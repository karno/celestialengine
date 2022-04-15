import { useMemo } from "react";
import { Color } from "three";
import { deg, ObservationProps, RepresentationProps, UniverseProps } from "..";
import { getStarRaDec } from "../core/stars";
import { InternationalizationProps, StarMarkerProps } from "../properties";
import { Constellations } from "./primitives/Constellations";
import { AzimuthalGrid, EquatorialGrid } from "./primitives/GridSpheres";
import {
  DirectionLabels,
  StarMarkerLabel,
  StarMarkerLabelProps,
} from "./primitives/Labels";

const getNormalizeFactor = (sphereRadius: number) =>
  0.0001 * Math.sqrt(sphereRadius);

const EqGridDefaultColor = new Color(0.7, 0.0, 0.0);
const AzGridDefaultColor = new Color(0.0, 0.2, 1.0);
const ConsDefaultColor = new Color(0.8, 0.3, 0.0);
const DirLabelsDefaultColor = new Color(1.0, 1.0, 1.0);
const StarMarkersDefaultColor = new Color(1.0, 1.0, 1.0);

export type NavigatorProps = Required<
  Pick<UniverseProps, "universeClock" | "stars" | "sphereRadius">
> &
  Pick<InternationalizationProps, "starNames"> &
  Pick<ObservationProps, "latitude" | "longitude"> &
  RepresentationProps;

/**
 * Represents the grid spheres and the directinal labels.
 */
export const Navigator = ({
  universeClock,
  stars,
  starNames,
  sphereRadius,
  latitude,
  longitude,
  constellations,
  equatorialGrid,
  azimuthalGrid,
  directionLabel,
  starMarkers,
  defaultFont,
  defaultFontSize,
}: NavigatorProps) => (
  <>
    {equatorialGrid && equatorialGrid.show !== false ? (
      <EquatorialGrid
        sphereRadius={sphereRadius + (equatorialGrid.radialOffset || 0)}
        lineColor={equatorialGrid.color || EqGridDefaultColor}
        opacity={equatorialGrid.opacity || 1.0}
        lineWidth={
          (equatorialGrid.lineWidth || 1.0) * getNormalizeFactor(sphereRadius)
        }
      />
    ) : null}
    {azimuthalGrid && azimuthalGrid.show !== false ? (
      <AzimuthalGrid
        universeClock={universeClock}
        latitude={deg(latitude)}
        longitude={deg(longitude)}
        sphereRadius={sphereRadius + (azimuthalGrid.radialOffset || 0)}
        lineColor={azimuthalGrid.color || AzGridDefaultColor}
        opacity={azimuthalGrid.opacity || 1.0}
        lineWidth={
          (azimuthalGrid.lineWidth || 1.0) * getNormalizeFactor(sphereRadius)
        }
      />
    ) : null}
    {constellations && constellations.show !== false ? (
      <Constellations
        universeClock={universeClock}
        stars={stars}
        sphereRadius={sphereRadius + (constellations.radialOffset || 0)}
        lineColor={constellations.color || ConsDefaultColor}
        opacity={constellations.opacity || 1.0}
        lineWidth={
          (constellations.lineWidth || 1.0) * getNormalizeFactor(sphereRadius)
        }
      />
    ) : null}
    {directionLabel && directionLabel.show !== false ? (
      <DirectionLabels
        texts={{
          north: directionLabel.texts?.north || "N",
          east: directionLabel.texts?.east || "E",
          south: directionLabel.texts?.south || "S",
          west: directionLabel.texts?.west || "W",
        }}
        latitude={deg(latitude)}
        longitude={deg(longitude)}
        universeClock={universeClock}
        sphereRadius={sphereRadius}
        radialOffset={directionLabel.radialOffset || 0}
        font={directionLabel.font || defaultFont}
        fontSize={directionLabel.fontSize || defaultFontSize}
        color={directionLabel.color || DirLabelsDefaultColor}
        opacity={directionLabel.opacity || 1.0}
      />
    ) : null}
    {useMemo(
      () =>
        starMarkers
          ? Object.entries(
              starMarkers.reduce(
                (
                  d: { [key: number]: StarMarkerLabelProps },
                  e: StarMarkerProps
                ) => {
                  const text = e.text || starNames[e.starNumber];
                  const star = stars[e.starNumber];
                  if (star && text) {
                    const [ra, dec] = getStarRaDec(star, universeClock);
                    d[e.starNumber] = {
                      text,
                      sphereRadius,
                      ra,
                      dec,
                      color: e.color || StarMarkersDefaultColor,
                      opacity: e.opacity || 1.0,
                      radialOffset: e.radialOffset || 0.0,
                      font: e.font || defaultFont,
                      fontSize: e.fontSize || defaultFontSize,
                      ...e,
                    };
                  }
                  return d;
                },
                {}
              )
            ).map(([key, props]) => <StarMarkerLabel key={key} {...props} />)
          : null,
      [starMarkers, stars, sphereRadius]
    )}
  </>
);
