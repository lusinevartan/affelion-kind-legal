"""Builds the Stagecoach site: shared head, header, footer and blocks, one file per page.

Run from the stagecoach/ folder:  python3 src/build.py
Edit copy here (inside pages) or in src/home.html (home), never in the generated .html files.
"""
import os
import re
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from icons import icon

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
S = open(os.path.join(SRC, 's-path.txt')).read().strip()
B = 'https://stagecoachmedical.com/__l5e/assets-v1/'
IMG = {
    'kids3': 'assets/photos/kids-3.jpg',
    'kids2': 'assets/photos/kids-2.jpg',
    'field': 'assets/photos/team-field.jpg',
}
# Public address of the live site. Used for link previews and canonical URLs. Change it if the site launches elsewhere.
SITE_URL = 'https://stagecoachmedical.com'
PHONE = '202.839.9439'
TEL = 'tel:+12028399439'
EMAIL = 'medical@thestagecoachgroup.com'

SMALL = {'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'up', 'vs', 'via', 'per'}


def title_case(text):
    """Title Case for headings: every word capitalised except short joining words, which stay lower unless first or last."""
    parts = re.split(r'(\s+|&[a-z]+;)', text)
    words = [i for i, p in enumerate(parts) if p and not re.fullmatch(r'\s+|&[a-z]+;', p)]
    for n, i in enumerate(words):
        w = parts[i]
        m = re.match(r'^([^A-Za-z]*)([A-Za-z][A-Za-z\u2019\'.]*)(.*)$', w)
        if not m:
            continue
        pre, core, post = m.groups()
        if core.isupper() or re.fullmatch(r'[ap]\.m\.', core):
            continue
        low = core.lower()
        first_or_last = n == 0 or n == len(words) - 1
        after_colon = n > 0 and parts[words[n - 1]].endswith(':')
        if low in SMALL and not first_or_last and not after_colon:
            parts[i] = pre + low + post
        else:
            parts[i] = pre + core[0].upper() + core[1:] + post
    return ''.join(parts)


def title_case_headings(html):
    def fix(m):
        open_, inner, close = m.group(1), m.group(2), m.group(3)
        segs = re.split(r'(<[^>]+>)', inner)
        segs = [title_case(x) if not x.startswith('<') else x for x in segs]
        return open_ + ''.join(segs) + close
    html = re.sub(r'(<h[1-3]\b[^>]*>)(.*?)(</h[1-3]>)', fix, html, flags=re.S)
    html = re.sub(r'(<span class="txt">(?:(?!<strong>).)*<strong>)(.*?)(</strong>)', fix, html, flags=re.S)
    html = re.sub(r'(<li class="rise"[^>]*>(?:<span class="ic-wrap">.*?</span>)?<b>)(.*?)(</b>)', fix, html, flags=re.S)
    return html


NAV = [('services.html', 'Services'), ('membership.html', 'Membership'), ('team.html', 'Team'), ('contact.html', 'Contact')]
SHEET_MORE = [('kids.html', 'Stagecoach Kids'), ('events.html', 'Events'), ('partners.html', 'Partners'), ('careers.html', 'Join us')]


def head(title, desc, name='index.html'):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#1E2A3E">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="icon" href="assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Stagecoach Concierge Emergency Medical Services">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<link rel="canonical" href="{SITE_URL}/{'' if name == 'index.html' else name}">
<meta property="og:url" content="{SITE_URL}/{'' if name == 'index.html' else name}">
<meta property="og:image" content="{SITE_URL}/assets/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Stagecoach: Emergency Care That Comes to You. Washington, DC, 24/7.">
<meta name="twitter:card" content="summary_large_image">
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="grain" aria-hidden="true"></div>
<div class="cur" aria-hidden="true"><span></span></div>
'''


def header(current, has_join=True):
    links = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if h == current else ""}>{t}</a>' for h, t in NAV)
    sheet = ''.join(f'<a href="{h}">{t}</a>' for h, t in [('index.html', 'Home')] + NAV) + '<span class="sheet-more">' + ''.join(f'<a href="{h}">{t}</a>' for h, t in SHEET_MORE) + '</span>'
    return f'''<header class="hdr on-dark" id="hdr">
  <div class="hdr-in">
    <a class="brand" href="index.html" aria-label="Stagecoach Concierge Emergency Medical Services, home"><svg class="s" viewBox="0 0 100 100" aria-hidden="true"><defs><mask id="hb-m" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140"><rect x="-20" y="-20" width="140" height="140" fill="#fff"/><circle cx="50" cy="50" r="13.5" fill="#000"/></mask></defs><path d="{S}" fill="none" stroke="currentColor" stroke-width="14.5" stroke-linecap="round" mask="url(#hb-m)"/><circle cx="50" cy="50" r="6.5" fill="#E37970"/></svg><span class="wm-text"><span class="wm">STAGECOACH</span><span class="wm-tag">CONCIERGE EMERGENCY MEDICAL SERVICES</span></span></a>
    <nav class="nav" aria-label="Primary">{links}</nav>
    <div style="display:flex;align-items:center;gap:20px">
      <a class="call-link" href="{TEL}" data-cur="Call"><span class="pulse" aria-hidden="true"></span><span class="num"><span class="lbl">24/7 · </span>{PHONE}</span></a>
      <a class="btn-join pill-call" href="{'#join' if has_join else 'membership.html#join'}">Join the Waitlist</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="sheet">Menu</button>
    </div>
  </div>
  <div class="progress" aria-hidden="true"></div>
</header>
<div class="sheet" id="sheet" aria-label="Menu">
  <nav aria-label="Mobile">{sheet}</nav>
  <p>24/7 · <a href="{TEL}">{PHONE}</a><br>Life-threatening emergency? Call 911&nbsp;first.</p>
</div>
'''


FOOTER = f'''<footer class="foot">
  <div class="foot-brand"><a class="foot-logo" href="index.html" aria-label="Stagecoach Concierge Emergency Medical Services, home"><svg class="s" viewBox="0 0 100 100" aria-hidden="true"><defs><mask id="fb-m" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140"><rect x="-20" y="-20" width="140" height="140" fill="#fff"/><circle cx="50" cy="50" r="13.5" fill="#000"/></mask></defs><path d="{S}" fill="none" stroke="currentColor" stroke-width="14.5" stroke-linecap="round" mask="url(#fb-m)"/><circle cx="50" cy="50" r="6.5" fill="#E37970"/></svg><span class="wm">STAGECOACH</span><span class="tag">Concierge Emergency Medical Services</span></a><span>White glove care, ready for emergencies, wherever you&nbsp;are.<br>Led by doctors. Based in Washington,&nbsp;DC.</span></div>
  <nav aria-label="Explore"><strong>Explore</strong><a href="services.html">Services</a><a href="membership.html">Membership</a><a href="events.html">Events</a><a href="kids.html">Stagecoach Kids</a><a href="team.html">Team</a></nav>
  <nav aria-label="Company"><strong>Company</strong><a href="careers.html">Join us</a><a href="careers.html#internships">Internships</a><a href="partners.html">Partners</a><a href="contact.html">Contact</a></nav>
  <div><strong>Reach us</strong><br><a href="{TEL}">{PHONE}</a>, 24/7<br><a href="mailto:{EMAIL}">{EMAIL}</a><br>3299 K St NW #210<br>Washington, DC 20007</div>
  <div class="fine"><span>© <span class="yr">2026</span> Stagecoach Concierge Emergency Medical Services. Not a substitute for 911. In a life-threatening emergency, call 911.</span><span>Stagecoach Concierge EMS PC is pending EMS Agency approval by the District of&nbsp;Columbia.</span></div>
</footer>
<nav class="callbar" aria-label="Quick actions"><a class="cb-call" href="{TEL}"><span class="pulse" aria-hidden="true"></span>Call 24/7</a><a class="cb-join" href="{{JOINHREF}}">Join the Waitlist</a></nav>
<script src="assets/site.js"></script>
</body>
</html>
'''

JOIN = f'''<!-- JOIN: membership waitlist -->
<section class="sec join" id="join" aria-labelledby="join-h">
  <div class="join-in">
    <div class="join-copy">
      <p class="eyebrow rise"><span class="live-dot" aria-hidden="true"></span>Launching soon</p>
      <h2 id="join-h" class="split">Join the&nbsp;Waitlist.</h2>
      <p class="lead rise">Membership is small on purpose. Add your email and you’ll hear first when spots&nbsp;open.</p>
      <ul class="join-why rise">
        <li>Takes 10 seconds</li><li>No spam, ever</li><li>Unsubscribe anytime</li>
      </ul>
    </div>
    <div class="join-card rise">
      <form id="join-form" novalidate data-endpoint="">
        <label for="join-email">Your email</label>
        <div class="field">
          <input id="join-email" name="email" type="email" autocomplete="email" inputmode="email" required placeholder="name@example.com" aria-describedby="join-msg join-fine" enterkeyhint="go">
          <button class="btn btn-dark" type="submit">Join the Waitlist <span class="arr" aria-hidden="true">→</span></button>
        </div>
        <label class="hp" aria-hidden="true">Company<input name="company" tabindex="-1" autocomplete="off"></label>
        <p class="msg" id="join-msg" role="status" aria-live="polite"></p>
        <fieldset class="chips-in" hidden><legend>One more thing, if you like: who is this for?</legend>
          <label><input type="checkbox" name="interest" value="individual"><span>Just me</span></label>
          <label><input type="checkbox" name="interest" value="family"><span>My family</span></label>
          <label><input type="checkbox" name="interest" value="kids"><span>My kids</span></label>
          <label><input type="checkbox" name="interest" value="executive"><span>Executive care</span></label>
          <label><input type="checkbox" name="interest" value="employer"><span>My company</span></label>
          <label><input type="checkbox" name="interest" value="events"><span>Events</span></label>
        </fieldset>
      </form>
      <div class="join-done" hidden>
        <svg viewBox="0 0 100 100" aria-hidden="true"><defs><mask id="jd-m" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140"><rect x="-20" y="-20" width="140" height="140" fill="#fff"/><circle cx="50" cy="50" r="13.5" fill="#000"/></mask></defs><path class="jd-s" d="{S}" pathLength="1" fill="none" stroke="#10192B" stroke-width="14.5" stroke-linecap="round" mask="url(#jd-m)"/><circle class="jd-dot" cx="50" cy="50" r="6.5" fill="#E37970"/></svg>
        <h3>You’re on the list.</h3>
        <p>We’ll email you the moment membership opens. Check your inbox to confirm.</p>
      </div>
      <p class="fine" id="join-fine">For news only. To get care now, call <a href="{TEL}">{PHONE}</a>. Not a substitute for&nbsp;911.</p>
    </div>
  </div>
</section>'''

LOGOS = '''<ul class="logos">
''' + ''.join(f'      <li><span class="logo" role="img" aria-label="{n}" style="-webkit-mask-image:url(assets/clients/{u});mask-image:url(assets/clients/{u});--w:{w};--h:{h}"></span></li>\n' for n, u, w, h in [
    ('Meta', 'meta.svg', '56%', '34%'), ('Google', 'google.svg', '50%', '36%'), ('J.P. Morgan', 'jpmorgan.svg', '66%', '40%'),
    ('The Atlantic', 'atlantic.svg', '54%', '64%'), ('Emerson Collective', 'emerson.svg', '70%', '52%'),
    ('Hargrove', 'hargrove.svg', '72%', '56%')]) + \
    '      <li><span class="logo-mix" role="img" aria-label="YPO"><span class="logo mark" style="-webkit-mask-image:url(assets/clients/ypo-mark.svg);mask-image:url(assets/clients/ypo-mark.svg)"></span><span class="wordlogo">YPO</span></span></li>\n' + \
    '      <li><span class="wordlogo">Edens</span></li>\n      <li><span class="wordlogo">Union Market</span></li>\n      <li><span class="wordlogo">Autoshop</span></li>\n  </ul>'

TEAM = {
    'noah': ('Noah Gray, EMT', 'Co-Founder & CEO', 'Former Chief Communications Officer, DC Fire & EMS. Volunteer EMT.',
             'Former Chief Communications Officer for DC Fire & EMS, volunteer EMT with Montgomery County, Maryland, and White House producer for CNN. UVA Darden MBA candidate.',
             'assets/team/' + 'noah' + '.jpg', 'center 50%'),
    'david': ('Dr. David Vitberg, MD', 'Co-Founder & Chief Medical Officer', 'Triple board certified ER and critical care doctor. Former Medical Director, DC Fire & EMS.',
              'Triple board certified emergency and critical care physician and former Medical Director of DC Fire & EMS, where he built its prehospital whole blood program. Practices in the MedStar and Johns Hopkins systems.',
              'assets/team/' + 'david' + '.jpg', 'center 50%'),
    'waleed': ('Waleed Haleem, PMP', 'Co-Founder & Chief Operating Officer', 'Ten years running hospital operations, including VIP care at Walter Reed.',
               'Ten years of executive experience in hospital operations, program and project management, IT, and VIP care delivery at Walter Reed; now focused on leading teams and keeping complex operations moving. UVA Darden MBA candidate.',
               'assets/team/' + 'waleed' + '.jpg', 'center 50%'),
    'scott': ('Scott Sehon, MBA', 'Co-Founder & Chief Financial Officer', 'Finance leader who helped grow Social Tables to a $100M sale to Cvent.',
              'Led finance at Crystal Clear Technologies from before it had revenue to No. 5 on the 2011 Inc. 500, then directed finance at Social Tables through 5× ARR growth, a $13M Series B, and a $100M acquisition by Cvent.',
              'assets/team/' + 'scott' + '.jpg', 'center 50%'),
    'liza': ('Liza White', 'VP of Strategy & Partnerships', 'Runs White32 Dental. Former communications director to Secretary of State Madeleine Albright.',
             'Owner and manager of White32 Dental, and former Director of Communications to U.S. Secretary of State Madeleine Albright. Former Chief of Staff at Subversive Capital and communications lead for the CEO of Ralph Lauren.',
             'assets/team/' + 'liza' + '.jpg', 'center 50%'),
    'ameen': ('Ameen Elhamdani, NRP', 'EMS Operations Manager', 'Runs our crews, vehicles and schedules, so a team is ready the moment you call.',
              'Leads daily EMS operations, crews, vehicles, scheduling, and readiness, so a Stagecoach team is staffed, equipped, and moving the moment a call comes in.',
              'assets/team/' + 'ameen' + '.jpg', 'center 50%'),
    'gupi': ('Gupi D. Howie, PA-C', 'Director of Advanced Practice Providers', 'Leads our PAs and nurse practitioners, so every visit meets the same high bar.',
             'Leads our advanced practice providers, hiring, credentialing, and clinical standards, so every physician assistant and nurse practitioner on a Stagecoach response meets the same bar.',
             'assets/team/' + 'gupi' + '.jpg', 'center 50%'),
    'yaffa': ('Dr. Yaffa Vitberg, MD', 'Pediatric Medical Director', 'Board certified children’s ER doctor at Weill Cornell Medicine / NewYork-Presbyterian.',
              'Board certified in Pediatrics and Pediatric Emergency Medicine, she is an Assistant Professor of Clinical Emergency Medicine and Pediatrics and a pediatric emergency medicine physician at Weill Cornell Medicine/NewYork-Presbyterian in New York City. She is an accomplished clinician, educator, and leader with a strong commitment to medical education, mentorship, and advancing pediatric emergency care.',
              'assets/team/' + 'yaffa' + '.jpg', 'center 50%'),
    'eve': ('Eve Hill, RN, NRP', 'Quality Improvement Officer', 'Nurse and paramedic at the R Adams Cowley Shock Trauma Center.',
            'Registered nurse and nationally registered paramedic in the Multi-Trauma Critical Care Unit at R Adams Cowley Shock Trauma Center, formerly in intensive care at MedStar Washington Hospital Center. Eight years in a 911-based EMS system, progressing from EMT to paramedic in charge and field training officer.',
            'assets/team/' + 'eve' + '.jpg', 'center 50%'),
    'charles': ('Dr. Charles White, DDS', 'Emergency Dental Response Partner', 'Founder and lead dentist at White32 Dental, our dental partner.',
                'Founder and Principal Dentist at White32 Dental, Stagecoach’s emergency dental response partner. He completed his undergraduate and dental education at UNC Chapel Hill, followed by a clinical residency at the VA Medical Center in Washington, DC.',
                'assets/team/' + 'charles' + '.jpg', 'center 50%'),
}


def person(key, full=False):
    name, role, short, bio, img, pos = TEAM[key]
    first = name.split(',')[0]
    more = f'<details class="bio-more"><summary>Read more</summary><p>{bio}</p></details>' if full else ''
    return f'''      <li><figure>
        <div class="portrait" tabindex="0" role="button" aria-label="Show {first} in colour"><img src="{img}" alt="{first}" loading="lazy" style="object-position:{pos}"><img class="sym" src="assets/symbol-cream.svg" alt=""></div>
        <figcaption><span class="name">{name}</span><span class="fig">{role}</span><span class="role">{short}</span>{more}</figcaption>
      </figure></li>
'''


def people(keys, cols, full=False):
    return f'<ul class="t-grid {cols}">\n' + ''.join(person(k, full) for k in keys) + '    </ul>'


COFOUNDERS = people(['noah', 'david', 'waleed', 'scott'], 'four')
SYM = '<img class="ph-sym" src="assets/symbol-cream.svg" alt="" aria-hidden="true">'


def hero(eyebrow, h1, lead, ctas='', img=None, alt=''):
    pic = f'<div class="ph-img rise"><img src="{img}" alt="{alt}"></div>' if img else ''
    copy = f'''<div class="ph-copy"><p class="eyebrow rise">{eyebrow}</p>
    <h1 class="split">{h1}</h1>
    <p class="lead rise">{lead}</p>
    {f'<div class="ctas rise">{ctas}</div>' if ctas else ''}</div>'''
    return f'''<section class="dark page-hero{' has-img' if img else ''}" aria-label="Introduction">
  {copy}
  {pic}
</section>
'''


def head2(eyebrow, h2, p='', id_=''):
    return f'''<div class="sec-head"><p class="eyebrow rise">{eyebrow}</p><h2{f' id="{id_}"' if id_ else ''} class="split">{h2}</h2>{f'<p class="rise">{p}</p>' if p else ''}</div>'''


def cards(items, cols=3, show=None):
    """A card grid. With show=N, only the first N cards are visible until the reader asks for the rest."""
    fold = show is not None and len(items) > show
    out = ('<div class="cardfold">\n' if fold else '') + f'<ul class="cards" style="--cols:{cols}">\n'
    for i, it in enumerate(items):
        t, p = it[0], it[1]
        extra = it[2] if len(it) > 2 else ''
        ic = f'<span class="ic-wrap">{icon(it[3])}</span>' if len(it) > 3 and it[3] else ''
        cls = 'card rise fold-item' if fold and i >= show else 'card rise'
        out += f'      <li class="{cls}">{ic}<h3>{t}</h3><p>{p}</p>{extra}</li>\n'
    out += '    </ul>'
    if fold:
        n = len(items) - show
        out += f'\n    <button class="btn btn-outline btn-md see-all rise" type="button">See {n} more</button>\n</div>'
    return out


def statement(eyebrow, big, p='', link='', id_=''):
    """A typographic break: one big sentence, one plain sentence, an optional link."""
    return f'''<div class="statement">
    <p class="eyebrow rise">{eyebrow}</p>
    <p{f' id="{id_}"' if id_ else ''} class="big split">{big}</p>
    {f'<p class="rise">{p}</p>' if p else ''}
    {f'<p class="rise">{link}</p>' if link else ''}
  </div>'''


def checks(items):
    return '<ul class="checks">' + ''.join(f'<li class="rise">{i}</li>' for i in items) + '</ul>'


def steps(items):
    ics = ['phone', 'compass', 'truck']
    return '<ol class="steps3">' + ''.join(f'<li class="rise"><span class="ic-wrap">{icon(ics[i])}</span><h3>{t}</h3><p>{p}</p></li>' for i, (t, p) in enumerate(items)) + '</ol>'


def band(h2, p, ctas):
    return f'''<section class="sec dark" aria-label="{h2}">
  <div class="band"><div><h2 class="split">{h2}</h2><p class="rise">{p}</p></div><div class="ctas rise">{ctas}</div></div>
</section>
'''


BTN_CALL = f'<a class="btn btn-paper" href="{TEL}" data-cur="Call">Call {PHONE} <span class="arr" aria-hidden="true">→</span></a>'
LINK_JOIN = '<a class="btn btn-outline" href="#join">Join the waitlist</a>'
LINK_CONTACT = '<a class="btn btn-outline" href="contact.html">Contact us</a>'
CALL_STEPS = [('You call. A real clinician answers.', 'Call or reach us online, any time. No phone tree.'),
              ('We figure out what you need.', '911, the ER, a telehealth call, a home visit, or safe to wait. We decide together.'),
              ('If you need us, we come to you.', 'An EMT, paramedic, NP, PA, doctor or dentist comes to you. A triple board certified doctor oversees every visit.')]

# ---------------------------------------------------------------- pages
PAGES = {}

PAGES['services.html'] = ('Services | Stagecoach Concierge Emergency Medical Services', 'Emergency care, private medicine and fast help from a team led by doctors in Washington, DC, 24/7.',
hero('Services', 'What we&nbsp;do.', 'Emergency care, private medicine and fast help from a team led by doctors. Day or night, all&nbsp;year.', BTN_CALL + LINK_CONTACT) +
f'''<section class="sec" aria-labelledby="s1">
  {head2('For emergencies', 'Emergency and critical&nbsp;care', 'When something is wrong, we bring hospital trained care to you.', 's1')}
  {cards([('Basic life support (BLS)', 'Emergency care from trained EMTs.', '', 'heart-pulse'),
          ('Advanced life support (ALS)', 'Paramedic level emergency care, wherever you are.', '', 'bolt'),
          ('Urgent care at your door', 'We treat you where you are, at home or on the go.', '', 'home'),
          ('Critical care and transport', 'ICU level care, and a safe ride to the hospital if you need one.', '', 'truck'),
          ('Blood products on scene', 'We can give lifesaving blood before you reach a hospital.', '', 'drop'),
          ('Emergency care for kids', 'A pediatric team for babies, kids and teens.', '<a class="more" href="kids.html">About Stagecoach Kids →</a>', 'child')], 3, show=3)}
</section>
<section class="sec alt" id="dental" aria-labelledby="s2">
  {statement('Dental emergencies, 24/7', 'A cracked tooth at midnight? The ER can’t fix that. We&nbsp;can.', 'Emergency dental care any hour, with pain relief on site and visits to your home, through our partner White32 Dental, led by Dr. Charles White.', '<a class="tlink" href="https://white32dc.com" rel="noopener">Visit white32dc.com</a>', 's2')}
</section>
<section class="sec" aria-labelledby="s3">
  {head2('Private care', 'Private, discreet&nbsp;medicine', 'Care that fits your life, your schedule and your privacy.', 's3')}
  {cards([('Your health plan, ready in advance', 'We build your full medical profile before you ever need us.', '', 'file'),
          ('Private executive medicine', 'Care for leaders, built around a busy day.', '', 'briefcase'),
          ('The hospital you choose', 'If you need to go in, we take you to the hospital you want.', '', 'hospital'),
          ('Lab tests at home or on site', 'Blood work and tests without a trip to the lab.', '', 'flask'),
          ('Help inside the hospital', 'We guide you through the hospital and speak up for you.', '', 'compass'),
          ('Works with your security', 'Medical care that works hand in hand with executive protection.', '', 'shield')], 3, show=3)}
</section>
<section class="sec alt" aria-labelledby="s4">
  {head2('For groups', 'For organizations and&nbsp;agencies', '', 's4')}
  {cards([('Event medical teams', 'Coverage for galas, sets, conferences and big crowds.', '<a class="more" href="events.html">About events →</a>', 'calendar'),
          ('Medical direction and consulting', 'Doctor oversight and advice for EMS teams and programs.', '', 'stetho'),
          ('CPR and EMS training', 'Practical training for your staff.', '', 'graduation'),
          ('Nurse triage line', 'Experienced clinicians who answer and sort calls.', '<a class="more" href="partners.html">Partner with us →</a>', 'dispatch')], 4)}
</section>
<section class="sec" aria-labelledby="s5">
  {head2('Why Stagecoach', 'What makes us&nbsp;different', '', 's5')}
  {checks(['Care from clinicians trained in the ER and ICU.', 'Lifesaving blood products we can bring to you.', 'Proven steps for emergencies where minutes matter.', 'Medical care that works with your security team.', 'Emergency dental care the ER can’t give.', 'If you need a hospital, you choose which.'])}
</section>
''' + band('Ready when you need&nbsp;us.', 'One number for everything on this page. A clinician answers, day or night.', BTN_CALL + LINK_CONTACT))

PAGES['membership.html'] = ('Membership | Stagecoach Concierge Emergency Medical Services', 'Individual, family, employer and executive membership: 24/7 access to a team led by doctors in Washington, DC.',
hero('Membership · Launching soon', 'Skip the ER wait. We come to&nbsp;you.', 'Members get 24/7 access to a team led by doctors for the whole family, including dental&nbsp;care.',
     '<a class="btn btn-light" href="#join">Join the waitlist <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-outline" href="#tiers">See membership options</a>', IMG['kids2'], 'A parent comforting a young child') +
f'''<section class="sec dark" aria-labelledby="m1" style="padding-top:0">
  {statement('Why it matters', 'The ER is not built for&nbsp;you.', 'In DC, a trip to the ER means hours of waiting, a big bill, and a room that was never meant for you. We come to you instead, with the same training and the right equipment.', '', 'm1')}
</section>
<section class="sec" aria-labelledby="m2">
  {head2('How it works', 'Three simple&nbsp;steps', '', 'm2')}
  {steps(CALL_STEPS)}
</section>
<section class="sec alt" aria-labelledby="m3">
  <div class="media">
    <div class="pic rise"><img src="{IMG['field']}" alt="Stagecoach clinicians working an overnight field operation" loading="lazy"></div>
    <div class="txt">
      <p class="eyebrow rise">Want us with you?</p>
      <h2 id="m3" class="split">Great care, right by your&nbsp;side.</h2>
      <p class="rise">You don’t have to wait for an emergency. We can place experienced emergency clinicians with you: at home, at work, or when you travel.</p>
      <ul class="chips rise"><li>A known health condition?</li><li>Need privacy and fast care?</li><li>A sick kid while your partner is away?</li></ul>
      <p class="rise"><strong>Real help is on the way. Because your response time&nbsp;matters.</strong></p>
    </div>
  </div>
</section>
<section class="sec" aria-labelledby="m4">
  {head2('The value', 'You already pay for the&nbsp;upgrade.', 'First class seats. A car service. A concierge. You pay for time, comfort and control. Your health deserves the same. The best time to join is before you need us.', 'm4')}
</section>
<section class="sec alt" id="tiers" aria-labelledby="m5">
  {head2('Ways to join', 'Pick your&nbsp;membership', '', 'm5')}
  <ul class="tiers">
    <li class="rise">{icon("users")}<h3>Individual</h3><p>One person. Full 24/7 access to our team: the call, the advice, and the visit.</p></li>
    <li class="rise">{icon("home")}<h3>Family</h3><p>Your whole household, adults and kids, including Stagecoach Kids.</p></li>
    <li class="rise">{icon("briefcase")}<h3>Employer</h3><p>Seats for your team and staff. Retainers and standby too.</p></li>
    <li class="rise">{icon("shield")}<h3>Executive &amp; VIP</h3><p>Private executive medicine that works with your security team.</p></li>
  </ul>
  <p class="note rise">Membership is small on purpose, so every member gets our best. Not a member? You can still book care, paid out of&nbsp;pocket.</p>
</section>
{JOIN}
<section class="sec" aria-labelledby="m6">
  {head2('Not an individual or family?', 'We partner with groups,&nbsp;too.', 'For teams that need emergency care they can’t staff on their own.', 'm6')}
  {cards([('Pediatricians', 'We extend your practice after hours, working with you and under our medical direction.', '', 'child'),
          ('Doctors’ offices', 'Emergency advice and visits after hours, between your office and the ER.', '', 'stetho'),
          ('Cities and agencies', 'A nurse triage line run by emergency clinicians, to cut unneeded 911 calls.', '', 'building'),
          ('Companies', 'Doctor oversight and plans for your team, program or event.', '', 'briefcase')], 4)}
  <a class="more-link rise" href="partners.html">Partner with us <span aria-hidden="true">→</span></a>
</section>
''')

PAGES['events.html'] = ('Events | Stagecoach Concierge Emergency Medical Services', 'Medical coverage led by doctors for galas, productions, conferences and big crowds in Washington, DC.',
hero('Events', 'A medical team at your&nbsp;event.', 'Coverage led by doctors for galas, film sets, conferences and big crowds. Ready to act, and dressed for the&nbsp;room.',
     f'<a class="btn btn-paper" href="mailto:{EMAIL}?subject=Event%20coverage">Plan your event <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-outline" href="{TEL}">Call {PHONE}</a>', IMG['field'], 'Stagecoach clinicians at an overnight field operation') +
f'''<section class="sec" aria-labelledby="e1">
  {head2('Who we cover', 'Every kind of&nbsp;event', '', 'e1')}
  {cards([('Galas and private events', 'Quiet clinicians on site, dressed for the room, ready to act without spoiling the evening.', '', 'star'),
          ('Film, TV and campaigns', 'Medical coverage for cast, crew and leaders, on location and on schedule.', '', 'spark'),
          ('Conferences and big crowds', 'Basic and advanced life support, planning and on site care for crowds of any size.', '', 'users')])}
</section>
<section class="sec alt" aria-labelledby="e2">
  {head2('What’s included', 'Everything your event&nbsp;needs', '', 'e2')}
  {checks(['EMTs, paramedics, nurses, PAs, NPs and doctors on standby.', 'Oversight from a triple board certified doctor.', 'A medical plan, site visit and emergency plan before the event.', 'On site care, so fewer guests need 911.', 'We work with your venue, your security and local EMS.', 'Critical care transport and hospital help if needed.'])}
</section>
<section class="sec clients" aria-labelledby="e3">
  <div class="c-head"><p class="eyebrow rise">Previous event clients include</p><h2 id="e3" class="split">Clients we’ve&nbsp;covered</h2></div>
  {LOGOS}
</section>
''' + band('Planning an&nbsp;event?', 'Tell us the place, the dates and how many guests. We’ll build the right plan and team.',
           f'<a class="btn btn-paper" href="mailto:{EMAIL}?subject=Event%20coverage">Plan your event <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-outline" href="{TEL}">Call {PHONE}</a>'))

PAGES['kids.html'] = ('Stagecoach Kids | Stagecoach Concierge Emergency Medical Services', 'Help for your child at home, day or night, with a pediatric ER doctor on call.',
hero('Stagecoach Kids', 'Help for your child, right at&nbsp;home.', 'The right care. Right when you need it. Right where your child feels&nbsp;safest.',
     BTN_CALL + LINK_JOIN, IMG['kids3'], 'A child smiling with a caregiver at the bedside') +
f'''<section class="sec dark" aria-labelledby="k1" style="padding-top:0">
  {head2('Picture this', 'It’s 2 a.m.', '', 'k1')}
  <ol class="story">
    <li class="rise"><span>1</span>Your daughter wakes up with a barking cough. It sounds like&nbsp;croup.</li>
    <li class="rise"><span>2</span>Your partner is away. Your son is asleep. You can’t take two kids to the ER, and 911 feels like too&nbsp;much.</li>
    <li class="rise"><span>3</span>So you sit on the bathroom floor with the shower running. And you&nbsp;wait.</li>
    <li class="rise turn"><span>4</span>Or you call Stagecoach. A pediatric team comes to your door with medicine. A children’s ER doctor is on the&nbsp;line.</li>
    <li class="rise turn"><span>5</span>Your daughter is treated in her own bed. Your son never wakes up. In the morning, your pediatrician has the full&nbsp;report.</li>
  </ol>
</section>
<section class="sec" aria-labelledby="k2">
  {head2('What changes', 'What that night looks like&nbsp;now', '', 'k2')}
  {checks(['You call us. No phone tree, no hold music.', 'A children’s ER doctor guides care from the first minute.', 'Our team comes to you, day or night.', 'Treatment at home when it’s safe. A fast path to the right ER when it isn’t.', 'Your pediatrician gets the handoff.'])}
</section>
<section class="sec alt" aria-labelledby="k3">
  {statement('After hours', 'When the pediatrician is closed, most families are left with 911 or the&nbsp;ER.', 'Late at night there is often nowhere else to go. We fill that gap, any hour, with a children’s ER doctor on the line.', '', 'k3')}
</section>
<section class="sec" aria-labelledby="k4">
  {head2('How it works', 'Three simple&nbsp;steps', '', 'k4')}
  {steps([('You call.', 'A real person answers, day or night. No phone tree, no waiting for a call back.'),
          ('We come to you.', 'A clinician checks your child at home, where they feel most comfortable.'),
          ('We see it through.', 'Treatment at home when it’s safe, a trip to the hospital when it isn’t, and a note to your pediatrician either way.')])}
</section>
<section class="sec alt" aria-labelledby="k5">
  {head2('Working with your pediatrician', 'We work with your child’s doctor, not instead of&nbsp;them.', '', 'k5')}
  {cards([('Alongside your doctor', 'We extend your pediatrician’s office into your home after hours. Your child’s story doesn’t start over.', '', 'handshake'),
          ('Led by kids’ ER experts', 'Care is directed by our own pediatric and pediatric ER doctors and trained in the ER nurses.', '', 'child'),
          ('A full report back', 'Everything we find and do goes to your pediatrician, so the follow up picks up where we left off.', '', 'file')])}
</section>
{JOIN}
''')

PAGES['team.html'] = ('Our Team | Stagecoach Concierge Emergency Medical Services', 'Meet the founders and clinical leaders of Stagecoach Concierge Emergency Medical Services in Washington, DC.',
hero('Our team', 'Who we&nbsp;are.', 'The people of Stagecoach Concierge Emergency Medical Services: doctors, nurses, paramedics and leaders with one belief. Not every urgent problem needs the&nbsp;ER.') +
f'''<section class="sec" aria-labelledby="t0">
  {head2('Our belief', 'Emergency medicine, built around&nbsp;you.', 'We built a better option. We bring great care to you, treat more where you are, and help you get to the right place when you need more. Expert, kind and private.', 't0')}
</section>
<section class="sec" id="leaders" aria-labelledby="t1" style="padding-top:0">
  <div class="t-group">
    <h3 id="t1">Co-founders</h3>
    {people(['noah', 'david', 'waleed', 'scott'], 'four', True)}
  </div>
  <div class="t-group">
    <h3>Leadership</h3>
    {people(['liza', 'ameen', 'gupi', 'yaffa', 'eve', 'charles'], 'three', True)}
  </div>
</section>
''' + band('Want to join&nbsp;them?', 'We’re hiring our first clinical team in Washington, DC.', '<a class="btn btn-paper" href="careers.html">See open roles <span class="arr" aria-hidden="true">→</span></a>' + LINK_CONTACT))

INTERN_COMMON = '''<h4>Pay and credit</h4><p>This internship is unpaid by Stagecoach Concierge Emergency Medical Services and is built for academic credit. You may get a stipend, grant, scholarship, work study or other funding from your school or another approved source. We’ll help with any paperwork your school or funder needs.</p>'''
APPLY = f'''<h4>How to apply</h4><p>Email <a href="mailto:{EMAIL}">{EMAIL}</a> with:</p><ul><li>Your résumé</li><li>A short note on why you’re interested</li><li>Your program and expected graduation date</li><li>Any EMS or healthcare experience</li><li>Your school credit or funding needs</li><li>When you’re available</li></ul>'''

PAGES['careers.html'] = ('Join Us | Stagecoach Concierge Emergency Medical Services', 'Careers at Stagecoach Concierge Emergency Medical Services in Washington, DC: doctors, nurses, paramedics, EMTs, NPs, PAs, dispatch and operations, plus academic credit internships.',
hero('Join us', 'Help us build something&nbsp;new.', 'Stagecoach Concierge Emergency Medical Services is a practice led by doctors launching in Washington, DC. We’re hiring our first clinical&nbsp;team.',
     f'<a class="btn btn-paper" href="mailto:{EMAIL}?subject=Careers%20at%20Stagecoach">Email your CV <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-outline" href="#internships">Internships</a>') +
f'''<section class="sec" aria-labelledby="c1">
  {head2('Who we look for', 'Great medicine is just the&nbsp;start.', 'We want kind, calm and discreet people who notice what a patient needs before they ask. How care feels matters as much as the care itself.', 'c1')}
</section>
<section class="sec alt" aria-labelledby="c2">
  {head2('Roles we hire', 'Open&nbsp;roles', '', 'c2')}
  {cards([('Doctors', 'ER and critical care doctors for on the scene care and telehealth triage.', '', 'stetho'),
          ('Registered nurses', 'trained in the ER nurses for home visits, treatment and follow up.', '', 'heart-pulse'),
          ('Paramedics and EMTs', 'Field crews for urgent care, critical care transport and event standby.', '', 'truck'),
          ('Nurse practitioners and PAs', 'For home visits, on site lab work and ongoing care.', '', 'flask'),
          ('Dispatch and operations center', 'The first voice a member hears, any hour.', '', 'dispatch'),
          ('Management and operations', 'Vehicles, schedules, supplies and member experience behind every visit.', '', 'wrench')])}
</section>
<section class="sec" aria-labelledby="c3">
  {statement('Why Stagecoach', 'Time with each patient. The right equipment. Care in the patient’s own&nbsp;space.', 'We’re launching now, with leaders who ran medicine and communications for DC Fire & EMS. Our first team shapes our protocols, our culture and our standard of care.', '', 'c3')}
</section>
<section class="sec alt" id="internships" aria-labelledby="c4">
  {head2('Internships', 'Internships for academic credit in&nbsp;DC', 'For students in medical and health programs. Hybrid, about 10 to 15 hours a week, with regular supervision and a real semester project. At our Georgetown office, 3299 K St NW #210.', 'c4')}
  <details class="fold rise" id="medical-operations"><summary><div><h3>Medical Operations Intern</h3><p>Help build and run a new medical service, with our CEO and operations team.</p></div><i aria-hidden="true">+</i></summary>
    <div class="fold-body">
      <dl class="facts"><dt>Where</dt><dd>Georgetown office, hybrid, with some in person work</dd><dt>Time</dt><dd>About 10 to 15 hours a week</dd><dt>Term</dt><dd>Semester and dates to be confirmed</dd><dt>Reports to</dt><dd>CEO and operations leaders</dd></dl>
      {INTERN_COMMON}
      <h4>What you’ll do</h4><ul><li>Help build operations and office workflows</li><li>Help plan concierge, mobile, executive and event services</li><li>Check equipment, medicine, vehicles and supplies</li><li>Track inventory and research equipment and vendors</li><li>Help with staffing, schedules, credentials and logistics</li><li>Write checklists, procedures and training materials</li><li>Research care models, rules, competitors and partners</li><li>Support event medical plans and reviews afterward</li><li>Organize information on clients, vendors and partners</li><li>Make presentations, proposals and reports</li><li>Join operations and leadership meetings</li><li>Finish a semester project and present it to leadership</li></ul>
      <h4>What you’ll learn</h4><ul><li>How a mobile medical service led by doctors runs</li><li>What concierge, mobile and event care need to work</li><li>Readiness, logistics and quality checks</li><li>How to write clear plans, procedures and briefings</li><li>How medicine, operations, rules and business fit together</li><li>How to work well with doctors and leaders</li><li>How to study a problem and suggest real fixes</li></ul>
      <h4>Who should apply</h4><ul><li>Students in a medical or health program, such as medicine, nursing, PA studies, paramedicine, EMS, public health or healthcare administration</li><li>EMS experience preferred</li><li>EMT, AEMT, paramedic, nursing assistant or other certification preferred, not required</li><li>Strong organizing, research, writing and communication skills</li><li>Good judgment, reliable and careful with details</li><li>Can work on your own and meet deadlines</li><li>Can keep things private and follow privacy rules</li><li>Comfortable with Microsoft Office or Google Workspace</li><li>A driver’s license is a plus</li></ul>
      <p>This is an educational role. Interns don’t give unsupervised patient care or medical advice, or do anything beyond a license they already hold. We’ll work with your school on goals, supervision and paperwork. You’re responsible for getting credit approved before you start. The internship doesn’t promise a future job.</p>
      {APPLY}
      <p><a class="btn btn-dark" href="mailto:{EMAIL}?subject=Medical%20Operations%20Intern">Apply for this internship <span class="arr" aria-hidden="true">→</span></a></p>
    </div>
  </details>
  <details class="fold rise" id="medical-director"><summary><div><h3>Office of the Medical Director Intern</h3><p>Research, protocols and quality work with our Medical Director.</p></div><i aria-hidden="true">+</i></summary>
    <div class="fold-body">
      <dl class="facts"><dt>Where</dt><dd>Georgetown office, hybrid, with possible in person observation</dd><dt>Time</dt><dd>About 10 to 15 hours a week</dd><dt>Term</dt><dd>Semester and dates to be confirmed</dd><dt>Reports to</dt><dd>Medical Director and clinical leaders</dd></dl>
      {INTERN_COMMON}
      <h4>What you’ll do</h4><ul><li>Review research on emergency medicine, EMS and mobile and concierge care</li><li>Research best practices and professional guidelines</li><li>Help draft clinical protocols, policies and checklists</li><li>Support quality, patient safety and clinical oversight work</li><li>Help build performance measures, audits and case reviews</li><li>Look at anonymous data for trends and fixes</li><li>Help with training, skills sessions and simulations</li><li>Research medicines, equipment, lab tools and new tech</li><li>Help set clinical standards for concierge, mobile, executive and event care</li><li>Join clinical meetings, case talks and reviews</li><li>Observe some training or care, when the law, our policies and the patient allow it</li><li>Finish a research or quality project and present it to the Medical Director</li></ul>
      <h4>Possible projects</h4><ul><li>Review the evidence for a new protocol</li><li>Build a quality plan for mobile medical care</li><li>Create a training or simulation exercise</li><li>Set standards for equipment and medicine readiness</li><li>Research best practice for event or executive care</li><li>Design ways to measure results for a new program</li><li>Study patient safety in concierge and mobile medicine</li></ul>
      <h4>What you’ll learn</h4><ul><li>What a medical director does</li><li>How protocols are researched, written, approved and checked</li><li>How to use research to answer a real question</li><li>The basics of oversight, patient safety and quality</li><li>How care, rules, operations and admin connect</li><li>How to explain medical ideas to any audience</li><li>How to present a project to clinical leaders</li></ul>
      <h4>Who should apply</h4><ul><li>Students in a medical or health program, such as medicine, nursing, PA studies, paramedicine, EMS, public health or clinical research</li><li>EMS experience preferred</li><li>EMT, AEMT, paramedic, nursing assistant or other certification preferred, not required</li><li>Strong research, analysis, writing and organizing skills</li><li>Can understand and sum up medical information</li><li>Good judgment, reliable and careful with details</li><li>Can keep things private and follow privacy rules</li><li>Comfortable with Microsoft Office or Google Workspace</li></ul>
      <p>This is an educational role. Interns don’t diagnose, treat, give medical advice, give medicine, or do anything that needs a license unless separately credentialed, allowed and supervised. You may need to complete privacy (HIPAA), infection control and safety training. Patient information is limited to what the law allows and the work needs, and we use anonymous data whenever we can. The internship doesn’t promise admission to a program or a future job.</p>
      {APPLY.replace('A short note on why you’re interested', 'A short note on why you’re interested in the Office of the Medical Director')}
      <p><a class="btn btn-dark" href="mailto:{EMAIL}?subject=Office%20of%20the%20Medical%20Director%20Intern">Apply for this internship <span class="arr" aria-hidden="true">→</span></a></p>
    </div>
  </details>
  <p class="note rise">Stagecoach Concierge Emergency Medical Services is an equal opportunity organization. We consider qualified applicants without regard to any status protected by law.</p>
</section>
''' + band('Send us your&nbsp;CV.', 'We’re building our first team now. Email your CV, licenses and certifications, and tell us the role you want. We read every one.',
           f'<a class="btn btn-paper" href="mailto:{EMAIL}?subject=Careers%20at%20Stagecoach">Email us <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-outline" href="team.html">Meet the team</a>'))

PAGES['partners.html'] = ('Partners | Stagecoach Concierge Emergency Medical Services', 'Partner with Stagecoach Concierge Emergency Medical Services: triage lines, medical direction, executive medicine, hotel and embassy coverage, and event medicine in Washington, DC.',
hero('Partners', 'Emergency care for the people you look&nbsp;after.', 'We work with cities, EMS agencies, doctors, employers, hotels, embassies and event&nbsp;producers.',
     f'<a class="btn btn-paper" href="mailto:{EMAIL}?subject=Partnership">Start a conversation <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-outline" href="membership.html">For individuals and families</a>') +
f'''<section class="sec" aria-labelledby="p1">
  {head2('Who we work with', 'How we can&nbsp;help', '', 'p1')}
  {cards([('Cities and government', 'A 24/7 triage line run by emergency clinicians. Callers who don’t need an ambulance get the right care, and 911 crews stay free for the calls that do.', '', 'building'),
          ('EMS agencies and doctors', 'Medical direction and EMS consulting: protocols, credentialing and quality review, led by a former Medical Director of DC Fire & EMS.', '', 'stetho'),
          ('Companies and leaders', 'Private executive medicine and care that works with your security team, with retainers and seats for staff. Includes blood products for high risk clients.', '', 'briefcase'),
          ('Hotels', 'A team led by doctors on call for your guests, with five star discretion.', '', 'map-pin'),
          ('Events and productions', 'Medical teams for galas, sets, campaigns and big crowds.', '<a class="more" href="events.html">About events →</a>', 'calendar'),
          ('Embassies and institutions', 'Dedicated, discreet emergency coverage on contract.', '', 'globe')])}
</section>
''' + band('Let’s&nbsp;talk.', 'Tell us who you look after and what you need. A real person will reply.',
           f'<a class="btn btn-paper" href="mailto:{EMAIL}?subject=Partnership">Email our team <span class="arr" aria-hidden="true">→</span></a><a class="btn btn-outline" href="{TEL}">Call {PHONE}</a>'))

PAGES['contact.html'] = ('Contact | Stagecoach Concierge Emergency Medical Services', 'Call Stagecoach Concierge Emergency Medical Services 24/7 or email our team in Washington, DC.',
hero('Contact', 'Talk to&nbsp;us.', 'Call or email. A clinician answers the phone, day or&nbsp;night.') +
f'''<section class="sec" aria-labelledby="ct1">
  <ul class="cards" style="--cols:2">
    <li class="card rise"><span class="tag">Call 24/7</span><h2 id="ct1" class="h3"><a href="{TEL}" style="text-decoration:none;font-size:clamp(32px,3.6vw,56px);letter-spacing:-.03em">{PHONE}</a></h2><p>A clinician answers. If it’s life-threatening, call 911 right away.</p><p><a class="mail" href="mailto:{EMAIL}">{EMAIL}</a><br>3299 K St NW #210, Washington, DC 20007</p></li>
    <li class="card rise"><span class="tag">Questions</span><h2 class="h3">Email our team</h2><p>Tell us what you need: membership, event coverage or a partnership. A real person will write back.</p><p><a class="btn btn-dark" href="mailto:{EMAIL}">Email us <span class="arr" aria-hidden="true">→</span></a></p><p style="font-size:15px">Please don’t send medical details by email. For anything urgent, call <a href="{TEL}">{PHONE}</a>.</p></li>
  </ul>
</section>
{JOIN}
''')


PAGES['404.html'] = ('Page Not Found | Stagecoach Concierge Emergency Medical Services', 'This page does not exist. Find Stagecoach services, membership or our 24/7 number.',
hero('Error 404', 'This Page Isn’t&nbsp;Here.', 'The link may be old or mistyped. Everything else is one tap away, and our line is open around the&nbsp;clock.',
     '<a class="btn btn-paper" href="index.html">Go to the home page <span class="arr" aria-hidden="true">→</span></a>' + f'<a class="btn btn-outline" href="{TEL}">Call {PHONE}</a>') +
'''<section class="sec" aria-labelledby="nf1">
  <div class="sec-head"><p class="eyebrow rise">Popular pages</p><h2 id="nf1" class="split">Where to&nbsp;Next</h2></div>
  ''' + cards([('Services', 'Emergency care, private medicine and dental, 24/7.', '<a class="more" href="services.html">See services →</a>', 'heart-pulse'),
          ('Membership', 'Join the waitlist for 24/7 access for your household.', '<a class="more" href="membership.html">About membership →</a>', 'home'),
          ('Contact', 'Call or email. A real person answers.', '<a class="more" href="contact.html">Contact us →</a>', 'phone')]) + '''
  <p class="note rise">In a life-threatening emergency, call 911.</p>
</section>
''')


def no_widows(html):
    """Join the last two words of every heading, paragraph and caption with a no-break space,
    so no line ends with a single word on its own. Skips text that already ends bound."""
    def fix(m):
        tag, attrs, inner = m.group(1), m.group(2) or '', m.group(3)
        if '<p' in inner or '<div' in inner or '<ul' in inner or '<br' in inner:
            return m.group(0)
        tail = re.sub(r'<[^>]+>', '', inner)[-24:]
        if '&nbsp;' in tail or '\u00a0' in tail:
            return m.group(0)
        depth, last = 0, -1
        for i, ch in enumerate(inner):
            if ch == '<':
                depth += 1
            elif ch == '>':
                depth -= 1
            elif ch == ' ' and depth == 0 and inner[i + 1:].strip():
                last = i
        if last < 0:
            return m.group(0)
        return f'<{tag}{attrs}>{inner[:last]}&nbsp;{inner[last + 1:]}</{tag}>'
    return re.sub(r'<(h1|h2|h3|h4|p|figcaption|dd)(\s[^>]*)?>(.*?)</\1>', fix, html, flags=re.S)


def build():
    intro = open(os.path.join(SRC, 'intro.html')).read().replace('{{S}}', S)
    home = (open(os.path.join(SRC, 'home.html')).read()
            .replace('{{S}}', S).replace('{{B}}', B).replace('{{JOIN}}', JOIN)
            .replace('{{COFOUNDERS}}', COFOUNDERS).replace('{{LOGOS}}', LOGOS))
    home = re.sub(r'\{\{ICON:([a-z-]+)\}\}', lambda m: f'<span class="ic-wrap">{icon(m.group(1))}</span>', home)
    pages = {'index.html': ('Stagecoach Concierge Emergency Medical Services | Emergency Care That Comes to You',
                            'A team led by doctors that comes to your home, office or event in Washington, DC, 24/7. Not a substitute for 911.',
                            home, intro)}
    for name, (title, desc, body) in PAGES.items():
        pages[name] = (title, desc, body, '')
    for name, (title, desc, body, pre) in pages.items():
        has_join = 'id="join"' in body
        html = no_widows(title_case_headings(head(title, desc, name) + pre + (header(name, has_join).replace('hdr on-dark', 'hdr') if name == 'index.html' else header(name, has_join)) + '\n<main id="main" tabindex="-1">\n' + body + '\n</main>\n\n' + FOOTER.replace('{JOINHREF}', '#join' if has_join else 'membership.html#join')))
        if name == '404.html':  # never indexed, never canonical
            html = re.sub(r'<link rel="canonical"[^>]*>\n', '<meta name="robots" content="noindex">\n', html)
            html = re.sub(r'<meta property="og:url"[^>]*>\n', '', html)
        open(os.path.join(ROOT, name), 'w').write(html)
        print('wrote', name, len(html) // 1024, 'KB')


if __name__ == '__main__':
    build()
