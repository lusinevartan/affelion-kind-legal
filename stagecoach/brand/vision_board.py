"""Stagecoach brand vision board: a 16:9 PDF of everything made for the brand.

    python3 brand/vision_board.py KIT_DIR SHOTS_DIR OUTPUT.pdf

KIT_DIR is the output of build_kit.py. SHOTS_DIR holds website screenshots
(d-*.jpg desktop, m-*.jpg phone, p-*.jpg inside pages, intro1-4.jpg).
"""
import base64
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import logo as LG  # noqa: E402
import mockups as M  # noqa: E402

KIT, SHOTS, OUT_PDF = [os.path.abspath(a) for a in sys.argv[1:4]]
SITE = os.path.dirname(HERE)
WORK = tempfile.mkdtemp()
NAVY, NIGHT, CORAL, PEACH, CREAM, INK = M.NAVY, M.NIGHT, M.CORAL, M.PEACH, M.CREAM, M.INK

HZ = LG.layout('horizontal', True)
HZN = LG.layout('horizontal', False)
ST = LG.layout('stacked', True)
SY = LG.layout('symbol')
WM = LG.layout('wordmark', True)


def asset(src, name=None):
    name = name or os.path.basename(src)
    shutil.copy(src, os.path.join(WORK, name))
    return name


def pdf_png(pdf, name, page=1, dpi=300, crop_bleed=True):
    base = os.path.join(WORK, name)
    subprocess.run(['pdftocairo', '-png', '-r', str(dpi), '-f', str(page), '-l', str(page), '-singlefile', pdf, base], check=True)
    if crop_bleed:
        b = int(round(0.125 * dpi))
        subprocess.run(['convert', base + '.png', '-shave', f'{b}x{b}', base + '.png'], check=True)
    return name + '.png'


def font_css():
    out = []
    for w, n in ((400, 'Regular'), (500, 'Medium'), (600, 'SemiBold'), (700, 'Bold')):
        b64 = base64.b64encode(open(os.path.join(HERE, 'fonts', f'Montserrat-{n}.ttf'), 'rb').read()).decode()
        out.append(f"@font-face{{font-family:'Montserrat';font-weight:{w};src:url(data:font/ttf;base64,{b64}) format('truetype')}}")
    return '\n'.join(out)


def logo_svg(L, cw, style=''):
    return LG.to_svg(L, cw, pad=0).replace('<svg ', f'<svg style="{style}" ', 1)


# ---------------------------------------------------------------- assets
for f in os.listdir(SHOTS):
    if f.endswith('.jpg'):
        asset(os.path.join(SHOTS, f))
CARDS = os.path.join(KIT, '04_Business_Cards', 'Print_Ready')
card_front = pdf_png(os.path.join(CARDS, 'Stagecoach_Card_Noah_Gray.pdf'), 'card_front', 1)
card_back_noah = pdf_png(os.path.join(CARDS, 'Stagecoach_Card_Noah_Gray.pdf'), 'card_back_noah', 2)
card_back_david = pdf_png(os.path.join(CARDS, 'Stagecoach_Card_David_Vitberg.pdf'), 'card_back_david', 2)
letterhead = pdf_png(os.path.join(KIT, '06_Stationery', 'Stagecoach_Letterhead.pdf'), 'letterhead', 1, dpi=150, crop_bleed=False)
avatar = asset(os.path.join(KIT, '07_Digital', 'Social', 'Stagecoach_Avatar_Navy_1080.png'), 'avatar.png')
linkedin = asset(os.path.join(KIT, '07_Digital', 'Social', 'Stagecoach_LinkedIn_Cover_1584x396.png'), 'linkedin.png')
og = asset(os.path.join(KIT, '07_Digital', 'Web', 'Stagecoach_Link_Preview_1200x630.jpg'), 'og.jpg')
videobg = asset(os.path.join(KIT, '07_Digital', 'Video_Call', 'Stagecoach_Video_Background_1920x1080.png'), 'videobg.png')
appicon = asset(os.path.join(KIT, '01_Logo', 'App_Icon', 'Stagecoach_AppIcon_512px.png'), 'appicon.png')
noah = asset(os.path.join(SITE, 'assets', 'team', 'noah.jpg'), 'noah.jpg')


def count(*parts):
    root = os.path.join(KIT, *parts)
    return sum(len(fs) for _, _, fs in os.walk(root))


# ---------------------------------------------------------------- slide helpers
SLIDES = []


def slide(body, dark=False, cls='', foot=True):
    n = len(SLIDES) + 1
    f = f'<div class="foot"><span>Stagecoach · Brand Vision 2026</span><span>{n:02d}</span></div>' if foot else ''
    SLIDES.append(f'<section class="slide {"dark" if dark else ""} {cls}">{body}{f}</section>')


def head(eyebrow, title, sub=''):
    return (f'<header class="sh"><p class="eb">{eyebrow}</p><h2>{title}</h2>' + (f'<p class="sub">{sub}</p>' if sub else '') + '</header>')


def stage(svg, label='', note='', cls=''):
    return f'<figure class="stage {cls}"><div class="art">{svg}</div>' + (f'<figcaption><b>{label}</b>{f"<span>{note}</span>" if note else ""}</figcaption>' if label else '') + '</figure>'


def phone(img):
    return f'<div class="phone"><div class="notch"></div><img src="{img}"></div>'


def browser(img, url='stagecoachmedical.com'):
    return f'<div class="browser"><div class="bar"><i></i><i></i><i></i><span>{url}</span></div><img src="{img}"></div>'


# ---------------------------------------------------------------- slides
# 1 cover
slide(f'''<div class="cover">
  <div class="cover-logo">{logo_svg(HZ, "Reverse", "width:900px;height:auto")}</div>
  <p class="cover-kicker">Brand &amp; Experience Vision</p>
  <p class="cover-meta">Prepared for Stagecoach Concierge Emergency Medical Services · Washington, DC · 2026</p>
  <div class="cover-glow"></div>
</div>''', dark=True)

# 2 the idea
stages = ''.join(
    f'<div class="idea-step"><svg viewBox="0 0 100 100">{s}</svg><b>{t}</b><span>{d}</span></div>' for s, t, d in [
        ('<circle cx="50" cy="50" r="7" fill="#E37970"/>', 'The Call', 'A point: one number, answered by a clinician.'),
        ('<circle cx="50" cy="50" r="34" fill="none" stroke="#1E2A3E" stroke-width="1.4" stroke-dasharray="2 3"/><circle cx="50" cy="50" r="24" fill="none" stroke="#1E2A3E" stroke-width="1"/><circle cx="50" cy="50" r="7" fill="#E37970"/>', 'The Decision', 'A ring: 911, the ER, telehealth, a home visit or safe to wait.'),
        (M.centred(SY, 'FullColour', 50, 8, h=84), 'The Arrival', 'The S: care that comes to you.'),
    ])
slide(f'''{head("The idea", "One Promise, Drawn in One Letter.", "The S is the brand's story in motion. It opens the website, explains how a call works, and signs every piece.")}
<div class="idea">{stages}</div>
<p class="quote">“Emergency Care That Comes to You.”</p>''')

# 3 logo system
slide(f'''{head("Logo system", "Four Forms, One Mark.")}
<div class="grid2x2">
  <div class="tile cream"><div class="lg">{logo_svg(HZ, "FullColour", "width:620px")}</div><p><b>Primary horizontal</b>Website header, letterhead, signage, everyday use.</p></div>
  <div class="tile cream"><div class="lg">{logo_svg(ST, "FullColour", "height:230px")}</div><p><b>Stacked</b>Square spaces, apparel backs, bags, social.</p></div>
  <div class="tile cream"><div class="lg">{logo_svg(SY, "FullColour", "height:220px")}</div><p><b>Symbol</b>App icon, favicon, caps, embossing, small spaces.</p></div>
  <div class="tile cream"><div class="lg">{logo_svg(HZN, "FullColour", "width:560px")}</div><p><b>Without tagline</b>Embroidery and anything under 2 in wide.</p></div>
</div>''')

# 4 colourways
cws = ''.join(
    f'<div class="cw" style="background:{bg}"><div>{logo_svg(HZ, cw, "width:380px")}</div><p style="color:{fg}">{label}</p></div>' for cw, bg, fg, label in [
        ('FullColour', CREAM, NAVY, 'Full colour'), ('Reverse', NAVY, CREAM, 'Reverse'), ('Navy', '#FFFFFF', NAVY, 'One colour navy'),
        ('White', NIGHT, CREAM, 'One colour white'), ('Black', '#FFFFFF', '#000', 'One colour black'), ('Reverse', CORAL, NIGHT, 'Reverse on coral, for campaigns')])
cws = cws.replace(f'<div class="cw" style="background:{CORAL}"><div>{logo_svg(HZ, "Reverse", "width:380px")}</div>',
                  f'<div class="cw" style="background:{CORAL}"><div>{logo_svg(HZ, "White", "width:380px")}</div>')
slide(f'''{head("Colourways", "Built for Every Surface.", "Every version ships as vector PDF and EPS in CMYK for print, SVG for screens, and transparent PNG.")}
<div class="cws">{cws}</div>''')

# 5 usage
cs = LG.clear_space(HZ)
k = 640 / (HZ['w'] + 2 * cs)
clear = (f'<svg viewBox="{-cs} {-cs} {HZ["w"] + 2 * cs} {HZ["h"] + 2 * cs}" style="width:640px;background:#fff;border-radius:6px">'
         f'<rect x="{-cs}" y="{-cs}" width="{HZ["w"] + 2 * cs}" height="{HZ["h"] + 2 * cs}" fill="rgba(227,121,112,.14)"/>'
         f'<rect x="0" y="0" width="{HZ["w"]}" height="{HZ["h"]}" fill="#fff"/>'
         f'<rect x="0" y="0" width="{HZ["w"]}" height="{HZ["h"]}" fill="none" stroke="{CORAL}" stroke-width="1.5" stroke-dasharray="6 5"/>'
         f'{M.inner(HZ, "FullColour")}</svg>')
donts = ''.join(f'<div class="dont"><div class="dz">{art}</div><span>{t}</span></div>' for art, t in [
    (logo_svg(HZ, 'FullColour', 'width:180px;transform:scaleX(1.35)'), 'Do not stretch'),
    (logo_svg(HZ, 'FullColour', 'width:240px;filter:hue-rotate(140deg) saturate(2)'), 'Do not recolour'),
    (logo_svg(HZ, 'FullColour', 'width:220px;transform:rotate(-12deg)'), 'Do not rotate'),
    (logo_svg(HZ, 'FullColour', 'width:240px;filter:drop-shadow(6px 6px 3px rgba(0,0,0,.5))'), 'Do not add effects'),
    (f'<div style="background:url({card_front if False else "d-hero.jpg"}) center/cover;padding:26px 12px;width:260px">{logo_svg(HZ, "FullColour", "width:236px")}</div>', 'Do not place on busy photos'),
    ('<div style="display:flex;gap:14px;align-items:center">' + logo_svg(WM, 'FullColour', 'width:170px') + logo_svg(SY, 'FullColour', 'height:46px') + '</div>', 'Do not rearrange the parts'),
])
slide(f'''{head("Using the logo", "Room to Breathe.")}
<div class="usage">
  <div><div class="clear">{clear}</div><p class="cap"><b>Clear space</b> Keep half the height of the S free on every side.</p>
  <p class="cap"><b>Minimum size</b> Horizontal with tagline: 1.75 in or 180 px wide. Below that, use the version without the tagline or the symbol alone.</p>
  <div class="mins"><div>{logo_svg(HZ, "FullColour", "width:180px")}<span>1.75 in · 180 px</span></div><div>{logo_svg(HZN, "FullColour", "width:120px")}<span>1.2 in · 120 px</span></div><div>{logo_svg(SY, "FullColour", "height:32px")}<span>0.3 in · 24 px</span></div></div></div>
  <div class="donts">{donts}</div>
</div>''')

# 6 colour
sw = ''.join(
    f'<div class="sw" style="flex:{flex}"><div class="chip" style="background:{c["hex"]};color:{fg}"><b>{c["name"]}</b></div>'
    f'<dl><dt>HEX</dt><dd>{c["hex"]}</dd><dt>RGB</dt><dd>{" ".join(map(str, c["rgb"]))}</dd><dt>CMYK</dt><dd>{" ".join(map(str, c["cmyk"]))}</dd></dl></div>'
    for c, flex, fg in [(LG.COLOURS['navy'], 3, CREAM), (LG.COLOURS['cream'], 2.4, NAVY), (LG.COLOURS['night'], 1.4, CREAM),
                        (LG.COLOURS['coral'], 1.1, NIGHT), (LG.COLOURS['peach'], 1, NIGHT), (LG.COLOURS['coral_ink'], 1, CREAM)])
slide(f'''{head("Colour", "Calm Navy, Warm Light, One Coral Pulse.", "Navy and Porcelain carry the brand. Coral is the pulse: the dot in the S, one button, a single highlight. Deep Coral keeps small text readable.")}
<div class="sws">{sw}</div>
<div class="ratio"><i style="flex:55;background:{NAVY}"></i><i style="flex:28;background:{CREAM}"></i><i style="flex:10;background:{NIGHT}"></i><i style="flex:5;background:{PEACH}"></i><i style="flex:2;background:{CORAL}"></i></div>
<p class="cap" style="margin-top:14px">Approximate balance across a page. HEX is the master value; CMYK builds are a starting point to approve on a printed proof.</p>''')

# 7 typography
slide(f'''{head("Typography", "One Family. Montserrat.", "Geometric, clear at any size, free to use everywhere. Installed fonts are in the kit.")}
<div class="type">
  <div class="spec"><span class="aa">Aa</span><p>ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 · 202.839.9439</p>
  <p class="weights"><span style="font-weight:400">Regular</span><span style="font-weight:500">Medium</span><span style="font-weight:600">SemiBold</span><span style="font-weight:700">Bold</span></p></div>
  <div class="hier">
    <p class="h-eb">Eyebrow · SemiBold · Tracked</p>
    <p class="h-1">Emergency Care That <span>Comes to You.</span></p>
    <p class="h-2">Headlines in Medium, Title Case, set tight.</p>
    <p class="h-b">Body copy in Regular at a comfortable size and line height. Plain words, short sentences, written for someone who needs help right now.</p>
  </div>
</div>''')

# 8 website hero
slide(f'''{head("Website", "A Site That Moves Like the Brand.", "Nine pages plus a 404, rewritten in plain English, built mobile first, and checked at 23 screen sizes.")}
<div class="web1">{browser("d-hero.jpg")}<div class="phones">{phone("m-hero.jpg")}{phone("m-how.jpg")}</div></div>''')

# 9 website journey
slide(f'''{head("Website", "From First Call to Front Door.")}
<div class="web2">
  <figure>{browser("d-how.jpg")}<figcaption>How It Works: the S builds itself as you scroll</figcaption></figure>
  <figure>{browser("d-services.jpg")}<figcaption>Services, each titled on its own image</figcaption></figure>
  <figure class="jn">{browser("d-join.jpg")}<figcaption>A one-field waitlist, the brand's only coral button</figcaption></figure>
  <figure>{browser("d-logos.jpg")}<figcaption>Clients as proof, set in one consistent weight</figcaption></figure>
</div>''')

# 10 inside pages + phones
slide(f'''{head("Website", "Every Page, Every Screen.")}
<div class="web3">
  <div class="pages">{"".join(f'<figure>{browser(f"p-{pg}.jpg", f"stagecoachmedical.com/{pg}")}</figure>' for pg in ("services", "membership", "kids", "team"))}</div>
  <div class="phones">{phone("m-services.jpg")}{phone("m-join.jpg")}</div>
</div>''')

# 11 motion
slide(f'''{head("Motion", "The Opening Moment.", "Name, point, S, lockup. It plays once per visit, can be skipped, and is ready to drop into the current Lovable site.")}
<div class="motion">{"".join(f'<figure><div class="fr"><img src="intro{i}.jpg"></div><figcaption>{t}</figcaption></figure>' for i, t in ((1, "01 The name"), (2, "02 The point"), (3, "03 The S draws"), (4, "04 The lockup")))}</div>''', dark=True)

# 12 business cards
slide(f'''{head("Business cards", "Quiet, Confident, Personal.", "Print-ready for all ten team members, CMYK with bleed, plus a blank template for new hires.")}
<div class="cards">
  <img class="c1" src="{card_front}"><img class="c2" src="{card_back_noah}"><img class="c3" src="{card_back_david}">
</div>''', cls='surface')

# 13 stationery
slide(f'''{head("Stationery", "Every Letter, Every Email.")}
<div class="stat">
  <figure class="paper"><img src="{letterhead}"><div class="letter"><p>October 2026</p><p>Dear Member,</p><p>Thank you for joining Stagecoach. A real clinician answers our line, day or night, and our team comes to you when you need us.</p><p>Warm regards,</p><p><b>Noah Gray, EMT</b><br>Co-Founder &amp; CEO</p></div></figure>
  <div class="mail"><div class="mail-bar">New message</div><div class="mail-body"><p>Thank you for your time today. Details are attached.</p><p>Best,</p>
    <div class="sig">{logo_svg(HZ, "FullColour", "width:250px")}<p class="sn">Noah Gray, EMT</p><p class="sr">Co-Founder &amp; CEO</p><p>202.839.9439 <span>· 24/7</span><br>medical@thestagecoachgroup.com<br>stagecoachmedical.com</p><p class="sf">Not a substitute for 911. In a life-threatening emergency, call 911.</p></div></div></div>
</div>''', cls='surface')

# 14 tees
u = 570 / 20.0
front_n = M.tee(NAVY, M.place(HZ, 'Reverse', 560, 245, w=3.5 * u))
back_n = M.tee(NAVY, M.centred(ST, 'Reverse', 500, 220, w=10 * u), back=True)
front_c = M.tee(CREAM, M.place(HZ, 'FullColour', 560, 245, w=3.5 * u))
back_c = M.tee(CREAM, M.centred(ST, 'FullColour', 500, 220, w=10 * u), back=True)
slide(f'''{head("Apparel", "Team Tees.", "Left chest at 3.5 in, full back at 10 in. Screen print and embroidery files included.")}
<div class="row4">{stage(front_n, "Navy tee", "Front")}{stage(back_n, "Navy tee", "Back")}{stage(front_c, "Natural tee", "Front")}{stage(back_c, "Natural tee", "Back")}</div>''')

# 15 quarter zip + cap
qz = M.quarter_zip(NAVY, M.place(HZN, 'Reverse', 548, 236, w=3.25 * 22))
cp = M.cap(NAVY, M.centred(SY, 'Reverse', 350, 150, h=128))
detail = (f'<div class="detail"><div class="emb">{logo_svg(HZN, "Reverse", "width:360px")}</div><span>Embroidery detail, left chest</span></div>')
slide(f'''{head("Apparel", "The Quarter-Zip and the Cap.", "Tone-on-tone navy, porcelain thread, a single coral stitch for the dot.")}
<div class="row3">{stage(qz, "Quarter-zip", "Embroidered, without tagline")}{detail}{stage(cp, "Cap", "Embroidered symbol, 2.25 in")}</div>''')

# 16 bags
slide(f'''{head("Retail and gifting", "The Bag Goes Home With Them.")}
<div class="row2">{stage(M.shopping_bag(ST), "Shopping bag", "Navy paper, porcelain rope, foil or one-colour print")}{stage(M.tote(ST), "Canvas tote", "Natural canvas, navy web handles")}</div>''')

# 17 doctor kit bag
body, bw, bh = M.badge(noah, 'Noah Gray, EMT', 'Co-Founder & CEO', HZN)
badge_svg = M.svg(bw, bh + 60, body, vb=f'0 0 {bw} {bh + 60}')
slide(f'''{head("In the field", "Arrive Like a Concierge.", "A navy leather kit bag with a pressed S, brass hardware and a porcelain tag. A clinician ID that reads at a glance.")}
<div class="field">{stage(M.doctor_bag(SY, ST), "Doctor’s kit bag", "Debossed symbol, brass hardware")}{stage(badge_svg, "Clinician ID", "Photo, name, role, 24/7 line", cls="badge")}</div>''')

# 18 digital
slide(f'''{head("Digital", "Recognisable at Every Size.")}
<div class="digital">
  <div class="colL"><figure class="li"><img src="{linkedin}"><figcaption>LinkedIn cover</figcaption></figure>
    <figure class="vb"><img src="{videobg}"><figcaption>Video call background</figcaption></figure></div>
  <div class="colR"><figure class="ogc"><div class="msg"><img src="{og}"><p><b>Stagecoach Concierge Emergency Medical Services</b><span>stagecoachmedical.com</span></p></div><figcaption>Link preview when the site is shared</figcaption></figure>
    <div class="pair"><figure class="av"><img src="{avatar}"><figcaption>Profile picture</figcaption></figure><figure class="ic"><img src="{appicon}"><figcaption>App icon</figcaption></figure></div></div>
</div>''')

# 19 the kit
items = [
    ('Logos', count('01_Logo'), '5 layouts × 5 colourways. SVG, CMYK PDF, EPS, PNG, app icon.'),
    ('Colour', count('02_Colour'), 'Swatches for Adobe (RGB and CMYK), CSS, values sheet.'),
    ('Type', count('03_Typography'), 'Montserrat, four weights, with licence and type guide.'),
    ('Business cards', count('04_Business_Cards'), 'Ten team members plus a blank template. Print ready.'),
    ('Apparel', count('05_Apparel'), 'Tee, embroidery and cap artwork at print size, mockups, specs.'),
    ('Stationery', count('06_Stationery'), 'Letterhead PDF, Word template, email signature.'),
    ('Digital', count('07_Digital'), 'Avatars, covers, video background, link preview, icons.'),
]
total = sum(i[1] for i in items)
rows = ''.join(f'<div class="ki"><b>{n}</b><span class="num">{c}</span><p>{d}</p></div>' for n, c, d in items)
slide(f'''{head("The kit", f"{total} Files, Ready for Any Vendor.", "Every logo is outlined artwork, so printers need no fonts. Print files are CMYK with bleed where it applies.")}
<div class="kit">{rows}</div>''')

# 20 close
slide(f'''<div class="close">{logo_svg(ST, "Reverse", "height:330px")}<p class="cl">Ready When You Need Us.</p><p class="cm">202.839.9439 · medical@thestagecoachgroup.com · stagecoachmedical.com</p></div>''', dark=True)


# ---------------------------------------------------------------- page
CSS = f'''{font_css()}
@page {{ size: 1920px 1080px; margin: 0 }}
*{{box-sizing:border-box}} html,body{{margin:0;padding:0}}
body{{font-family:Montserrat,sans-serif;color:{NAVY};-webkit-print-color-adjust:exact;print-color-adjust:exact}}
h1,h2,h3,.cl,.cover-kicker,.quote{{text-wrap:balance}} p,figcaption,span,dd,b{{text-wrap:pretty}}
.slide{{width:1920px;height:1080px;position:relative;overflow:hidden;background:{CREAM};padding:96px 120px;page-break-after:always;break-after:page}}
.slide.dark{{background:radial-gradient(60% 80% at 85% 10%,rgba(227,121,112,.30),transparent 60%),linear-gradient(160deg,{NAVY},{NIGHT});color:{CREAM}}}
.slide.surface{{background:radial-gradient(70% 70% at 70% 30%,#FBF9F4,#E9E4DA)}}
.foot{{position:absolute;left:120px;right:120px;bottom:44px;display:flex;justify-content:space-between;font:500 14px Montserrat;letter-spacing:.14em;text-transform:uppercase;color:#8A92A0}}
.dark .foot{{color:#8E97A8}}
.sh .eb{{margin:0 0 18px;font:600 18px Montserrat;letter-spacing:.24em;text-transform:uppercase;color:{INK}}}
.dark .sh .eb{{color:{PEACH}}}
.sh h2{{margin:0;font:500 76px/1.04 Montserrat;letter-spacing:-.035em;max-width:1300px}}
.sh .sub{{margin:22px 0 0;font:400 25px/1.5 Montserrat;max-width:1180px;color:#3D4A60}}
.dark .sh .sub{{color:#C9CDD6}}
.cap{{font:400 20px/1.5 Montserrat;color:#3D4A60;max-width:720px}} .cap b{{font-weight:600;color:{NAVY};margin-right:8px}}
/* cover */
.cover{{height:100%;display:flex;flex-direction:column;justify-content:center;position:relative}}
.cover-kicker{{margin:56px 0 0;font:500 40px Montserrat;letter-spacing:-.01em}}
.cover-meta{{position:absolute;bottom:0;left:0;margin:0;font:500 20px Montserrat;letter-spacing:.06em;opacity:.7}}
/* idea */
.idea{{display:grid;grid-template-columns:repeat(3,1fr);gap:56px;margin-top:70px}}
.idea-step{{display:grid;gap:14px;justify-items:start}} .idea-step svg{{width:220px;height:220px;background:#fff;border-radius:24px;padding:24px;box-shadow:0 30px 60px -40px rgba(16,25,43,.5)}}
.idea-step b{{font:600 30px Montserrat;margin-top:14px}} .idea-step span{{font:400 22px/1.45 Montserrat;color:#3D4A60;max-width:420px}}
.quote{{position:absolute;left:120px;bottom:90px;margin:0;font:500 34px Montserrat;color:{INK};letter-spacing:-.01em}}
/* logo grid */
.grid2x2{{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:44px}}
.tile{{background:#fff;border-radius:20px;height:330px;display:grid;grid-template-rows:1fr auto;padding:28px 36px;box-shadow:0 30px 60px -48px rgba(16,25,43,.6)}}
.tile .lg{{display:grid;place-items:center}} .tile svg{{max-width:100%}}
.tile p{{margin:0;font:400 18px Montserrat;color:#3D4A60}} .tile p b{{font-weight:600;color:{NAVY};margin-right:10px}}
.cws{{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:48px}}
.cw{{height:300px;border-radius:18px;display:grid;grid-template-rows:1fr auto;padding:26px 30px;box-shadow:0 26px 50px -42px rgba(16,25,43,.6)}}
.cw>div{{display:grid;place-items:center}} .cw p{{margin:0;font:600 16px Montserrat;letter-spacing:.16em;text-transform:uppercase}}
/* usage */
.usage{{display:grid;grid-template-columns:700px 1fr;gap:70px;margin-top:46px}}
.clear{{padding:20px;background:#fff;border-radius:18px;display:inline-block;box-shadow:0 26px 50px -42px rgba(16,25,43,.6)}}
.mins{{display:flex;gap:44px;align-items:flex-end;margin-top:26px;background:#fff;border-radius:16px;padding:26px 30px;box-shadow:0 26px 50px -44px rgba(16,25,43,.6)}} .mins div{{display:grid;gap:12px;justify-items:start}} .mins span{{font:600 14px Montserrat;letter-spacing:.1em;color:#7A8394}}
.donts{{display:grid;grid-template-columns:1fr 1fr;gap:20px}}
.dont{{background:#fff;border-radius:16px;padding:18px;display:grid;gap:10px;justify-items:center;box-shadow:0 26px 50px -44px rgba(16,25,43,.6)}}
.dz{{height:120px;display:grid;place-items:center;position:relative}}
.dont span{{font:600 15px Montserrat;letter-spacing:.12em;text-transform:uppercase;color:{INK}}} .dont span::before{{content:"✕ ";}}
/* colour */
.sws{{display:flex;gap:18px;margin-top:46px}} .sw{{min-width:0}}
.chip{{height:330px;border-radius:18px;border:1px solid rgba(16,25,43,.10);padding:22px;display:flex;align-items:flex-end;box-shadow:0 26px 50px -40px rgba(16,25,43,.55)}} .chip b{{font:600 20px Montserrat}}
.sw dl{{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:16px 4px 0;font:500 16px Montserrat}} .sw dt{{color:#7A8394;font-weight:600;letter-spacing:.1em}} .sw dd{{margin:0}}
.ratio{{display:flex;height:22px;border-radius:12px;overflow:hidden;margin-top:30px;box-shadow:inset 0 0 0 1px rgba(16,25,43,.12)}}
/* type */
.type{{display:grid;grid-template-columns:720px 1fr;gap:80px;margin-top:40px}}
.spec{{background:#fff;border-radius:22px;padding:40px 44px;box-shadow:0 30px 60px -48px rgba(16,25,43,.6)}}
.aa{{font:500 220px/1 Montserrat;letter-spacing:-.04em}} .spec p{{font:400 24px/1.5 Montserrat;margin:20px 0 0}}
.weights{{display:flex;gap:26px;font-size:26px!important}}
.hier p{{margin:0 0 26px}} .h-eb{{font:600 18px Montserrat;letter-spacing:.24em;text-transform:uppercase;color:{INK}}}
.h-1{{font:500 92px/1.02 Montserrat;letter-spacing:-.035em}} .h-1 span{{color:{INK}}}
.h-2{{font:500 34px/1.2 Montserrat;letter-spacing:-.02em}} .h-b{{font:400 24px/1.55 Montserrat;color:#3D4A60;max-width:760px}}
/* devices */
.browser{{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 40px 80px -40px rgba(16,25,43,.55)}}
.browser .bar{{height:34px;background:#ECE8DF;display:flex;align-items:center;gap:8px;padding:0 14px}}
.browser .bar i{{width:11px;height:11px;border-radius:50%;background:#D1CBBF}} .browser .bar span{{margin-left:16px;font:500 13px Montserrat;color:#7A8394;background:#fff;border-radius:6px;padding:4px 14px}}
.browser img{{display:block;width:100%}}
.phone{{width:232px;border-radius:38px;background:{NIGHT};padding:10px;position:relative;box-shadow:0 40px 80px -36px rgba(16,25,43,.7)}}
.phone img{{display:block;width:100%;border-radius:30px}} .phone .notch{{position:absolute;top:18px;left:50%;transform:translateX(-50%);width:76px;height:20px;border-radius:12px;background:{NIGHT};z-index:2}}
.web1{{display:grid;grid-template-columns:1fr auto;gap:46px;margin-top:40px;align-items:start}} .web1 .browser{{width:980px}} .web1 .browser img{{height:560px;object-fit:cover;object-position:top}}
.phones{{display:flex;gap:28px}}
.web2{{display:grid;grid-template-columns:1fr 1fr;gap:22px 40px;margin-top:26px}} .web2 figure{{margin:0}} .web2 .browser img{{height:282px;object-fit:cover;object-position:top}} .web2 .jn .browser img{{object-position:center 62%}}
.web2 figcaption,.motion figcaption,.digital figcaption{{margin-top:12px;font:500 18px Montserrat;color:#3D4A60}}
.web3{{display:grid;grid-template-columns:1fr auto;gap:46px;margin-top:40px}} .pages{{display:grid;grid-template-columns:1fr 1fr;gap:26px}} .pages figure{{margin:0}} .pages .browser img{{height:270px;object-fit:cover;object-position:top}}
.motion{{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:70px}} .motion figure{{margin:0}}
.motion .fr{{aspect-ratio:4/3;border-radius:16px;overflow:hidden;position:relative;box-shadow:0 30px 60px -30px rgba(0,0,0,.6);background:{NAVY}}}
.motion .fr img{{position:absolute;left:50%;top:50%;width:150%;transform:translate(-50%,-50%)}}
.dark .motion figcaption{{color:#C9CDD6}}
/* cards */
.cards{{position:relative;height:640px;margin-top:20px}}
.cards img{{position:absolute;width:560px;border-radius:10px;box-shadow:0 50px 70px -36px rgba(16,25,43,.55),0 4px 10px rgba(16,25,43,.12)}}
.cards .c1{{left:40px;top:60px;transform:rotate(-5deg)}} .cards .c2{{left:660px;top:250px;transform:rotate(3deg)}} .cards .c3{{left:1150px;top:10px;transform:rotate(-3deg)}}
/* stationery */
.stat{{display:grid;grid-template-columns:470px 1fr;gap:90px;margin-top:30px;align-items:start}}
.paper{{margin:0;position:relative;width:470px;box-shadow:0 50px 70px -40px rgba(16,25,43,.5)}} .paper img{{width:100%;display:block}}
.letter{{position:absolute;left:48px;right:48px;top:132px;font:400 10px/1.6 Montserrat}} .letter p{{margin:0 0 12px}}
.mail{{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 40px 70px -40px rgba(16,25,43,.5);max-width:760px}}
.mail-bar{{background:{NAVY};color:{CREAM};font:600 16px Montserrat;padding:16px 26px}}
.mail-body{{padding:30px 36px;font:400 19px/1.55 Montserrat}} .mail-body>p{{margin:0 0 12px}}
.sig{{margin-top:26px}} .sig p{{margin:8px 0 0;font-size:16px}} .sig .sn{{font-weight:700;font-size:19px;margin-top:16px}} .sig .sr{{font-weight:600;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:{INK};margin-top:2px}}
.sig span{{color:{INK}}} .sig .sf{{font-size:13px;color:#7A8394}}
/* product stages */
.stage{{margin:0;background:radial-gradient(80% 80% at 50% 35%,#FBF9F4,#E7E1D6);border-radius:24px;display:grid;grid-template-rows:1fr auto;padding:26px;box-shadow:inset 0 0 0 1px rgba(16,25,43,.04)}}
.stage .art{{min-height:0;position:relative}} .stage .art svg{{position:absolute;inset:0;width:100%;height:100%}}
.stage figcaption{{display:flex;justify-content:space-between;gap:20px;font:400 17px Montserrat;color:#5B6473;margin-top:14px}} .stage figcaption b{{font-weight:600;color:{NAVY}}}
.row4{{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;height:620px;margin-top:40px}}
.row3{{display:grid;grid-template-columns:1.15fr .9fr 1fr;gap:26px;height:640px;margin-top:36px}}
.row2{{display:grid;grid-template-columns:1fr 1fr;gap:30px;height:700px;margin-top:36px}}
.detail{{border-radius:24px;background:{NAVY};display:grid;grid-template-rows:1fr auto;padding:26px;position:relative;overflow:hidden}}
.detail::before{{content:"";position:absolute;inset:0;background:repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 2px,transparent 2px 6px)}}
.emb{{display:grid;place-items:center;filter:drop-shadow(0 2px 0 rgba(0,0,0,.45)) drop-shadow(0 -1px 0 rgba(255,255,255,.15))}} .detail span{{font:500 17px Montserrat;color:#C9CDD6;position:relative}}
.field{{display:grid;grid-template-columns:1.5fr .7fr;gap:30px;height:660px;margin-top:30px}}
/* digital */
.digital{{display:grid;grid-template-columns:720px 600px;gap:70px;margin-top:40px;align-items:start}} .colL,.colR{{display:grid;gap:28px}} .pair{{display:flex;gap:56px;align-items:flex-start}}
.digital figure{{margin:0}} .digital img{{display:block;width:100%;border-radius:14px;box-shadow:0 30px 60px -40px rgba(16,25,43,.6)}}
.av img{{width:190px;border-radius:50%}} .ic img{{width:150px;border-radius:34px}}
.ogc .msg{{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 30px 60px -40px rgba(16,25,43,.6)}} .ogc .msg img{{border-radius:0;box-shadow:none}}
.ogc .msg p{{margin:0;padding:14px 18px;font:400 15px Montserrat}} .ogc .msg b{{display:block;font-weight:600}} .ogc .msg span{{color:#7A8394}}
.vb img{{width:560px}}
/* kit */
.kit{{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:50px}}
.ki{{background:#fff;border-radius:18px;padding:28px 28px 30px;box-shadow:0 26px 50px -42px rgba(16,25,43,.6)}}
.ki b{{display:block;font:600 22px Montserrat}} .ki .num{{display:block;font:500 72px/1.05 Montserrat;letter-spacing:-.04em;color:{INK};margin:12px 0}} .ki p{{margin:0;font:400 17px/1.5 Montserrat;color:#3D4A60}}
/* close */
.close{{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}}
.cl{{margin:60px 0 0;font:500 64px Montserrat;letter-spacing:-.03em}} .cm{{margin:24px 0 0;font:500 22px Montserrat;opacity:.75;letter-spacing:.04em}}
.cover-glow{{display:none}}
'''

html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(SLIDES)}</body></html>'
page = os.path.join(WORK, 'vision.html')
open(page, 'w').write(html)
js = os.path.join(WORK, 'pdf.js')
open(js, 'w').write(f'''const {{ chromium }} = require('playwright');
(async () => {{ const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1920, height: 1080 }} }});
  await p.goto('file://{page}', {{ waitUntil: 'networkidle' }}); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(800);
  await p.pdf({{ path: {OUT_PDF!r}, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true }});
  await p.setViewportSize({{ width: 1920, height: 1080 }});
  const n = await p.evaluate(() => document.querySelectorAll('.slide').length);
  for (let i = 0; i < n; i++) {{ const el = (await p.$$('.slide'))[i]; await el.screenshot({{ path: {os.path.splitext(OUT_PDF)[0]!r} + `-${{String(i + 1).padStart(2, '0')}}.jpg`, type: 'jpeg', quality: 80 }}); }}
  await b.close(); }})();''')
subprocess.run(['node', js], check=True)
print('wrote', OUT_PDF, len(SLIDES), 'slides'); print('html', page)
