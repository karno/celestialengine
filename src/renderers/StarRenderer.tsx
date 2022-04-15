import React, { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  RawShaderMaterial,
} from "three";
import {
  calcStarPositions,
  getStarOpacity,
  getStarSize,
  Star,
  StarPositionDict,
} from "../core/stars";
import { UniverseProps } from "../properties";

const STARS_V_SHADER = `
	precision highp float;
	uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;
	attribute vec3 position;
	attribute vec3 color;
	attribute float size;
	attribute float opacity;
	varying vec3 vColor;
	varying float vOpacity;
	void main() {
	  vColor = color;
    vOpacity = opacity;
	  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	  gl_PointSize = size;
	  gl_Position = projectionMatrix * mvPosition;
	}`;

const STARS_F_SHADER = `
	precision highp float;
	varying vec3 vColor;
	varying float vOpacity;
	void main() {
    vec2 n = gl_PointCoord * 2.0 - 1.0;
    float d = dot(n, n);
    if (d > 1.0) discard;
    gl_FragColor = vec4(vec3(1.0) * vColor, vOpacity); // * (1.0 - sqrt(d)));
	}`;

export type StarRendererProps = Required<UniverseProps>;

export const StarRenderer = ({
  universeClock,
  stars,
  sphereRadius,
  vMag,
  starSizeRatio,
}: StarRendererProps) => {
  const material = useMemo(
    () =>
      new RawShaderMaterial({
        vertexShader: STARS_V_SHADER,
        fragmentShader: STARS_F_SHADER,
        blending: AdditiveBlending,
        depthTest: false,
        transparent: true,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  // star positions are not so changed when the universeClocks are almost same (at universe-scale).
  const geometry = useMemo(() => {
    const visibleStars = Object.values(stars).filter((s) => s.vMag <= vMag);
    const starPosDict = calcStarPositions(
      visibleStars,
      sphereRadius,
      universeClock
    );
    return generateGeometry(visibleStars, starPosDict, starSizeRatio * 1.0);
  }, [
    stars,
    vMag,
    sphereRadius,
    starSizeRatio,
    universeClock.getUTCFullYear(),
  ]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  return <points geometry={geometry} material={material} />;
};

const generateGeometry = (
  stars: Star[],
  starPositions: StarPositionDict,
  scale: number
) => {
  const numStars = stars.length;
  let positions = new Float32Array(numStars * 3);
  let colors = new Float32Array(numStars * 3);
  let sizes = new Float32Array(numStars);
  let opacities = new Float32Array(numStars);
  stars.forEach((s, i) => {
    const pos = starPositions[s.id];
    positions[i * 3 + 0] = pos[0];
    positions[i * 3 + 1] = pos[1];
    positions[i * 3 + 2] = pos[2];
    colors[i * 3 + 0] = s.r;
    colors[i * 3 + 1] = s.g;
    colors[i * 3 + 2] = s.b;
    sizes[i] = getStarSize(s) * scale;
    opacities[i] = getStarOpacity(s);
  });
  return new BufferGeometry()
    .setAttribute("position", new Float32BufferAttribute(positions, 3))
    .setAttribute("color", new Float32BufferAttribute(colors, 3))
    .setAttribute("size", new Float32BufferAttribute(sizes, 1))
    .setAttribute("opacity", new Float32BufferAttribute(opacities, 1));
};
