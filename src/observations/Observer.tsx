import { useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { PerspectiveCamera, Quaternion } from "three";
import {
  ObservationProps,
  ObservationRaDecTargetProps,
  ObservationStarTargetProps,
  targetIsRaDec,
  targetIsStar,
  UniverseProps,
} from "..";
import {
  asRad,
  deg,
  Degree,
  degToRad,
  getGASTDeg,
  rad,
  Radian,
} from "../core/basic";
import { getStarRaDec, StarDict } from "../core/stars";
import {
  lerp,
  quaternionFromAxisAngle,
  setAnimationRefs,
  VECTOR3_X,
  VECTOR3_Y,
  VECTOR3_Z,
} from "../renderers/primitives/observationUtil";

export type ObserverProps = Pick<UniverseProps, "universeClock" | "stars"> &
  ObservationProps;

/**
 * Represents the celestial observer.
 */
export const Observer = ({
  universeClock,
  stars,
  latitude,
  longitude,
  target,
  fov,
  zoom,
  animationSpeed = 1.0,
  cameraProps,
}: ObserverProps) => {
  const set = useThree((s) => s.set);
  const size = useThree((s) => s.size);

  const cameraRef = useRef<PerspectiveCamera | null>(null);

  const rotParams = useRef<Quaternion | null>(null);
  const fovParams = useRef<number | null>(null);
  const zoomParams = useRef<number | null>(null);

  // initialize threejs props and camera location
  useLayoutEffect(() => {
    const camera = cameraRef.current;
    if (camera) {
      set({ camera });
    }
  }, [cameraRef, set]);

  // propagate size changes of canvas
  useLayoutEffect(() => {
    const camera = cameraRef.current;
    if (camera) {
      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();
    }
  }, [cameraRef, size]);

  // initialize & update animation parameter
  useEffect(() => {
    // resolve target
    const rt = targetIsStar(target)
      ? convertTargetStarToRaDec(universeClock, stars, target)
      : target;

    // get camera quaternion
    const q = targetIsRaDec(rt)
      ? getCameraQuaternionFromRaDec(rad(rt.ra), rad(rt.dec))
      : getCameraQuaternionFromAzAlt(
          universeClock,
          deg(latitude),
          deg(longitude),
          deg(rt.azimuth),
          deg(rt.altitude)
        );
    setAnimationRefs(cameraRef, rotParams, q, (c, v) => {
      c.quaternion.copy(v);
      c.updateProjectionMatrix();
    });
    setAnimationRefs(cameraRef, fovParams, fov, (c, v) => {
      c.fov = v;
      c.updateProjectionMatrix();
    });
    setAnimationRefs(cameraRef, zoomParams, zoom, (c, v) => {
      c.zoom = v;
      c.updateProjectionMatrix();
    });
  }, [universeClock, target, fov, zoom]);

  // animator
  useFrame(() => {
    // camera
    if (cameraRef.current) {
      // rotation
      if (rotParams.current) {
        cameraRef.current.quaternion.slerp(rotParams.current, animationSpeed);
      }
      // fov
      if (fovParams.current) {
        cameraRef.current.fov = lerp(
          cameraRef.current.fov,
          fovParams.current,
          animationSpeed
        );
      }
      // zoom
      if (zoomParams.current) {
        cameraRef.current.zoom = lerp(
          cameraRef.current.zoom,
          zoomParams.current,
          animationSpeed
        );
      }
      cameraRef.current.updateProjectionMatrix();
    }
  });

  return (
    <perspectiveCamera ref={cameraRef} position={[0, 0, 0]} {...cameraProps} />
  );
};

const convertTargetStarToRaDec = (
  universeClock: Date,
  stars: StarDict,
  target: ObservationStarTargetProps
) => {
  const star = stars[target.starNumber];
  const [ra, dec] = getStarRaDec(star, universeClock);
  return {
    ra,
    dec,
  } as ObservationRaDecTargetProps;
};

export const getCameraQuaternionFromRaDec = (ra: Radian, dec: Radian) =>
  new Quaternion() // at first, camera is heading the south celestial pole (-Z)
    .multiply(quaternionFromAxisAngle(VECTOR3_X, rad(Math.PI / 2)))
    .multiply(quaternionFromAxisAngle(VECTOR3_Y, rad(ra - Math.PI / 2)))
    .multiply(quaternionFromAxisAngle(VECTOR3_X, dec))
    .normalize();

export const getCameraQuaternionFromAzAlt = (
  universeClock: Date,
  latitude: Degree,
  longitude: Degree,
  azimuth: Degree,
  altitude: Degree
) =>
  new Quaternion() // at first, camera is heading the south celestial pole (-Z)
    // apply time angle + local longitude
    .multiply(
      quaternionFromAxisAngle(
        VECTOR3_Z,
        asRad(deg(getGASTDeg(universeClock) + (longitude - 90)))
      )
    )
    // apply latitude
    .multiply(quaternionFromAxisAngle(VECTOR3_X, degToRad(latitude + 90)))
    // apply azimuth
    .multiply(quaternionFromAxisAngle(VECTOR3_Z, degToRad(azimuth - 180)))
    //apply altitude
    .multiply(quaternionFromAxisAngle(VECTOR3_X, degToRad(altitude - 90)))
    .normalize();
