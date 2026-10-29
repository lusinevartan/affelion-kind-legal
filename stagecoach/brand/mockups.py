"""Vector product mockups for the vision board. Each returns an SVG string.

Illustrations, not photographs: flat shapes with soft light, so every logo is
the real outlined artwork at the right proportion.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import logo as LG  # noqa: E402

NAVY, NIGHT, CORAL, PEACH, CREAM, INK = '#1E2A3E', '#10192B', '#E37970', '#DC8E73', '#F4F1E9', '#A9473B'


def inner(L, cw):
    s = LG.to_svg(L, cw, pad=0)
    s = re.sub(r'^<svg[^>]*>\s*<title>.*?</title>\s*', '', s, flags=re.S)
    return s.rsplit('</svg>', 1)[0]


def place(L, cw, x, y, w=None, h=None, opacity=1):
    k = (w / L['w']) if w else (h / L['h'])
    return f'<g transform="translate({x:.2f} {y:.2f}) scale({k:.5f})" opacity="{opacity}">{inner(L, cw)}</g>'


def centred(L, cw, cx, y, w=None, h=None, opacity=1):
    k = (w / L['w']) if w else (h / L['h'])
    return place(L, cw, cx - L['w'] * k / 2, y, w=w, h=h, opacity=opacity)


def recolour(svg_inner, colour):
    return re.sub(r'fill="#[0-9A-Fa-f]{6}"', f'fill="{colour}"', svg_inner)


def debossed(L, cx, y, h, base):
    """Tone-on-tone pressed symbol: a light lower edge and a dark upper edge."""
    k = h / L['h']
    x = cx - L['w'] * k / 2
    shape = recolour(inner(L, 'Navy'), '#000000')
    return (f'<g transform="translate({x:.2f} {y + 1.6:.2f}) scale({k:.5f})" opacity=".22">{recolour(shape, "#FFFFFF")}</g>'
            f'<g transform="translate({x:.2f} {y - 1.2:.2f}) scale({k:.5f})" opacity=".55">{shape}</g>'
            f'<g transform="translate({x:.2f} {y:.2f}) scale({k:.5f})">{recolour(shape, base)}</g>')


DEFS = '''<defs>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
<linearGradient id="sheenV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<radialGradient id="floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#10192B" stop-opacity=".32"/><stop offset="1" stop-color="#10192B" stop-opacity="0"/></radialGradient>
<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0C2A6"/><stop offset=".5" stop-color="#DC8E73"/><stop offset="1" stop-color="#A9473B"/></linearGradient>
</defs>'''


def shadow(cx, cy, rx, ry):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#floor)"/>'


def svg(w, h, body, vb=None):
    vb = vb or f'0 0 {w} {h}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">{DEFS}{body}</svg>'


# ---------------------------------------------------------------- garments
TEE = ('M360 70 C400 118 600 118 640 70 L820 118 L985 330 L862 408 L782 322 L792 1062 '
       'C600 1078 400 1078 208 1062 L218 322 L138 408 L15 330 L180 118 Z')


def tee(fill, logo_svg, back=False):
    line = 'rgba(0,0,0,.22)' if fill in (NAVY, NIGHT) else 'rgba(16,25,43,.10)'
    collar = ('M360 70 C400 118 600 118 640 70 C602 140 398 140 360 70 Z' if not back
              else 'M360 70 C400 92 600 92 640 70 C602 104 398 104 360 70 Z')
    return svg(1000, 1160, shadow(500, 1095, 420, 34) +
               f'<path d="{TEE}" fill="{fill}" stroke="{'none' if fill in (NAVY, NIGHT) else 'rgba(16,25,43,.16)'}" stroke-width="3"/><path d="{TEE}" fill="url(#sheen)"/>'
               f'<path d="{collar}" fill="{line}"/>'
               f'<path d="M218 322 C236 380 236 420 230 470 M782 322 C764 380 764 420 770 470" stroke="{line}" stroke-width="3" fill="none"/>'
               f'<path d="M208 1040 C400 1056 600 1056 792 1040" stroke="{line}" stroke-width="3" fill="none"/>'
               + logo_svg, vb='0 0 1000 1160')


QZ = ('M392 92 L300 150 C246 168 186 206 158 262 L70 880 L168 906 L262 430 L268 1010 '
      'C420 1032 580 1032 732 1010 L738 430 L832 906 L930 880 L842 262 C814 206 754 168 700 150 L608 92 Z')


def quarter_zip(fill, logo_svg):
    dark = 'rgba(0,0,0,.24)'
    return svg(1000, 1100, shadow(500, 1062, 430, 30) +
               f'<path d="{QZ}" fill="{fill}"/><path d="{QZ}" fill="url(#sheen)"/>'
               # rib cuffs and hem
               f'<path d="M70 880 L168 906 L162 950 L64 924 Z M930 880 L832 906 L838 950 L936 924 Z" fill="{fill}"/>'
               f'<path d="M70 880 L168 906 L162 950 L64 924 Z M930 880 L832 906 L838 950 L936 924 Z" fill="{dark}"/>'
               f'<path d="M268 1010 C420 1032 580 1032 732 1010 L732 1048 C580 1070 420 1070 268 1048 Z" fill="{fill}"/>'
               f'<path d="M268 1010 C420 1032 580 1032 732 1010 L732 1048 C580 1070 420 1070 268 1048 Z" fill="{dark}"/>'
               # stand collar, open at the zip
               f'<path d="M392 92 L392 30 C430 18 492 16 498 18 L498 330 L476 330 C446 230 410 160 392 92 Z" fill="{fill}"/>'
               f'<path d="M608 92 L608 30 C570 18 508 16 502 18 L502 330 L524 330 C554 230 590 160 608 92 Z" fill="{fill}"/>'
               f'<path d="M392 92 L392 30 C430 18 492 16 498 18 L498 330 L476 330 C446 230 410 160 392 92 Z" fill="url(#sheenV)"/>'
               f'<path d="M392 30 C430 18 570 18 608 30" stroke="{dark}" stroke-width="4" fill="none"/>'
               # zip
               f'<path d="M500 22 L500 330" stroke="#C9C3B8" stroke-width="7" stroke-dasharray="3 3"/>'
               f'<rect x="490" y="326" width="20" height="40" rx="6" fill="url(#brass)"/>'
               f'<path d="M262 430 C276 520 280 600 272 700 M738 430 C724 520 720 600 728 700" stroke="{dark}" stroke-width="3" fill="none"/>'
               + logo_svg, vb='0 0 1000 1100')


def cap(fill, logo_svg):
    dark = 'rgba(0,0,0,.25)'
    return svg(700, 520,
               shadow(350, 470, 300, 26) +
               f'<path d="M90 340 C90 150 210 80 350 80 C490 80 610 150 610 340 Z" fill="{fill}"/>'
               f'<path d="M90 340 C90 150 210 80 350 80 C490 80 610 150 610 340 Z" fill="url(#sheen)"/>'
               f'<path d="M350 80 L350 340 M220 112 C190 190 180 270 186 340 M480 112 C510 190 520 270 514 340" stroke="{dark}" stroke-width="3" fill="none"/>'
               f'<circle cx="350" cy="84" r="11" fill="{fill}"/><circle cx="350" cy="84" r="11" fill="{dark}"/>'
               f'<path d="M70 340 L630 340 C640 380 540 420 350 420 C160 420 60 380 70 340 Z" fill="{fill}"/>'
               f'<path d="M70 340 L630 340 C640 380 540 420 350 420 C160 420 60 380 70 340 Z" fill="rgba(0,0,0,.30)"/>'
               + logo_svg)


# ---------------------------------------------------------------- bags
def shopping_bag(L_stack):
    side = '#16202F'
    body = (shadow(560, 905, 360, 30) +
            # rope handles (back pair first)
            f'<path d="M390 300 C390 150 560 150 560 300" stroke="#D9D3C7" stroke-width="12" fill="none" stroke-linecap="round"/>'
            f'<path d="M300 300 L700 300 L700 880 L300 880 Z" fill="{NAVY}"/>'
            f'<path d="M700 300 L820 262 L820 842 L700 880 Z" fill="{side}"/>'
            f'<path d="M700 300 L820 262 L790 252 L680 290 Z" fill="#0C1320"/>'
            f'<path d="M300 300 L700 300 L700 880 L300 880 Z" fill="url(#sheenV)"/>'
            f'<path d="M760 281 L760 861" stroke="rgba(255,255,255,.06)" stroke-width="2"/>'
            f'<path d="M300 336 L700 336" stroke="rgba(255,255,255,.08)" stroke-width="2"/>'
            f'<path d="M440 304 C440 150 620 150 620 304" stroke="{CREAM}" stroke-width="12" fill="none" stroke-linecap="round"/>'
            f'<circle cx="440" cy="318" r="7" fill="#0C1320"/><circle cx="620" cy="318" r="7" fill="#0C1320"/>'
            + centred(L_stack, 'Reverse', 500, 470, w=250))
    return svg(1000, 960, body)


def tote(L_stack):
    canvas = '#E8E1D2'
    body = (shadow(500, 900, 330, 26) +
            f'<path d="M360 330 C360 200 480 200 480 330" stroke="{NAVY}" stroke-width="22" fill="none"/>'
            f'<path d="M520 330 C520 200 640 200 640 330" stroke="{NAVY}" stroke-width="22" fill="none"/>'
            f'<path d="M250 320 L750 320 L770 880 L230 880 Z" fill="{canvas}" stroke="rgba(16,25,43,.12)" stroke-width="3"/>'
            f'<path d="M250 320 L750 320 L770 880 L230 880 Z" fill="url(#sheenV)" opacity=".7"/>'
            f'<path d="M250 346 L750 346" stroke="rgba(16,25,43,.10)" stroke-width="3" stroke-dasharray="7 6"/>'
            f'<rect x="349" y="320" width="22" height="70" fill="{NAVY}"/><rect x="469" y="320" width="22" height="70" fill="{NAVY}"/><rect x="509" y="320" width="22" height="70" fill="{NAVY}"/><rect x="629" y="320" width="22" height="70" fill="{NAVY}"/>'
            + centred(L_stack, 'FullColour', 500, 480, w=270))
    return svg(1000, 940, body)


def doctor_bag(L_sym, L_stack):
    leather, frame = NAVY, '#16202F'
    tag_x, tag_y = 760, 470
    body = (shadow(500, 902, 400, 30) +
            # handle
            f'<path d="M400 360 C400 210 600 210 600 360" stroke="{frame}" stroke-width="40" fill="none" stroke-linecap="round"/>'
            f'<path d="M400 360 C400 210 600 210 600 360" stroke="rgba(255,255,255,.08)" stroke-width="40" fill="none" stroke-linecap="round" stroke-dasharray="0 1"/>'
            f'<rect x="380" y="330" width="44" height="58" rx="8" fill="url(#brass)"/><rect x="576" y="330" width="44" height="58" rx="8" fill="url(#brass)"/>'
            # body
            f'<path d="M210 400 L790 400 L842 828 C848 872 822 890 782 890 L218 890 C178 890 152 872 158 828 Z" fill="{leather}"/>'
            f'<path d="M210 400 L790 400 L842 828 C848 872 822 890 782 890 L218 890 C178 890 152 872 158 828 Z" fill="url(#sheen)"/>'
            f'<path d="M226 426 L774 426 L818 820 C822 852 806 866 776 866 L224 866 C194 866 178 852 182 820 Z" fill="none" stroke="rgba(244,241,233,.22)" stroke-width="2.5" stroke-dasharray="9 7"/>'
            # top frame and clasp
            f'<path d="M180 372 C180 352 820 352 820 372 L820 414 L180 414 Z" fill="{frame}"/>'
            f'<path d="M180 372 C180 352 820 352 820 372" stroke="url(#brass)" stroke-width="5" fill="none"/>'
            f'<rect x="468" y="372" width="64" height="74" rx="10" fill="url(#brass)"/><rect x="486" y="392" width="28" height="34" rx="5" fill="#A9473B" opacity=".5"/>'
            # feet
            + ''.join(f'<ellipse cx="{x}" cy="892" rx="18" ry="8" fill="url(#brass)"/>' for x in (250, 750))
            # debossed symbol with the coral dot
            + debossed(L_sym, 500, 520, 210, '#18233A')
            # leather luggage tag
            + f'<path d="M{tag_x} 400 C{tag_x + 6} 430 {tag_x + 20} 450 {tag_x + 30} {tag_y}" stroke="{PEACH}" stroke-width="5" fill="none"/>'
            f'<g transform="rotate(8 {tag_x + 30} {tag_y})"><rect x="{tag_x - 30}" y="{tag_y}" width="120" height="170" rx="14" fill="{CREAM}"/>'
            f'<circle cx="{tag_x + 30}" cy="{tag_y + 18}" r="7" fill="{PEACH}"/>'
            + centred(L_stack, 'FullColour', tag_x + 30, tag_y + 44, w=96) + '</g>')
    return svg(1000, 960, body)


# ---------------------------------------------------------------- ID badge
def badge(photo_href, name, role, L_h):
    w, h = 420, 640
    body = (f'<path d="M210 0 L210 60" stroke="{NAVY}" stroke-width="22"/>'
            f'<rect x="170" y="50" width="80" height="36" rx="8" fill="url(#brass)"/>'
            f'<g transform="translate(0 80)">'
            f'<rect x="20" y="0" width="{w - 40}" height="{h - 120}" rx="26" fill="{CREAM}"/>'
            f'<rect x="20" y="0" width="{w - 40}" height="150" rx="26" fill="{NAVY}"/><rect x="20" y="120" width="{w - 40}" height="30" fill="{NAVY}"/>'
            f'<rect x="174" y="18" width="72" height="12" rx="6" fill="{NIGHT}"/>'
            + centred(L_h, 'Reverse', 210, 44, w=210) +
            f'<clipPath id="ph"><rect x="120" y="96" width="180" height="210" rx="18"/></clipPath>'
            f'<image href="{photo_href}" x="120" y="96" width="180" height="210" preserveAspectRatio="xMidYMid slice" clip-path="url(#ph)"/>'
            f'<text x="210" y="352" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="25" fill="{NAVY}">{name}</text>'
            f'<text x="210" y="384" text-anchor="middle" font-family="Montserrat" font-weight="600" font-size="13" letter-spacing="2.2" fill="{INK}">{role.upper()}</text>'
            f'<rect x="20" y="430" width="{w - 40}" height="90" fill="{NAVY}"/><path d="M20 496 L20 494 C20 508 32 520 46 520 L374 520 C388 520 400 508 400 494" fill="{NAVY}"/>'
            f'<text x="210" y="470" text-anchor="middle" font-family="Montserrat" font-weight="700" font-size="14" letter-spacing="5" fill="{CREAM}">CLINICIAN</text>'
            f'<text x="210" y="494" text-anchor="middle" font-family="Montserrat" font-weight="500" font-size="11" letter-spacing="1.5" fill="{CREAM}" opacity=".75">24/7 · 202.839.9439</text>'
            f'</g>')
    return body, w, h
