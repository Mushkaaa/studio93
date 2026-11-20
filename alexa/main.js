const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const fine = matchMedia('(pointer: fine)').matches;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
root.classList.remove('no-js');

$('#year').textContent = new Date().getFullYear();

/* ---------- mobile menu ---------- */
const burger = $('.nav__burger');
const setMenu = open => {
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', open);
};
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$$('.nav__menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

/* ---------- SK / EN ---------- */
const i18n = $$('[data-en]').map(el => ({ el, sk: el.innerHTML, en: el.dataset.en }));
const langBtn = $('.lang');
const setLang = lang => {
  root.lang = lang;
  i18n.forEach(o => { o.el.innerHTML = o[lang]; });
  langBtn.textContent = lang === 'sk' ? 'EN' : 'SK';
  langBtn.setAttribute('aria-label', lang === 'sk' ? 'EN — Switch to English' : 'SK — Prepnúť do slovenčiny');
  try { localStorage.setItem('s93-lang', lang); } catch {}
};
langBtn.addEventListener('click', () => setLang(root.lang === 'sk' ? 'en' : 'sk'));
try { if (localStorage.getItem('s93-lang') === 'en') setLang('en'); } catch {}

/* ---------- cookies: consent + trackers ---------- */
// paste the IDs here — each tracker stays off until its ID is filled in AND the visitor agrees
const TRACKING = {
  ga4: '',         // Google Analytics 4, e.g. 'G-XXXXXXXXXX'
  metaPixel: '',   // Meta (Facebook) Pixel ID, a ~15-digit number as a string
  tiktokPixel: '', // TikTok Pixel ID from TikTok Events Manager
};
const CK_KEY = 's93-consent', CK_DAYS = 365; // ask again after a year
const ck = $('#cookies');
const ckPrefs = $('.ck__prefs', ck);
const ckBox = name => $(`[name="${name}"]`, ckPrefs);
const readConsent = () => {
  try {
    const c = JSON.parse(localStorage.getItem(CK_KEY));
    if (c && Date.now() - c.ts < CK_DAYS * 864e5) return c;
  } catch {}
  return null;
};
const loadScript = src => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.append(s); };
const loaded = { ga4: false, meta: false, tiktok: false };
const startTrackers = c => {
  if (c.analytics && TRACKING.ga4 && !loaded.ga4) {
    loaded.ga4 = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', TRACKING.ga4);
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${TRACKING.ga4}`);
  }
  if (c.marketing && TRACKING.metaPixel && !loaded.meta) {
    loaded.meta = true;
    // Meta Pixel base code, unminified
    const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    window._fbq = f; f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    fbq('init', TRACKING.metaPixel);
    fbq('track', 'PageView');
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
  }
  if (c.marketing && TRACKING.tiktokPixel && !loaded.tiktok) {
    loaded.tiktok = true;
    // TikTok Pixel base code, unminified
    window.TiktokAnalyticsObject = 'ttq';
    const ttq = window.ttq = window.ttq || [];
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
    ttq.setAndDefer = (o, m) => { o[m] = (...a) => { o.push([m, ...a]); }; };
    ttq.methods.forEach(m => ttq.setAndDefer(ttq, m));
    ttq.instance = id => { const e = ttq._i[id] || []; ttq.methods.forEach(m => ttq.setAndDefer(e, m)); return e; };
    ttq.load = (id, opts) => {
      const src = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i = ttq._i || {}; ttq._i[id] = []; ttq._i[id]._u = src;
      ttq._t = ttq._t || {}; ttq._t[id] = +new Date();
      ttq._o = ttq._o || {}; ttq._o[id] = opts || {};
      loadScript(`${src}?sdkid=${id}&lib=ttq`);
    };
    ttq.load(TRACKING.tiktokPixel);
    ttq.page();
  }
};
// trackers set their cookies on the main domain (.studio93liptov.sk) — remove them on every level
const clearTrackerCookies = () => {
  const host = location.hostname, main = host.split('.').slice(-2).join('.');
  document.cookie.split(';').map(s => s.split('=')[0].trim())
    .filter(n => /^(_ga|_gid|_gat|_fbp|_fbc|_ttp|_tt_)/.test(n))
    .forEach(n => ['', `; domain=${host}`, `; domain=.${main}`].forEach(d => {
      document.cookie = `${n}=; Max-Age=0; path=/${d}`;
    }));
};
const showPrefs = on => {
  ckPrefs.hidden = !on;
  $('[data-ck="settings"]', ck).hidden = on;
  $('[data-ck="save"]', ck).hidden = !on;
};
const openCk = prefs => {
  const c = readConsent() || {};
  ckBox('analytics').checked = !!c.analytics;
  ckBox('marketing').checked = !!c.marketing;
  showPrefs(prefs);
  ck.hidden = false;
};
const closeCk = () => {
  ck.hidden = true;
  if (location.hash === '#cookies') history.replaceState(null, '', location.pathname + location.search);
};
const saveConsent = ({ analytics = false, marketing = false }) => {
  const prev = readConsent() || {};
  try { localStorage.setItem(CK_KEY, JSON.stringify({ analytics, marketing, ts: Date.now() })); } catch {}
  closeCk();
  if ((prev.analytics && !analytics) || (prev.marketing && !marketing)) clearTrackerCookies();
  // a running tracker can't be unloaded — reload so it's gone
  if ((loaded.ga4 && !analytics) || ((loaded.meta || loaded.tiktok) && !marketing)) return location.reload();
  startTrackers({ analytics, marketing });
};
ck.addEventListener('click', e => {
  const a = e.target.closest('[data-ck]')?.dataset.ck;
  if (a === 'all') saveConsent({ analytics: true, marketing: true });
  if (a === 'reject') saveConsent({});
  if (a === 'settings') showPrefs(true);
  if (a === 'save') saveConsent({ analytics: ckBox('analytics').checked, marketing: ckBox('marketing').checked });
});
$$('[data-ck-open]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openCk(true); }));
addEventListener('hashchange', () => { if (location.hash === '#cookies') openCk(true); });
const consent = readConsent();
if (consent) startTrackers(consent);
if (location.hash === '#cookies') openCk(true);
else if (!consent) openCk(false);

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('is-in');
  io.unobserve(e.target);
}), { threshold: .15, rootMargin: '0px 0px -8% 0px' });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- nav state + parallax ---------- */
const nav = $('.nav');
const para = calm ? [] : $$('[data-parallax]');
let ticking = false;
const onScroll = () => {
  nav.classList.toggle('is-scrolled', scrollY > 40);
  const vh = innerHeight;
  para.forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const shift = -(r.top + r.height / 2 - vh / 2) * el.dataset.parallax;
    el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
  });
  ticking = false;
};
addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

/* ---------- desktop-only toys: cursor, magnetic buttons, tilt ---------- */
if (fine) {
  /* custom cursor vypnutý — na zapnutie odkomentuj tento blok aj .cursor div v index.html
  root.classList.add('has-cursor');
  const cur = $('.cursor');
  const label = $('span', cur);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cur.classList.add('is-visible'); });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-visible'));
  document.addEventListener('pointerover', e => {
    const t = e.target.closest('a, button, summary, label, [data-cursor]');
    const text = t?.dataset.cursor ? (root.lang === 'en' ? 'View' : t.dataset.cursor) : '';
    cur.classList.toggle('is-hover', !!t);
    cur.classList.toggle('has-label', !!text);
    label.textContent = text;
  });
  const ease = calm ? 1 : .2;
  (function loop() {
    cx += (x - cx) * ease;
    cy += (y - cy) * ease;
    cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  })();
  */

  if (!calm) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        // how far the button follows the mouse (share of the distance from its center); bigger = moves more
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .08}px, ${(e.clientY - r.top - r.height / 2) * .12}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }
}

/* ---------- tím ---------- */
// side by side (>= 900px): hover a person -> photo in color, card tilts under the mouse, logo turns to face them
// stacked (phones/tablets): the card nearest the middle of the screen lights up (color + glow)
//   and tilts as you tilt the phone (gyroscope). iPhone asks permission on the first tap of that card.
const team = $('.team');
const teamLogo = $('.team__logo .logo-tile');
const members = $$('.member', team);
const cardOf = m => $('.member__card', m);
const stacked = matchMedia('(max-width: 899.98px)');
const clampNum = (v, a, b) => Math.min(Math.max(v, a), b);
const setTilt = (card, rx, ry, gx = 50, gy = 30) => {
  card.style.setProperty('--rx', `${rx}deg`);
  card.style.setProperty('--ry', `${ry}deg`);
  card.style.setProperty('--gx', `${gx}%`);
  card.style.setProperty('--gy', `${gy}%`);
};
const lean = (x, y, t) => {
  if (!teamLogo) return;
  teamLogo.style.setProperty('--lx', `${x}deg`);
  teamLogo.style.setProperty('--ly', `${y}deg`);
  teamLogo.style.setProperty('--lt', `${t}px`);
};
// light up one person (or nobody), switch the others back to black & white
const activate = m => members.forEach(x => {
  if (x !== m && x.classList.contains('is-active')) setTilt(cardOf(x), 0, 0);
  x.classList.toggle('is-active', x === m);
});

/* side by side: mouse hover */
members.forEach(m => {
  const card = cardOf(m);
  const side = m.dataset.side === 'left' ? -1 : 1;
  m.addEventListener('pointerenter', () => {
    if (stacked.matches) return;
    activate(m);
    lean(4, side * 38, side * 18);
  });
  m.addEventListener('pointerleave', () => {
    if (stacked.matches) return;
    activate(null);
    lean(0, 0, 0);
  });
  if (fine && !calm) m.addEventListener('pointermove', e => {
    if (stacked.matches) return;
    const r = card.getBoundingClientRect();
    const px = clampNum((e.clientX - r.left) / r.width, 0, 1);
    const py = clampNum((e.clientY - r.top) / r.height, 0, 1);
    setTilt(card, (.5 - py) * 16, (px - .5) * 16, px * 100, py * 100);
  });
});
// between the photos the logo follows the mouse
if (fine && !calm && teamLogo) team.addEventListener('pointermove', e => {
  if (stacked.matches || members.some(m => m.classList.contains('is-active'))) return;
  const r = teamLogo.getBoundingClientRect();
  const dx = (e.clientX - (r.left + r.width / 2)) / (team.offsetWidth / 2);
  const dy = (e.clientY - (r.top + r.height / 2)) / (team.offsetHeight / 2);
  lean(clampNum(-dy, -1, 1) * 18, clampNum(dx, -1, 1) * 30, 0);
});
if (team) team.addEventListener('pointerleave', () => { if (!stacked.matches) lean(0, 0, 0); });

/* stacked: scroll highlight */
let lit = null;
const pickLit = () => {
  if (!stacked.matches) return;
  const vh = innerHeight;
  const tr = team.getBoundingClientRect();
  let best = null;
  // only while the team section covers the middle part of the screen
  if (tr.bottom > vh * .2 && tr.top < vh * .8) {
    let bestDist = Infinity;
    members.forEach(m => {
      const r = cardOf(m).getBoundingClientRect();
      const dist = Math.abs(r.top + r.height / 2 - vh / 2);
      if (dist < bestDist) { bestDist = dist; best = m; }
    });
  }
  if (best !== lit) { lit = best; activate(best); }
};
let pickQueued = false;
addEventListener('scroll', () => {
  if (pickQueued) return;
  pickQueued = true;
  requestAnimationFrame(() => { pickQueued = false; pickLit(); });
}, { passive: true });
stacked.addEventListener('change', () => { lit = null; activate(null); lean(0, 0, 0); pickLit(); });
pickLit();

/* stacked: the lit card follows the phone's tilt */
const gyro = { base: null, tx: 0, ty: 0, x: 0, y: 0, running: false, asked: false };
const GYRO_RANGE = 20; // degrees of phone tilt for the full card tilt
const GYRO_TILT = 12;  // max card tilt in degrees
const gyroLoop = () => {
  gyro.x += (gyro.tx - gyro.x) * .15; // smoothing
  gyro.y += (gyro.ty - gyro.y) * .15;
  if (lit && stacked.matches) setTilt(cardOf(lit), -gyro.x * GYRO_TILT, gyro.y * GYRO_TILT, 50 + gyro.y * 40, 40 - gyro.x * 40);
  requestAnimationFrame(gyroLoop);
};
const onOrient = e => {
  if (e.beta == null || e.gamma == null) return;
  // "straight" = however you were holding the phone; it slowly re-centers if you keep it tilted
  if (!gyro.base) gyro.base = { b: e.beta, g: e.gamma };
  gyro.base.b += (e.beta - gyro.base.b) * .005;
  gyro.base.g += (e.gamma - gyro.base.g) * .005;
  gyro.tx = clampNum((e.beta - gyro.base.b) / GYRO_RANGE, -1, 1);
  gyro.ty = clampNum((e.gamma - gyro.base.g) / GYRO_RANGE, -1, 1);
  if (!gyro.running) { gyro.running = true; requestAnimationFrame(gyroLoop); }
};
if (!calm && 'DeviceOrientationEvent' in window) {
  // Android: data arrives right away. iPhone: nothing arrives until the visitor allows it
  addEventListener('deviceorientation', onOrient);
  // so if no data came yet, the first tap on the lit card asks (iPhone pop-up; no visible hint, by choice)
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    members.forEach(m => m.addEventListener('click', () => {
      if (!stacked.matches || m !== lit || gyro.asked || gyro.running) return;
      gyro.asked = true;
      DeviceOrientationEvent.requestPermission().catch(() => {});
    }));
  }
}

/* ---------- práce: 3D reel ring ---------- */
const ringEl = $('#ring');
const ringCards = [...ringEl.children];
const ring = { rot: 0, drag: 0, R: 0 };
const layoutRing = () => {
  const n = ringCards.length;
  ring.R = (ringEl.offsetWidth / 2) / Math.tan(Math.PI / n) + (innerWidth < 600 ? 24 : 60);
  ringCards.forEach((c, i) => { c.style.transform = `rotateY(${i * 360 / n}deg) translateZ(${ring.R}px)`; });
};
// only the front-facing reel plays, and only while the ring is on screen
const ringVideos = ringCards.map(c => $('video', c));
let ringFront = -1, ringVisible = false;
const syncReels = () => {
  const n = ringCards.length;
  const i = ringVisible && !calm ? ((Math.round(-(ring.rot + ring.drag) / (360 / n)) % n) + n) % n : -1;
  if (i === ringFront) return;
  ringVideos[ringFront]?.pause();
  ringFront = i;
  ringVideos[i]?.play().catch(() => {});
};
const drawRing = () => {
  ringEl.style.transform = `translateZ(${-ring.R}px) rotateX(-6deg) rotateY(${ring.rot + ring.drag}deg)`;
  syncReels();
};
layoutRing();
drawRing();
new IntersectionObserver(([e]) => { ringVisible = e.isIntersecting; syncReels(); }, { threshold: .25 }).observe(ringEl.parentElement);
let ringResize;
addEventListener('resize', () => {
  clearTimeout(ringResize);
  ringResize = setTimeout(() => { layoutRing(); drawRing(); }, 150);
});

if (window.gsap && window.ScrollTrigger && !calm) {
  gsap.registerPlugin(ScrollTrigger);
  // 'bottom bottom' = 'top top' when the section fits the screen; on short screens it pins once the ring is fully in view
  gsap.to(ring, {
    rot: -360, ease: 'none', onUpdate: drawRing,
    scrollTrigger: { trigger: '.reel', start: 'bottom bottom', end: '+=180%', pin: true, scrub: 1 },
  });
  let dragging = false, lastX = 0;
  const release = () => {
    if (!dragging) return;
    dragging = false;
    gsap.to(ring, { drag: 0, duration: 1.2, ease: 'elastic.out(1,0.5)', onUpdate: drawRing });
  };
  $('.stage').addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; gsap.killTweensOf(ring, 'drag'); });
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  addEventListener('pointermove', e => {
    if (!dragging) return;
    ring.drag += (e.clientX - lastX) * .25;
    lastX = e.clientX;
    drawRing();
  });
}

/* ---------- testimonial slider ---------- */
const track = $('.slider__track');
const slides = $$('.slide', track);
const count = $('.slider__count');
const pad = n => String(n).padStart(2, '0');
const current = () => Math.round(track.scrollLeft / (slides[1].offsetLeft - slides[0].offsetLeft));
$$('.slider [data-dir]').forEach(btn => btn.addEventListener('click', () => {
  const i = (current() + Number(btn.dataset.dir) + slides.length) % slides.length;
  track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: calm ? 'auto' : 'smooth' });
}));
track.addEventListener('scroll', () => {
  count.textContent = `${pad(Math.min(current(), slides.length - 1) + 1)} / ${pad(slides.length)}`;
}, { passive: true });

/* ---------- contact form ---------- */
const form = $('.form');
const status = $('.form__status');
const msg = {
  sk: { sending: 'Odosielam…', ok: 'Hotovo! Ozveme sa do 24 hodín.', err: 'Niečo sa pokazilo. Napíš nám na ' + form.dataset.mail },
  en: { sending: 'Sending…', ok: 'Done! We’ll get back to you within 24 hours.', err: 'Something went wrong. Email us at ' + form.dataset.mail },
};
form.addEventListener('submit', async e => {
  e.preventDefault();
  const t = msg[root.lang] || msg.sk;
  const data = new FormData(form);
  if (data.get('_honey')) return; // bot filled the hidden field
  // goes to our Apps Script (form-mailer/Code.gs); multi-value fields (siete) get joined so none are lost
  const body = {
    meno: data.get('meno'),
    firma: data.get('firma') || '-',
    email: data.get('email'),
    telefon: data.get('telefon') || '-',
    siete: data.getAll('siete').join(', ') || '-',
    sprava: data.get('sprava'),
  };
  status.className = 'form__status';
  status.textContent = t.sending;
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: JSON.stringify(body),
      // text/plain keeps it a "simple" request — Apps Script can't answer a CORS preflight
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) throw new Error(json.error || res.status);
    form.reset();
    status.classList.add('ok');
    status.textContent = t.ok;
  } catch {
    status.classList.add('err');
    status.textContent = t.err;
  }
});

/* ---------- quote calculator ---------- */
// budget slider stops in € — the last one reads as "and more"
const SPEND = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000];
const plSk = (n, one, few, many) => `${n} ${n === 1 ? one : n < 5 ? few : many}`;
const plEn = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const CALC = {
  sk: {
    social: 'Správa sociálnych sietí', content: 'Tvorba obsahu', reels: 'Reels & TikTok', ads: 'Platená reklama',
    strategy: 'Stratégia a reporting', web: 'Web design', care: 'Hosting a údržba webu',
    audit: 'audit', report: 'mesačný report', call: 'strategický call',
    landing: 'Landing page', business: 'Firemný web', eshop: 'E-shop',
    posts: n => plSk(n, 'post', 'posty', 'postov'), days: n => plSk(n, 'natáčací deň', 'natáčacie dni', 'natáčacích dní'),
    videos: n => plSk(n, 'video', 'videá', 'videí'), months: n => plSk(n, 'mesiac', 'mesiace', 'mesiacov'),
    community: 'komentáre a DM', drone: 'dron', webcopy: 'texty', lang: '2 jazyky',
    mo: '/ mes.', once: 'jednorazovo', monthly: 'Mesačne', oneoff: 'Jednorazovo', spend: 'Rozpočet', term: 'Spolupráca',
    empty: 'Zatiaľ prázdne — vyber si službu.',
    intro: 'Ahoj, mám záujem o ponuku z kalkulačky:',
  },
  en: {
    social: 'Social media management', content: 'Content creation', reels: 'Reels & TikTok', ads: 'Paid ads',
    strategy: 'Strategy & reporting', web: 'Web design', care: 'Hosting & maintenance',
    audit: 'audit', report: 'monthly report', call: 'strategy call',
    landing: 'Landing page', business: 'Business site', eshop: 'E-shop',
    posts: n => plEn(n, 'post'), days: n => plEn(n, 'shoot day'), videos: n => plEn(n, 'video'), months: n => plEn(n, 'month'),
    community: 'comments & DMs', drone: 'drone', webcopy: 'copy', lang: '2 languages',
    mo: '/ mo', once: 'one-off', monthly: 'Monthly', oneoff: 'One-off', spend: 'Budget', term: 'Commitment',
    empty: 'Nothing here yet — pick a service.',
    intro: "Hi, I'm interested in a quote from your calculator:",
  },
};

const calc = $('#calc');
const loc = () => (root.lang === 'en' ? 'en-GB' : 'sk-SK');
const clamp = inp => Math.min(+inp.max, Math.max(+inp.min, Math.round(inp.value) || +inp.min));

const quote = () => {
  const d = new FormData(calc), t = CALC[root.lang] || CALC.sk;
  const on = d.getAll('svc'), lines = [];
  const add = (svc, detail, monthly = true, name = t[svc]) => lines.push({ svc, name, detail: detail.filter(Boolean).join(' · '), monthly });

  if (on.includes('social')) add('social', [d.getAll('net').join(', '), t.posts(+d.get('posts')), d.has('stories') && 'stories', d.has('community') && t.community]);
  if (on.includes('content')) add('content', [t.days(clamp(calc.elements.days)), d.has('drone') && t.drone]);
  if (on.includes('reels')) add('reels', [t.videos(+d.get('videos'))]);
  if (on.includes('ads')) add('ads', [d.getAll('plat').join(', ')]);
  if (on.includes('strategy')) add('strategy', [d.has('audit') && t.audit, d.has('report') && t.report, d.has('call') && t.call]);
  if (on.includes('web')) {
    add('web', [t[d.get('webtype')], d.has('webcopy') && t.webcopy, d.has('seo') && 'SEO', d.has('weblang') && t.lang], false);
    if (d.has('care')) add('web', [], true, t.care);
  }

  const i = +d.get('spend'), monthly = lines.some(l => l.monthly);
  const spend = `${SPEND[i].toLocaleString(loc())} €${i === SPEND.length - 1 ? ' +' : ''}`;
  return {
    t, on, lines, monthly, term: +d.get('term'), nets: d.getAll('net'),
    spend: `${spend} ${monthly || !lines.length ? t.mo : t.once}`,
  };
};

$('[data-no]', calc).textContent = `#93-${1000 + Math.floor(Math.random() * 9000)}`;

const renderCalc = () => {
  const q = quote(), { t } = q;

  $$('.opt', calc).forEach(el => { el.hidden = !q.on.includes(el.dataset.svc); });
  $('.calc__empty', calc).hidden = q.on.length > 0;
  $('[data-term]', calc).hidden = !q.monthly;
  $$('.range', calc).forEach(r => {
    r.style.setProperty('--p', (r.value - r.min) / (r.max - r.min));
    $(`[data-out="${r.name}"]`, calc).textContent = r.name === 'spend' ? q.spend : r.value;
  });
  $('[data-date]', calc).textContent = new Date().toLocaleDateString(loc());

  const row = l => `<li><span><b>${l.name}</b>${l.detail ? `<small>${l.detail}</small>` : ''}</span><i></i><strong>✓</strong></li>`;
  const group = (title, ls) => (ls.length ? `<li class="receipt__group">${title}</li>` + ls.map(row).join('') : '');
  $('[data-lines]', calc).innerHTML = q.lines.length
    ? group(q.monthly ? `${t.monthly} · ${t.months(q.term)}` : t.monthly, q.lines.filter(l => l.monthly)) + group(t.oneoff, q.lines.filter(l => !l.monthly))
    : `<li class="receipt__empty">${t.empty}</li>`;
  $('[data-total]', calc).textContent = q.spend;
  $('[data-bar]', calc).textContent = q.spend;
  $('[data-cta]', calc).disabled = !q.lines.length;
};

calc.addEventListener('input', e => {
  const el = e.target;
  // keep at least one network / ad platform ticked
  if (['net', 'plat'].includes(el.name) && !$(`[name="${el.name}"]:checked`, calc)) el.checked = true;
  renderCalc();
});
calc.addEventListener('change', e => {
  if (e.target.type !== 'number') return;
  e.target.value = clamp(e.target);
  renderCalc();
});
calc.addEventListener('submit', e => e.preventDefault());
$$('[data-step]', calc).forEach(btn => btn.addEventListener('click', () => {
  const inp = $('input', btn.parentElement);
  inp.value = +inp.value + +btn.dataset.step;
  inp.value = clamp(inp);
  renderCalc();
}));
langBtn.addEventListener('click', renderCalc);

// hand the selection over to the contact form
let lastPitch = '';
$('[data-cta]', calc).addEventListener('click', () => {
  const q = quote(), { t } = q, area = form.elements.sprava;
  const pitch = [
    t.intro,
    ...q.lines.map(l => `• ${l.name}${l.detail ? ` (${l.detail})` : ''}`),
    q.monthly && `${t.term}: ${t.months(q.term)}`,
    `${t.spend}: ${q.spend}`,
  ].filter(Boolean).join('\n');
  area.value = lastPitch && area.value.includes(lastPitch)
    ? area.value.replace(lastPitch, pitch)
    : [area.value.trim(), pitch].filter(Boolean).join('\n\n');
  lastPitch = pitch;
  if (q.on.includes('social')) $$('[name="siete"]', form).forEach(c => { if (q.nets.includes(c.value)) c.checked = true; });
  $('#kontakt').scrollIntoView();
  form.elements.meno.focus({ preventScroll: true });
});

renderCalc();
