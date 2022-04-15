import { extend, ReactThreeFiber } from "@react-three/fiber";
import React, { useEffect, useMemo } from "react";
import { Color } from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";
import { CONSTELLATIONS, CONSTELLATION_KEY } from "../../core/constellations";
import { calcStarPositions, StarDict, StarPosition } from "../../core/stars";

extend({ LineSegments2, LineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      lineSegments2: ReactThreeFiber.Node<LineSegments2, typeof LineSegments2>;
      lineMaterial: ReactThreeFiber.Node<LineMaterial, typeof LineMaterial>;
    }
  }
}

export interface ConstellationsProps {
  universeClock: Date;
  sphereRadius: number;
  stars: StarDict;
  lineColor: Color;
  lineWidth: number;
  opacity?: number;
}

export const Constellations = ({
  universeClock,
  sphereRadius,
  stars,
  lineColor,
  lineWidth,
  opacity = 1.0,
}: ConstellationsProps) => {
  const material = useMemo(
    () =>
      new LineMaterial({
        color: lineColor.getHex(),
        opacity,
        transparent: true,
        linewidth: lineWidth,
      }),
    [lineColor, opacity, lineWidth]
  );
  useEffect(() => () => material.dispose(), [material]);
  // get star instances that is used in the constellation.
  const starsInCons = useMemo(
    () =>
      Array.from(
        new Set(Object.entries(CONSTELLATIONS).flatMap((c) => c[1].flat()))
      )
        .map((n) => stars[n])
        .filter((s) => s != null),
    [stars]
  );

  // star positions are not so changed when the universeClocks are almost same (at universe-scale).
  // see also: StarRenderer.tsx
  const geometries = useMemo(() => {
    const poss = calcStarPositions(starsInCons, sphereRadius, universeClock);
    const segs = Object.entries(CONSTELLATIONS).map(
      ([consKeyStr, starTuples]) => ({
        key: consKeyStr as CONSTELLATION_KEY,
        segments: starTuples
          .map((stars) => stars.map((s) => poss[s]))
          .filter((stars) => stars.every((s) => s != null)),
      })
    );
    return segs.map(({ key, segments }) => ({
      key: key,
      geom: new LineSegmentsGeometry().setPositions(
        starPositionsToFloat32Array(segments)
      ),
    }));
  }, [starsInCons, sphereRadius, universeClock.getUTCFullYear()]);

  useEffect(
    () => () => geometries.forEach(({ geom }) => geom.dispose()),
    [geometries]
  );
  const lines = useMemo(
    () =>
      geometries.map(({ key, geom }) => (
        <lineSegments2 key={key} geometry={geom} material={material} />
      )),
    [geometries, material]
  );

  return <> {lines} </>;
};

const starPositionsToFloat32Array = (stars: StarPosition[][]) => {
  let positions = new Float32Array(stars.length * 3 * 2);
  stars.forEach((sps, i) =>
    sps.forEach((pos, j) => {
      positions[(i * 2 + j) * 3 + 0] = pos[0];
      positions[(i * 2 + j) * 3 + 1] = pos[1];
      positions[(i * 2 + j) * 3 + 2] = pos[2];
    })
  );
  return positions;
};
