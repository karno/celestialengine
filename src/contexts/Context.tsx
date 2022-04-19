import React, {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  CelestialEngineProps,
  CelestialMoveEvent,
  CelestialSelectEvent,
  CelestialZoomEvent,
  deg,
  Degree,
} from "..";
import { DEFAULT_KNOWN_CONS_NAMES } from "../core/constellations";
import { DEFAULT_KNOWN_STAR_NAMES } from "../core/stars";
import { fetchStars, initialState, StarFetcherState } from "../fetcher";
import { CelestialEngineContextProps } from "./contextProperties";

/**
 * Properties provided from the CelestialEngine Context.
 * @see CelestialEngineProvider
 */
export interface CelestialEngineContextType {
  props: CelestialEngineContextProps;
  setProps: Dispatch<SetStateAction<CelestialEngineContextProps>>;
  fetchState: StarFetcherState;
  internalProps: CelestialEngineProps;
}

export const CelestialEngineContext =
  createContext<CelestialEngineContextType | null>(null);

export const useCelestialEngine = () => {
  const context = useContext(CelestialEngineContext);
  if (context == null) {
    throw new Error(
      "useCelestialEngine() must be used with in the CelestialEngine instance."
    );
  }
  return context;
};

const normalizeAzimuth = (azimuth: Degree): Degree =>
  deg(azimuth > 360 ? azimuth - 360 : azimuth < 0 ? azimuth + 360 : azimuth);

const normalizeAltitude = (altitude: Degree): Degree =>
  deg(Math.max(-90, Math.min(90, altitude)));

export interface CelestialEngineProviderProps {
  /**
   * source of star metadata.
   */
  metadataSource: string;

  /**
   * initial values used for this engine.
   */
  initialProps?: Partial<Omit<CelestialEngineContextProps, "stars">>;

  /**
   * children with context.
   */
  children?: ReactNode;
}

/**
 * Implementation shorthand to provide and handle props for CelestialCanvas.
 */
export const CelestialEngineProvider = ({
  metadataSource,
  initialProps,
  children,
}: CelestialEngineProviderProps) => {
  const [props, setProps] = useState<CelestialEngineContextProps>({
    stars: {},
    ...initialProps,
    // mandatory arguments
    universeClock: initialProps?.universeClock || new Date(),
    vMag: initialProps?.vMag || 3.0,
    constellationNames:
      initialProps?.constellationNames || DEFAULT_KNOWN_CONS_NAMES,
    starNames: DEFAULT_KNOWN_STAR_NAMES,
    latitude: initialProps?.latitude || deg(36.0681333),
    longitude: initialProps?.longitude || deg(140.1305979),
    azimuth: initialProps?.azimuth || deg(0),
    altitude: initialProps?.altitude || deg(45),
    fov: initialProps?.fov || deg(100),
    zoom: initialProps?.zoom || 1.0,
    targetFov: initialProps?.targetFov || deg(60),
    targetStarNumber: initialProps?.targetStarNumber || null,
    animationSpeed: initialProps?.animationSpeed || 0.1,
    reactiveButtons: initialProps?.reactiveButtons || 1,
  });
  const [fetchState, setFetchState] = useState<StarFetcherState>(initialState);
  // prepare handlers
  const onSelect = useCallback(
    (e: CelestialSelectEvent) => {
      if (props.selectable === false) {
        return;
      }
      if (props.previewOnSelect && props.previewOnSelect(e) === false) {
        return;
      }
      setProps((p) => ({
        ...p,
        targetStarNumber: p.targetStarNumber ? null : e.namedStar?.id || null,
      }));
    },
    [props.previewOnSelect, props.selectable, setProps]
  );
  const onMove = useCallback(
    (e: CelestialMoveEvent) => {
      if (props.controllable === false) {
        return;
      }
      if (props.previewOnMove && props.previewOnMove(e) === false) {
        return;
      }
      setProps((p) => ({
        ...p,
        azimuth: normalizeAzimuth(deg(p.azimuth + e.azimuth)),
        altitude: normalizeAltitude(deg(p.altitude + e.altitude)),
      }));
    },
    [props.previewOnMove, props.controllable, setProps]
  );
  const onZoom = useCallback(
    (e: CelestialZoomEvent) => {
      if (props.controllable === false) {
        return;
      }
      if (props.previewOnZoom && props.previewOnZoom(e) === false) {
        return;
      }
      setProps((p) => ({
        ...p,
        zoom: Math.max(
          1.0,
          Math.min(props.maxZoom || 10.0, p.zoom + e.zoomDelta)
        ),
      }));
    },
    [props.controllable, props.previewOnZoom, setProps, props.maxZoom]
  );
  // fetcher
  useEffect(() => {
    (async () => {
      const state = await fetchStars(fetchState, metadataSource, props.vMag);
      setProps((p) => ({ ...p, stars: state.stars }));
      setFetchState(state);
    })();
  }, [props.vMag, setProps, setFetchState]);

  return (
    <CelestialEngineContext.Provider
      value={{
        props,
        setProps,
        fetchState,
        internalProps: createEngineProps(props, onSelect, onMove, onZoom),
      }}
      children={children}
    />
  );
};

const createEngineProps = (
  props: CelestialEngineContextProps,
  onSelect: (event: CelestialSelectEvent) => any,
  onMove: (event: CelestialMoveEvent) => any,
  onZoom: (event: CelestialZoomEvent) => any
): CelestialEngineProps => {
  const { targetFov, targetStarNumber, ...passProps } = props;
  return {
    ...passProps,
    target: props.targetStarNumber
      ? { starNumber: props.targetStarNumber }
      : { azimuth: props.azimuth, altitude: props.altitude },
    starMarkers: props.targetStarNumber
      ? [
          {
            ...props.starMarkerTemplate,
            starNumber: props.targetStarNumber,
          },
        ]
      : [],
    onSelect,
    onMove,
    onZoom,
  };
};
