import { Service } from "../src/service";
import { ServiceLoader, inject } from "../src/loader";

class Service1 extends Service {
  initTime: number;

  init() {
    this.initTime = new Date().getTime();
  }
}

class Service2 extends Service {
  @inject
  dep1: Service1;

  initTime: number;

  async init() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.initTime = new Date().getTime();
        resolve();
      }, 10);
    });
  }
}

class Service3 extends Service {
  @inject
  dep1: Service2;

  initTime: number;

  init() {
    this.initTime = new Date().getTime();
  }
}

class Service4 extends Service {
  @inject
  dep1: Service1;

  @inject
  dep2: Service2;

  @inject
  dep3: Service3;

  initTime: number;

  init() {
    this.initTime = new Date().getTime();
  }
}

class Service5 extends Service {}

class Service6 extends Service {
  @inject
  dep1: Service5;
}

afterAll(() => {
  ServiceLoader.reset();
});

describe("Dependency injection", () => {
  it("Ensure dependencies are injected in correct order", async () => {
    await ServiceLoader.getInstance().init([
      Service1,
      Service3,
      Service2,
      Service4
    ]);
    //Should go init (1, 2, 3, 4)
    let s1 = ServiceLoader.getInstance().get(Service1);
    let s2 = ServiceLoader.getInstance().get(Service2);
    let s3 = ServiceLoader.getInstance().get(Service3);
    let s4 = ServiceLoader.getInstance().get(Service4);

    let expectedOrder = [s1.initTime, s2.initTime, s3.initTime, s4.initTime];

    let sortedOrder = [...expectedOrder].sort();
    expect(expectedOrder).toEqual(sortedOrder);
    expect(s2.dep1).toEqual(s1);
    expect(s3.dep1).toEqual(s2);
    expect(s4.dep1).toEqual(s1);
    expect(s4.dep2).toEqual(s2);
    expect(s4.dep3).toEqual(s3);
  });

  it("Should fail if required dependency isn't included", async () => {
    expect(ServiceLoader.getInstance().init([Service6])).rejects.toThrowError();
  });
});
