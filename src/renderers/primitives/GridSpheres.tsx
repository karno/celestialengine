import { extend, ReactThreeFiber, useFrame } from "@react-three/fiber";
import React, { forwardRef, useEffect, useMemo, useRef } from "react";
import { Color, Quaternion } from "three";
import { Degree, degToRad, getGreenwichSiderealTime } from "../../core/basic";
import { LineMaterial } from "../../threejs-examples/LineMaterial";
import { LineSegments2 } from "../../threejs-examples/LineSegments2";
import { LineSegmentsGeometry } from "../../threejs-examples/LineSegmentsGeometry";
import {
  quaternionFromAxisAngle,
  VECTOR3_X,
  VECTOR3_Z,
} from "./observationUtil";

extend({ LineSegments2, LineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      lineSegments2: ReactThreeFiber.Node<LineSegments2, typeof LineSegments2>;
      lineMaterial: ReactThreeFiber.Node<LineMaterial, typeof LineMaterial>;
    }
  }
}

export interface GridSphereProps {
  sphereRadius: number;
  lineColor: Color;
  lineWidth: number;
  opacity?: number;
}

export interface AzimuthalGridSphereProps extends GridSphereProps {
  universeClock: Date;
  latitude: Degree;
  longitude: Degree;
}

export const GridSphere = forwardRef<LineSegments2, GridSphereProps>(
  ({ sphereRadius, lineColor, lineWidth, opacity = 1.0 }, ref) => {
    const geometry = useMemo(
      () =>
        new LineSegmentsGeometry().setPositions(
          createNavigationSpherePositions(sphereRadius, 4)
        ),
      [sphereRadius]
    );
    useEffect(() => () => geometry.dispose(), [geometry]);
    const material = useMemo(
      () =>
        new LineMaterial({
          opacity: opacity,
          transparent: true,
          color: lineColor.getHex(),
          linewidth: lineWidth,
        }),
      [opacity, lineColor, lineWidth]
    );
    useEffect(() => () => material.dispose(), [material]);
    return <lineSegments2 ref={ref} geometry={geometry} material={material} />;
  }
);

export const EquatorialGrid = (props: GridSphereProps) =>
  useMemo(
    () => <GridSphere {...props} />,
    [props.sphereRadius, props.lineColor, props.lineWidth, props.opacity]
  );

export const AzimuthalGrid = ({
  sphereRadius,
  lineWidth,
  lineColor,
  opacity,
  universeClock,
  latitude,
  longitude,
}: AzimuthalGridSphereProps) => {
  const ref = useRef<LineSegments2>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.quaternion.copy(
        getAzimuthalQuaternion(universeClock, latitude, longitude)
      );
    }
  });

  return useMemo(
    () => (
      <GridSphere
        ref={ref}
        sphereRadius={sphereRadius}
        lineColor={lineColor}
        opacity={opacity}
        lineWidth={lineWidth}
      />
    ),
    [ref, sphereRadius, opacity, lineColor, lineWidth]
  );
};

const createNavigationSpherePositions = (radius: number, segments: number) => {
  if (segments < 2 || segments % 1 != 0) {
    throw new Error("segments must be integer and larger than 2.");
  }
  const rotStep = Math.PI / segments;
  const unit = Math.PI / 180;
  const dash_start = -(unit / 2.0);
  let array = new Float32Array((2 * segments - 1) * 181 * 2 * 3);
  let i = 0;
  // render lon (horizontal) line
  for (let theta = rotStep; theta < Math.PI; theta += rotStep) {
    const s_theta = Math.sin(theta);
    const c_theta = Math.cos(theta);
    for (let phi = dash_start; phi < Math.PI * 2; phi += 2 * unit) {
      const s_phi = Math.sin(phi);
      const s_phi_n = Math.sin(phi + unit);
      const c_phi = Math.cos(phi);
      const c_phi_n = Math.cos(phi + unit);
      // start (x,y,z)
      array[i++] = radius * c_phi * s_theta;
      array[i++] = radius * s_phi * s_theta;
      array[i++] = radius * c_theta;
      // end (x,y,z)
      array[i++] = radius * c_phi_n * s_theta;
      array[i++] = radius * s_phi_n * s_theta;
      array[i++] = radius * c_theta;
    }
  }

  // render lat (vertical) line
  for (let phi = 0; phi < Math.PI; phi += rotStep) {
    const s_phi = Math.sin(phi);
    const c_phi = Math.cos(phi);
    for (let theta = dash_start; theta < Math.PI * 2; theta += 2 * unit) {
      const s_theta = Math.sin(theta);
      const s_theta_n = Math.sin(theta + unit);
      const c_theta = Math.cos(theta);
      const c_theta_n = Math.cos(theta + unit);
      // start (x,y,z)
      array[i++] = radius * c_phi * s_theta;
      array[i++] = radius * s_phi * s_theta;
      array[i++] = radius * c_theta;
      // end (x, y, z)
      array[i++] = radius * c_phi * s_theta_n;
      array[i++] = radius * s_phi * s_theta_n;
      array[i++] = radius * c_theta_n;
    }
  }
  return array;
};

const getAzimuthalQuaternion = (
  universeClock: Date,
  latitude: Degree,
  longitude: Degree
) =>
  new Quaternion() // at first, a sphere pole is heading the south celestial pole (-Z)
    // apply time angle + local longitude
    .multiply(
      quaternionFromAxisAngle(
        VECTOR3_Z,
        degToRad(getGreenwichSiderealTime(universeClock) + (longitude - 90))
      )
    )
    // apply latitude
    .multiply(quaternionFromAxisAngle(VECTOR3_X, degToRad(latitude + 90)))
    .normalize();
