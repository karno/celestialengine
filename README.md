# celestialengine🪐

[![npm version](https://badge.fury.io/js/celestialengine.svg)](https://badge.fury.io/js/celestialengine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

_The universe, at your site._

This component introduces a planetarium to your React webpage.

demo: https://celestian.io/engine

## Prerequisites

- React
- Three.js
- react-three-fiber
- react-three-postprocessing

## Installation

```
npm install celestialengine
```

you probably also need to install these libraries:

```
npm install react three @react-three/fiber @react-three/postprocessing
```

## How to use

### 1. Prepare star data

Before installing components into your page, you have to download & extract star data.

1. `cd` into the `public` folder
2. Execute `npx get-star-db`

### 2. Install components into your page

```tsx
<CelestialEngine
  metadataSource="./dat_hp_meta.json"
  initialProps={{ vMag: 5.0 }}
>
  <CelestialCanvas useEngine={true} />
</CelestialEngine>
```

### 3. Control the properties

```tsx
import { deg, useCelestialEngine } from "celestialengine";
import { useEffect } from "react";

...

  const { setProps } = useCelestialEngine();
  useEffect(() => {
    setProps((p) => ({
      ...p,
      controllable: true,
      selectable: true,
      vMag: 7.0,
      altitude: deg(60),
    }))
  }, []);
```

see [properties.ts](./src/properties.ts) and [contexts/contextProperties.ts](./src/contexts/contextProperties.ts).

## How does it work?

_celestialengine_ renders the starry skies on the Canvas via [ThreeJS](https://threejs.org/) and [react-three-fiber](https://github.com/pmndrs/react-three-fiber).

This module includes:

- star renderer, it can render over one-hundred thousand stars (although depends on the performance of the client).
- constellation lines and navigation lines, it is a handy hint to find stars.
- astrometric calculations, render the actual sky corresponding to the actual location, time, and observation az/alt.

## Redux compatibility?

Remove `<CelestialEngine>` and manage [`CelestialEngineProps`](./src/properties.ts) in your redux store, then seed the `CelestialEngineProps` to `<CelestialCanvas>`.
