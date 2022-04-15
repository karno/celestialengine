# celestialengine🪐

[![npm version](https://badge.fury.io/js/celestialengine.svg)](https://badge.fury.io/js/celestialengine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

_The universe, at your site._

demo: https://celestian.io/engine

## Prerequisites

- React
- Three.js
- react-three-fiber
- react-three-postprocessing
- troika-three-text
- astronomy-bundle

optional dependencies (to acquire your own star data):

- Python 3.9.1 (you can use pyenv)
- [Poetry](https://python-poetry.org/)

## Installation

```
npm install celestialengine
```

you probably also need to install these libraries:

```
npm install react three @react-three/fiber @react-three/postprocessing troika-three-text
```

then

```tsx
<CelestialEngine
  metadataSource="./dat_hp_meta.json"
  initialProps={{ vMag: 5.0 }}
>
  <CelestialCanvas useEngine={true} />
</CelestialEngine>
```

## How does it work?

_celestialengine_ renders the starry skies on the Canvas via [ThreeJS](https://threejs.org/) and [react-three-fiber](https://github.com/pmndrs/react-three-fiber).

This module includes:

- star renderer, it can renders over one-hundled thousand of stars (although depends on the performance of the client).
- constellation lines and navigation lines, it is a handy hint to find stars.
- astrometric calculations, it renders the actual sky corresponding to the actual location, time, and observation az/alt.

## How to acquire the star data?

1. install Python and Poetry.
2. exec `npx getstardb` or `yarn getstardb`
3. that extracts file into the `public` folder.
