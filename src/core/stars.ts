import { AstrometricSecondsInYear, cos, rad, Radian, sin } from "./basic";

/**
 * Star data.
 */
export interface Star {
  id: number;
  ra: Radian;
  dec: Radian;
  parallax: number;
  epoch: number;
  pmRa: Radian;
  pmDec: Radian;
  vMag: number;
  r: number;
  g: number;
  b: number;
}

/**
 * Star metadata.
 */
export interface StarMetadata {
  source: string;
  vRange: [number, number];
  files: [number, number, string][];
  epoch: number;
}

/**
 * Right ascension and Declination, in @see Radian s.
 */
export type StarRaDec = [Radian, Radian];
/**
 * Star position in the Space (x, y, z).
 */
export type StarPosition = [number, number, number];
/**
 * Dictionary of stars, key is the @see Star.id .
 */
export type StarDict = { [key: number]: Star };
/**
 * Dictionary of star positions, key is the @see Star.id .
 */
export type StarPositionDict = { [key: number]: StarPosition };

const OBS_THRES_VMAG = 5.0;
const OBS_SIZE_MIN = 3.0;
const OBS_SIZE_RATIO = Math.sqrt(2.5118864315);
const UNOBS_OPACITY_RATIO = Math.sqrt(2.5118864315);

/**
 * Get size of star, based on Vmag.
 * This function will be saturating when the Vmag is 5.0 or lower.
 * @param star star instance.
 * @returns star diameter.
 */
export const getStarSize = (star: Star) =>
  star.vMag < OBS_THRES_VMAG
    ? Math.max(
        OBS_SIZE_MIN,
        Math.pow(OBS_SIZE_RATIO, OBS_THRES_VMAG - star.vMag)
      )
    : OBS_SIZE_MIN;

/**
 * Get the opacity of the star, based on Vmag.
 * This function will be saturating when the Vmag is 5.0 or lower.
 * @param star star instance.
 * @returns opacity of star, (0..1] .
 */
export const getStarOpacity = (star: Star) =>
  star.vMag > OBS_THRES_VMAG
    ? 0.5 / Math.pow(UNOBS_OPACITY_RATIO, star.vMag - OBS_THRES_VMAG)
    : 1.0;

/**
 * Get the right ascension / declination position of the star, based on the universe clock.
 * @param star target star
 * @param clock universe clock
 * @returns right ascension and declination
 */
export const getStarRaDec = (star: Star, clock: Date): StarRaDec => {
  // calc proper motion
  const unixSec = clock.getTime() / 1000; // getTime returns in millisec, convert to sec
  const passedYears = (unixSec - star.epoch) / AstrometricSecondsInYear;
  const pm_ra = (star.pmRa * passedYears) / (1000 * 3600);
  const pm_dec = (star.pmDec * passedYears) / (1000 * 3600);

  const alpha = rad(star.ra + pm_ra);
  const delta = rad(star.dec + pm_dec);

  // right ascension, declination in RADIANS
  return [alpha, delta];
};

export const calcCelestialPosition = (
  ra: Radian,
  dec: Radian,
  sphereRadius: number
): StarPosition => {
  const sin_alpha = sin(ra);
  const cos_alpha = cos(ra);
  const sin_delta = sin(dec);
  const cos_delta = cos(dec);
  const x = sphereRadius * cos_alpha * cos_delta;
  const y = sphereRadius * sin_alpha * cos_delta;
  const z = sphereRadius * sin_delta;
  return [x, y, z];
};

// this function converts the star position into X-Y-Z coordinate, that is:
// +Y axis: RA 0h
// +Z axis: Celestial Sphere North
export const calcStarPosition = (
  star: Star,
  sphereRadius: number,
  clock: Date
): StarPosition => {
  const [alpha, delta] = getStarRaDec(star, clock);
  return calcCelestialPosition(alpha, delta, sphereRadius);
};

export const calcStarPositions = (
  stars: Star[],
  sphereRadius: number,
  clock: Date
) =>
  stars.reduce<StarPositionDict>((d, s) => {
    d[s.id] = calcStarPosition(s, sphereRadius, clock);
    return d;
  }, {});

/**
 * Default (built-in) known star names.
 * Derived from: https://www.cosmos.esa.int/web/hipparcos/common-star-names
 */
export const DEFAULT_KNOWN_STAR_NAMES: {
  [key: number]: string;
} = {
  677: "Alpheratz",
  746: "Caph",
  1067: "Algenib",
  2081: "Ankaa",
  3179: "Shedir",
  3419: "Diphda",
  3829: "Van Maanen 2",
  5447: "Mirach",
  7588: "Achernar",
  9640: "Almaak",
  9884: "Hamal",
  10826: "Mira",
  11767: "Polaris",
  13847: "Acamar",
  14135: "Menkar",
  14576: "Algol",
  15863: "Mirphak",
  17702: "Alcyone",
  17851: "Pleione",
  18543: "Zaurak",
  21421: "Aldebaran",
  24186: "Kapteyn's star",
  24436: "Rigel",
  24608: "Capella",
  25336: "Bellatrix",
  25428: "Alnath",
  25606: "Nihal",
  25930: "Mintaka",
  25985: "Arneb",
  26311: "Alnilam",
  26727: "Alnitak",
  27366: "Saiph",
  27989: "Betelgeuse",
  30089: "Red Rectangle",
  30438: "Canopus",
  31681: "Alhena",
  32349: "Sirius",
  33579: "Adhara",
  36208: "Luyten's star",
  36850: "Castor",
  37279: "Procyon",
  37826: "Pollux",
  46390: "Alphard",
  49669: "Regulus",
  50583: "Algieba",
  53910: "Merak",
  54061: "Dubhe",
  57632: "Denebola",
  57939: "Groombridge 1830",
  58001: "Phad",
  59774: "Megrez",
  60718: "Acrux",
  60936: "3C 273",
  62956: "Alioth",
  63125: "Cor Caroli",
  63608: "Vindemiatrix",
  65378: "Mizar",
  65474: "Spica",
  65477: "Alcor",
  67301: "Alkaid",
  68702: "Hadar",
  68756: "Thuban",
  69673: "Arcturus",
  70890: "Proxima",
  71683: "Rigil Kent",
  72105: "Izar",
  72607: "Kocab",
  76267: "Alphekka",
  77070: "Unukalhai",
  80763: "Antares",
  84345: "Rasalgethi",
  85927: "Shaula",
  86032: "Rasalhague",
  87833: "Etamin",
  87937: "Barnard's star",
  90185: "Kaus Australis",
  91262: "Vega",
  92420: "Sheliak",
  92855: "Nunki",
  95947: "Albireo",
  96295: "Campbell's star",
  97278: "Tarazed",
  97649: "Altair",
  98036: "Alshain",
  98298: "Cyg X-1",
  102098: "Deneb",
  105199: "Alderamin",
  107315: "Enif",
  109074: "Sadalmelik",
  109268: "Alnair",
  110893: "Kruger 60",
  112247: "Babcock's star",
  113368: "Fomalhaut",
  113881: "Scheat",
  113963: "Markab",
};
