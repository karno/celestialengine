import { PerspectiveCamera } from "three";
import { rad, Radian } from "../core";
import {
  calcDistance,
  calcDistanceLine,
  getLocalPoints,
  getNearestLocalPoint,
  toRaDec,
} from "./Interactor";

describe("getLocalPoints() convert clicked/touched points to local points.", () => {
  const createClickEvent = (
    rectLeft: number,
    rectTop: number,
    clientX: number,
    clientY: number
  ) =>
    ({
      target: {
        getBoundingClientRect: () => ({ left: rectLeft, top: rectTop }),
      },
      clientX,
      clientY,
    } as unknown as MouseEvent);
  const createTouchEvent = (
    rectLeft: number,
    rectTop: number,
    touches: {
      clientX: number;
      clientY: number;
    }[]
  ) =>
    ({
      target: {
        getBoundingClientRect: () => ({ left: rectLeft, top: rectTop }),
      },
      touches,
    } as unknown as TouchEvent);
  let windowSpy: any;
  beforeEach(() => {
    windowSpy = jest.spyOn(global, "window", "get");
  });
  afterEach(() => {
    windowSpy.mockRestore();
  });
  test("map simple click event", () => {
    windowSpy.mockImplementation(() => ({
      scrollX: 8,
      scrollY: 4,
    }));
    const p = getLocalPoints(createClickEvent(7, 10, 17, 25));
    expect(p.length).toBe(1);
    expect(p[0].x).toBe(2);
    expect(p[0].y).toBe(11);
  });
  test("map multiple tap event", () => {
    windowSpy.mockImplementation(() => ({
      scrollX: 8,
      scrollY: 4,
    }));
    const p = getLocalPoints(
      createTouchEvent(7, 10, [
        { clientX: 17, clientY: 25 },
        { clientX: 100, clientY: 1000 },
      ])
    );
    expect(p.length).toBe(2);
    expect(p[0].x).toBe(2);
    expect(p[0].y).toBe(11);
    expect(p[1].x).toBe(85);
    expect(p[1].y).toBe(986);
  });
});

describe("getNearestLocalPoint should behave correctly", () => {
  test("when the array contains just an element, just return it", () =>
    expect(
      getNearestLocalPoint([{ x: 16, y: 20 }], { x: 8, y: 10 })
    ).toStrictEqual({
      x: 16,
      y: 20,
    }));
  test("when the array contains multiple element, returns nearest one", () =>
    expect(
      getNearestLocalPoint(
        [
          { x: 16, y: 20 },
          { x: -30, y: -90 },
        ],
        { x: 8, y: 10 }
      )
    ).toStrictEqual({
      x: 16,
      y: 20,
    }));
  test("when the last position was not specified, returns the first one", () =>
    expect(
      getNearestLocalPoint(
        [
          { x: 16, y: 20 },
          { x: -30, y: -90 },
        ],
        null
      )
    ).toStrictEqual({
      x: 16,
      y: 20,
    }));
});

describe("toRaDec should process the relationship between localpoint and camera.", () => {
  test("with neutral camera", () => {
    const [ra, dec] = toRaDec(
      { x: 400, y: 200 },
      { width: 800, height: 400 },
      new PerspectiveCamera()
    );
    // neutral camera indicates -z => ra = 0, dec = -PI/2
    expect(ra).toBeCloseTo(0);
    expect(dec).toBeCloseTo(-Math.PI / 2);
  });
});

const r2 = (v0: number, v1: number): [Radian, Radian] => [rad(v0), rad(v1)];

describe("calc distances between two celestial points", () => {
  test("with same positions", () =>
    expect(calcDistance(r2(1.0, 0.8), r2(1.0, 0.8))).toBeCloseTo(0.0));
  test("with known positions, right ascension", () =>
    expect(calcDistance(r2(Math.PI / 2, 0), r2(Math.PI / 4, 0))).toBeCloseTo(
      Math.pow(Math.PI / 4, 2)
    ));
  test("with known positions, declination", () =>
    expect(calcDistance(r2(0, Math.PI / 4), r2(0, Math.PI / 2))).toBeCloseTo(
      Math.pow(Math.PI / 4, 2)
    ));
  test("with known positions, arbitrary known two points", () =>
    expect(
      calcDistance(r2(Math.PI / 4, Math.PI / 4), r2(-Math.PI / 2, -Math.PI / 2))
    ).toBeCloseTo(Math.pow((3 * Math.PI) / 4, 2)));
});

describe("calc distances between celestial point and line", () => {
  test("with in the line", () =>
    expect(
      calcDistanceLine(r2(1.0, 0.5), r2(1.0, 0.5), r2(2.0, 1.0))
    ).toBeCloseTo(0.0));
  test("with in the line 2", () =>
    expect(
      calcDistanceLine(r2(2.0, 1.0), r2(1.0, 0.5), r2(2.0, 1.0))
    ).toBeCloseTo(0.0));
  test("with perpendicular line pos", () =>
    expect(
      calcDistanceLine(r2(1.0, 0.5), r2(0.0, 0.0), r2(2.0, 0.0))
    ).toBeCloseTo(Math.pow(0.5, 2)));
});
