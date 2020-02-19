import * as assert from "assert";
import { Service } from "../src/service";
import { ServiceLoader } from "../src/loader";

class Service1 extends Service {}
class Service2 extends Service {
  _init: boolean = false;

  public get initalized() {
    return this._init;
  }

  init() {
    this._init = true;
  }
}

//async init
class Service3 extends Service {
  _init: boolean = false;

  public get initalized() {
    return this._init;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this._init = true;
      resolve();
    });
  }
}

afterAll(() => {
  ServiceLoader.reset();
});

describe("Service loader init", () => {
  it("Service loader with no services show start", async () => {
    await ServiceLoader.getInstance().init([]);
    assert.ok(true);
  });

  it("Service loader should load service (no init)", async () => {
    await ServiceLoader.getInstance().init([Service1]);
    let service = ServiceLoader.getInstance().get(Service1);
    assert.ok(service);
  });

  it("Service loader should load and sync initialize service", async () => {
    await ServiceLoader.getInstance().init([Service2]);
    let service = ServiceLoader.getInstance().get(Service2);
    assert.ok(service);
    assert.ok(service.initalized);
  });

  it("Service loader should load and async initialize service", async () => {
    await ServiceLoader.getInstance().init([Service3]);
    let service = ServiceLoader.getInstance().get(Service3);
    assert.ok(service);
    assert.ok(service.initalized);
  });
});
