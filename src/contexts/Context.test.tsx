import { renderHook } from "@testing-library/react";
import React from "react";
import {
  CelestialEngineContext,
  CelestialEngineContextType,
  useCelestialEngine,
} from "./Context";

describe("test useCelestialEngine behavior", () => {
  test("throw when useCelestialEngine() without the CelestialEngineContext.", () =>
    expect(() => renderHook(() => useCelestialEngine()).result).toThrow());
  test("useCelestialEngine() return the props specified in the CelestialEngineContext.", () => {
    const stub = {} as CelestialEngineContextType;
    expect(
      renderHook(() => useCelestialEngine(), {
        wrapper: ({ children }) => (
          <CelestialEngineContext.Provider value={stub} children={children} />
        ),
      }).result.current
    ).toEqual(stub);
  });
});
