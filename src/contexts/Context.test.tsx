import { renderHook } from "@testing-library/react-hooks";
import React from "react";
import {
  CelestialEngineContext,
  CelestialEngineContextType,
  useCelestialEngine,
} from "./Context";

describe("test useCelestialEngine behavior", () => {
  test("throw when useCelestialEngine() without the CelestialEngineContext.", () =>
    expect(
      () => renderHook(() => useCelestialEngine()).result.current
    ).toThrow());
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
