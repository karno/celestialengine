import { extend, useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Color,
  DoubleSide,
  Euler,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from "three";
import { Text as TroikaText } from "troika-three-text";
import {
  asRad,
  deg,
  Degree,
  degToRad,
  getGreenwichSiderealTime,
  Radian,
} from "../../core/basic";
import { calcCelestialPosition } from "../../core/stars";
import {
  quaternionFromAxisAngle,
  VECTOR3_X,
  VECTOR3_Y,
  VECTOR3_Z,
} from "./observationUtil";

extend({ TroikaText });

const DEFAULT_FONT =
  "https://fonts.gstatic.com/s/notosans/v7/o-0IIpQlx3QUlC5A4PNr5TRG.woff";
const DEFAULT_FONT_SIZE = 10.0;

export interface BasicLabelProps {
  font: string | null | undefined;
  fontSize: number | null | undefined;
  color: Color;
  opacity: number;
  sphereRadius: number;
  radialOffset: number;
}

export interface DirectionLabelProps extends BasicLabelProps {
  texts: {
    north: string;
    east: string;
    south: string;
    west: string;
  };
  latitude: Degree;
  longitude: Degree;
  universeClock: Date;
}

export interface TextLabelProps extends BasicLabelProps {
  text: string;
  ra: Radian;
  dec: Radian;
}

export interface StarMarkerLabelProps extends BasicLabelProps {
  text: string;
  ra: Radian;
  dec: Radian;
}

interface RawLabelProps {
  text: string;
  font: string | null | undefined;
  fontSize: number | null | undefined;
  color: Color;
  opacity: number;
  yAngle?: Degree;
}

const RawLabel = React.forwardRef<Mesh, RawLabelProps>(
  ({ text, font, fontSize, color, opacity, yAngle = deg(0) }, ref) => {
    const mesh = useMemo(() => new TroikaText(), []);
    useEffect(() => () => mesh.dispose(), [mesh]);
    const material = useMemo(
      () => new MeshBasicMaterial({ opacity, side: DoubleSide }),
      [opacity]
    );
    useEffect(() => () => material.dispose(), [material]);
    return (
      <primitive
        object={mesh}
        ref={ref}
        text={text}
        font={font || DEFAULT_FONT}
        fontSize={fontSize || DEFAULT_FONT_SIZE}
        anchorX="center"
        anchorY="bottom"
        textAlign="center"
        color={color}
        rotation={new Euler(0, asRad(yAngle), 0)}
        material={material}
      />
    );
  }
);

export const DirectionLabels = ({
  texts,
  font,
  fontSize,
  color,
  opacity,
  latitude,
  longitude,
  sphereRadius,
  universeClock,
  radialOffset,
}: DirectionLabelProps) => {
  const camera = useThree((s) => s.camera);
  const ref = useRef<Mesh>(null);
  const makeDef = (key: string, text: string, angleDeg: number) => ({
    key,
    text,
    angle: deg(angleDeg),
    ref: useRef<Mesh>(null),
  });

  const labelDefs = [
    makeDef("N", texts.north, 180),
    makeDef("E", texts.east, 90),
    makeDef("S", texts.south, 0),
    makeDef("W", texts.west, 270),
  ];

  // global rotation
  useFrame(() => {
    if (ref.current) {
      ref.current.quaternion.copy(
        getDirectionLabelQuaternion(universeClock, latitude, longitude)
      );
    }
  });

  // local position and scaling (to keep the font size)
  useFrame(() =>
    labelDefs.forEach(({ angle, ref }) => {
      const label = ref.current;
      if (label) {
        normalizeLabelScale(
          label,
          camera.projectionMatrix,
          sphereRadius,
          radialOffset
        );
        label.position.copy(
          new Vector3(1, 0, 0)
            .applyAxisAngle(VECTOR3_Y, degToRad(angle + 90))
            .multiplyScalar(sphereRadius + radialOffset)
        );
      }
    })
  );

  return (
    <mesh ref={ref}>
      {labelDefs.map(({ key, text, angle, ref }) => (
        <RawLabel
          ref={ref}
          key={key}
          text={text}
          yAngle={angle}
          font={font}
          fontSize={fontSize}
          color={color}
          opacity={opacity}
        />
      ))}
    </mesh>
  );
};

export const TextLabel = ({
  text,
  font,
  fontSize,
  color,
  opacity,
  ra,
  dec,
  sphereRadius,
  radialOffset,
}: TextLabelProps) => {
  const camera = useThree((s) => s.camera);
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    const label = ref.current;
    if (label) {
      normalizeLabelScale(
        label,
        camera.projectionMatrix,
        sphereRadius,
        radialOffset
      );
      label.quaternion.copy(camera.quaternion);
      label.position.copy(
        new Vector3(
          ...calcCelestialPosition(ra, dec, sphereRadius + radialOffset)
        )
      );
    }
  });

  return useMemo(
    () => (
      <RawLabel
        ref={ref}
        text={text}
        font={font}
        fontSize={fontSize}
        color={color}
        opacity={opacity}
      />
    ),
    [text, font, fontSize, color, opacity]
  );
};

export const StarMarkerLabel = ({
  text,
  font,
  fontSize,
  color,
  opacity,
  ra,
  dec,
  sphereRadius,
  radialOffset,
}: StarMarkerLabelProps) => {
  const camera = useThree((s) => s.camera);
  const ref = useRef<Mesh>(null);
  useFrame(() => {
    const label = ref.current;
    if (label) {
      normalizeLabelScale(
        label,
        camera.projectionMatrix,
        sphereRadius,
        radialOffset
      );
      label.quaternion.copy(camera.quaternion);
      label.position.copy(
        new Vector3(
          ...calcCelestialPosition(ra, dec, sphereRadius + radialOffset)
        )
      );
    }
  });
  const offset = 8;
  const geometry = useMemo(() => new PlaneGeometry(5.0, 1.0), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const material = useMemo(
    () => new MeshBasicMaterial({ color, opacity, transparent: true }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh
      ref={ref}
      position={new Vector3(...calcCelestialPosition(ra, dec, sphereRadius))}
    >
      <RawLabel
        text={text}
        font={font}
        fontSize={fontSize}
        color={color}
        opacity={opacity}
      />
      <mesh
        position={new Vector3(offset, 0.0, 0.0)}
        geometry={geometry}
        material={material}
      />
      <mesh
        position={new Vector3(0.0, -offset, 0.0)}
        rotation={new Euler(0, 0, Math.PI / 2)}
        geometry={geometry}
        material={material}
      />
      <mesh
        position={new Vector3(-offset, 0.0, 0.0)}
        geometry={geometry}
        material={material}
      />
    </mesh>
  );
};

const normalizeLabelScale = (
  label: Mesh,
  projectionMatrix: Matrix4,
  sphereRadius: number,
  radialOffset: number
) => {
  const camDist = projectionMatrix.elements[5];
  const scale = (sphereRadius + radialOffset) / (camDist * 200);
  label.scale.copy(new Vector3(scale, scale, scale));
};

const getDirectionLabelQuaternion = (
  universeClock: Date,
  latitude: Degree,
  longitude: Degree
) =>
  new Quaternion()
    // apply time angle + local longitude
    .multiply(
      quaternionFromAxisAngle(
        VECTOR3_Z,
        asRad(deg(getGreenwichSiderealTime(universeClock) + longitude - 90))
      )
    )
    // apply latitude
    .multiply(quaternionFromAxisAngle(VECTOR3_X, asRad(latitude)))
    .normalize();
