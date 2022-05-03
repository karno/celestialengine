import {
  asDeg,
  asRad,
  deg,
  degToRad,
  getGASTDeg,
  rad,
  radToDeg,
} from "./basic";

describe("degrees to radians", () => {
  test("0 deg is 0 rad", () => {
    expect(degToRad(0)).toBeCloseTo(0);
  });
  test("180 deg is PI rad", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });
  test("-360 deg is -2PI rad", () => {
    expect(degToRad(-360)).toBeCloseTo(-2 * Math.PI);
  });
  test("deg type into radians", () => {
    expect(asRad(deg(0))).toBeCloseTo(rad(0));
    expect(asRad(deg(180))).toBeCloseTo(rad(Math.PI));
    expect(asRad(deg(-360))).toBeCloseTo(rad(-2 * Math.PI));
  });
});

describe("radians to degrees", () => {
  test("0 rad is 0 deg", () => {
    expect(radToDeg(0)).toBeCloseTo(0);
  });
  test("PI rad is 180 deg", () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
  });
  test("-2PI rad is -360 deg", () => {
    expect(radToDeg(-2 * Math.PI)).toBeCloseTo(-360);
  });
  test("rad type into degrees", () => {
    expect(asDeg(rad(0))).toBeCloseTo(deg(0));
    expect(asDeg(rad(Math.PI))).toBeCloseTo(deg(180));
    expect(asDeg(rad(-2 * Math.PI))).toBeCloseTo(deg(-360));
  });
});

describe("check greenwich apparent sidereal time", () => {
  test("GAST in 2020/04/01 00:00:00", () =>
    expect(getGASTDeg(new Date(Date.UTC(2020, 4, 1, 0, 0, 0, 0)))).toBeCloseTo(
      219.380511
    ));
});
