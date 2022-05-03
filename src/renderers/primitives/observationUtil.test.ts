import { MutableRefObject } from "react";
import { lerp, setAnimationRefs } from "./observationUtil";

describe("check setAnimationRefs() works as intended", () => {
  test("skip when the object reference is not initialized", () => {
    const orstub = { current: null } as MutableRefObject<string | null>;
    const prstub = { current: "init" } as MutableRefObject<string | null>;
    setAnimationRefs(orstub, prstub, "", () => {
      throw "unreachable!";
    });
    expect(prstub.current).toBeNull();
  });
  test("paramRef value will be updated when the reference is valid", () => {
    const orstub = { current: "dummy" } as MutableRefObject<string | null>;
    const prstub = { current: "init" } as MutableRefObject<string | null>;
    setAnimationRefs(orstub, prstub, "value", () => {
      throw "unreachable!";
    });
    expect(prstub.current).toBe("value");
  });
  test("initializer will be called when the paramRef will not be initialized yet.", () => {
    const orstub = { current: "dummy" } as MutableRefObject<string | null>;
    const prstub = { current: null } as MutableRefObject<string | null>;
    let called = 0;
    setAnimationRefs(orstub, prstub, "value", () => {
      called += 1;
    });
    expect(called).toBe(1);
  });
});

describe("check the lerp function", () => {
  test("lerp alpha = 0 => v1", () => expect(lerp(0, 1, 0)).toBeCloseTo(0));
  test("lerp alpha = 1 => v2", () => expect(lerp(0, 1, 1)).toBeCloseTo(1));
  test("lerp alpha = 0.5 => (v1+v2)/2", () =>
    expect(lerp(0, 1, 0.5)).toBeCloseTo(0.5));
});
