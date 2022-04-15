import { MutableRefObject } from "react";
import { Quaternion, Vector3 } from "three";
import { Radian } from "../../core/basic";

export const setAnimationRefs = <TObj, TParam>(
  objRef: MutableRefObject<TObj | null>,
  paramRef: MutableRefObject<TParam | null>,
  value: TParam,
  valueSetter: (obj: TObj, param: TParam) => void
) => {
  if (objRef.current) {
    if (!paramRef.current) {
      valueSetter(objRef.current, value);
    }
    paramRef.current = value;
  } else {
    paramRef.current = null;
  }
};

export const lerp = (v1: number, v2: number, alpha: number) =>
  (1.0 - alpha) * v1 + alpha * v2;

export const VECTOR3_X = new Vector3(1, 0, 0);
export const VECTOR3_Y = new Vector3(0, 1, 0);
export const VECTOR3_Z = new Vector3(0, 0, 1);

export const quaternionFromAxisAngle = (vec: Vector3, rad: Radian) =>
  new Quaternion().setFromAxisAngle(vec, rad);
