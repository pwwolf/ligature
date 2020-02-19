import * as assert from "assert";
import { Service } from "../src/service";
import { ServiceLoader } from "../src/loader";

class Service1 extends Service {
  _val: string;
  get val() {
    return this._val;
  }
  init(options: { val: string }) {
    this._val = options.val;
  }
}

afterAll(() => {
  ServiceLoader.reset();
});

describe("Test init options", () => {
  it("Options should be passed to the init method", async () => {
    let options = new Map();
    options.set(Service1, { val: "hello" });
    await ServiceLoader.getInstance().init([Service1], options);
    let s1 = ServiceLoader.getInstance().get(Service1);
    expect(s1.val).toEqual("hello");
  });
});
