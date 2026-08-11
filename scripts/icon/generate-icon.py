#!/usr/bin/env python3
"""
Draw the Unbottl U onto "The fill" — the app icon and the Android adaptive icon.

Run from the repo root:

    python3 -m venv .venv-icon && .venv-icon/bin/pip install Pillow
    .venv-icon/bin/python scripts/icon/generate-icon.py

It reads the base art from scripts/icon/base/ and writes assets/images/. The
base art is the icon WITHOUT the letter, kept separately so this can be re-run
without compounding — running it twice on its own output would stack two U's.

WHY THE LETTER IS TWO COLOURS
A single colour cannot work on this art. Wine disappears into the wine below the
waterline, and the pale rosé disappears into the off-white above it. So the U is
drawn in wine above the surface and in rosé below, which makes it read as a
letter filled to exactly the level of the icon. It joins the idea rather than
sitting on top of it.

The split is not a hardcoded y value. Every pixel of the glyph samples the
luminance of the art underneath, so the boundary follows the real meniscus
curve — including the lighter rim highlight where it lifts at the edges — and
stays correct if the base art is ever redrawn.

WHY THE BOLD IS SYNTHETIC
Allura ships one weight. Stroking the outline thickens every stroke evenly and
keeps the calligraphic thick-to-thin contrast; faking bold by offsetting a copy
of the glyph smears it. Weight is also how this icon stays legible at 64pt:
contrast is fixed by the two colours (4.6:1 for rosé on wine, well below the
9.7:1 that cream gave), so the letter has to earn its legibility with ink
instead. That was a deliberate trade — the rosé is the house colour and worth
keeping.

FONT LICENCE
Allura is under the SIL Open Font License 1.1, which permits use in a logo and
in commercial work. See Allura-OFL.txt alongside this file. macOS system script
faces (Snell Roundhand, Apple Chancery) were avoided — their licensing for a
shipped app icon is not clear.
"""
import pathlib
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent.parent
FONT = HERE / 'Allura-Regular.ttf'
BASE = HERE / 'base'
OUT = ROOT / 'assets' / 'images'

WINE = (114, 47, 55)       # Colors.primary — above the waterline
ROSE = (232, 180, 184)     # Colors.wineRose — below it
SS = 2                     # supersample factor
STROKE = 10 * SS           # synthetic bold, in supersampled pixels
DARK_CUTOFF = 140          # luminance below which the art counts as wine


def render(
    src: pathlib.Path,
    dst: pathlib.Path,
    cap_frac: float,
    cross: float,
    behind: tuple = (250, 248, 245),
) -> None:
    """
    cap_frac  glyph height as a fraction of the canvas
    cross     where the waterline should cut the glyph, 0 = top, 1 = bottom
    behind    what shows through transparency, for analysis only

    `behind` matters more than it looks. The adaptive icon's pale half is
    transparent, and a plain .convert('RGB') turns transparency black — which
    put the detected waterline at y=0 and drew the letter off the canvas.
    Compositing onto the same colour Android paints behind it
    (android.adaptiveIcon.backgroundColor in app.json) makes the analysis see
    what a person sees. The saved file keeps its original alpha.
    """
    base = Image.open(src)
    alpha = base.split()[-1] if base.mode == 'RGBA' else None
    if alpha is not None:
        flat = Image.new('RGB', base.size, behind)
        flat.paste(base.convert('RGB'), (0, 0), alpha)
        rgb = flat
    else:
        rgb = base.convert('RGB')
    size = rgb.size[0]
    big = size * SS

    # Size the glyph by measuring, since point size does not map to drawn
    # height in a face with this much overshoot.
    target = cap_frac * big
    pt = int(target * 1.35)
    for _ in range(60):
        font = ImageFont.truetype(str(FONT), pt)
        box = font.getbbox('U')
        if abs((box[3] - box[1]) - target) <= 2:
            break
        pt = max(8, int(pt * (target / max(box[3] - box[1], 1))))
    font = ImageFont.truetype(str(FONT), pt)
    box = font.getbbox('U')
    gw, gh = box[2] - box[0], box[3] - box[1]

    # Find the waterline in the art itself rather than assuming it.
    mid = size // 2
    water = next(
        (y for y in range(size) if sum(rgb.getpixel((mid, y))[:3]) / 3 < 150),
        size // 2,
    )

    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).text(
        ((big - gw) / 2 - box[0], water * SS - cross * gh - box[1]),
        'U', font=font, fill=255, stroke_width=STROKE, stroke_fill=255,
    )

    # Blur before thresholding so the colour boundary is a clean curve rather
    # than chasing the bubbles and gradient banding in the art.
    lum = rgb.convert('L').resize((big, big), Image.LANCZOS)
    submerged = lum.filter(ImageFilter.GaussianBlur(SS * 3)).point(
        lambda v: 255 if v < DARK_CUTOFF else 0
    )

    ink = Image.new('RGB', (big, big), WINE)
    ink.paste(Image.new('RGB', (big, big), ROSE), (0, 0), submerged)

    out = rgb.resize((big, big), Image.LANCZOS)
    out.paste(ink, (0, 0), mask)
    out = out.resize((size, size), Image.LANCZOS)

    if alpha is not None:
        # The letter has to carry its own opacity. Re-applying the source alpha
        # alone erased every part of the U standing in the transparent half —
        # which on the adaptive icon is most of it, so the letter all but
        # vanished. The output is opaque wherever the art was OR the glyph is.
        glyph = mask.resize((size, size), Image.LANCZOS)
        out = out.convert('RGBA')
        out.putalpha(ImageChops.lighter(alpha, glyph))
    out.save(dst)

    coverage = sum(
        1 for v in mask.resize((64, 64), Image.LANCZOS).tobytes() if v > 96
    ) / (64 * 64) * 100
    print(f'  {dst.name:<20} waterline y={water:<5} ink at 64pt {coverage:.1f}%')


if __name__ == '__main__':
    if not BASE.exists():
        sys.exit(f'missing base art: {BASE}\nIt holds the icon WITHOUT the U.')
    print('Unbottl icon — Allura U, wine above the waterline, rosé below')
    # The app icon sits on a square; the U straddles the surface near centre.
    render(BASE / 'icon.png', OUT / 'icon.png', cap_frac=0.46, cross=0.55)
    # Android masks to the centre 66% and its waterline sits lower, so the U is
    # smaller and crosses nearer its foot to stay inside the safe zone.
    render(BASE / 'adaptive-icon.png', OUT / 'adaptive-icon.png',
           cap_frac=0.42, cross=0.75)
