import { Canvas, Props as CanvasProps } from "@react-three/fiber";
import React, { forwardRef, ReactNode, useEffect, useState } from "react";
import { useCelestialEngine } from "./contexts";
import { Interactor, InteractorProps } from "./observations/Interactor";
import { Observer, ObserverProps } from "./observations/Observer";
import { CelestialEngineProps } from "./properties";
import { Effector } from "./renderers/Effector";
import { Navigator, NavigatorProps } from "./renderers/Navigator";
import { StarRenderer, StarRendererProps } from "./renderers/StarRenderer";

export interface CelestialCanvasWithContextProps {
  /**
   * Use the CelestialEngineContext as source of canvas props.
   */
  useContext: true;
}

export interface CelestialCanvasWithoutContextType
  extends CelestialEngineProps {
  /**
   * Use the CelestialEngineContext as source of canvas props.
   */
  useContext?: false | undefined;
}

export interface CelestialCanvasAdHocProps
  extends Omit<CanvasProps, "children" | "onSelect"> {
  /**
   * apply default bloom effect.
   * @defaultValue true
   */
  bloomEffect?: boolean;
  /**
   * additional children in the CelestialCanvas.
   */
  children?: ReactNode;
}

export type CelestialCanvasProps = (
  | CelestialCanvasWithContextProps
  | CelestialCanvasWithoutContextType
) &
  CelestialCanvasAdHocProps;

/**
 * The canvas to render the celestial entities.
 */
export const CelestialCanvas = forwardRef<
  HTMLCanvasElement,
  CelestialCanvasProps
>(({ children, bloomEffect = true, ...props }, ref) => {
  const {
    // UniverseProps
    universeClock,
    stars,
    vMag,
    sphereRadius = 20.0,
    starSizeRatio = 1.0,
    // I18nProps
    constellationNames,
    starNames,
    // RepresentationProps
    constellations,
    equatorialGrid,
    azimuthalGrid,
    directionLabel,
    starMarkers,
    // ObservationProps
    latitude,
    longitude,
    target,
    fov,
    zoom,
    animationSpeed,
    cameraProps,
    // InteractionProps
    onSelect,
    onMove,
    onZoom,
    reactiveButtons,
    disableUserScale,
    useContext,
    ...canvasProps
  } = "useContext" in props && props.useContext === true
    ? { ...useCelestialEngine().internalProps, ...props }
    : props;

  const starRendererProps: StarRendererProps = {
    universeClock,
    stars,
    sphereRadius,
    vMag,
    starSizeRatio,
  };

  const navigatorProps: NavigatorProps = {
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
  };

  const observerProps: ObserverProps = {
    universeClock,
    stars,
    latitude,
    longitude,
    target,
    fov,
    zoom,
    animationSpeed,
    cameraProps,
  };

  const interactorProps: InteractorProps = {
    universeClock,
    stars,
    starNames,
    vMag,
    onSelect,
    onMove,
    onZoom,
    reactiveButtons,
    disableUserScale,
  };

  // lazy init for server side rendering compat.
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => setShowCanvas(true), []);

  if (!showCanvas) {
    return null;
  }
  return (
    <Canvas ref={ref} {...canvasProps}>
      <StarRenderer {...starRendererProps} />
      <Navigator {...navigatorProps} />
      <Observer {...observerProps} />
      <Interactor {...interactorProps} />
      {children}
      <Effector enabled={bloomEffect} />
    </Canvas>
  );
});
