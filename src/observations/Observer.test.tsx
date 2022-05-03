import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { deg, rad } from "../core";
import {
  getCameraQuaternionFromAzAlt,
  getCameraQuaternionFromRaDec,
} from "./Observer";
expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("get camera quaternion from ra/dec", () => {
  test("indicates south celestial pole", () =>
    expect(
      getCameraQuaternionFromRaDec(rad(Math.PI / 2), rad(Math.PI / 2))
    ).toMatchCloseTo({ _w: 0.0, _x: 1.0, _y: 0.0, _z: 0.0 }));
  test("indicates ra/dec zero", () =>
    expect(getCameraQuaternionFromRaDec(rad(0), rad(0))).toMatchCloseTo({
      _w: 0.5,
      _x: 0.5,
      _y: -0.5,
      _z: -0.5,
    }));
});

describe("get camera quaternion from az/alt", () => {
  test("indicates known quaternion", () =>
    expect(
      getCameraQuaternionFromAzAlt(
        new Date(Date.UTC(2000, 4, 1, 0, 0, 0)),
        deg(0),
        deg(90),
        deg(0),
        deg(90)
      )
    ).toMatchCloseTo({
      _w: 0.666079,
      _x: -0.666079,
      _y: -0.2373566,
      _z: 0.2373566,
    }));
});
