import { Camera, useThree } from "@react-three/fiber";
import React, { useCallback, useEffect, useRef } from "react";
import { Vector3 } from "three";
import { InternationalizationProps } from "..";
import { cos, deg, rad, Radian, sin } from "../core/basic";
import { CONSTELLATIONS, CONSTELLATION_KEY } from "../core/constellations";
import { getStarRaDec, Star } from "../core/stars";
import {
  CelestialSelectEvent,
  InteractionProps,
  UniverseProps,
} from "../properties";

export type InteractorProps = Pick<
  UniverseProps,
  "universeClock" | "stars" | "vMag"
> &
  Pick<InternationalizationProps, "starNames"> &
  InteractionProps;

export const Interactor = ({
  universeClock,
  stars,
  vMag,
  starNames,
  onSelect,
  onMove,
  onZoom,
  reactiveButtons = 1,
  disableUserScale = true,
}: InteractorProps) => {
  const camera = useThree((s) => s.camera);
  const { domElement: canvas } = useThree((s) => s.gl);
  const dragging = useRef<boolean>(false);
  const lastPos = useRef<LocalPoint | null>(null);
  const pinchDist = useRef<number | null>(null);
  const currentClock = useRef<Date>(universeClock);

  useEffect(() => {
    currentClock.current = universeClock;
  }, [universeClock]);

  // utility functions

  const fireOnMove = useCallback(
    (ev: MouseEvent | TouchEvent, denominator: number) => {
      if ("touches" in ev && ev.touches.length != 1) {
        // this event has multiple touch point or not have any touch points
        // disable moving
        return null;
      }
      const localPos = getLocalPoints(ev)[0];
      const last = lastPos.current;
      if (onMove && last) {
        onMove({
          azimuth: deg(-(localPos.x - last.x) / denominator),
          altitude: deg((localPos.y - last.y) / denominator),
          originalEvent: ev,
        });
      }
      return localPos;
    },
    [onMove]
  );
  const fireOnClick = useCallback(
    (ev: MouseEvent | TouchEvent) => {
      if ("touches" in ev && ev.touches.length != 0) {
        // this event has multiple touch point or not have any touch points
        // disable moving
        return;
      }
      const last = lastPos.current;
      if (onSelect && last) {
        const rect = (ev.target as HTMLElement).getBoundingClientRect();
        const rd = toRaDec(last, rect, camera);
        onSelect(
          createClickEvent(stars, starNames, currentClock.current, rd, vMag, ev)
        );
      }
    },
    [onSelect, lastPos, stars, vMag, camera, currentClock]
  );

  const fireOnZoom = useCallback(
    (ev: MouseEvent | TouchEvent, delta: number) => {
      if (onZoom) {
        onZoom({
          zoomDelta: delta,
          originalEvent: ev,
        });
      }
    },
    [onZoom]
  );

  // event listener utility
  const useEventListener = <K extends keyof HTMLElementEventMap>(
    type: K,
    listener: (this: HTMLCanvasElement, ev: HTMLElementEventMap[K]) => any
  ) =>
    useEffect(() => {
      canvas.addEventListener(type, listener);
      return () => canvas.removeEventListener(type, listener);
    }, [canvas, listener]);

  // mouse events
  useEventListener(
    "mousedown",
    useCallback(
      (ev) => {
        if ((ev.buttons & reactiveButtons) == 0) return;
        lastPos.current = getLocalPoints(ev)[0];
        dragging.current = false;
      },
      [reactiveButtons, lastPos, dragging]
    )
  );
  useEventListener(
    "mousemove",
    useCallback(
      (ev) => {
        if ((ev.buttons & reactiveButtons) == 0) return;
        if (lastPos.current) {
          dragging.current = true;
          lastPos.current = fireOnMove(ev, 10);
        }
      },
      [reactiveButtons, lastPos, dragging, fireOnMove]
    )
  );
  useEventListener(
    "mouseup",
    useCallback(
      (ev) => {
        if (lastPos.current && !dragging.current) {
          fireOnClick(ev);
        }
        lastPos.current = null;
      },
      [lastPos, dragging, fireOnClick]
    )
  );
  useEventListener(
    "wheel",
    useCallback(
      (ev) => fireOnZoom(ev, ev.deltaY / Math.abs(ev.deltaY) / 5),
      [fireOnZoom]
    )
  );

  // touch events
  useEventListener(
    "touchstart",
    useCallback(
      (ev) => {
        if (ev.touches.length > 0) {
          lastPos.current = getNearestLocalPoint(
            getLocalPoints(ev),
            lastPos.current
          );
          dragging.current = false;
        }
      },
      [lastPos, dragging]
    )
  );

  useEventListener(
    "touchmove",
    useCallback(
      (ev) => {
        if (lastPos.current) {
          dragging.current = true;
          if (ev.touches.length == 1) {
            // swiping
            lastPos.current = fireOnMove(ev, 5);
            pinchDist.current = null;
          } else if (ev.touches.length >= 2) {
            // pinching
            const d = Math.sqrt(
              Math.pow(ev.touches[0].screenX - ev.touches[1].screenX, 2) +
                Math.pow(ev.touches[0].screenY - ev.touches[1].screenY, 2)
            );
            if (pinchDist.current) {
              fireOnZoom(ev, (d - pinchDist.current) / 20);
            }
            pinchDist.current = d;
            lastPos.current = getNearestLocalPoint(
              getLocalPoints(ev),
              lastPos.current
            );
          }
          if (disableUserScale) {
            ev.preventDefault();
          }
        }
      },
      [lastPos, dragging, fireOnMove, pinchDist, fireOnZoom, disableUserScale]
    )
  );

  useEventListener(
    "touchend",
    useCallback(
      (ev) => {
        if (ev.touches.length < 1) {
          if (lastPos.current && !dragging.current) {
            fireOnClick(ev);
            // due to handle here, suppress trailing click event
            ev.preventDefault();
          }
          lastPos.current = null;
        }
        if (ev.touches.length < 2) {
          pinchDist.current = null;
        }
      },
      [lastPos, dragging, fireOnClick, pinchDist]
    )
  );

  return <></>;
};

export interface LocalPoint {
  x: number;
  y: number;
}

export const getLocalPoints = (ev: MouseEvent | TouchEvent): LocalPoint[] => {
  const rect = (ev.target as HTMLElement).getBoundingClientRect();
  const client =
    "clientX" in ev
      ? [{ clientX: ev.clientX, clientY: ev.clientY }]
      : [...ev.touches].map((t) => ({
          clientX: t.clientX,
          clientY: t.clientY,
        }));
  return client.map((c) => ({
    x: c.clientX - window.scrollX - rect.left,
    y: c.clientY - window.scrollY - rect.top,
  }));
};

export const getNearestLocalPoint = (
  current: LocalPoint[],
  last: LocalPoint | null
) =>
  last
    ? current
        .map((p) => ({
          p,
          d: Math.pow(p.x - last.x, 2) + Math.pow(p.y - last.y, 2),
        }))
        .sort((a, b) => a.d - b.d)[0].p
    : current[0];

export const toRaDec = (
  pos: LocalPoint,
  rect: { width: number; height: number },
  camera: Camera
): [Radian, Radian] => {
  // calculate clicked angle (ra-dec)
  const mouseVec = new Vector3(
    (pos.x / rect.width) * 2 - 1,
    -(pos.y / rect.height) * 2 + 1,
    1
  );
  const angleVec = mouseVec.unproject(camera).sub(camera.position).normalize();
  const delta = Math.asin(angleVec.z);
  const sAlpha = Math.atan2(angleVec.y, angleVec.x);
  const alpha = sAlpha >= 0 ? sAlpha : Math.PI * 2 + sAlpha;
  return [rad(alpha), rad(delta)];
};

const normDec = (dec: Radian) =>
  rad(
    dec > Math.PI * 2
      ? dec - Math.PI * 2
      : dec < -(Math.PI * 2)
      ? dec + Math.PI * 2
      : dec
  );

export const calcDistance = (
  p0RaDec: [Radian, Radian],
  p1RaDec: [Radian, Radian]
) =>
  Math.pow(
    Math.acos(
      sin(p0RaDec[1]) * sin(p1RaDec[1]) +
        cos(p0RaDec[1]) *
          cos(p1RaDec[1]) *
          cos(rad(Math.abs(p0RaDec[0] - p1RaDec[0])))
    ),
    2
  );

export const calcDistanceLine = (
  pRaDec: [Radian, Radian],
  l0RaDec: [Radian, Radian],
  l1RaDec: [Radian, Radian]
) => {
  // prepare vector
  const vl: [Radian, Radian] = [
    rad(l1RaDec[0] - l0RaDec[0]),
    normDec(rad(l1RaDec[1] - l0RaDec[1])),
  ];
  const vp: [Radian, Radian] = [
    rad(pRaDec[0] - l0RaDec[0]),
    normDec(rad(pRaDec[1] - l0RaDec[1])),
  ];
  // ll2 = vl ^ 2
  const ll2 = Math.pow(vl[0], 2) + Math.pow(vl[1], 2);
  // check the relative position
  // (vl.vp / |v|^2)
  const k = (vl[0] * vp[0] + vl[1] * vp[1]) / ll2;
  // check the clicked point is inside of the range of the line
  return k <= 0
    ? calcDistance(pRaDec, l0RaDec)
    : k >= 1
    ? calcDistance(pRaDec, l1RaDec)
    : // calc distance
      // (vl x vp / | vl |)^2
      Math.pow(vl[0] * vp[1] - vl[1] * vp[0], 2) / ll2;
};

const createClickEvent = (
  stars: { [key: number]: Star },
  starNames: { [key: number]: string },
  clock: Date,
  radec: [Radian, Radian],
  vMag: number,
  originalEvent: MouseEvent | TouchEvent
): CelestialSelectEvent => {
  const [ra, dec] = radec;
  const sortedStarsByD = Object.values(stars)
    .filter((star) => star.vMag <= vMag)
    .map((s) => ({
      distance: calcDistance(radec, getStarRaDec(s, clock)),
      ...s,
    }))
    .sort((x, y) =>
      x.distance < y.distance ? -1 : x.distance > y.distance ? 1 : 0
    );

  const sortedConsByD = Object.entries(CONSTELLATIONS)
    .flatMap(([consKey, starPair]) =>
      Array.from(starPair, (pair) => ({
        consKey: consKey as CONSTELLATION_KEY,
        stars: pair.map((s) => stars[s]),
      }))
    )
    .filter((d) => d.stars.every((s) => s && s.vMag <= vMag))
    .map((d) => ({
      ...d,
      sp: d.stars.map((s) => getStarRaDec(s, clock)),
    }))
    .map((d) => ({
      consKey: d.consKey,
      distance: calcDistanceLine(radec, d.sp[0], d.sp[1]),
    }))
    .sort((x, y) =>
      x.distance < y.distance ? -1 : x.distance > y.distance ? 1 : 0
    );

  return {
    ra,
    dec,
    star: sortedStarsByD[0],
    namedStar: sortedStarsByD.find((s) => s.id in starNames) || null,
    constellation: sortedConsByD[0],
    originalEvent,
  };
};
