"""App icons for Affelion Aura: a dark disc with a corona of light on black.

One mark, one family of colour (teal into blue), no figure. Usage: make_icons.py <out dir>
"""
import sys, numpy as np
from PIL import Image, ImageFilter
out = sys.argv[1]
S = 1024

def hsv_to_rgb(h, s, v):
    i = (h * 6).astype(int) % 6; f = h * 6 - np.floor(h * 6)
    p = v * (1 - s); q = v * (1 - f * s); t = v * (1 - (1 - f) * s)
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1)

def corona(radius, grain=True):
    y, x = np.mgrid[0:S, 0:S].astype(np.float32)
    cx = cy = S / 2
    r = np.hypot(x - cx, y - cy)
    d = r - radius                                  # distance outside the disc
    ang = np.arctan2(y - cy, x - cx)                # -pi..pi, 0 = right
    # The light sits behind the disc, up and to the left, so that side of the corona is brighter.
    lit = 0.5 + 0.5 * np.cos(ang - np.deg2rad(-135))
    k = radius / 250.0
    rim = np.exp(-np.maximum(d, 0) / (16 * k))                      # tight white-hot edge
    halo = np.exp(-np.maximum(d, 0) / (lit * 150 * k + 46 * k))     # wide soft light
    inten = (0.55 * rim + 0.75 * halo * (0.35 + 0.65 * lit)) * (d >= 0)
    # Teal where the light is strongest, easing into blue on the far side.
    hue = (172 + 44 * (1 - lit)) / 360.0
    sat = np.clip(0.72 - 0.6 * rim, 0.08, 1.0)                      # the very edge runs to white
    rgb = hsv_to_rgb(hue, sat, np.ones_like(hue)) * inten[..., None]
    im = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))
    bloom = np.asarray(im.filter(ImageFilter.GaussianBlur(30 * k)), np.float32) / 255
    a = np.asarray(im, np.float32) / 255
    mix = 1 - (1 - a) * (1 - bloom * 0.6)
    mix *= np.clip(d / 2.0 + 0.5, 0, 1)[..., None]                  # the disc stays black, edge anti-aliased
    if grain:
        rng = np.random.default_rng(7)
        mix = np.clip(mix + (rng.random((S, S, 1)) - 0.5) * 0.03 * (mix.max(-1, keepdims=True) > 0.02), 0, 1)
    return mix, d

mix, _ = corona(250)
icon = Image.fromarray((mix * 255).astype(np.uint8))
icon.save(out + '/icon.png'); icon.save(out + '/favicon.png')

for name, radius in [('splash-icon.png', 215), ('android-icon-foreground.png', 150)]:
    m, _ = corona(radius, grain=False)
    alpha = np.clip(m.max(-1) * 1.5, 0, 1)
    rgb = np.clip(m / np.maximum(alpha[..., None], 1e-3), 0, 1)
    Image.fromarray((np.dstack([rgb, alpha]) * 255).astype(np.uint8), 'RGBA').save(out + '/' + name)

# Android themed icon: the corona in one tone; the system supplies the colour.
m, _ = corona(150, grain=False)
alpha = np.clip(m.max(-1) * 1.8, 0, 1)
Image.fromarray((np.dstack([np.ones((S, S, 3)), alpha]) * 255).astype(np.uint8), 'RGBA').save(out + '/android-icon-monochrome.png')
Image.new('RGB', (S, S), (0, 0, 0)).save(out + '/android-icon-background.png')
print('ok')
