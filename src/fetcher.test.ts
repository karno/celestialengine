import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { StarMetadata } from "./core";
import { getRequiredStarsFiles } from "./fetcher";
expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("resolve required star file range", () => {
  const files = ["first", "second", "3rd"];
  const testMeta: StarMetadata = {
    source: "",
    vRange: [-1.0, 15.0],
    files: [
      [-1.0, 3.0, files[0]],
      [3.0, 9.0, files[1]],
      [9.0, 15.0, files[2]],
    ],
    epoch: 0,
  };
  test("resolve single file without loaded stars", () => {
    expect(getRequiredStarsFiles(testMeta, null, 2.0)).toStrictEqual([
      { satisfyingVmag: 3.0, file: files[0] },
    ]);
  });
  test("resolve multiple files without loaded stars", () => {
    expect(getRequiredStarsFiles(testMeta, null, 12.0)).toStrictEqual([
      { satisfyingVmag: 3.0, file: files[0] },
      { satisfyingVmag: 9.0, file: files[1] },
      { satisfyingVmag: 15.0, file: files[2] },
    ]);
  });
  test("resolve single file with loaded stars", () => {
    expect(getRequiredStarsFiles(testMeta, 3.0, 8.0)).toStrictEqual([
      { satisfyingVmag: 9.0, file: files[1] },
    ]);
  });
  test("resolve multiple files with loaded stars", () => {
    expect(getRequiredStarsFiles(testMeta, 3.0, 14.0)).toStrictEqual([
      { satisfyingVmag: 9.0, file: files[1] },
      { satisfyingVmag: 15.0, file: files[2] },
    ]);
  });
});
