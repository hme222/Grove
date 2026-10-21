"""
Heuristic quality scoring for botanical illustration images.

Used by find_museum_illustrations.py (rank new candidates) and
audit_illustrations.py (flag the weakest current images).

The score is a screen, not a judgement: it catches text pages, tiny or blurry
scans, dark scan borders and near-empty sheets. A person still picks the final
plate from the contact sheet.
"""
import io

import numpy as np
from PIL import Image

ANALYSIS_WIDTH = 800

MIN_SHORT_SIDE = 600  # px on the source image; below this it blurs on the species page


def _paper_color(rgb):
    """Estimate paper tone as the median colour of a thin border strip."""
    h, w, _ = rgb.shape
    m = max(2, int(min(h, w) * 0.02))
    strip = np.concatenate([
        rgb[:m].reshape(-1, 3), rgb[-m:].reshape(-1, 3),
        rgb[:, :m].reshape(-1, 3), rgb[:, -m:].reshape(-1, 3),
    ])
    return np.median(strip, axis=0)


def analyze(image_bytes, source_size=None):
    """Return {metrics..., score (0-100), flags [str]} for an image.

    source_size: (width, height) of the full-resolution original when the bytes
    are a downscaled preview; defaults to the size of the bytes themselves.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    src_w, src_h = source_size or img.size
    scale = ANALYSIS_WIDTH / img.width
    if scale < 1:
        img = img.resize((ANALYSIS_WIDTH, max(1, int(img.height * scale))), Image.LANCZOS)
    rgb = np.asarray(img, dtype=np.float32)
    gray = rgb.mean(axis=2)

    # Sharpness: variance of a 4-neighbour Laplacian.
    lap = (-4 * gray[1:-1, 1:-1] + gray[:-2, 1:-1] + gray[2:, 1:-1]
           + gray[1:-1, :-2] + gray[1:-1, 2:])
    sharpness = float(lap.var())

    # Subject coverage: share of pixels that differ clearly from the paper tone.
    paper = _paper_color(rgb)
    diff = np.abs(rgb - paper).max(axis=2)
    ink = diff > 40
    coverage = float(ink.mean())

    # Colour: plates are painted; text pages are grey. Saturation of the inked pixels.
    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    colorfulness = float(sat[ink].mean()) if ink.any() else 0.0

    # Text pages: lots of small high-contrast marks arranged in rows. Count rows
    # whose ink density flips often; plates have few, text pages have dozens.
    row_density = ink.mean(axis=1)
    banded = (row_density > 0.05).astype(np.int8)
    row_flips = int(np.abs(np.diff(banded)).sum())

    # Dark scan borders: outer strip much darker than the paper.
    h, w = gray.shape
    m = max(2, int(min(h, w) * 0.02))
    edge = np.concatenate([gray[:m].ravel(), gray[-m:].ravel(),
                           gray[:, :m].ravel(), gray[:, -m:].ravel()])
    dark_border = bool(edge.mean() < 0.55 * gray.mean())

    short_side = min(src_w, src_h)
    flags = []
    if short_side < MIN_SHORT_SIDE:
        flags.append(f"low-res ({src_w}x{src_h})")
    if sharpness < 15:
        flags.append("blurry")
    if coverage < 0.04:
        flags.append("near-empty")
    elif coverage > 0.9:
        flags.append("no clear paper margin (busy or photo)")
    if colorfulness < 0.10 and coverage > 0.04:
        flags.append("grayscale (likely text page or engraving)")
    if row_flips > 60 and colorfulness < 0.25:
        flags.append("text-like banding")
    if dark_border:
        flags.append("dark scan border")

    score = 100
    score -= 30 if short_side < MIN_SHORT_SIDE else 0
    score -= 20 if sharpness < 15 else 0
    score -= 35 if coverage < 0.04 else (15 if coverage > 0.9 else 0)
    score -= 20 if (colorfulness < 0.10 and coverage > 0.04) else 0
    score -= 25 if (row_flips > 60 and colorfulness < 0.25) else 0
    score -= 15 if dark_border else 0
    score += 5 if 0.15 <= coverage <= 0.7 else 0
    score = max(0, min(100, score))

    return {
        "width": src_w,
        "height": src_h,
        "sharpness": round(sharpness, 1),
        "coverage": round(coverage, 3),
        "colorfulness": round(colorfulness, 3),
        "row_flips": row_flips,
        "score": score,
        "flags": flags,
    }
