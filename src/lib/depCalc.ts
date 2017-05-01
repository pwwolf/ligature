/*
 * This is based off code I wrote for https://github.com/BlueOakJS/blueoak-server
 * 
 * Use to calculate the order for performing dependencies
 *
 * Imagine we have a dependency tree
 *     a
 *    / \
 *   c  d
 *   \/ |
 *   e  f
 *
 *  We can create this graph using
 *  addNode('a')
 *  addNode('c', ['a']);
 *  addNode('d', ['a']);
 *  addNode('e', ['c', 'd']);
 *  addNode('f', ['d']);
 *
 *  If we want to execute these nodes, we can parallelize them by grouping them.
 *  The items within each group can safely be executed in parallel before moving on to the next group
 *  [['a'], ['c', 'd'], ['e', 'f']]
 *
 *  which is the output of the calcGroups call.
 */

import * as d from 'debug';
const debug = d('depCalc');
export default class DependencyCalculator {

  /*
   * Key is the name of the node
   * value is array of dependencies
   */
  _nodes: { [key: string]: Array<string> } = {};

  addNode (name: string, deps: Array<string>) {
    debug(`Adding dependency ${name} ${deps}`);
    this._nodes[name] = deps;
  }

  calcGroups = function (): Array<Array<string>> {
    var nodes = this._nodes;
    var groups: Array<Array<string>> = [];

    //First let's do a quick scan for unmet dependencies so that we can fail out early
    this.findUnmetDependencies(nodes);

    //Iterate until we don't have any nodes left to process
    while (Object.keys(nodes).length > 0) {

      //Find the nodes that don't have any dependencies
      let emptyNodes = getNodesWithoutDeps(nodes);

      //If there aren't any, we must have hit a cycle
      if (emptyNodes.length === 0) {
        //reset itself
        this._nodes = {};
        throw new Error('Cycle found in dependency list: ' + JSON.stringify(nodes));
      }

      //Add all the empty nodes to a group
      groups.push(emptyNodes);

      //remove the empty nodes from all dependency lists
      Object.keys(nodes).forEach(key => {
        let val = nodes[key] || [];
        nodes[key] = diffArray(val, emptyNodes);
      });

      //remove the empty nodes from the node list
      for (var key in nodes) {
        if (emptyNodes.indexOf(key) > -1) {
          delete nodes[key];
        }
      }
    }
    return groups;
  };

  private findUnmetDependencies () {
    Object.keys(this._nodes).forEach(key => {
      if (this._nodes[key]) {
        var deps = this._nodes[key];
        deps.forEach(depName => {
          if (!(depName in this._nodes)) {
            //reset itself
            this._nodes = {};
            throw new Error('Unmet dependency: ' + key + ' -> ' + depName);
          }
        });
      }
    });
  }
}

function getNodesWithoutDeps (nodes: { [key: string]: Array<string> }) {
  let toReturn: Array<string> = [];
  Object.keys(nodes).forEach(key => {
    let val = nodes[key];
    if (!val || val.length === 0) {
      toReturn.push(key);
    }
  });
  return toReturn;
}

function diffArray (a: Array<string>, b: Array<string>) {
  return a.filter(i => {
    return b.indexOf(i) < 0;
  });
}