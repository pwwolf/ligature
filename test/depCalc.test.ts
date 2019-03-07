import * as assert from "assert";
import DependencyCalculator from "../src/lib/depCalc";

describe("DepCalc", function() {
  it("No dependencies should return empty array", () => {
    let depCalc = new DependencyCalculator();
    let results = depCalc.calcGroups();
    assert.deepEqual([], results);
  });

  it("Single item should return single result", () => {
    let depCalc = new DependencyCalculator();
    depCalc.addNode("foo", []);
    let results = depCalc.calcGroups();
    assert.deepEqual([["foo"]], results);
  });

  it("Two independent items should return two results", () => {
    let depCalc = new DependencyCalculator();
    depCalc.addNode("foo", []);
    depCalc.addNode("bar", []);
    let results = depCalc.calcGroups();
    assert.deepEqual([["foo", "bar"]], results);
  });

  it("Two dependent items should return two groups", () => {
    let depCalc = new DependencyCalculator();
    depCalc.addNode("foo", []);
    depCalc.addNode("bar", ["foo"]);
    let results = depCalc.calcGroups();
    assert.deepEqual([["foo"], ["bar"]], results);
  });

  it("Unresolved dependency should throw error", () => {
    let depCalc = new DependencyCalculator();
    depCalc.addNode("bar", ["foo"]);
    assert.throws(
      () => {
        depCalc.calcGroups();
      },
      Error,
      "Error thrown"
    );
  });

  it("Circular dependency should throw error", () => {
    let depCalc = new DependencyCalculator();
    depCalc.addNode("a", ["b"]);
    depCalc.addNode("b", ["c"]);
    depCalc.addNode("c", ["d"]);
    depCalc.addNode("d", ["e"]);
    depCalc.addNode("e", ["a"]);
    assert.throws(
      () => {
        depCalc.calcGroups();
      },
      Error,
      "Error thrown"
    );
  });

  it("Ignore non-required dependencies", () => {
    let depCalc = new DependencyCalculator();
    depCalc.addNode("a", ["b"]);
    depCalc.addNode("c", []);
    let results = depCalc.calcGroups(["c"]);
    assert.deepEqual([["c"]], results);
  });
});
