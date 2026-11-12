#!/usr/bin/env python3
"""Regenerates every logo-derived image from assets/brand/logo-source.png.

    python3 -m venv .venv && .venv/bin/pip install pillow numpy scipy
    .venv/bin/python scripts/make-logo-assets.py

The source is the logo on a plain white background. Only the white *outside*
the logo is removed; the white inside it (label frame, cap stripes, clock face)
stays opaque. Outputs, all under assets/:

  logo.png                         in-app logo, transparent
  icon.png                         iOS / store icon, opaque, 1024
  android-icon-foreground.png      adaptive icon, fitted inside the safe zone
  android-icon-background.png      adaptive icon background (solid)
  android-icon-monochrome.png      Android 13+ themed icon
  splash-icon.png                  splash screen, transparent
  favicon.png                      web
  notification-icons/drawable-*/   Android status-bar icon (white silhouette)
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'assets'
SOURCE = ASSETS / 'brand' / 'logo-source.png'

BACKGROUND = (255, 255, 255)  # adaptive icon + splash; keep in sync with app.json
CANVAS = 1024


def cut_out(path: Path) -> Image.Image:
    rgb = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    h, w, _ = rgb.shape

    white = (rgb >= 247).all(axis=2)

    # The background is the white that touches the border. Eroding first stops a
    # thin white outline inside the logo from counting as a way out to the edge.
    r = 5
    core = ndi.binary_erosion(white, iterations=r, border_value=1)
    labels, _ = ndi.label(core)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    outer = ndi.binary_dilation(np.isin(labels, list(edge)), iterations=r) & white

    # Soft edge: colour-to-alpha on the pixels just inside the logo's outline.
    ring = ndi.binary_dilation(outer, iterations=3) & ~outer
    alpha = np.ones((h, w), np.float32)
    alpha[outer] = 0
    alpha[ring] = np.clip((255.0 - rgb.min(axis=2))[ring] / 90.0, 0, 1)

    a = np.maximum(alpha, 1e-3)[..., None]
    out = rgb.copy()
    out[ring] = np.clip((rgb - 255.0 * (1 - a)) / a, 0, 255)[ring]
    return Image.fromarray(np.dstack([out, alpha * 255]).round().astype(np.uint8), 'RGBA')


def crop(img: Image.Image) -> Image.Image:
    return img.crop(img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox())


def ink(img: Image.Image) -> Image.Image:
    """White silhouette of the coloured parts only, for single-colour icons."""
    a = np.array(img).astype(np.float32)
    strength = np.clip((245.0 - a[..., :3].min(axis=2)) / 45.0, 0, 1) * (a[..., 3] / 255.0)
    out = np.zeros(a.shape, np.uint8)
    out[..., :3] = 255
    out[..., 3] = (strength * 255).round().astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def fit_height(img: Image.Image, height: int) -> Image.Image:
    return img.resize((round(img.width * height / img.height), height), Image.LANCZOS)


def on_canvas(img: Image.Image, size: int, bg=None) -> Image.Image:
    canvas = Image.new('RGBA', (size, size), (bg + (255,)) if bg else (0, 0, 0, 0))
    canvas.alpha_composite(img, ((size - img.width) // 2, (size - img.height) // 2))
    return canvas


def fit_safe_zone(img: Image.Image, size: int) -> Image.Image:
    """Largest logo whose every opaque pixel lies inside the adaptive-icon safe
    circle (66dp of the 108dp canvas), measured from the logo's own centre."""
    alpha = np.array(img.getchannel('A'))
    ys, xs = np.where(alpha > 40)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    reach = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2).max()
    scale = (size * 66 / 108 / 2) / reach
    return img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)


def main() -> None:
    logo = crop(cut_out(SOURCE))

    # In-app logo.
    pad = round(logo.height * 0.03)
    padded = Image.new('RGBA', (logo.width + 2 * pad, logo.height + 2 * pad), (0, 0, 0, 0))
    padded.alpha_composite(logo, (pad, pad))
    fit_height(padded, 512).save(ASSETS / 'logo.png')

    # iOS and store icon: opaque, no transparency allowed.
    on_canvas(fit_height(logo, 840), CANVAS, BACKGROUND).convert('RGB').save(ASSETS / 'icon.png')

    # Android adaptive icon.
    foreground = fit_safe_zone(logo, CANVAS)
    on_canvas(foreground, CANVAS).save(ASSETS / 'android-icon-foreground.png')
    Image.new('RGB', (CANVAS, CANVAS), BACKGROUND).save(ASSETS / 'android-icon-background.png')
    on_canvas(ink(foreground), CANVAS).save(ASSETS / 'android-icon-monochrome.png')

    # Splash screen.
    on_canvas(fit_height(logo, 900), CANVAS).save(ASSETS / 'splash-icon.png')

    # Web favicon.
    on_canvas(fit_height(logo, 44), 48, BACKGROUND).convert('RGB').save(ASSETS / 'favicon.png')

    # Android status-bar icon: a white silhouette, one file per density.
    # Densities and sizes are the standard 24dp notification icon.
    big = ink(logo)
    for density, px in {'mdpi': 24, 'hdpi': 36, 'xhdpi': 48, 'xxhdpi': 72, 'xxxhdpi': 96}.items():
        target = ASSETS / 'notification-icons' / f'drawable-{density}'
        target.mkdir(parents=True, exist_ok=True)
        on_canvas(fit_height(big, round(px * 0.92)), px).save(target / 'ic_notification.png')

    print('logo assets written to', ASSETS)


if __name__ == '__main__':
    main()
