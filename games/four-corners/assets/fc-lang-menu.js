/* Little Wonders web app: hide the floating lang.js toggle on Four Corners only,
   and put English / EN+中文 into the far-right Menu hanging-plank dropdown
   (same shared localStorage lw.lang via LWLang). */
(function () {
  var STYLE_ID = 'fc-hide-lw-lang';
  var CSS = '#lw-lang{display:none!important}.fc-lang-rung .lwzh{display:none!important}';
  var GLOBE =
    '<svg class="pill-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="10"></circle>' +
    '<path d="M2 12h20"></path>' +
    '<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>' +
    '</svg>';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    (document.head || document.documentElement).appendChild(st);
  }

  function hideToggle() {
    ensureStyle();
    var el = document.getElementById('lw-lang');
    if (el) {
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('hidden', '');
    }
  }

  function zhOn() {
    return !!(window.LWLang && LWLang.zh);
  }

  function labels(menu) {
    return [].map.call(menu.querySelectorAll('.hang-plank'), function (b) {
      return (b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    });
  }

  /* Root Menu is Help / Sound / Voice / Settings / Restart — not Settings or Redo pages. */
  function isRootMenu(menu) {
    if (!menu || menu.getAttribute('data-anchor') !== 'menu') return false;
    var labs = labels(menu).filter(function (l) { return l !== 'English' && l !== 'EN+中文'; });
    var hasHelp = labs.indexOf('Help') !== -1;
    var hasSettings = labs.indexOf('Settings') !== -1;
    var hasBack = labs.indexOf('Back') !== -1;
    return hasHelp && hasSettings && !hasBack;
  }

  function sync(menu) {
    if (!menu) return;
    var on = zhOn();
    [].forEach.call(menu.querySelectorAll('.fc-lang-rung .hang-plank'), function (b) {
      var active = (b.getAttribute('data-l') === 'zh') === on;
      b.setAttribute('data-on', active ? 'true' : 'false');
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setLabel(btn, text) {
    btn.setAttribute('aria-label', text);
    var face = btn.querySelector('.hang-plank-face');
    if (!face) return;
    var span = null;
    [].forEach.call(face.children, function (el) {
      if (el.tagName === 'SPAN') span = el;
    });
    if (span) span.textContent = text;
    var old = face.querySelector('svg, .pill-mark');
    var wrap = document.createElement('div');
    wrap.innerHTML = GLOBE;
    var globe = wrap.firstChild;
    if (old && globe) old.replaceWith(globe);
    else if (globe && face.firstChild) face.insertBefore(globe, face.firstChild);
    else if (globe) face.appendChild(globe);
  }

  function makeRung(src, lang, text) {
    var rung = src.cloneNode(true);
    rung.classList.add('fc-lang-rung');
    var btn = rung.querySelector('.hang-plank');
    if (!btn) return rung;
    rung.setAttribute('data-lw-skip', '');
    btn.setAttribute('data-lw-skip', '');
    btn.setAttribute('data-l', lang);
    btn.removeAttribute('data-shelf');
    setLabel(btn, text);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!window.LWLang) return;
      LWLang.set(lang, false);
      sync(btn.closest('.hang-menu'));
    }, true);
    return rung;
  }

  function inject() {
    var menu = document.querySelector('.hang-menu[data-anchor="menu"]');
    if (!isRootMenu(menu)) return;
    if (menu.querySelector('.fc-lang-rung')) {
      sync(menu);
      return;
    }
    var chain = menu.querySelector('.hang-chain');
    var src = chain && chain.querySelector('.hang-rung');
    if (!src) return;
    chain.appendChild(makeRung(src, 'en', 'English'));
    chain.appendChild(makeRung(src, 'zh', 'EN+中文'));
    sync(menu);
    if (window.LWLang && LWLang.add) LWLang.add({ English: '英语', Language: '语言' });
    if (window.LWLang && LWLang.rescan) LWLang.rescan();
  }

  function boot() {
    hideToggle();
    inject();
    if (window.LWLang && LWLang.on) {
      LWLang.on(function () { sync(document.querySelector('.hang-menu[data-anchor="menu"]')); });
    }
    window.addEventListener('lwlang', function () {
      sync(document.querySelector('.hang-menu[data-anchor="menu"]'));
    });
    var obs = new MutationObserver(function () {
      hideToggle();
      inject();
    });
    if (document.body) obs.observe(document.body, { childList: true, subtree: true });
  }

  ensureStyle();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
