import { Bloom, EffectComposer } from "@react-three/postprocessing";
import React, { useMemo } from "react";

export interface EffectorProps {
  /**
   * set enablity of effects.
   * @defaultvalue true
   */
  enabled?: boolean;
}

export const Effector = ({ enabled = true }: EffectorProps) =>
  useMemo(
    () => (
      <EffectComposer enabled={enabled}>
        <Bloom
          blendFunction={1} // ADDITIVE
          intensity={0.3}
          luminanceThreshold={0}
          luminanceSmoothing={0}
          kernelSize={0} // VERY_SMALL
        />
        <Bloom
          blendFunction={1} // ADDITIVE
          intensity={0.8}
          luminanceThreshold={0}
          luminanceSmoothing={1}
          kernelSize={3} // VERY_SMALL
        />
      </EffectComposer>
    ),
    [enabled]
  );
