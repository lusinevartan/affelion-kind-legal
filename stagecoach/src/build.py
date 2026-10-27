"""Builds the Stagecoach site: shared head, header, footer and blocks, one file per page.

Run from the stagecoach/ folder:  python3 src/build.py
Edit copy here (inside pages) or in src/home.html (home), never in the generated .html files.
"""
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
S = open(os.path.join(SRC, 's-path.txt')).read().strip()
B = 'https://stagecoachmedical.com/__l5e/assets-v1/'
IMG = {
    'kids3': B + 'd69fe3ed-2b99-4dd4-8527-f7204c29ae31/stagecoach-kids-3.jpg',
    'kids2': B + '48a8e1f1-a0a6-43e8-8552-5d478a5e7539/stagecoach-kids-2.png',
    'field': B + '4e83799b-d5a1-43d0-9ba3-8f9d9aad5a64/team-field.jpg',
    'fleet': B + 'c641f78a-cbf0-4b65-9ca2-aa0f0a64ad36/fleet.png',
}
PHONE = '202.839.9439'
TEL = 'tel:+12028399439'
EMAIL = 'medical@thestagecoachgroup.com'

NAV = [('services.html', 'Services'), ('membership.html', 'Membership'), ('events.html', 'Events'),
       ('kids.html', 'Stagecoach Kids'), ('team.html', 'Team'), ('contact.html', 'Contact')]


def head(title, desc):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#1E2A3E">
<link rel="icon" href="assets/favicon-32.png" sizes="32x32">
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


def header(current):
    links = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if h == current else ""}>{t}</a>' for h, t in NAV)
    sheet = ''.join(f'<a href="{h}">{t}</a>' for h, t in [('index.html', 'Home')] + NAV + [('careers.html', 'Join us'), ('partners.html', 'Partners')])
    return f'''<header class="hdr on-dark" id="hdr">
  <div class="hdr-in">
    <a class="brand" href="index.html" aria-label="Stagecoach, home"><span class="wm">STAGECOACH</span></a>
    <nav class="nav" aria-label="Primary">{links}</nav>
    <div style="display:flex;align-items:center;gap:20px">
      <a class="call-link pill-call" href="{TEL}" data-cur="Call"><span class="pulse" aria-hidden="true"></span><span class="num"><span class="lbl">24/7 · </span>{PHONE}</span><span class="short">Call 24/7</span></a>
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
  <div class="foot-brand"><span class="wm">STAGECOACH</span><span class="tag">Concierge Emergency Medical Services</span><span>White-glove care, emergency-ready, wherever you are. Doctor-led and based in Washington,&nbsp;DC.</span></div>
  <nav aria-label="Explore"><strong>Explore</strong><a href="services.html">Services</a><a href="membership.html">Membership</a><a href="events.html">Events</a><a href="kids.html">Stagecoach Kids</a><a href="team.html">Team</a></nav>
  <nav aria-label="Company"><strong>Company</strong><a href="careers.html">Join us</a><a href="careers.html#internships">Internships</a><a href="partners.html">Partners</a><a href="contact.html">Contact</a></nav>
  <div><strong>Reach us</strong><br><a href="{TEL}">{PHONE}</a>, 24/7<br><a href="mailto:{EMAIL}">{EMAIL}</a><br>3299 K St NW #210<br>Washington, DC 20007</div>
  <div class="fine"><span>© 2026 Stagecoach Concierge EMS PC. Not a substitute for 911. In a life-threatening emergency, call 911.</span><span>Stagecoach Concierge EMS PC is pending EMS Agency approval by the District of&nbsp;Columbia.</span></div>
</footer>
<script src="assets/site.js"></script>
</body>
</html>
'''

JOIN = f'''<!-- JOIN: membership waitlist -->
<section class="sec join" id="join" aria-labelledby="join-h">
  <div class="join-in">
    <div>
      <p class="eyebrow rise">Membership · Launching soon</p>
      <h2 id="join-h" class="split">Join the&nbsp;waitlist.</h2>
      <p class="lead rise">Membership is small on purpose, so every member gets our best. Add your email to hear first when spots&nbsp;open.</p>
    </div>
    <form id="join-form" class="rise" novalidate data-endpoint="">
      <label for="join-email">Email address</label>
      <div class="field">
        <input id="join-email" name="email" type="email" autocomplete="email" inputmode="email" required placeholder="name@example.com" aria-describedby="join-msg join-fine">
        <button class="btn btn-dark" type="submit">Join the waitlist <span class="arr" aria-hidden="true">→</span></button>
      </div>
      <fieldset class="chips-in"><legend>I’m interested in (optional)</legend>
        <label><input type="checkbox" name="interest" value="individual"><span>Just me</span></label>
        <label><input type="checkbox" name="interest" value="family"><span>My family</span></label>
        <label><input type="checkbox" name="interest" value="kids"><span>My kids</span></label>
        <label><input type="checkbox" name="interest" value="executive"><span>Executive care</span></label>
        <label><input type="checkbox" name="interest" value="employer"><span>My company</span></label>
        <label><input type="checkbox" name="interest" value="events"><span>Events</span></label>
      </fieldset>
      <label class="hp" aria-hidden="true">Company<input name="company" tabindex="-1" autocomplete="off"></label>
      <p class="msg" id="join-msg" role="status" aria-live="polite"></p>
      <p class="fine" id="join-fine">News only. Unsubscribe anytime. To get care now, call {PHONE}. Not a substitute for&nbsp;911.</p>
    </form>
  </div>
</section>'''

LOGOS = '''<ul class="logos">
''' + ''.join(f'      <li><span class="logo" role="img" aria-label="{n}" style="-webkit-mask-image:url(assets/clients/{u});mask-image:url(assets/clients/{u});--w:{w};--h:{h}"></span></li>\n' for n, u, w, h in [
    ('Meta', 'meta.svg', '70%', '44%'), ('Google', 'google.svg', '60%', '46%'), ('J.P. Morgan', 'jpmorgan.svg', '72%', '44%'),
    ('The Atlantic', 'atlantic.svg', '64%', '76%'), ('Emerson Collective', 'emerson.png', '68%', '50%'), ('YPO', 'ypo.png', '56%', '48%'),
    ('Edens', 'edens.png', '58%', '58%'), ('Hargrove', 'hargrove.svg', '70%', '54%')]) + \
    '      <li><span class="wordlogo">Union Market</span></li>\n      <li><span class="wordlogo">Autoshop</span></li>\n  </ul>'

TEAM = {
    'noah': ('Noah Gray, EMT', 'Co-Founder & CEO', 'Former Chief Communications Officer, DC Fire & EMS. Volunteer EMT.',
             'Former Chief Communications Officer for DC Fire & EMS, volunteer EMT with Montgomery County, Maryland, and White House producer for CNN. UVA Darden MBA candidate.',
             B + '46556dab-0929-47be-a3df-644ae030b889/noah-gray.jpg', 'center 18%'),
    'david': ('Dr. David Vitberg, MD', 'Co-Founder & Chief Medical Officer', 'Triple board-certified ER and critical care doctor. Former Medical Director, DC Fire & EMS.',
              'Triple board-certified emergency and critical care physician and former Medical Director of DC Fire & EMS, where he built its prehospital whole blood program. Practices in the MedStar and Johns Hopkins systems.',
              B + '23074c25-8945-4654-89e2-a5d66747596d/david-vitberg.jpg', 'center 18%'),
    'waleed': ('Waleed Haleem, PMP', 'Co-Founder & Chief Operating Officer', 'Ten years running hospital operations, including VIP care at Walter Reed.',
               'Ten years of executive experience in hospital operations, program and project management, IT, and VIP care delivery at Walter Reed; now focused on leading teams and keeping complex operations moving. UVA Darden MBA candidate.',
               B + '55a82406-f357-4506-ad40-94aba5f09a61/waleed-haleem.jpg', 'center 18%'),
    'scott': ('Scott Sehon, MBA', 'Co-Founder & Chief Financial Officer', 'Finance leader who helped grow Social Tables to a $100M sale to Cvent.',
              'Led finance at Crystal Clear Technologies from pre-revenue to No. 5 on the 2011 Inc. 500, then directed finance at Social Tables through 5× ARR growth, a $13M Series B, and a $100M acquisition by Cvent.',
              B + '87df245f-32bf-40c8-8ce7-d63d97e188ee/scott-sehon.jpg', 'center 18%'),
    'liza': ('Liza White', 'VP of Strategy & Partnerships', 'Runs White32 Dental. Former communications director to Secretary of State Madeleine Albright.',
             'Owner and manager of White32 Dental, and former Director of Communications to U.S. Secretary of State Madeleine Albright. Former Chief of Staff at Subversive Capital and communications lead for the CEO of Ralph Lauren.',
             B + '50a5a59b-7571-4946-bd3e-435c424e393c/liza-white.jpg', 'center 20%'),
    'ameen': ('Ameen Elhamdani, NRP', 'EMS Operations Manager', 'Runs our crews, vehicles and schedules, so a team is ready the moment you call.',
              'Leads day-to-day EMS operations, crews, vehicles, scheduling, and readiness, so a Stagecoach team is staffed, equipped, and moving the moment a call comes in.',
              B + '030ff342-e677-42cc-b973-cd8f8a0aa136/ameen-elhamdani-new.png', 'center 20%'),
    'gupi': ('Gupi D. Howie, PA-C', 'Director of Advanced Practice Providers', 'Leads our PAs and nurse practitioners, so every visit meets the same high bar.',
             'Leads our advanced practice providers, hiring, credentialing, and clinical standards, so every physician assistant and nurse practitioner on a Stagecoach response meets the same bar.',
             B + '4825dfa2-7531-43d7-b0b5-bee26c6d4e36/gurpreet-howie.jpg', 'center 25%'),
    'yaffa': ('Dr. Yaffa Vitberg, MD', 'Pediatric Medical Director', 'Board-certified children’s ER doctor at Weill Cornell Medicine / NewYork-Presbyterian.',
              'Board certified in Pediatrics and Pediatric Emergency Medicine, she is an Assistant Professor of Clinical Emergency Medicine and Pediatrics and a pediatric emergency medicine physician at Weill Cornell Medicine/NewYork-Presbyterian in New York City. She is an accomplished clinician, educator, and leader with a strong commitment to medical education, mentorship, and advancing pediatric emergency care.',
              B + '169d521d-b66a-4801-92e8-874686895a91/yaffa-vitberg-new.png', 'center 8%'),
    'eve': ('Eve Hill, RN, NRP', 'Quality Improvement Officer', 'Nurse and paramedic at the R Adams Cowley Shock Trauma Center.',
            'Registered nurse and nationally registered paramedic in the Multi-Trauma Critical Care Unit at R Adams Cowley Shock Trauma Center, formerly in intensive care at MedStar Washington Hospital Center. Eight years in a 911-based EMS system, progressing from EMT to paramedic in charge and field training officer.',
            B + 'b58255d0-f619-4df1-adee-19316900f229/eve-hill.png', 'center 20%'),
    'charles': ('Dr. Charles White, DDS', 'Emergency Dental Response Partner', 'Founder and lead dentist at White32 Dental, our dental partner.',
                'Founder and Principal Dentist at White32 Dental, Stagecoach’s emergency dental response partner. He completed his undergraduate and dental education at UNC Chapel Hill, followed by a clinical residency at the VA Medical Center in Washington, DC.',
                B + '011c9f57-8350-44ea-8455-af4bdbb27207/charles-white.jpeg', 'center 6%'),
}


def person(key, full=False):
    name, role, short, bio, img, pos = TEAM[key]
    first = name.split(',')[0]
    more = f'<details class="bio-more"><summary>Read more</summary><p>{bio}</p></details>' if full else ''
    return f'''      <li><figure>
        <div class="portrait" tabindex="0" role="button" aria-label="Show {first} in colour"><img src="{img}" alt="{first}" loading="lazy" style="object-position:{pos}"></div>
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
  {SYM}
  {copy}
  {pic}
</section>
'''


def head2(eyebrow, h2, p='', id_=''):
    return f'''<div class="sec-head"><p class="eyebrow rise">{eyebrow}</p><h2{f' id="{id_}"' if id_ else ''} class="split">{h2}</h2>{f'<p class="rise">{p}</p>' if p else ''}</div>'''


def cards(items, cols=3):
    out = f'<ul class="cards" style="--cols:{cols}">\n'
    for it in items:
        t, p = it[0], it[1]
        extra = it[2] if len(it) > 2 else ''
        out += f'      <li class="card rise"><h3>{t}</h3><p>{p}</p>{extra}</li>\n'
    return out + '    </ul>'


def checks(items):
    return '<ul class="checks">' + ''.join(f'<li class="rise">{i}</li>' for i in items) + '</ul>'


def steps(items):
    return '<ol class="steps3">' + ''.join(f'<li class="rise"><h3>{t}</h3><p>{p}</p></li>' for t, p in items) + '</ol>'


def band(h2, p, ctas):
    return f'''<section class="sec dark" aria-label="{h2}">
  <div class="band"><div><h2 class="split">{h2}</h2><p class="rise">{p}</p></div><div class="ctas rise">{ctas}</div></div>
</section>
'''


BTN_CALL = f'<a class="btn btn-light" href="{TEL}" data-cur="Call">Call {PHONE} <span class="arr" aria-hidden="true">→</span></a>'
LINK_JOIN = '<a class="tlink" href="#join">Join the waitlist</a>'
LINK_CONTACT = '<a class="tlink" href="contact.html">Contact us</a>'
CALL_STEPS = [('You call. A real clinician answers.', 'Call or reach us online, any time. No phone tree.'),
              ('We figure out what you need.', '911, the ER, a telehealth call, a home visit, or safe to wait. We decide together.'),
              ('If you need us, we come to you.', 'An EMT, paramedic, NP, PA, doctor or dentist comes to you. A triple board-certified doctor oversees every visit.')]

# ---------------------------------------------------------------- pages
PAGES = {}

PAGES['services.html'] = ('Services | Stagecoach', 'Emergency care, private medicine and fast help from a doctor-led team in Washington, DC, 24/7.',
hero('Services', 'What we&nbsp;do.', 'Emergency care, private medicine and fast help from a doctor-led team. Day or night, all&nbsp;year.', BTN_CALL + LINK_CONTACT) +
f'''<section class="sec" aria-labelledby="s1">
  {head2('For emergencies', 'Emergency and critical&nbsp;care', 'When something is wrong, we bring hospital-trained care to you.', 's1')}
  {cards([('Basic life support (BLS)', 'Emergency care from trained EMTs.'),
          ('Advanced life support (ALS)', 'Paramedic-level emergency care, wherever you are.'),
          ('Urgent care at your door', 'We treat you where you are, at home or on the go.'),
          ('Critical care and transport', 'ICU-level care, and a safe ride to the hospital if you need one.'),
          ('Blood products on scene', 'We can give life-saving blood before you reach a hospital.'),
          ('Emergency care for kids', 'A pediatric team for babies, kids and teens.', '<a class="more" href="kids.html">About Stagecoach Kids →</a>')])}
</section>
<section class="sec alt" id="dental" aria-labelledby="s2">
  {head2('Dental', 'Dental emergencies, 24/7', 'A cracked tooth at midnight? The ER can’t fix that. We can, with our partner White32&nbsp;Dental.', 's2')}
  {cards([('Dental visits to you', 'Emergency dental care, any hour, including visits to your home.'),
          ('Pain relief on site', 'Dental procedures and pain management where you are.'),
          ('Our partner', 'White32 Dental, led by Dr. Charles White.', '<a class="more" href="https://white32dc.com" rel="noopener">Visit white32dc.com →</a>')])}
</section>
<section class="sec" aria-labelledby="s3">
  {head2('Private care', 'Private, discreet&nbsp;medicine', 'Care that fits your life, your schedule and your privacy.', 's3')}
  {cards([('Your health plan, ready in advance', 'We build your full medical profile before you ever need us.'),
          ('Private executive medicine', 'Care for leaders, built around a busy day.'),
          ('The hospital you choose', 'If you need to go in, we take you to the hospital you want.'),
          ('Lab tests at home or on site', 'Blood work and tests without a trip to the lab.'),
          ('Help inside the hospital', 'We guide you through the hospital and speak up for you.'),
          ('Works with your security', 'Medical care that works hand in hand with executive protection.')])}
</section>
<section class="sec alt" aria-labelledby="s4">
  {head2('For groups', 'For organizations and&nbsp;agencies', '', 's4')}
  {cards([('Event medical teams', 'Coverage for galas, sets, conferences and big crowds.', '<a class="more" href="events.html">About events →</a>'),
          ('Medical direction and consulting', 'Doctor oversight and advice for EMS teams and programs.'),
          ('CPR and EMS training', 'Hands-on training for your staff.'),
          ('Nurse triage line', 'Experienced clinicians who answer and sort calls.', '<a class="more" href="partners.html">Partner with us →</a>')], 4)}
</section>
<section class="sec" aria-labelledby="s5">
  {head2('Why Stagecoach', 'What makes us&nbsp;different', '', 's5')}
  {checks(['Care from ER- and ICU-trained clinicians.', 'Life-saving blood products we can bring to you.', 'Proven steps for time-critical emergencies.', 'Medical care that works with your security team.', 'Emergency dental care the ER can’t give.', 'If you need a hospital, you choose which.'])}
</section>
''' + band('Ready when you need&nbsp;us.', 'One number for everything on this page. A clinician answers, day or night.', BTN_CALL + LINK_CONTACT))

PAGES['membership.html'] = ('Membership | Stagecoach', 'Individual, family, employer and executive membership: 24/7 access to a doctor-led emergency team in Washington, DC.',
hero('Membership · Launching soon', 'Skip the ER wait. We come to&nbsp;you.', 'Members get 24/7 access to a doctor-led emergency team for the whole family, including dental&nbsp;care.',
     '<a class="btn btn-light" href="#join">Join the waitlist <span class="arr" aria-hidden="true">→</span></a><a class="tlink" href="#tiers">See membership options</a>', IMG['kids2'], 'A parent comforting a young child') +
f'''<section class="sec dark" aria-labelledby="m1" style="padding-top:0">
  {head2('Why it matters', 'The ER is not built for&nbsp;you.', 'In DC, a trip to the ER takes hours and costs a lot. There are few beds for a very big city.', 'm1')}
  <ul class="stats">
    <li class="rise"><b>5h 14m</b><span>The average ER visit in DC. Almost twice the national average.</span></li>
    <li class="rise"><b>$2,863</b><span>The average cost of one ER visit.</span></li>
    <li class="rise"><b>350</b><span>ER beds in all of Washington, DC.</span></li>
    <li class="rise"><b>0.05%</b><span>The share of people DC’s ERs can treat at once: 694,000 residents and about 1 million people by day.</span></li>
  </ul>
  <p class="src rise">Figures from Stagecoach’s research. Sources to be added before launch.</p>
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
  {head2('The value', 'You already pay for the&nbsp;upgrade.', 'First-class seats. A car service. A concierge. You pay for time, comfort and control. Your health deserves the same. The best time to join is before you need us.', 'm4')}
</section>
<section class="sec alt" id="tiers" aria-labelledby="m5">
  {head2('Ways to join', 'Pick your&nbsp;membership', '', 'm5')}
  <ul class="tiers">
    <li class="rise"><h3>Individual</h3><p>One person. Full 24/7 access to our team: the call, the advice, and the visit.</p></li>
    <li class="rise"><h3>Family</h3><p>Your whole household, adults and kids, including Stagecoach Kids.</p></li>
    <li class="rise"><h3>Employer</h3><p>Seats for your team and staff. Retainers and standby too.</p></li>
    <li class="rise"><h3>Executive &amp; VIP</h3><p>Private executive medicine that works with your security team.</p></li>
  </ul>
  <p class="note rise">Membership is small on purpose, so every member gets our best. Not a member? You can still book care, paid out of&nbsp;pocket.</p>
</section>
{JOIN}
<section class="sec" aria-labelledby="m6">
  {head2('Not an individual or family?', 'We partner with groups,&nbsp;too.', 'For teams that need emergency care they can’t staff on their own.', 'm6')}
  {cards([('Pediatricians', 'We extend your practice after hours, working with you and under our medical direction.'),
          ('Doctors’ offices', 'Emergency advice and visits after hours, between your office and the ER.'),
          ('Cities and agencies', 'A nurse triage line run by emergency clinicians, to cut unneeded 911 calls.'),
          ('Companies', 'Doctor oversight and plans for your team, program or event.')], 4)}
  <a class="more-link rise" href="partners.html">Partner with us <span aria-hidden="true">→</span></a>
</section>
''')

PAGES['events.html'] = ('Events | Stagecoach', 'Doctor-led medical coverage for galas, productions, conferences and big crowds in Washington, DC.',
hero('Events', 'A medical team at your&nbsp;event.', 'Doctor-led coverage for galas, film sets, conferences and big crowds. Ready to act, and dressed for the&nbsp;room.',
     f'<a class="btn btn-light" href="mailto:{EMAIL}?subject=Event%20coverage">Plan your event <span class="arr" aria-hidden="true">→</span></a><a class="tlink" href="{TEL}">Call {PHONE}</a>', IMG['field'], 'Stagecoach clinicians at an overnight field operation') +
f'''<section class="sec" aria-labelledby="e1">
  {head2('Who we cover', 'Every kind of&nbsp;event', '', 'e1')}
  {cards([('Galas and private events', 'Quiet clinicians on site, dressed for the room, ready to act without spoiling the evening.'),
          ('Film, TV and campaigns', 'Medical coverage for cast, crew and leaders, on location and on schedule.'),
          ('Conferences and big crowds', 'Basic and advanced life support, planning and on-site care for crowds of any size.')])}
</section>
<section class="sec alt" aria-labelledby="e2">
  {head2('What’s included', 'Everything your event&nbsp;needs', '', 'e2')}
  {checks(['EMTs, paramedics, nurses, PAs, NPs and doctors on standby.', 'Oversight from a triple board-certified doctor.', 'A medical plan, site visit and emergency plan before the event.', 'On-site care, so fewer guests need 911.', 'We work with your venue, your security and local EMS.', 'Critical care transport and hospital help if needed.'])}
</section>
<section class="sec clients" aria-labelledby="e3">
  <div class="c-head"><p class="eyebrow rise">Previous event clients include</p><h2 id="e3" class="split">Trusted at events&nbsp;by</h2></div>
  {LOGOS}
</section>
''' + band('Planning an&nbsp;event?', 'Tell us the place, the dates and how many guests. We’ll build the right plan and team.',
           f'<a class="btn btn-light" href="mailto:{EMAIL}?subject=Event%20coverage">Plan your event <span class="arr" aria-hidden="true">→</span></a><a class="tlink" href="{TEL}">Call {PHONE}</a>'))

PAGES['kids.html'] = ('Stagecoach Kids | Stagecoach', 'Help for your child at home, day or night, with a pediatric ER doctor on call.',
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
  <div class="big-stat"><b class="rise">130,000</b><div><h2 id="k3" class="sec-head" style="margin:0 0 12px;font:500 clamp(28px,3vw,44px)/1.1 var(--sans);letter-spacing:-.03em">kids live in DC.</h2><p class="rise">When the pediatrician is closed or full, families are left with 911 or the ER. No children’s urgent care in the city is open overnight, and nothing at all after 10 p.m. We fill that gap, any&nbsp;hour.</p><p class="src rise">Figures from Stagecoach’s research. Sources to be added before launch.</p></div></div>
</section>
<section class="sec" aria-labelledby="k4">
  {head2('How it works', 'Three simple&nbsp;steps', '', 'k4')}
  {steps([('You call.', 'A real person answers, day or night. No phone tree, no waiting for a call back.'),
          ('We come to you.', 'A clinician checks your child at home, where they feel most comfortable.'),
          ('We see it through.', 'Treatment at home when it’s safe, a trip to the hospital when it isn’t, and a note to your pediatrician either way.')])}
</section>
<section class="sec alt" aria-labelledby="k5">
  {head2('Working with your pediatrician', 'We work with your child’s doctor, not instead of&nbsp;them.', '', 'k5')}
  {cards([('Alongside your doctor', 'We extend your pediatrician’s office into your home after hours. Your child’s story doesn’t start over.'),
          ('Led by kids’ ER experts', 'Care is directed by our own pediatric and pediatric ER doctors and ER-trained nurses.'),
          ('A full report back', 'Everything we find and do goes to your pediatrician, so the follow-up picks up where we left off.')])}
</section>
{JOIN}
''')

PAGES['team.html'] = ('Our team | Stagecoach', 'Meet the founders and clinical leaders of Stagecoach in Washington, DC.',
hero('Our team', 'Who we&nbsp;are.', 'Doctors, nurses, paramedics and leaders with one belief: not every urgent problem needs the&nbsp;ER.') +
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
''' + band('Want to join&nbsp;them?', 'We’re hiring our first clinical team in Washington, DC.', '<a class="btn btn-light" href="careers.html">See open roles <span class="arr" aria-hidden="true">→</span></a>' + LINK_CONTACT))

INTERN_COMMON = '''<h4>Pay and credit</h4><p>This internship is unpaid by Stagecoach and is built for academic credit. You may get a stipend, grant, scholarship, work-study or other funding from your school or another approved source. We’ll help with any paperwork your school or funder needs.</p>'''
APPLY = f'''<h4>How to apply</h4><p>Email <a href="mailto:{EMAIL}">{EMAIL}</a> with:</p><ul><li>Your résumé</li><li>A short note on why you’re interested</li><li>Your program and expected graduation date</li><li>Any EMS or healthcare experience</li><li>Your school-credit or funding needs</li><li>When you’re available</li></ul>'''

PAGES['careers.html'] = ('Join us | Stagecoach', 'Careers at Stagecoach in Washington, DC: doctors, nurses, paramedics, EMTs, NPs, PAs, dispatch and operations, plus academic-credit internships.',
hero('Join us', 'Help us build something&nbsp;new.', 'We’re a doctor-led concierge EMS practice launching in Washington, DC. We’re hiring our first clinical&nbsp;team.',
     f'<a class="btn btn-light" href="mailto:{EMAIL}?subject=Careers%20at%20Stagecoach">Email your CV <span class="arr" aria-hidden="true">→</span></a><a class="tlink" href="#internships">Internships</a>') +
f'''<section class="sec" aria-labelledby="c1">
  {head2('Who we look for', 'Great medicine is just the&nbsp;start.', 'We want kind, calm and discreet people who notice what a patient needs before they ask. How care feels matters as much as the care itself.', 'c1')}
</section>
<section class="sec alt" aria-labelledby="c2">
  {head2('Roles we hire', 'Open&nbsp;roles', '', 'c2')}
  {cards([('Doctors', 'ER and critical care doctors for on-scene care and telehealth triage.'),
          ('Registered nurses', 'ER-trained nurses for home visits, treatment and follow-up.'),
          ('Paramedics and EMTs', 'Field crews for urgent care, critical care transport and event standby.'),
          ('Nurse practitioners and PAs', 'For home visits, on-site lab work and ongoing care.'),
          ('Dispatch and operations center', 'The first voice a member hears, any hour.'),
          ('Management and operations', 'Vehicles, schedules, supplies and member experience behind every visit.')])}
</section>
<section class="sec" aria-labelledby="c3">
  {head2('Why Stagecoach', 'Why work with&nbsp;us', '', 'c3')}
  {cards([('Learn from the best', 'Work with leaders who ran medicine and communications for DC Fire & EMS.'),
          ('Medicine done right', 'Time with each patient, the right equipment, and care in the patient’s own space when it’s safe.'),
          ('Build it from day one', 'We’re launching now. Our first team shapes our protocols, our culture and our standard of care.')])}
</section>
<section class="sec alt" id="internships" aria-labelledby="c4">
  {head2('Internships', 'Academic-credit internships in&nbsp;DC', 'For students in medical and health programs. Hybrid, about 10 to 15 hours a week, with regular supervision and a real semester project. At our Georgetown office, 3299 K St NW #210.', 'c4')}
  <details class="fold rise" id="medical-operations"><summary><div><h3>Medical Operations Intern</h3><p>Help build and run a new medical service, with our CEO and operations team.</p></div><i aria-hidden="true">+</i></summary>
    <div class="fold-body">
      <dl class="facts"><dt>Where</dt><dd>Georgetown office, hybrid, with some in-person work</dd><dt>Time</dt><dd>About 10 to 15 hours a week</dd><dt>Term</dt><dd>Semester and dates to be confirmed</dd><dt>Reports to</dt><dd>CEO and operations leaders</dd></dl>
      {INTERN_COMMON}
      <h4>What you’ll do</h4><ul><li>Help build operations and office workflows</li><li>Help plan concierge, mobile, executive and event services</li><li>Check equipment, medicine, vehicles and supplies</li><li>Track inventory and research equipment and vendors</li><li>Help with staffing, schedules, credentials and logistics</li><li>Write checklists, procedures and training materials</li><li>Research care models, rules, competitors and partners</li><li>Support event medical plans and reviews afterward</li><li>Organize information on clients, vendors and partners</li><li>Make presentations, proposals and reports</li><li>Join operations and leadership meetings</li><li>Finish a semester project and present it to leadership</li></ul>
      <h4>What you’ll learn</h4><ul><li>How a doctor-led mobile medical service runs</li><li>What concierge, mobile and event care need to work</li><li>Readiness, logistics and quality checks</li><li>How to write clear plans, procedures and briefings</li><li>How medicine, operations, rules and business fit together</li><li>How to work well with doctors and leaders</li><li>How to study a problem and suggest real fixes</li></ul>
      <h4>Who should apply</h4><ul><li>Students in a medical or health program, such as medicine, nursing, PA studies, paramedicine, EMS, public health or healthcare administration</li><li>EMS experience preferred</li><li>EMT, AEMT, paramedic, nursing assistant or other certification preferred, not required</li><li>Strong organizing, research, writing and communication skills</li><li>Good judgment, reliable and detail-minded</li><li>Can work on your own and meet deadlines</li><li>Can keep things private and follow privacy rules</li><li>Comfortable with Microsoft Office or Google Workspace</li><li>A driver’s license is a plus</li></ul>
      <p>This is an educational role. Interns don’t give unsupervised patient care or medical advice, or do anything beyond a license they already hold. We’ll work with your school on goals, supervision and paperwork. You’re responsible for getting credit approved before you start. The internship doesn’t promise a future job.</p>
      {APPLY}
      <p><a class="btn btn-dark" href="mailto:{EMAIL}?subject=Medical%20Operations%20Intern">Apply for this internship <span class="arr" aria-hidden="true">→</span></a></p>
    </div>
  </details>
  <details class="fold rise" id="medical-director"><summary><div><h3>Office of the Medical Director Intern</h3><p>Research, protocols and quality work with our Medical Director.</p></div><i aria-hidden="true">+</i></summary>
    <div class="fold-body">
      <dl class="facts"><dt>Where</dt><dd>Georgetown office, hybrid, with possible in-person observation</dd><dt>Time</dt><dd>About 10 to 15 hours a week</dd><dt>Term</dt><dd>Semester and dates to be confirmed</dd><dt>Reports to</dt><dd>Medical Director and clinical leaders</dd></dl>
      {INTERN_COMMON}
      <h4>What you’ll do</h4><ul><li>Review research on emergency medicine, EMS and mobile and concierge care</li><li>Research best practices and professional guidelines</li><li>Help draft clinical protocols, policies and checklists</li><li>Support quality, patient safety and clinical oversight work</li><li>Help build performance measures, audits and case reviews</li><li>Look at de-identified data for trends and fixes</li><li>Help with training, skills sessions and simulations</li><li>Research medicines, equipment, lab tools and new tech</li><li>Help set clinical standards for concierge, mobile, executive and event care</li><li>Join clinical meetings, case talks and reviews</li><li>Observe some training or care, when the law, our policies and the patient allow it</li><li>Finish a research or quality project and present it to the Medical Director</li></ul>
      <h4>Possible projects</h4><ul><li>Review the evidence for a new protocol</li><li>Build a quality plan for mobile medical care</li><li>Create a training or simulation exercise</li><li>Set standards for equipment and medicine readiness</li><li>Research best practice for event or executive care</li><li>Design ways to measure results for a new program</li><li>Study patient safety in concierge and mobile medicine</li></ul>
      <h4>What you’ll learn</h4><ul><li>What a medical director does</li><li>How protocols are researched, written, approved and checked</li><li>How to use research to answer a real question</li><li>The basics of oversight, patient safety and quality</li><li>How care, rules, operations and admin connect</li><li>How to explain medical ideas to any audience</li><li>How to present a project to clinical leaders</li></ul>
      <h4>Who should apply</h4><ul><li>Students in a medical or health program, such as medicine, nursing, PA studies, paramedicine, EMS, public health or clinical research</li><li>EMS experience preferred</li><li>EMT, AEMT, paramedic, nursing assistant or other certification preferred, not required</li><li>Strong research, analysis, writing and organizing skills</li><li>Can understand and sum up medical information</li><li>Good judgment, reliable and detail-minded</li><li>Can keep things private and follow privacy rules</li><li>Comfortable with Microsoft Office or Google Workspace</li></ul>
      <p>This is an educational role. Interns don’t diagnose, treat, give medical advice, give medicine, or do anything that needs a license unless separately credentialed, allowed and supervised. You may need to complete privacy (HIPAA), infection-control and safety training. Patient information is limited to what the law allows and the work needs, and we use de-identified data whenever we can. The internship doesn’t promise admission to a program or a future job.</p>
      {APPLY.replace('A short note on why you’re interested', 'A short note on why you’re interested in the Office of the Medical Director')}
      <p><a class="btn btn-dark" href="mailto:{EMAIL}?subject=Office%20of%20the%20Medical%20Director%20Intern">Apply for this internship <span class="arr" aria-hidden="true">→</span></a></p>
    </div>
  </details>
  <p class="note rise">Stagecoach is an equal-opportunity organization. We consider qualified applicants without regard to any status protected by law.</p>
</section>
''' + band('Send us your&nbsp;CV.', 'We’re building our first team now. Email your CV, licenses and certifications, and tell us the role you want. We read every one.',
           f'<a class="btn btn-light" href="mailto:{EMAIL}?subject=Careers%20at%20Stagecoach">Email us <span class="arr" aria-hidden="true">→</span></a><a class="tlink" href="team.html">Meet the team</a>'))

PAGES['partners.html'] = ('Partners | Stagecoach', 'Partner with Stagecoach: triage lines, medical direction, executive medicine, hotel and embassy coverage, and event medicine in Washington, DC.',
hero('Partners', 'Emergency care for the people you look&nbsp;after.', 'We work with cities, EMS agencies, doctors, employers, hotels, embassies and event&nbsp;producers.',
     f'<a class="btn btn-light" href="mailto:{EMAIL}?subject=Partnership">Start a conversation <span class="arr" aria-hidden="true">→</span></a><a class="tlink" href="membership.html">For individuals and families</a>') +
f'''<section class="sec" aria-labelledby="p1">
  {head2('Who we work with', 'How we can&nbsp;help', '', 'p1')}
  {cards([('Cities and government', 'A 24/7 EMS triage line. Nearly 60% of 911 calls are low-urgency. DC pays about $1M a year for its triage line and diverts just 2% of calls, against a 5–15% benchmark. Nearby counties have none.<span class="src" style="display:block">Figures from Stagecoach’s research. Sources to be added before launch.</span>'),
          ('EMS agencies and doctors', 'Medical direction and EMS consulting: protocols, credentialing and quality review, led by a former Medical Director of DC Fire & EMS.'),
          ('Companies and leaders', 'Private executive medicine and security-aware care, with retainers and seats for staff. Includes blood products for high-risk clients.'),
          ('Hotels', 'A doctor-led team on call for your guests, with five-star discretion.'),
          ('Events and productions', 'Medical teams for galas, sets, campaigns and big crowds.', '<a class="more" href="events.html">About events →</a>'),
          ('Embassies and institutions', 'Dedicated, discreet emergency coverage on contract.')])}
</section>
''' + band('Let’s&nbsp;talk.', 'Tell us who you look after and what you need. A real person will reply.',
           f'<a class="btn btn-light" href="mailto:{EMAIL}?subject=Partnership">Email our team <span class="arr" aria-hidden="true">→</span></a><a class="tlink" href="{TEL}">Call {PHONE}</a>'))

PAGES['contact.html'] = ('Contact | Stagecoach', 'Call Stagecoach 24/7 or email our team in Washington, DC.',
hero('Contact', 'Talk to&nbsp;us.', 'Call or email. A clinician answers the phone, day or&nbsp;night.') +
f'''<section class="sec" aria-labelledby="ct1">
  <ul class="cards" style="--cols:2">
    <li class="card rise"><span class="tag">Call 24/7</span><h3 id="ct1"><a href="{TEL}" style="text-decoration:none;font-size:clamp(32px,3.6vw,56px);letter-spacing:-.03em">{PHONE}</a></h3><p>A clinician answers. If it’s life-threatening, call 911 right away.</p><p>{EMAIL}<br>3299 K St NW #210, Washington, DC 20007</p></li>
    <li class="card rise"><span class="tag">Questions</span><h3>Email our team</h3><p>Tell us what you need: membership, event coverage or a partnership. A real person will write back.</p><p><a class="btn btn-dark" href="mailto:{EMAIL}">Email us <span class="arr" aria-hidden="true">→</span></a></p><p style="font-size:15px">Please don’t send medical details by email. For anything urgent, call {PHONE}.</p></li>
  </ul>
</section>
{JOIN}
''')


def build():
    intro = open(os.path.join(SRC, 'intro.html')).read().replace('{{S}}', S)
    home = (open(os.path.join(SRC, 'home.html')).read()
            .replace('{{S}}', S).replace('{{B}}', B).replace('{{JOIN}}', JOIN)
            .replace('{{COFOUNDERS}}', COFOUNDERS).replace('{{LOGOS}}', LOGOS))
    pages = {'index.html': ('Stagecoach | Emergency care that comes to you',
                            'A doctor-led emergency team that comes to your home, office or event in Washington, DC, 24/7. Not a substitute for 911.',
                            home, intro)}
    for name, (title, desc, body) in PAGES.items():
        pages[name] = (title, desc, body, '')
    for name, (title, desc, body, pre) in pages.items():
        html = head(title, desc) + pre + header(name) + '\n<main id="main" tabindex="-1">\n' + body + '\n</main>\n\n' + FOOTER
        open(os.path.join(ROOT, name), 'w').write(html)
        print('wrote', name, len(html) // 1024, 'KB')


if __name__ == '__main__':
    build()
