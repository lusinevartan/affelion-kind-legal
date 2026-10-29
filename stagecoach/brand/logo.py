"""Stagecoach logo geometry, built once and emitted to SVG, PDF and EPS.

Everything is outlined: the S is a filled shape (not a stroke with a mask) and
the letters are glyph outlines from Montserrat, so files print correctly with no
fonts installed and no transparency tricks.

Coordinates are in logo units with y pointing down. One unit is 1/100 of the
symbol's design box, the same 0-100 box the website uses.
"""
import os
from shapely.geometry import LineString, Point
from shapely.ops import unary_union
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

HERE = os.path.dirname(os.path.abspath(__file__))
S_PATH = os.path.join(HERE, '..', 'src', 's-path.txt')
FONTS = os.path.join(HERE, 'fonts')

# ---- colour ------------------------------------------------------------------
# HEX is the master. CMYK is a starting build for coated stock; match the printed
# proof to the HEX swatch before a full run.
COLOURS = {
    'navy':      {'name': 'Stagecoach Navy',  'hex': '#1E2A3E', 'rgb': (30, 42, 62),    'cmyk': (90, 75, 45, 50)},
    'night':     {'name': 'Night',            'hex': '#10192B', 'rgb': (16, 25, 43),    'cmyk': (90, 78, 50, 70)},
    'coral':     {'name': 'Coral',            'hex': '#E37970', 'rgb': (227, 121, 112), 'cmyk': (0, 62, 50, 0)},
    'peach':     {'name': 'Peach',            'hex': '#DC8E73', 'rgb': (220, 142, 115), 'cmyk': (5, 50, 55, 0)},
    'cream':     {'name': 'Porcelain',        'hex': '#F4F1E9', 'rgb': (244, 241, 233), 'cmyk': (3, 3, 8, 0)},
    'coral_ink': {'name': 'Deep Coral',       'hex': '#A9473B', 'rgb': (169, 71, 59),   'cmyk': (20, 80, 80, 10)},
    'white':     {'name': 'White',            'hex': '#FFFFFF', 'rgb': (255, 255, 255), 'cmyk': (0, 0, 0, 0)},
    'black':     {'name': 'Black',            'hex': '#000000', 'rgb': (0, 0, 0),       'cmyk': (0, 0, 0, 100)},
}

# colourways: S, dot, text
COLOURWAYS = {
    'FullColour':  {'s': 'navy',  'dot': 'coral', 'text': 'navy',  'bg': 'cream', 'label': 'Full colour, for light backgrounds'},
    'Reverse':     {'s': 'cream', 'dot': 'coral', 'text': 'cream', 'bg': 'navy',  'label': 'Reverse, for dark backgrounds'},
    'Navy':        {'s': 'navy',  'dot': 'navy',  'text': 'navy',  'bg': 'cream', 'label': 'One colour navy'},
    'White':       {'s': 'white', 'dot': 'white', 'text': 'white', 'bg': 'navy',  'label': 'One colour white'},
    'Black':       {'s': 'black', 'dot': 'black', 'text': 'black', 'bg': 'white', 'label': 'One colour black'},
}


# ---- the S -------------------------------------------------------------------
def _s_geometry():
    pts = []
    for tok in open(S_PATH).read().replace('M', ' ').replace('L', ' ').split():
        pts.append(float(tok))
    line = LineString(list(zip(pts[0::2], pts[1::2])))
    stroke = line.buffer(14.5 / 2, quad_segs=64, cap_style='round', join_style='round')
    cut = Point(50, 50).buffer(13.5, quad_segs=96)
    s = stroke.difference(cut)
    dot = Point(50, 50).buffer(6.5, quad_segs=96)
    return s, dot


def _poly_ops(geom):
    ops = []
    polys = getattr(geom, 'geoms', [geom])
    for poly in polys:
        for ring in [poly.exterior, *poly.interiors]:
            c = list(ring.coords)
            ops.append(('M', c[0][0], c[0][1]))
            for x, y in c[1:]:
                ops.append(('L', x, y))
            ops.append(('Z',))
    return ops


_S, _DOT = _s_geometry()
S_OPS, DOT_OPS = _poly_ops(_S), _poly_ops(_DOT)
_minx, _miny, _maxx, _maxy = unary_union([_S, _DOT]).bounds
SYMBOL_BOUNDS = (_minx, _miny, _maxx, _maxy)


# ---- type --------------------------------------------------------------------
class _OpsPen(BasePen):
    def __init__(self, glyphset, ox, oy, scale):
        super().__init__(glyphset)
        self.ops, self.ox, self.oy, self.k = [], ox, oy, scale

    def _p(self, pt):
        return (self.ox + pt[0] * self.k, self.oy - pt[1] * self.k)

    def _moveTo(self, p): self.ops.append(('M', *self._p(p)))
    def _lineTo(self, p): self.ops.append(('L', *self._p(p)))
    def _curveToOne(self, a, b, c): self.ops.append(('C', *self._p(a), *self._p(b), *self._p(c)))
    def _closePath(self): self.ops.append(('Z',))


class Face:
    def __init__(self, weight):
        self.font = TTFont(os.path.join(FONTS, f'Montserrat-{weight}.ttf'))
        self.upm = self.font['head'].unitsPerEm
        self.cap = self.font['OS/2'].sCapHeight
        self.gs = self.font.getGlyphSet()
        self.cmap = self.font.getBestCmap()
        self.hmtx = self.font['hmtx']

    def advance(self, ch):
        return self.hmtx[self.cmap[ord(ch)]][0]

    def ink_width(self, text, cap, tracking_em):
        """Width from the first glyph's origin to the last glyph's advance, without trailing tracking."""
        k = cap / self.cap
        size = self.upm * k
        return sum(self.advance(c) * k for c in text) + tracking_em * size * (len(text) - 1)

    def outline(self, text, x, baseline, cap, tracking_em=0.0, width=None):
        """Glyph outlines with cap height `cap`. If `width` is given, tracking is solved so the
        line spans exactly that width."""
        k = cap / self.cap
        size = self.upm * k
        if width is not None:
            plain = sum(self.advance(c) * k for c in text)
            tracking_em = (width - plain) / (size * (len(text) - 1))
        ops, pen_x = [], x
        for ch in text:
            g = self.cmap[ord(ch)]
            pen = _OpsPen(self.gs, pen_x, baseline, k)
            self.gs[g].draw(pen)
            ops += pen.ops
            pen_x += self.advance(ch) * k + tracking_em * size
        return ops, tracking_em


BOLD, SEMI = Face('Bold'), Face('SemiBold')
WORD, TAG = 'STAGECOACH', 'CONCIERGE EMERGENCY MEDICAL SERVICES'
WORD_TRACK = 0.34


# ---- layouts -----------------------------------------------------------------
def _place(ops, dx, dy, k):
    out = []
    for op in ops:
        if op[0] == 'Z':
            out.append(op)
        else:
            vals = list(op[1:])
            out.append((op[0], *[(v * k + (dx if i % 2 == 0 else dy)) for i, v in enumerate(vals)]))
    return out


def _symbol_at(x, y, ink_h):
    """S and dot scaled so the S ink is `ink_h` tall, top-left of ink at (x, y)."""
    minx, miny, maxx, maxy = SYMBOL_BOUNDS
    k = ink_h / (maxy - miny)
    return _place(S_OPS, x - minx * k, y - miny * k, k), _place(DOT_OPS, x - minx * k, y - miny * k, k), (maxx - minx) * k


def layout(kind, tagline=True):
    """Returns dict with 's', 'dot', 'text' op lists, and width/height of the ink box.
    H (the S ink height) is 100 units."""
    H = 100.0
    if kind == 'symbol':
        s, d, w = _symbol_at(0, 0, H)
        return {'s': s, 'dot': d, 'text': [], 'w': w, 'h': H, 'H': H}
    if kind == 'horizontal':
        s, d, sw = _symbol_at(0, 0, H)
        gap = 0.34 * H
        wcap, tcap, lead = 0.40 * H, 0.153 * H, 0.20 * H
        block = wcap + (lead + tcap if tagline else 0)
        top = (H - block) / 2
        x0 = sw + gap
        word_w = BOLD.ink_width(WORD, wcap, WORD_TRACK)
        text, _ = BOLD.outline(WORD, x0, top + wcap, wcap, WORD_TRACK)
        if tagline:
            t, _ = SEMI.outline(TAG, x0, top + wcap + lead + tcap, tcap, width=word_w)
            text += t
        return {'s': s, 'dot': d, 'text': text, 'w': x0 + word_w, 'h': H, 'H': H}
    if kind == 'stacked':
        wcap, tcap, lead = 0.21 * H, 0.080 * H, 0.105 * H
        word_w = BOLD.ink_width(WORD, wcap, WORD_TRACK)
        minx, miny, maxx, maxy = SYMBOL_BOUNDS
        sw = (maxx - minx) * H / (maxy - miny)
        W = max(word_w, sw)
        s, d, _ = _symbol_at((W - sw) / 2, 0, H)
        y = H + 0.26 * H
        text, _ = BOLD.outline(WORD, (W - word_w) / 2, y + wcap, wcap, WORD_TRACK)
        h = y + wcap
        if tagline:
            t, _ = SEMI.outline(TAG, (W - word_w) / 2, y + wcap + lead + tcap, tcap, width=word_w)
            text += t
            h = y + wcap + lead + tcap
        return {'s': s, 'dot': d, 'text': text, 'w': W, 'h': h, 'H': H}
    if kind == 'wordmark':
        wcap, tcap, lead = 40.0, 15.3, 20.0
        word_w = BOLD.ink_width(WORD, wcap, WORD_TRACK)
        text, _ = BOLD.outline(WORD, 0, wcap, wcap, WORD_TRACK)
        h = wcap
        if tagline:
            t, _ = SEMI.outline(TAG, 0, wcap + lead + tcap, tcap, width=word_w)
            text += t
            h = wcap + lead + tcap
        return {'s': [], 'dot': [], 'text': text, 'w': word_w, 'h': h, 'H': wcap / 0.40}
    raise ValueError(kind)


# ---- emitters ----------------------------------------------------------------
def _d(ops, dx=0, dy=0):
    parts = []
    for op in ops:
        if op[0] == 'Z':
            parts.append('Z')
        else:
            vals = [v + (dx if i % 2 == 0 else dy) for i, v in enumerate(op[1:])]
            parts.append(op[0] + ' '.join(f'{v:.3f}'.rstrip('0').rstrip('.') for v in vals))
    return ''.join(parts)


def clear_space(L):
    """Minimum clear space: half the S ink height on every side."""
    return 0.5 * L['H']


def to_svg(L, colourway, pad=None, title='Stagecoach Concierge Emergency Medical Services', bg=None):
    cw = COLOURWAYS[colourway]
    pad = clear_space(L) if pad is None else pad
    W, H = L['w'] + 2 * pad, L['h'] + 2 * pad
    col = lambda role: COLOURS[cw[role]]['hex']
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.2f} {H:.2f}" width="{W:.2f}" height="{H:.2f}" role="img" aria-label="{title}">',
           f'<title>{title}</title>']
    if bg:
        out.append(f'<rect width="100%" height="100%" fill="{COLOURS[bg]["hex"]}"/>')
    if L['s']:
        out.append(f'<path fill="{col("s")}" fill-rule="evenodd" d="{_d(L["s"], pad, pad)}"/>')
        out.append(f'<path fill="{col("dot")}" d="{_d(L["dot"], pad, pad)}"/>')
    if L['text']:
        out.append(f'<path fill="{col("text")}" fill-rule="nonzero" d="{_d(L["text"], pad, pad)}"/>')
    out.append('</svg>')
    return '\n'.join(out) + '\n'


def rl_paths(L, colourway, x, y_top, scale, cmyk=True):
    """reportlab Path shapes for the logo, top-left of the ink at (x, y_top) in PDF points
    (y up), `scale` points per logo unit."""
    from reportlab.graphics.shapes import Path
    from reportlab.lib.colors import CMYKColor, Color
    cw = COLOURWAYS[colourway]

    def colour(role):
        c = COLOURS[cw[role]]
        if cmyk:
            return CMYKColor(*[v / 100 for v in c['cmyk']])
        return Color(*[v / 255 for v in c['rgb']])

    def path(ops, fill, mode):
        p = Path(fillColor=fill, strokeColor=None, strokeWidth=0, fillMode=mode)
        for op in ops:
            if op[0] == 'M':
                p.moveTo(x + op[1] * scale, y_top - op[2] * scale)
            elif op[0] == 'L':
                p.lineTo(x + op[1] * scale, y_top - op[2] * scale)
            elif op[0] == 'C':
                v = op[1:]
                p.curveTo(*[x + v[i] * scale if i % 2 == 0 else y_top - v[i] * scale for i in range(6)])
            else:
                p.closePath()
        return p

    from reportlab.graphics.shapes import FILL_EVEN_ODD, FILL_NON_ZERO
    shapes = []
    if L['s']:
        shapes += [path(L['s'], colour('s'), FILL_EVEN_ODD), path(L['dot'], colour('dot'), FILL_NON_ZERO)]
    if L['text']:
        shapes.append(path(L['text'], colour('text'), FILL_NON_ZERO))
    return shapes
