import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { rad } from "./basic";
import {
  calcStarPosition,
  getStarOpacity,
  getStarRaDec,
  getStarSize,
  Star,
} from "./stars";
expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

const starForVmag = (vMag: number): Star => ({ vMag } as Star);
const starForRaDec = (
  ra: number,
  dec: number,
  epoch?: Date,
  pmRa?: number,
  pmDec?: number
) =>
  ({
    ra: rad(ra),
    dec: rad(dec),
    pmRa: rad(pmRa || 0.0),
    pmDec: rad(pmDec || 0.0),
    epoch: epoch ? epoch.getTime() / 1000 : 0,
  } as Star);

describe("calculate star size and opacity for the star", () => {
  test("star size should not be smaller than min(3.0).", () => {
    expect(getStarSize(starForVmag(6.0))).toBeGreaterThanOrEqual(3.0);
    expect(getStarSize(starForVmag(9.0))).toBeGreaterThanOrEqual(3.0);
    expect(getStarSize(starForVmag(12.0))).toBeGreaterThanOrEqual(3.0);
  });
  test("star opacity should not be larger than 1.0.", () =>
    expect(getStarOpacity(starForVmag(0.0))).toBeLessThanOrEqual(1.0));
});

const BASE_DATE = new Date(Date.UTC(2020, 4, 1, 0, 0, 0));

describe("star ra/dec should be calculated correctly", () => {
  test("check known ra/dec", () => {
    const star = starForRaDec(0.5, 0.8, BASE_DATE, 0.05, -0.08);
    expect(getStarRaDec(star, BASE_DATE)).toBeDeepCloseTo([0.5, 0.8]);
  });
});

describe("star position should be calculated correctly", () => {
  test("check known x/y/z", () => {
    const star = starForRaDec(Math.PI / 4, Math.PI / 4, BASE_DATE);
    const [x, y, z] = calcStarPosition(star, 1.0, BASE_DATE);
    expect(x).toBeCloseTo(0.5);
    expect(y).toBeCloseTo(0.5);
    expect(z).toBeCloseTo(0.707);
    expect(
      Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2))
    ).toBeCloseTo(1.0);
  });
  test("check celestial north", () => {
    const star = starForRaDec(0, Math.PI / 2, BASE_DATE);
    const [x, y, z] = calcStarPosition(star, 1.0, BASE_DATE);
    expect(z).toBeCloseTo(1.0);
    expect(
      Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2))
    ).toBeCloseTo(1.0);
  });
  test("check RA +0h", () => {
    const star = starForRaDec(0, 0, BASE_DATE);
    const [x, y, z] = calcStarPosition(star, 1.0, BASE_DATE);
    expect(x).toBeCloseTo(1.0);
    expect(
      Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2))
    ).toBeCloseTo(1.0);
  });
});
