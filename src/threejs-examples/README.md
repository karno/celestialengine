# Resources derived from ThreeJS examples

## What?

This directory includes ThreeJS examples used in the celestialengine.
They are licensed under the [MIT License](https://github.com/mrdoob/three.js/blob/dev/LICENSE).

## Why?

We have to bundle them to prevent mismatch in moduling systems.

This problem occurs in the CommonJS moduling system.
Because this library has written in module-system agnostic, this library will convert into CommonJS and ESModules by bundlers.
However, when convert into CommonJS, the reference to ThreeJS examples modules kept original (that is an ESM) and can't get along with the CJS module.
