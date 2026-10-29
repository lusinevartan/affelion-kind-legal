/* Stagecoach loader: show once per session, end on tap, key, scroll or after 3.4 s. */
(function () {
  var el = document.getElementById('sc-loader');
  if (!el) return;
  var seen = false;
  try { seen = sessionStorage.getItem('sc-loader') === '1'; } catch (e) {}
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (seen || rm) { el.remove(); return; }
  var done = false;
  function end() {
    if (done) return; done = true;
    el.classList.add('is-out');
    document.documentElement.style.overflow = '';
    setTimeout(function () { el.remove(); }, 1050);
    try { sessionStorage.setItem('sc-loader', '1'); } catch (e) {}
  }
  document.documentElement.style.overflow = 'hidden';
  setTimeout(end, 3400);
  el.addEventListener('click', end);
  ['keydown', 'wheel', 'touchstart', 'pointerdown'].forEach(function (t) { addEventListener(t, end, { once: true, passive: true }); });
})();
