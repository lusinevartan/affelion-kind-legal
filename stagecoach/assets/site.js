(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const io = (els, fn, opt = { threshold: .25 }) => { const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fn(e.target); o.unobserve(e.target); } }), opt); els.forEach(el => o.observe(el)); };

  /* intro: once per visit, skippable, off for reduced motion */
  const intro = $('#intro');
  let seen = false; try { seen = sessionStorage.getItem('sc-intro') === '1'; } catch (e) {}
  const endIntro = () => { if (!intro || intro.classList.contains('out')) return; intro.classList.add('out'); document.documentElement.style.overflow = ''; setTimeout(() => intro.classList.add('gone'), 1150); try { sessionStorage.setItem('sc-intro', '1'); } catch (e) {} };
  if (!intro) {}
  else if (RM || seen || location.hash) { intro.classList.add('gone'); }
  else {
    document.documentElement.style.overflow = 'hidden';
    setTimeout(endIntro, 3900);
    intro.addEventListener('click', endIntro);
    addEventListener('keydown', endIntro, { once: true });
    addEventListener('wheel', endIntro, { once: true, passive: true });
    addEventListener('touchstart', endIntro, { once: true, passive: true });
    addEventListener('pointerdown', endIntro, { once: true });
  }

  /* live DC clock */
  const clockEl = $('#clock');
  const tick = () => { clockEl.textContent = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' }).format(new Date()).replace(' AM', ' a.m.').replace(' PM', ' p.m.'); };
  if (clockEl) { tick(); setInterval(tick, 10000); }

  /* split headings into words */
  $$('.split').forEach(h => {
    let i = 0;
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const parts = c.textContent.split(/([ \t\n\r]+)/); const f = document.createDocumentFragment();
        parts.forEach(p => { if (!p) return; if (/^[ \t\n\r]+$/.test(p)) { f.append(' '); return; } const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.style.setProperty('--i', i++); s.textContent = p; w.append(s); f.append(w); });
        c.replaceWith(f);
      } else if (c.nodeType === 1) walk(c);
    });
    walk(h);
  });
  io($$('.split'), el => el.classList.add('in'), { threshold: .3, rootMargin: '0px 0px -8% 0px' });
  io($$('.rise'), el => el.classList.add('in'), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  io($$('.cta'), el => el.classList.add('in'), { threshold: .3 });

  /* phone number: digit-by-digit rise */
  $$('.tel').forEach(a => { const t = a.textContent; a.textContent = ''; [...t].forEach((ch, i) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); a.append(s); }); });

  /* mission words */
  const mh = $('[data-words]'); const mws = [];
  if (mh) { const txt = mh.textContent; mh.textContent = ''; txt.split(' ').forEach((w, i, a) => { const s = document.createElement('span'); s.className = 'mw' + (/911/.test(w) ? ' accent' : ''); s.textContent = w; mh.append(s); mws.push(s); if (i < a.length - 1) mh.append(' '); }); }

  /* mobile menu */
  const mb = $('.menu-btn'), sheet = $('#sheet'), hdr = $('#hdr');
  const setMenu = open => { mb.setAttribute('aria-expanded', open); mb.textContent = open ? 'Close' : 'Menu'; sheet.classList.toggle('open', open); hdr.classList.toggle('menu-open', open); document.documentElement.style.overflow = open ? 'hidden' : ''; frame(); if (open) $('a', sheet).focus(); };
  mb.addEventListener('click', () => setMenu(mb.getAttribute('aria-expanded') !== 'true'));
  $$('a', sheet).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('open')) { setMenu(false); mb.focus(); } });

  /* scroll-linked scenes */
  const hero = $('.hero'), win = $('.hero-win'), clock = $('.clock'), meta = $('.hero-meta'), side = $('.hero-side'), cue = $('.scroll-cue'), copy = $('.hero-copy');
  const how = $('.how'), hDot = $('#h-dot'), hRings = $$('.h-ring'), hS = $('#h-s'), hGuide = $('#h-guide'), opts = $$('.opt'), steps = $$('.step');
  const jS = $('#j-s'), jArt = $('.journey-art'), jDot = $('#j-dot');
  const prog = $('.progress');
  const darkZones = () => $$('.dark');
  const AX = .333, AY = .335; // a point on the S stroke (33.3, 33.5 in the 100-unit symbol)

  let vw = innerWidth, vh = innerHeight;
  addEventListener('resize', () => { vw = innerWidth; vh = innerHeight; frame(); });

  const angles = [-90, -18, 54, 126, 198];
  const stepBtns = $$('.stepper button'), heroNext = $('#hero-next'), howNext = $('#how-next');
  const STAGES = [[0, .3], [.3, .62], [.62, 1]], STOPS = [.16, .5, .84];
  const prog01 = el => clamp(-el.getBoundingClientRect().top / (el.offsetHeight - vh));

  /* immediate, scroll-tied pieces */
  function frame() {
    const y = scrollY;
    const probe = 36; let onDark = false;
    darkZones().forEach(z => { const r = z.getBoundingClientRect(); if (r.top <= probe && r.bottom >= probe) onDark = true; });
    hdr.classList.toggle('on-dark', onDark || sheet.classList.contains('open'));
    hdr.classList.toggle('solid', y > 10);
    const max = document.documentElement.scrollHeight - vh; prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (jArt) { const jr = jArt.getBoundingClientRect(); const jp = RM ? 1 : clamp((vh * .9 - jr.top) / (vh * .55 + jr.height * .6));
    jS.style.strokeDashoffset = (1 - ease(jp)).toFixed(4);
    jDot.style.transform = `scale(${clamp(jp * 3)})`; jDot.style.transformOrigin = '50px 50px'; }
    if (mh) { const r = mh.getBoundingClientRect(); const mp = RM ? 1 : clamp((vh * .9 - r.top) / (vh * .55)); const n = Math.round(mp * (mws.length + 1)); mws.forEach((w, i) => w.classList.toggle('lit', i < n)); }
    kick();
  }

  /* pinned scenes glide toward the scroll position instead of stepping with it */
  const cur = { hp: null, p: null }; let running = false;
  function kick() { if (!hero && !how) return; if (!running) { running = true; requestAnimationFrame(glide); } }
  function glide() {
    const t = { hp: RM || !hero ? 1 : prog01(hero), p: RM || !how ? 1 : prog01(how) };
    if (cur.hp === null || RM) { cur.hp = t.hp; cur.p = t.p; }
    else { cur.hp += (t.hp - cur.hp) * .14; cur.p += (t.p - cur.p) * .14; }
    scene(cur.hp, cur.p);
    if (Math.abs(t.hp - cur.hp) > .0004 || Math.abs(t.p - cur.p) > .0004) requestAnimationFrame(glide); else running = false;
  }

  function scene(hp, p) {
    if (hero) heroScene(hp);
    if (how) howScene(p);
  }
  function heroScene(hp) {
    const m = Math.min(vw, vh) * (vw < 860 ? .7 : .56);
    const z = ease(clamp((hp - .1) / .4));
    const size = m * Math.pow(34, z);
    const sx0 = (vw - m) / 2 + AX * m, sy0 = vh * .44 - m / 2 + AY * m;
    const ax = sx0 + (vw / 2 - sx0) * z, ay = sy0 + (vh / 2 - sy0) * z;
    const pos = `${ax - AX * size}px ${ay - AY * size}px`, sz = `${size}px ${size}px`;
    win.style.webkitMaskSize = sz; win.style.maskSize = sz; win.style.webkitMaskPosition = pos; win.style.maskPosition = pos;
    win.style.setProperty('--scrim', (clamp((hp - .4) / .15) * .66).toFixed(3));
    const hold = clamp((hp - .6) / .4);
    win.style.transform = `scale(${1 + .08 * hold})`;
    win.style.filter = `brightness(${(.68 + .32 * z).toFixed(3)}) saturate(${(1.3 - .3 * z).toFixed(3)}) contrast(${(1.15 - .15 * z).toFixed(3)})`;
    const fade = 1 - clamp((hp - .03) / .09);
    clock.style.opacity = fade; clock.style.transform = `translateY(${-(1 - fade) * 60}px)`;
    meta.style.opacity = fade; side.style.opacity = fade; cue.style.opacity = fade;
    const cp = RM ? 1 : clamp((hp - .5) / .1);
    copy.style.opacity = cp; copy.style.transform = `translateY(${(1 - ease(cp)) * 40 - hold * 36}px)`; copy.classList.toggle('live', cp > .6);
    heroNext.classList.toggle('show', !RM && hp > .68 && hp < .995);
  }
  function howScene(p) {
    /* how: point → ring → S, each stage held while you read */
    const s1 = clamp(p / .08), s2 = clamp((p - .3) / .14), s3 = clamp((p - .62) / .14);
    hDot.style.transform = `scale(${RM ? 1 : ease(s1) * (1 + .25 * Math.sin(Math.PI * s1))})`;
    hRings.forEach((c, i) => { const t = clamp(s2 * 1.4 - i * .2); const r = 6.5 + t * (34 - 6.5) * (1 - i * .18); c.setAttribute('r', r.toFixed(2)); c.setAttribute('opacity', (RM ? .3 : (t > 0 ? (1 - s3) * .55 * (1 - i * .25) : 0)).toFixed(3)); });
    hGuide.setAttribute('opacity', (RM ? .5 : clamp(s2 * 2) * (1 - s3) * .9).toFixed(3));
    const box = $('.how-art').getBoundingClientRect().width;
    opts.forEach((o, i) => { const a = angles[i] * Math.PI / 180, R = box * .44 * (vw < 860 ? .92 : 1); const t = box < 300 ? 0 : RM ? 1 : clamp(s2 * 1.6 - i * .12) * (1 - s3); o.style.opacity = t.toFixed(3); o.style.transform = `translate(calc(-50% + ${Math.cos(a) * R * (.7 + .3 * t)}px), calc(-50% + ${Math.sin(a) * R * (.7 + .3 * t)}px))`; });
    hS.style.strokeDashoffset = RM ? 0 : (1 - ease(s3)).toFixed(4);
    const active = p < .3 ? 0 : p < .62 ? 1 : 2;
    steps.forEach((s, i) => s.classList.toggle('on', RM || i === active));
    stepBtns.forEach((b, i) => { b.classList.toggle('on', i === active); b.setAttribute('aria-current', i === active ? 'step' : 'false'); $('em', b).style.transform = `scaleX(${clamp((p - STAGES[i][0]) / (STAGES[i][1] - STAGES[i][0])).toFixed(3)})`; });
    howNext.classList.toggle('show', !RM && p > .9 && p < .999);
  }
  stepBtns.forEach((b, i) => b.addEventListener('click', () => scrollTo({ top: how.offsetTop + (how.offsetHeight - vh) * STOPS[i], behavior: RM ? 'auto' : 'smooth' })));

  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { frame(); ticking = false; }); } }, { passive: true });
  frame();

  /* keyboard: tabbing into the hidden hero buttons scrolls to where they are shown */
  if (copy) copy.addEventListener('focusin', () => { if (!copy.classList.contains('live') && !RM) scrollTo({ top: hero.offsetTop + (hero.offsetHeight - vh) * .66, behavior: 'instant' }); });

  /* desktop cursor */
  if (fine && !RM) {
    const cur = $('.cur'), lbl = $('span', cur);
    let mx = vw / 2, my = vh / 2, cx = mx, cy = my;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.classList.add('show'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('show'));
    $$('[data-cur]').forEach(el => { el.addEventListener('pointerenter', () => { lbl.textContent = el.dataset.cur; cur.classList.add('big'); }); el.addEventListener('pointerleave', () => cur.classList.remove('big')); });
    const loop = () => {
      cx += (mx - cx) * .22; cy += (my - cy) * .22;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      const el = document.elementFromPoint(cx, cy); cur.classList.toggle('light', !!(el && el.closest('.dark, .sheet')));
      requestAnimationFrame(loop);
    };
    loop();
    /* magnetic buttons */
    $$('.btn').forEach(b => { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; }); b.addEventListener('pointerleave', () => { b.style.transform = ''; }); b.style.transition = 'color .5s cubic-bezier(.2,.9,.2,1), transform .6s cubic-bezier(.2,.9,.2,1)'; });
  }

  /* mailing list: one field, inline validation, honest status until a provider is connected */
  const jf = $('#join-form');
  if (jf) {
    const ji = $('#join-email', jf), jm = $('#join-msg');
    jf.addEventListener('submit', async e => {
      e.preventDefault();
      if (jf.company.value) return;
      const v = ji.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { ji.setAttribute('aria-invalid', 'true'); jm.textContent = 'Enter an email address like name@example.com.'; ji.focus(); return; }
      ji.removeAttribute('aria-invalid');
      const ep = jf.dataset.endpoint;
      if (!ep) { jm.textContent = 'Preview only: this form is not connected to a mailing list yet, so nothing was sent.'; return; }
      jm.textContent = 'Sending…';
      try { const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: v, interests: $$('input[name="interest"]:checked', jf).map(c => c.value) }) }); if (!r.ok) throw 0; jf.reset(); jm.textContent = 'Thanks. Check your inbox to confirm your subscription.'; }
      catch (err) { jm.textContent = 'That did not go through. Please try again in a moment.'; }
    });
    ji.addEventListener('input', () => { if (ji.getAttribute('aria-invalid')) { ji.removeAttribute('aria-invalid'); jm.textContent = ''; } });
  }
  /* touch: tap a portrait to see it in colour */
  $$('.portrait').forEach(p => { p.addEventListener('click', () => p.classList.toggle('color')); p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.classList.toggle('color'); } }); });
})();
