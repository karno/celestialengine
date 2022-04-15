import { degToRad } from "./core/basic";
import { Star, StarDict, StarMetadata } from "./core/stars";

/**
 * Describe the state of StarFetcher.
 * @see fetchStars
 */
export interface StarFetcherState {
  step: StarFetcherStep;
  stars: StarDict;
  loadedVmag: number | null;
}

/**
 * Describe the fetching status of StarFetcher.
 */
export type StarFetcherStep =
  | { value: "INIT" }
  | { value: "OK"; meta: StarMetadata }
  | { value: "FAIL"; meta: StarMetadata | null; error: any };

/**
 * Initial state of StarFetcherState.
 * @see StarFetcherState
 */
export const initialState: StarFetcherState = {
  step: {
    value: "INIT",
  },
  stars: {},
  loadedVmag: null,
};

/**
 * Fetch star data and metadata from the remote.
 * @param state state of StarFetcher.
 * @param metadataSource source of metadata, must be a (fetchable) URI.
 * @param vmag required star Vmag.
 * @param yieldCallback callback function on the star dictionary has been updated.
 * @param retryCount maximum retry count when the fetch faces errors.
 * @returns Promise of @see StarFetcherState .
 */
export const fetchStars = async (
  state: StarFetcherState,
  metadataSource: string,
  vmag: number,
  yieldCallback?: (newState: StarFetcherState) => void,
  retryCount: number = 3
): Promise<StarFetcherState> => {
  if (state.loadedVmag && state.loadedVmag > vmag) {
    // already resolved
    return state;
  }

  let failureCount = 0;
  while (true) {
    try {
      // decide action
      if (
        state.step.value == "OK" &&
        state.step.meta.source !== metadataSource
      ) {
        // need to be re-initialized
        state = { ...initialState };
      }
      switch (state.step.value) {
        case "INIT":
          // fetch metadata
          const meta = await fetchMetadata(metadataSource);
          state = {
            ...state,
            step: { value: "OK", meta: meta },
          };
          if (yieldCallback) {
            yieldCallback(state);
          }
          break;
        case "OK":
          // fetch star
          const metadata = state.step.meta;
          const entries = getRequiredStarsFiles(
            state.step.meta,
            state.loadedVmag,
            vmag
          );
          for (const entry of entries) {
            const stars = await fetchStar(metadata, entry.file);
            state = {
              ...state,
              loadedVmag: entry.satisfyingVmag,
              stars: { ...state.stars, ...stars }, // merge star dicts
            };

            if (yieldCallback) {
              yieldCallback(state);
            }
          }
          return state;
        case "FAIL":
          // unrecoverable
          return state;
      }
    } catch (e) {
      console.error(e);
      failureCount++;
      if (failureCount > retryCount) {
        // update state with FAIL state
        state = {
          ...state,
          step: { ...state.step, value: "FAIL", meta: null, error: e },
        };
        if (yieldCallback) {
          yieldCallback(state);
        }
        // re-throw last exception
        throw e;
      }
    }
  }
};

const getRequiredStarsFiles = (
  metadata: StarMetadata,
  loadedVmag: number | null,
  requiredVmag: number
) =>
  metadata.files
    .filter(
      ([lower, higher, _f]) =>
        requiredVmag >= lower && (!loadedVmag || higher >= loadedVmag)
    )
    .sort((a, b) => a[1] - b[1]) // order by higher range of the file
    .map(([_l, _h, file]) => ({ satisfyingVmag: _h, file: file }));

const checkResponse = (r: Response) => {
  if (r.ok) {
    return r;
  }
  throw new Error(
    "fetch failed from " + r.url + ": [" + r.status + "] " + r.statusText
  );
};

interface RawStarMetadata {
  v_map_range: [number, number];
  files: [number, number, string][];
  pm_epoch: number;
}

const parseMetadata = (obj: RawStarMetadata, source: string): StarMetadata => ({
  source: source,
  vRange: obj.v_map_range,
  files: obj.files,
  epoch: obj.pm_epoch,
});

const fetchMetadata = (url: string) =>
  fetch(url)
    .then(checkResponse)
    .then((r) => r.json())
    .then((m) => m as RawStarMetadata)
    .then((m) => parseMetadata(m, url));

interface RawStar {
  n: number;
  p: [number, number, number];
  m: [number, number];
  v: number;
  c: [number, number, number];
}

const parseStar = (obj: RawStar, epoch: number): Star => ({
  id: obj.n,
  ra: degToRad(obj.p[0]),
  dec: degToRad(obj.p[1]),
  parallax: obj.p[2],
  epoch: epoch,
  pmRa: degToRad(obj.m[0]),
  pmDec: degToRad(obj.m[1]),
  vMag: obj.v,
  r: obj.c[0],
  g: obj.c[1],
  b: obj.c[2],
});

const fetchStar = async (metadata: StarMetadata, file: string) => {
  const meta_host = metadata.source.slice(0, metadata.source.lastIndexOf("/"));
  return fetch(meta_host + "/" + file)
    .then(checkResponse)
    .then((r) => r.json())
    .then((s: any[]) => s.map((o) => parseStar(o, metadata.epoch)))
    .then((s) =>
      s.reduce<StarDict>((d, s) => {
        d[s.id] = s;
        return d;
      }, {})
    );
};
