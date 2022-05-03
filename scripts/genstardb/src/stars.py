#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Saucer-Stars: acquire & process stars information."""


import gzip
import json
import re
import shutil
import sys
from argparse import ArgumentParser
from dataclasses import asdict, dataclass
from ftplib import FTP
from itertools import chain
from logging import DEBUG, basicConfig, getLogger
from pathlib import Path
from typing import Callable, Iterable, List, Optional, Tuple, TypeVar

from astropy.time import Time

# PROCESS SWITCH

ENABLE_HP = True
ENABLE_T2 = False

# FILES AND ENDPOINTS

SRC_HOST = "dbc.nao.ac.jp"
SRC_PATH_HP = "/DBC/NASAADC/catalogs/1/1239/"
SRC_PATH_T2 = "/DBC/NASAADC/catalogs/1/1259/"

CACHE_BASE = Path(__file__).parent.parent.joinpath(".cache")
CACHE_STARS_HP = CACHE_BASE / "hipparcos"
CACHE_STARS_T2 = CACHE_BASE / "tycho2"

FILES_HP = "hip_main.dat.gz"
FILES_T2 = "tyc2_[0-9]{2}.dat.gz"


OUT_RANGES: list[float] = [1.5, 3.0, 6.0]
OUT_HP_FORMAT = "dat_hp_{}.json"
OUT_HP_METADATA = "dat_hp_meta.json"
OUT_T2_FORMAT = "dat_t2_{}.json"
OUT_T2_METADATA = "dat_t2_meta.json"

# NORMALIZATION OPTION

NORM_COLORS_GLOBAL = True  # darker stars
NORM_COLORS_LOCAL = True  # brighter stars

#
# PHYSICAL COEFFICIENTS
# ------------------------------------------------------------------------------


# B-V to T(K)
# - https://qiita.com/youhe__/items/2565692fd95b7a1ca945
# - http://ysmr-ry.hatenablog.com/entry/2017/08/06/104857
# - http://uenosato.net/hr_diagram/doc/draw_hr_diagram.pdf
# - http://www.cc.kyoto-su.ac.jp/~kano/pdf/study/student/2020SanoPaper.pdf
BV_T_COEF = [3.939654, -0.395361, 0.2082113, -0.0604097]

# T(K) to xy
# - https://en.wikipedia.org/wiki/Planckian_locus
T_CX_COEF_TABLE = [
    (1667.0, +4000.0, [+0.179910, +0.8776956, -0.2343589, -0.2661239]),
    (4000.0, 25000.0, [+0.240390, +0.2226347, +2.1070379, -3.0258469]),
]
T_CY_COEF_TABLE = [
    (1667.0, +2222.0, [-0.20219683, +2.18555832, -1.34811020, -1.1063814]),
    (2222.0, +4000.0, [-0.16748867, +2.09137015, -1.37418593, -0.9549476]),
    (4000.0, 25000.0, [-0.37001483, +3.75112997, -5.87338670, +3.0817580]),
]
# XYZ to sRGB
# https://kazmus.hatenablog.jp/entry/2018/04/29/193659
# http://www.motorwarp.com/koizumi/srgb.html
XYZ_SRGB_COEF = (
    [+3.240970, -1.537383, -0.498611],
    [-0.969244, +1.875968, +0.041555],
    [+0.055630, -0.203977, +1.056972],
)

# Telestial Time of J1991.25, JD2448349.0625
# Reference timestamp for Hipparcos Star Catalogue
J1991_25 = Time(1991.25, format="jyear", scale="tt")

# star color for the stars that b-v index is not specified
STAR_DEFAULT_COLOR = (0.9, 0.9, 0.9)

COLOR_SIG_DIGITS = 4

#
# CORE DATA STRUCTURE
# ------------------------------------------------------------------------------


@dataclass
class RawStarInfo:
    # hipparcos number of the star
    hip_id: int
    # right ascension (ICRS), deg
    ra: float
    # declination (ICRS), deg
    dec: float
    # parallax, milliarcseconds
    parallax: float
    # proper motion of ra, milliarcseconds/year
    pm_ra: float
    # proper motion of dec, milliarcseconds/year
    pm_dec: float
    # magnitude of Johnson V
    v_mag: float
    # Johnson BV color
    bv: Optional[float]


@dataclass
class OutputStarInfo:
    # star number
    n: int
    # position (right ascention, declination, and parallax)
    p: tuple[float, float, float]
    # proper motion, ra and dec, milliarcseconds/year
    m: tuple[float, float]
    # visual band magnitude
    v: float
    # star color, linear rgb [0..1]
    c: tuple[float, float, float]


@dataclass
class StarsMetadata:
    # vmag range
    v_mag_range: tuple[float, float]
    # stars files
    files: list[tuple[float, float, str]]
    # base time of proper motions of stars, unix epoch
    pm_epoch: int


#
# MAIN FUNCTION
# ------------------------------------------------------------------------------


def _main():
    # parse arguments
    parser = ArgumentParser(description="download and process information of stars.")
    parser.add_argument(
        "--nocache", action="store_true", help="ignore cached (planet/star) data."
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        help="output directory",
        default=str(Path(__file__).parent.joinpath("output")),
    )
    args = parser.parse_args()

    # parse output directory
    out_dir = Path(args.output)
    if out_dir.is_file():
        getLogger(__name__).error(
            f"specified output directory {out_dir} is already existed and it is a file."
        )
        sys.exit(-1)

    _stars_main(args.nocache, out_dir)


def _stars_main(nocache: bool, output_dir: Path):
    # download section
    if ENABLE_HP and (nocache or not CACHE_STARS_HP.is_dir()):
        # download hipparcos star data
        _download_ftp(SRC_HOST, SRC_PATH_HP, FILES_HP, CACHE_STARS_HP)
    if ENABLE_T2 and (nocache or not CACHE_STARS_T2.is_dir()):
        # download tycho2 star data
        _download_ftp(SRC_HOST, SRC_PATH_T2, FILES_T2, CACHE_STARS_T2)

    # clean output
    if output_dir.is_dir():
        shutil.rmtree(output_dir)
    output_dir.mkdir()

    # process section
    if ENABLE_HP:
        stars = _proc_star_files(
            _proc_line_hipparcos,
            CACHE_STARS_HP.glob("*"),
        )
        out_stars = filter(None, map(_convert_star_info, stars))
        _export_to_json_with_metadata(
            output_dir,
            OUT_HP_FORMAT,
            OUT_HP_METADATA,
            J1991_25.unix,
            out_stars,
            100,
            4,
        )


#
# SUB FUNCTIONS
# ------------------------------------------------------------------------------


def _download_ftp(
    host: str,
    path: str,
    pattern: str,
    dest: Path,
    clean_dest: bool = True,
) -> None:
    # remove the dest dir if exists
    if clean_dest and dest.is_dir():
        print("cleaning cache...")
        shutil.rmtree(dest)
    # prepare dest dir
    if not dest.is_dir():
        dest.mkdir(parents=True)
    # connect as anonymous
    print(f"connect: ftp://{host}")
    ftp_client = FTP(host)
    ftp_client.login()
    # change to target dir
    print(f"working dir: {path}")
    ftp_client.cwd(path)
    # iterate directory entries
    for filename in ftp_client.nlst():
        if not re.match(pattern, filename):
            # if not filename.endswith(pattern):
            # suffix of the file does not match
            continue
        print(f"download: {filename}")
        _download_ftp_file(ftp_client, filename, dest)


def _download_ftp_file(ftp_client: FTP, filename: str, dest: Path):
    with dest.joinpath(filename).open("wb") as f:
        ftp_client.retrbinary(f"RETR {filename}", f.write)


def _proc_line_hipparcos(line: str) -> Optional[RawStarInfo]:
    splitted = [s.strip() for s in line.split("|")]
    try:
        return RawStarInfo(
            hip_id=int(splitted[1]),
            ra=_read_ra(splitted[3]) or 0,
            dec=_read_dec(splitted[4]) or 0,
            parallax=_read_nullable_float(splitted[11]) or 0,
            pm_ra=_read_nullable_float(splitted[12]) or 0,
            pm_dec=_read_nullable_float(splitted[13]) or 0,
            v_mag=float(splitted[5]),
            bv=(None if splitted[37] == "" else float(splitted[37])),
        )
    except ValueError as e:
        getLogger(__name__).debug(
            f"parse error: star#{splitted[1]} - {line}",
            exc_info=e,
        )
        outs = ", ".join(
            map(lambda n: f"{n}: {splitted[n]}", [1, 8, 9, 11, 12, 13, 5, 37])
        )
        getLogger(__name__).warning(
            f"skipped: #{splitted[1]} -- invalid data.{outs}",
        )
        return None


def _proc_line_tycho2(line: str) -> Optional[RawStarInfo]:
    pass


def _read_ra(item: str) -> Optional[float]:
    hms = _read_ra_dec_item(item)
    if hms is None:
        return None
    sign = -1 if item.strip()[0] == "-" else +1
    h, m, s = hms
    return sign * ((abs(h) * 3600) + (m * 60) + s) / (3600 / 15)


def _read_dec(item: str) -> Optional[float]:
    dms = _read_ra_dec_item(item)
    if dms is None:
        return None
    sign = -1 if item.strip()[0] == "-" else +1
    d, m, s = dms
    return sign * (((abs(d) * 3600) + (m * 60) + s) / 3600)


def _read_ra_dec_item(item: str) -> Optional[Tuple[int, int, float]]:
    item = item.strip()
    if item == "":
        return None
    a = item.split(" ")
    return int(a[0]), int(a[1]), float(a[2])


def _read_nullable_float(item: str) -> Optional[float]:
    item = item.strip()
    return None if item == "" else float(item)


def _proc_star_files(
    line_handler: Callable[[str], Optional[RawStarInfo]], files: Iterable[Path]
) -> Iterable[RawStarInfo]:
    def proc_single(file: Path) -> Iterable[RawStarInfo]:
        mode = "rt"
        is_gzip = file.suffix == ".gz"
        with (gzip.open(str(file), mode) if is_gzip else file.open(mode)) as f:
            return [s for s in map(line_handler, f) if s is not None]

    return chain.from_iterable(map(proc_single, files))


def _export_to_json_with_metadata(
    out_dir: Path,
    fn_format: str,
    fn_metadata: str,
    pm_epoch: int,
    stars: Iterable[OutputStarInfo],
    s_num_init: int,
    s_num_factor: float,
):
    sorted_stars = sorted(stars, key=lambda s: s.v)
    if NORM_COLORS_GLOBAL:
        # normalize star colors
        sorted_stars = _normalize_star_colors(sorted_stars)
    num_batch = 0
    stars_batched: list[OutputStarInfo] = []
    s_num = float(s_num_init)
    export_list: list[tuple[float, float, str]] = []
    for star in sorted_stars:
        stars_batched.append(star)
        if len(stars_batched) > s_num:
            export_list.append(
                _write_stars_to_json(
                    out_dir / fn_format.format(num_batch), stars_batched
                )
            )
            stars_batched.clear()
            num_batch += 1
            s_num *= s_num_factor
    # final export
    if len(stars_batched) > 0:
        export_list.append(
            _write_stars_to_json(out_dir / fn_format.format(num_batch), stars_batched)
        )
    # write metadata
    min_v, max_v = sorted_stars[0].v, sorted_stars[-1].v
    metadata = StarsMetadata((min_v, max_v), export_list, pm_epoch)
    _write_metadata_to_json(out_dir / fn_metadata, metadata)


def _write_stars_to_json(
    file: Path, stars: list[OutputStarInfo]
) -> tuple[float, float, str]:
    mode = "wt"
    is_gzip = file.suffix == ".gz"
    with (gzip.open(str(file), mode) if is_gzip else file.open(mode)) as f:
        json.dump([asdict(s) for s in stars], f)  # type: ignore
    return stars[0].v, stars[-1].v, file.name


def _write_metadata_to_json(file: Path, metadata: StarsMetadata):
    mode = "wt"
    is_gzip = file.suffix == ".gz"
    with (gzip.open(str(file), mode) if is_gzip else file.open(mode)) as f:
        json.dump(asdict(metadata), f)  # type: ignore


def _convert_star_info(star: RawStarInfo) -> Optional[OutputStarInfo]:
    try:
        rgb = _convert_bv_to_linear_rgb(star.bv)
        return OutputStarInfo(
            star.hip_id,
            (star.ra, star.dec, star.parallax),
            (star.pm_ra, star.pm_dec),
            star.v_mag,
            rgb,
        )
    except ValueError as e:
        getLogger(__name__).debug(f"conversion error: {star.hip_id}", exc_info=e)
        getLogger(__name__).warning(
            f"skipped: #{star.hip_id} -- color out of range: {star.bv}."
        )
        return None


def _convert_bv_to_linear_rgb(bv: Optional[float]) -> tuple[float, float, float]:
    # if b-v value is not present, return as just 'white'
    if bv is None:
        return STAR_DEFAULT_COLOR

    # bv -> t
    log_10_t = sum(c * (bv ** n) for (n, c) in enumerate(BV_T_COEF))
    t = 10.0 ** log_10_t
    # alt_t = 4600 * ((1.0 / (0.92 * bv + 1.7)) + (1 / (0.92 * bv + 0.62)))

    # t -> xy
    cx_coef = _select_coef_table(t, T_CX_COEF_TABLE)
    cy_coef = _select_coef_table(t, T_CY_COEF_TABLE)
    if cx_coef is None or cy_coef is None:
        # unsupported range
        raise ValueError(f"temperature `{t}` is out of range, bv: {bv}")

    cx = sum(c * (10 ** (3 * n)) / (t ** n) for (n, c) in enumerate(cx_coef))
    cy = sum(c * (cx ** n) for (n, c) in enumerate(cy_coef))

    # xy -> XYZ
    y = 1.0
    x = (y / cy) * cx
    z = (y / cy) * (1 - cx - cy)

    # XYZ -> linear RGB
    xyz = [x, y, z]
    r_l = sum(n * c for n, c in zip(xyz, XYZ_SRGB_COEF[0]))
    g_l = sum(n * c for n, c in zip(xyz, XYZ_SRGB_COEF[1]))
    b_l = sum(n * c for n, c in zip(xyz, XYZ_SRGB_COEF[2]))

    # linear RGB -> normalized RGB
    if NORM_COLORS_LOCAL:
        rgb_max = max(r_l, g_l, b_l)
        r_l = r_l / rgb_max
        g_l = g_l / rgb_max
        b_l = b_l / rgb_max

    # crop significant digits to compress data size
    r_c = round(r_l, COLOR_SIG_DIGITS)
    g_c = round(g_l, COLOR_SIG_DIGITS)
    b_c = round(b_l, COLOR_SIG_DIGITS)

    # WebGL accepts the Linear RGB color space.
    return r_c, g_c, b_c


def _normalize_star_colors(stars: List[OutputStarInfo]) -> List[OutputStarInfo]:
    # inner function
    def _normalize_star_color(star: OutputStarInfo, rgb_max: float) -> OutputStarInfo:
        oc = star.c
        star.c = (oc[0] / rgb_max, oc[1] / rgb_max, oc[2] / rgb_max)
        return star

    # apply for star list
    rgb_max = max([max(s.c) for s in stars])
    return [_normalize_star_color(s, rgb_max) for s in stars]


TCOEF = TypeVar("TCOEF")


def _select_coef_table(
    value: float,
    coef_table: list[tuple[float, float, TCOEF]],
) -> Optional[TCOEF]:
    for (low, high, coef) in coef_table:
        if low <= value < high:
            return coef
    return None


#
# GLOBAL ENTRYPOINT
# ------------------------------------------------------------------------------

# global entry point
if __name__ == "__main__":
    basicConfig(filename="convert.log", level=DEBUG)
    _main()
