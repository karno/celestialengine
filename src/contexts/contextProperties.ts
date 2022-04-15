import {
  CelestialMoveEvent,
  CelestialSelectEvent,
  CelestialZoomEvent,
  Degree,
  InteractionProps,
  InternationalizationProps,
  ObservationAzAltTargetProps,
  ObservationProps,
  RepresentationProps,
  StarMarkerProps,
  UniverseProps,
} from "..";

export type CelestialEngineContextProps = UniverseProps &
  InternationalizationProps &
  ContextRepresentationProps &
  ContextObservationProps &
  ContextInteractionProps;

export interface ContextRepresentationProps
  extends Omit<RepresentationProps, "starMarkers"> {
  starMarkerTemplate?: Omit<StarMarkerProps, "starNumber">;
}

export interface ContextObservationProps
  extends Omit<ObservationProps, "target" | "cameraProps">,
    ObservationAzAltTargetProps {
  /**
   * camera fov when targeting the star, in degree.
   */
  targetFov: Degree;
  /**
   * targeting star number.
   */
  targetStarNumber: number | null;
  /**
   * maximum zoom factor.
   * @defaultvalue 10.0
   */
  maxZoom?: number;
}

export interface ContextInteractionProps
  extends Pick<InteractionProps, "reactiveButtons"> {
  /**
   * enable automatic control handling (like OrbitControls).
   * @defaultvalue true
   */
  controllable?: boolean;
  /**
   * enable automatic selection handling.
   * @defaultvalue true
   */
  selectable?: boolean;
  /**
   * handle selection of the celestial entities.
   * this handler will be fired before firing the default event, and
   * default event will be cancelled when you returns `false` in the handler.
   */
  previewOnSelect?: (event: CelestialSelectEvent) => boolean;
  /**
   * handle move of the sight in the celestial canvas.
   * this handler will be fired before firing the default event, and
   * default event will be cancelled when you returns `false` in the handler.
   */
  previewOnMove?: (event: CelestialMoveEvent) => boolean;
  /**
   * handle zoom changes on the celestial canvas.
   * this handler will be fired before firing the default event, and
   * default event will be cancelled when you returns `false` in the handler.
   */
  previewOnZoom?: (event: CelestialZoomEvent) => boolean;
}
