import {
  PerspectiveCameraProps,
  Props as CanvasProps,
} from "@react-three/fiber";
import { Color as ThreeColor } from "three";
import { Degree, Radian } from ".";
import { CONSTELLATION_KEY } from "./core/constellations";
import { Star, StarDict } from "./core/stars";

/**
 * Color type, same as three.Color.
 * @see ThreeColor
 */
export type Color = ThreeColor;

/**
 * Root of properties for CelestialEngine.
 */
export type CelestialEngineProps = UniverseProps &
  InternationalizationProps &
  RepresentationProps &
  ObservationProps &
  InteractionProps;

/**
 * Properties of the universe.
 */
export interface UniverseProps {
  /**
   * clock of current universe.
   */
  universeClock: Date;
  /**
   * dictionary of the loaded stars.
   */
  stars: StarDict;
  /**
   * upper-bound Vmag for the stars.
   */
  vMag: number;
  /**
   * radius of the celestial sphere.
   * @defaultvalue 20.0
   */
  sphereRadius?: number;
  /**
   * ratio for star sizes.
   * @defaultvalue 1.0 .
   */
  starSizeRatio?: number;
}

export interface InternationalizationProps {
  /**
   * constellation names.
   * @defaultvalue DEFAULT_KNOWN_CONS_NAMES .
   */
  constellationNames: { [key in CONSTELLATION_KEY]: string };
  /**
   * star names.
   * @defaultvalue DEFAULT_KNOWN_STAR_NAMES .
   */
  starNames: { [key: number]: string };
}

/**
 * Properties for representational elements.
 */
export interface RepresentationProps {
  /**
   * properties for constellation lines.
   */
  constellations?: RepresentationItemProps;
  /**
   * properties for the equatorial grid sphere.
   */
  equatorialGrid?: RepresentationItemProps;
  /**
   * properties for the azimuthal grid sphere.
   */
  azimuthalGrid?: RepresentationItemProps;
  /**
   * properties for the direction label.
   */
  directionLabel?: DirectionLabelProps;
  /**
   * properties for the star marker.
   * key: star number (HIP ID), value: props for the star.
   */
  starMarkers?: StarMarkerProps[];
  /**
   * Default font for labels (TTF, OTF, and WOFF formats are supported).
   * This value will be applied for labels items except the labels which
   * have specified their own font properties.
   * @defaultvalue "(The Roboto font from Google Fonts CDN)"
   */
  defaultFont?: string;
  /**
   * Default font size (em-height, in local world unit) for labels.
   * @defaultvalue 0.1
   */
  defaultFontSize?: number;
}

/**
 * Properties shared between the representational items.
 */
export interface RepresentationItemPropsBase {
  /**
   * show the element.
   * @defaultvalue true
   */
  show?: boolean;
  /**
   * line color.
   */
  color?: Color;
  /**
   * opacity of the element.
   * @defaultvalue 1.0
   */
  opacity?: number;
  /**
   * radial offset against the sphere radius.
   * @defaultvalue 0.0
   */
  radialOffset?: number;
}

/**
 * Properties for grids and constellation lines.
 */
export interface RepresentationItemProps extends RepresentationItemPropsBase {
  /**
   * width of the lines.
   * @defaultvalue 1.0
   */
  lineWidth?: number;
}

export interface RepresentationLabelItemPropsBase
  extends RepresentationItemPropsBase {
  /**
   * The font for the label (TTF, OTF, and WOFF formats are supported).
   * @defaultvalue defaultFont
   */
  font?: string;
  /**
   * The font size (em-height, in local world unit) for the label.
   * @defaultvalue defaultFontSize
   */
  fontSize?: number;
}
/**
 * Properties for navigation labels.
 */
export interface DirectionLabelProps extends RepresentationLabelItemPropsBase {
  /**
   * directional label texts.
   */
  texts?: {
    north: string;
    east: string;
    south: string;
    west: string;
  };
}

/**
 * Properties for the star markers.
 */
export interface StarMarkerProps extends RepresentationLabelItemPropsBase {
  /**
   * star number, aka HIP ID
   */
  starNumber: number;
  /**
   * label text for the star.
   * @defaultvalue declared star name correspond to specified star.
   */
  text?: string;
  /**
   * marker size.
   */
  markerSize?: number;
  /**
   * show the target marker.
   * @defaultvalue true
   */
  showTargetMark?: boolean;
}

/**
 * Properties for the observer.
 */
export interface ObservationProps {
  /**
   * latitude of the observation location, in degree. [-90..+90]
   */
  latitude: Degree;
  /**
   * longitude of the observation location, in degree. [0..360]
   */
  longitude: Degree;
  /**
   * observation target.
   */
  target: ObservationTargetProps;
  /**
   * camera fov, in degree.
   */
  fov: Degree;
  /**
   * zoom factor.
   */
  zoom: number;
  /**
   * animation speed. (0.0..1.0]
   * @defaultvalue 1.0
   */
  animationSpeed?: number;
  /**
   * optional camera properties for @see PerspectiveCamera .
   */
  cameraProps?: Omit<
    PerspectiveCameraProps,
    "fov" | "zoom" | "aspect" | "position" | "ref"
  >;
}

export type ObservationTargetProps =
  | ObservationAzAltTargetProps
  | ObservationRaDecTargetProps
  | ObservationStarTargetProps;

/**
 * Properties of the az/alt for observation target (center).
 */
export interface ObservationAzAltTargetProps {
  /**
   * azimuth angle, in degree. [0..360]
   */
  azimuth: Degree;
  /**
   * altitude angle, in degree. [-90..+90]
   */
  altitude: Degree;
}

/**
 * Properties of the ra/dec for the observation target (center).
 */
export interface ObservationRaDecTargetProps {
  /**
   * right ascension, in radian.
   */
  ra: Radian;
  /**
   * declination, in radian.
   */
  dec: Radian;
}

/**
 * Properties of the star numbore for observation target (center).
 */
export interface ObservationStarTargetProps {
  /**
   * targeting star number.
   */
  starNumber: number;
}

/**
 * Distinguish the observation target is identified by the Az/Alt.
 * @param target observation target
 */
export const targetIsAzAlt = (
  target: ObservationTargetProps
): target is ObservationAzAltTargetProps => "azimuth" in target;

/**
 * Distinguish the observation target is identified by the celestial Ra/Dec.
 * @param target observation target
 */
export const targetIsRaDec = (
  target: ObservationTargetProps
): target is ObservationRaDecTargetProps => "ra" in target;

/**
 * Distinguish the observation target is identified by the star ID.
 * @param target observation target
 */
export const targetIsStar = (
  target: ObservationTargetProps
): target is ObservationStarTargetProps => "starNumber" in target;

/**
 * Describes interactions by the user on the celestial canvas.
 */
export interface InteractionProps
  extends Pick<CanvasProps, "onWheel" | "onTouchMove"> {
  /**
   * handle selection of the celestial entities.
   * this event will occur by the clicking or tapping.
   */
  onSelect?: (event: CelestialSelectEvent) => any;
  /**
   * handle move of the sight in the celestial canvas.
   * this event will occur by the dragging or swiping.
   */
  onMove?: (event: CelestialMoveEvent) => any;
  /**
   * handle zoom changes on the celestial canvas.
   * this event will occur by moving wheels or pinching fingers.
   */
  onZoom?: (event: CelestialZoomEvent) => any;
  /**
   * mouse button ids for handling click.
   * @defaultvalue 1
   */
  reactiveButtons?: number;
  /**
   * whether disable user-side pinch zoom on the celestial canvas.
   * @defaultvalue true
   */
  disableUserScale?: boolean;
}

/**
 * Describes the selection of the celestial object.
 */
export interface CelestialSelectEvent {
  /**
   * right ascension of the selection point, in radian.
   */
  ra: Radian;
  /**
   * declination of the selection point, in radian.
   */
  dec: Radian;
  /**
   * nearest star of the selected position.
   */
  star: (Star & { distance: number }) | null;
  /**
   * nearest named star of the selected position.
   */
  namedStar: (Star & { distance: number }) | null;
  /**
   * nearest constellation of the selected position.
   */
  constellation: { consKey: CONSTELLATION_KEY; distance: number } | null;
  /**
   * original event dispatched by the DOM element.
   */
  originalEvent: MouseEvent | TouchEvent;
}

/**
 * Describes the movement of the sight.
 */
export interface CelestialMoveEvent {
  /**
   * azimuthal difference.
   */
  azimuth: Degree;
  /**
   * altitudal difference.
   */
  altitude: Degree;
  /**
   * original event dispatched by the DOM element.
   */
  originalEvent: MouseEvent | TouchEvent;
}

/**
 * Describes the change of the zoom of the camera.
 */
export interface CelestialZoomEvent {
  /**
   * delta zoom factor.
   */
  zoomDelta: number;
  /**
   * original event dispatched by the DOM element.
   */
  originalEvent: MouseEvent | TouchEvent;
}
