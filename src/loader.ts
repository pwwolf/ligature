import "reflect-metadata";
import * as d from "debug";
import DependencyCalculator from "./lib/depCalc";
import { Service } from "./service";
import { Consumer } from "./consumer";

const debug = d("loader");

export type ServiceConstructor = {
  new (): Service | Consumer;
};

export type ServiceConstructorOptions = Map<Service | Consumer, any>;

export class ServiceLoader {
  private static instance: ServiceLoader;

  private instanceMap: Map<string, Service | Consumer> = new Map();
  //maps a package class name to the list of packages it directly depends on
  private dependencies: Map<
    string,
    Array<{ propertyKey: string; type: string }>
  > = new Map();
  private dependencyCalculator: DependencyCalculator = new DependencyCalculator();

  private constructor() {}

  static getInstance() {
    if (!ServiceLoader.instance) {
      ServiceLoader.instance = new ServiceLoader();
    }
    return ServiceLoader.instance;
  }

  /**
   * Reset all the data stored in the loader.
   * This is used by units tests, and typically shouldn't
   * be needed in any otherwise.
   */
  static reset() {
    let instance = this.getInstance();
    instance.dependencyCalculator = new DependencyCalculator();
    instance.instanceMap = new Map();
    instance.dependencies = new Map();
  }

  /**
   * Starts the initialization process for all services.
   *
   * @param services list of services to initialize
   * @param options
   */
  async init(
    services: Array<ServiceConstructor>,
    options?: ServiceConstructorOptions
  ) {
    //convert the options to be keyed of a string instead of the service object
    //TODO: I'd like to avoid this entirely and not ever represent types as a string
    //but haven't figured that out fully.
    let initOptions: { [type: string]: any } = {};
    if (options) {
      for (let [key, value] of options) {
        initOptions[(<any>key).prototype.constructor.name] = value;
      }
    }
    //By the time this is called, all the @inject declarations have been processed

    //make sure we have an entry for every service
    //Ones with no dependencies aren't necessarily registered yet since they don't use any @inject
    services.forEach(type => {
      if (!this.instanceMap.has(type.name)) {
        let instance = new type();
        this.instanceMap.set(type.name, instance);
      }

      if (!this.dependencies.has(type.name)) {
        this.dependencies.set(type.name, []);
      }
    });

    this.dependencies.forEach((values, key) => {
      this.dependencyCalculator.addNode(
        key,
        values.map(val => {
          return val.type;
        })
      );
    });

    let groups: Array<Array<string>> = this.dependencyCalculator.calcGroups(
      services.map(s => s.name)
    );

    let initOrder: Array<string> = [];

    //Process each group in sequence
    //However, each service within the group can be processed simultaneously
    for (let types of groups) {
      let initProms: Array<Promise<any>> = [];
      types.forEach(type => {
        initOrder.push(type);
        let obj = this.instanceMap.get(type);

        if (!obj) {
          throw new Error(`No service found for ${type}.`);
        }

        if (obj instanceof Service || obj instanceof Consumer) {
          //First we do the injection, then we can init it
          let deps = this.dependencies.get(type);
          if (deps) {
            deps.forEach(dep => {
              debug(
                `Injecting ${dep.type} into field ${
                  dep.propertyKey
                } of ${type}: ${this.instanceMap.get(dep.type)}`
              );
              Object.defineProperty(obj, dep.propertyKey, {
                value: this.instanceMap.get(dep.type),
                writable: false,
                enumerable: false,
                configurable: false
              });
            });
          } else {
            throw new Error(`Missing type ${type}`);
          }

          try {
            let res = obj.init(initOptions[obj.constructor.name]); //res is either a promise or undefined
            if (res) {
              initProms.push(res);
            }
          } catch (err) {
            initProms.push(Promise.reject(err));
          }
        } else {
          throw new Error(`Cannot call init on ${type}`);
        }
      });
      await Promise.all(initProms);
    }

    //Now we need to call the done() method in reverse order of the init
    //TODO: We could choose to honor the groups as well, but this is easier
    for (let type of initOrder.reverse()) {
      let obj = this.instanceMap.get(type);
      if (obj instanceof Service || obj instanceof Consumer) {
        let res = obj.done(); //res is either a promise or undefined
        if (res) {
          await res;
        }
      }
    }
  }

  get<T extends Service>(c: { new (): T }): T {
    let toReturn = this.instanceMap.get(c.name);
    if (toReturn instanceof c) {
      return toReturn;
    }
    throw new Error(`${c.name} must be a service.`);
  }

  addInstance(typeName: string, instance: Service) {
    this.instanceMap.set(typeName, instance);
  }

  hasInstance(typeName: string) {
    return this.instanceMap.has(typeName);
  }

  registerDependency(
    type: string,
    propertyKey: string,
    dependencyType: string
  ) {
    let deps = this.dependencies.get(type);
    if (!deps) {
      deps = [];
      this.dependencies.set(type, deps);
    }
    deps.push({ propertyKey: propertyKey, type: dependencyType });
  }
}

const loader = ServiceLoader.getInstance();
export function inject(target: any, propertyKey: string): any {
  let curTypeName = target.constructor.name;

  if (!(target instanceof Service) && !(target instanceof Consumer)) {
    throw new Error(`${curTypeName} must extend Service`);
  }
  let type = Reflect.getMetadata("design:type", target, propertyKey);
  //TODO:
  //This seems to happen on direct circular dependencies, e.g.
  // ServiceA injects ServiceB and ServiceB injects ServiceA
  // but I don't have a good way yet to detect this scenario
  if (!type) {
    throw new Error(
      `Cannot inject ${propertyKey} of ${curTypeName}. This is possibly circular reference.`
    );
  }
  let typeName = type.name;
  if (!loader.hasInstance(typeName)) {
    let obj: typeof Service = new type();
    if (!(obj instanceof Service)) {
      throw new Error(`${typeName} must extend Service`);
    }
    loader.addInstance(typeName, obj);
  }

  loader.registerDependency(curTypeName, propertyKey, typeName);
}
