/**
 * General utility functions.
 */
import { createTimeOfInterest } from "astronomy-bundle/time";

/**
 * Describe numbers in Degrees.
 */
export type Degree = number & { readonly _DegreeBrand: unique symbol };
/**
 * Describe numbers in Radians.
 */
export type Radian = number & { readonly _RadianBrand: unique symbol };

/**
 * Annotate the number has Degree unit.
 */
export const deg = (n: number) => n as Degree;
/**
 * Annotate the number has Radian unit.
 */
export const rad = (n: number) => n as Radian;

// untyped conversions
/**
 * The number treat as Degrees into Radians.
 */
export const degToRad = (deg: number | Degree): Radian =>
  rad((deg * Math.PI) / 180);
/**
 * The number treat as Radians into Degrees.
 */
export const radToDeg = (rad: number | Radian): Degree =>
  deg((rad * 180) / Math.PI);

// conversions
/**
 * Convert Degrees into Radians.
 */
export const asRad = (value: Degree): Radian => degToRad(value);
/**
 * Convert Radians into Degrees.
 */
export const asDeg = (value: Radian): Degree => radToDeg(value);

// trigonometric functions
export const sin = (value: Radian) => Math.sin(value);
export const cos = (value: Radian) => Math.cos(value);

// calculate greenwich apparent sidereal time.
// https://github.com/andrmoel/astronomy-bundle-js/blob/master/src/time/createTimeOfInterest.ts#L32
// https://github.com/andrmoel/astronomy-bundle-js/blob/2564ed5c5b5d1f8165cb60a8cc903d96ffa3b745/src/time/calculations/timeCalc.ts#L192
export const getGreenwichSiderealTime = (universeClock: Date) =>
  deg(
    createTimeOfInterest
      .fromDate(universeClock)
      .getGreenwichApparentSiderealTime()
  );

export const AstrometricSecondsInYear = 31557600;
