import * as assert from "assert";
import { Service } from "../src/service";
import { ServiceLoader, inject } from "../src/loader";

class Service1 extends Service {
  initTime: number;
  doneTime: number;

  init() {
    this.initTime = new Date().getTime();
  }

  done() {
    this.doneTime = new Date().getTime();
  }
}

class Service2 extends Service {
  @inject
  dep1: Service1;

  initTime: number;
  doneTime: number;

  async init() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.initTime = new Date().getTime();
        resolve();
      }, 10);
    });
  }

  done() {
    this.doneTime = new Date().getTime();
  }
}

class Service3 extends Service {
  @inject
  dep1: Service2;

  initTime: number;
  doneTime: number;

  init() {
    this.initTime = new Date().getTime();
  }

  done() {
    this.doneTime = new Date().getTime();
  }
}

afterAll(() => {
  ServiceLoader.reset();
});

describe("Done is called", () => {
  it("Ensure init and done order", async () => {
    await ServiceLoader.getInstance().init([Service1, Service3, Service2]);
    //Should go init (1, 2, 3) done (3, 2, 1)
    let s1 = ServiceLoader.getInstance().get(Service1);
    let s2 = ServiceLoader.getInstance().get(Service2);
    let s3 = ServiceLoader.getInstance().get(Service3);

    let expectedOrder = [
      s1.initTime,
      s2.initTime,
      s3.initTime,
      s3.doneTime,
      s2.doneTime,
      s1.doneTime
    ];

    let sortedOrder = [...expectedOrder].sort();
    expect(expectedOrder).toEqual(sortedOrder);
  });
});
