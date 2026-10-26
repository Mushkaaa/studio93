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
  langBtn.setAttribute('aria-label', lang === 'sk' ? 'Switch to English' : 'Prepnúť do slovenčiny');
  try { localStorage.setItem('s93-lang', lang); } catch {}
};
langBtn.addEventListener('click', () => setLang(root.lang === 'sk' ? 'en' : 'sk'));
try { if (localStorage.getItem('s93-lang') === 'en') setLang('en'); } catch {}

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
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    $$('.feed__item').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg) scale(1.03)`;
        el.style.zIndex = 2;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; el.style.zIndex = ''; });
    });
  }
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
  // ponytail: no backend until a Formspree ID is set — fall back to the visitor's mail app
  if (form.action.includes('YOUR_FORM_ID')) {
    const body = ['meno', 'firma', 'email', 'telefon', 'sprava']
      .map(k => `${k}: ${data.get(k) || '-'}`)
      .concat(`siete: ${data.getAll('siete').join(', ') || '-'}`)
      .join('\n');
    location.href = `mailto:${form.dataset.mail}?subject=${encodeURIComponent('Spolupráca — ' + (data.get('firma') || data.get('meno')))}&body=${encodeURIComponent(body)}`;
    return;
  }
  status.className = 'form__status';
  status.textContent = t.sending;
  try {
    const res = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    status.classList.add('ok');
    status.textContent = t.ok;
  } catch {
    status.classList.add('err');
    status.textContent = t.err;
  }
});

/* ---------- price calculator ---------- */
// PLACEHOLDER: všetky ceny v € — uprav podľa reálneho cenníka, kalkulačka číta len odtiaľto
const PRICE = {
  social: { network: 120, post: 15, stories: 90, community: 110 },
  content: { day: 240, drone: 120 },
  reels: { video: 70 },
  ads: { min: 150, rate: .15, platform: 60 }, // správa = max(min, rate × rozpočet) + platform za každú ďalšiu platformu
  web: { landing: 590, business: 1190, eshop: 2390, copy: 190, seo: 190, lang: 250, care: 39 },
  strategy: 290,
  term: { 1: 0, 3: .05, 6: .1, 12: .15 },
};
const plSk = (n, one, few, many) => `${n} ${n === 1 ? one : n < 5 ? few : many}`;
const plEn = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const CALC = {
  sk: {
    social: 'Správa sociálnych sietí', content: 'Foto & video', reels: 'Reels & TikTok', ads: 'Správa reklamy',
    web: 'Web design', care: 'Hosting a údržba webu', strategy: 'Audit & stratégia',
    landing: 'Landing page', business: 'Firemný web', eshop: 'E-shop',
    posts: n => plSk(n, 'post', 'posty', 'postov'), days: n => plSk(n, 'natáčací deň', 'natáčacie dni', 'natáčacích dní'),
    videos: n => plSk(n, 'video', 'videá', 'videí'), months: n => plSk(n, 'mesiac', 'mesiace', 'mesiacov'),
    community: 'komentáre a DM', drone: 'dron', copy: 'texty', lang: '2 jazyky', budget: 'rozpočet',
    unit: { mo: '/ mes.', day: '/ deň', net: '/ sieť', post: '/ post', video: '/ video' },
    monthly: 'Mesačne', once: 'Jednorazovo', discount: 'Zľava', term: 'Spolupráca', empty: 'Zatiaľ prázdne — vyber si službu.',
    adNote: b => `+ rozpočet na reklamu ${b} / mes. platíš priamo platforme.`,
    save: (s, m) => `Za ${m} ušetríš ${s}.`,
    intro: 'Ahoj, mám záujem o túto ponuku z kalkulačky:',
  },
  en: {
    social: 'Social media management', content: 'Photo & video', reels: 'Reels & TikTok', ads: 'Ads management',
    web: 'Web design', care: 'Hosting & maintenance', strategy: 'Audit & strategy',
    landing: 'Landing page', business: 'Business site', eshop: 'E-shop',
    posts: n => plEn(n, 'post'), days: n => plEn(n, 'shoot day'), videos: n => plEn(n, 'video'), months: n => plEn(n, 'month'),
    community: 'comments & DMs', drone: 'drone', copy: 'copy', lang: '2 languages', budget: 'budget',
    unit: { mo: '/ mo', day: '/ day', net: '/ network', post: '/ post', video: '/ video' },
    monthly: 'Monthly', once: 'One-off', discount: 'Discount', term: 'Commitment', empty: 'Nothing here yet — pick a service.',
    adNote: b => `+ ${b} / mo ad budget, paid directly to the platform.`,
    save: (s, m) => `You save ${s} over ${m}.`,
    intro: "Hi, I'm interested in this quote from your calculator:",
  },
};

const calc = $('#calc');
const loc = () => (root.lang === 'en' ? 'en-GB' : 'sk-SK');
const money = n => `${Math.round(n).toLocaleString(loc())} €`;
const sum = ls => ls.reduce((s, l) => s + l.price, 0);
const clamp = inp => Math.min(+inp.max, Math.max(+inp.min, Math.round(inp.value) || +inp.min));

const quote = () => {
  const d = new FormData(calc), t = CALC[root.lang] || CALC.sk, P = PRICE;
  const on = d.getAll('svc'), lines = [];
  const opt = (k, v) => (d.has(k) ? v : 0);
  const add = (svc, name, detail, price, monthly = true) =>
    lines.push({ svc, name, detail: detail.filter(Boolean).join(' · '), price: Math.round(price), monthly });

  if (on.includes('social')) {
    const nets = d.getAll('net'), posts = +d.get('posts');
    add('social', t.social, [nets.join(', '), t.posts(posts), d.has('stories') && 'stories', d.has('community') && t.community],
      nets.length * P.social.network + posts * P.social.post + opt('stories', P.social.stories) + opt('community', P.social.community));
  }
  if (on.includes('content')) {
    const days = clamp(calc.elements.days);
    add('content', t.content, [t.days(days), d.has('drone') && t.drone], days * (P.content.day + opt('drone', P.content.drone)));
  }
  if (on.includes('reels')) {
    const n = +d.get('videos');
    add('reels', t.reels, [t.videos(n)], n * P.reels.video);
  }
  let budget = 0;
  if (on.includes('ads')) {
    const plats = d.getAll('plat');
    budget = +d.get('budget');
    add('ads', t.ads, [plats.join(', '), `${t.budget} ${money(budget)}`],
      Math.max(P.ads.min, budget * P.ads.rate) + (plats.length - 1) * P.ads.platform);
  }
  if (on.includes('web')) {
    const type = d.get('webtype');
    add('web', t.web, [t[type], d.has('webcopy') && t.copy, d.has('seo') && 'SEO', d.has('weblang') && t.lang],
      P.web[type] + opt('webcopy', P.web.copy) + opt('seo', P.web.seo) + opt('weblang', P.web.lang), false);
    if (d.has('care')) add('web', t.care, [], P.web.care);
  }
  if (on.includes('strategy')) add('strategy', t.strategy, [], P.strategy, false);

  const term = +d.get('term'), disc = P.term[term] || 0, raw = sum(lines.filter(l => l.monthly));
  return { t, on, lines, budget, term, disc, raw, nets: d.getAll('net'), m: Math.round(raw * (1 - disc)), o: sum(lines.filter(l => !l.monthly)) };
};

// static bits that only change with the language
const calcLabels = () => {
  const t = CALC[root.lang] || CALC.sk;
  $$('[data-price]', calc).forEach(el => {
    const [, plus, path] = el.dataset.price.match(/^(\+?)(.+)$/);
    el.textContent = `${plus}${money(path.split('.').reduce((o, k) => o[k], PRICE))}${el.dataset.unit ? ' ' + t.unit[el.dataset.unit] : ''}`;
  });
  $$('[data-disc]', calc).forEach(el => { el.textContent = `−${Math.round(PRICE.term[el.dataset.disc] * 100)} %`; });
  $('[data-date]', calc).textContent = new Date().toLocaleDateString(loc());
};
$('[data-no]', calc).textContent = `#93-${1000 + Math.floor(Math.random() * 9000)}`;

const totals = { m: $('[data-total="m"] strong', calc), o: $('[data-total="o"] strong', calc) };
const bar = $('[data-bar]', calc);
const live = $('[data-live]', calc);
const cta = $('[data-cta]', calc);
const shown = { m: 0, o: 0 };
let raf, liveTimer;

const renderCalc = () => {
  const q = quote(), { t } = q;

  $$('.opt', calc).forEach(el => {
    const ls = q.lines.filter(l => l.svc === el.dataset.svc);
    const once = sum(ls.filter(l => !l.monthly)), mo = sum(ls.filter(l => l.monthly));
    el.hidden = !q.on.includes(el.dataset.svc);
    $('.opt__sum', el).textContent = [once && money(once), mo && `${money(mo)} ${t.unit.mo}`].filter(Boolean).join(' + ');
  });
  $('.calc__empty', calc).hidden = q.on.length > 0;
  $('[data-term]', calc).hidden = !q.raw;
  $$('.range', calc).forEach(r => {
    r.style.setProperty('--p', (r.value - r.min) / (r.max - r.min));
    $(`[data-out="${r.name}"]`, calc).textContent = r.name === 'budget' ? money(r.value) : r.value;
  });

  const row = (name, detail, price, cls = '') =>
    `<li class="${cls}"><span><b>${name}</b>${detail ? `<small>${detail}</small>` : ''}</span><i></i><strong>${price}</strong></li>`;
  const group = (title, ls) => (ls.length ? `<li class="receipt__group">${title}</li>` + ls.map(l => row(l.name, l.detail, money(l.price))).join('') : '');
  $('[data-lines]', calc).innerHTML = q.lines.length
    ? group(t.monthly, q.lines.filter(l => l.monthly))
      + (q.disc && q.raw ? row(`${t.discount} −${Math.round(q.disc * 100)} %`, t.months(q.term), `−${money(q.raw - q.m)}`, 'receipt__disc') : '')
      + group(t.once, q.lines.filter(l => !l.monthly))
    : `<li class="receipt__empty">${t.empty}</li>`;
  $('[data-note]', calc).textContent = [q.budget && t.adNote(money(q.budget)), q.disc && q.raw && t.save(money((q.raw - q.m) * q.term), t.months(q.term))].filter(Boolean).join(' ');

  totals.m.parentElement.hidden = !q.m && !!q.o;
  totals.o.parentElement.hidden = !q.o;
  cta.disabled = !q.lines.length;

  // count the totals up/down instead of jumping
  const to = { m: q.m, o: q.o }, from = { ...shown }, t0 = performance.now();
  cancelAnimationFrame(raf);
  const frame = now => {
    const k = calm ? 1 : Math.min((now - t0) / 450, 1), e = 1 - (1 - k) ** 3;
    for (const key in to) {
      shown[key] = from[key] + (to[key] - from[key]) * e;
      totals[key].textContent = money(shown[key]);
    }
    bar.textContent = [(q.m || !q.o) && `${money(shown.m)} ${t.unit.mo}`, q.o && money(shown.o)].filter(Boolean).join(' + ');
    if (k < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => { live.textContent = `${t.monthly}: ${money(q.m)}. ${t.once}: ${money(q.o)}.`; }, 700);
};

calc.addEventListener('input', e => {
  const el = e.target;
  // keep at least one network / ad platform ticked
  if ((el.name === 'net' || el.name === 'plat') && !$(`[name="${el.name}"]:checked`, calc)) el.checked = true;
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
langBtn.addEventListener('click', () => { calcLabels(); renderCalc(); });

// hand the quote over to the contact form
let lastPitch = '';
cta.addEventListener('click', () => {
  const q = quote(), { t } = q, area = form.elements.sprava;
  const pitch = [
    t.intro,
    ...q.lines.map(l => `• ${l.name}${l.detail ? ` (${l.detail})` : ''}: ${money(l.price)}${l.monthly ? ` ${t.unit.mo}` : ''}`),
    q.raw && `${t.term}: ${t.months(q.term)}${q.disc ? ` (−${Math.round(q.disc * 100)} %)` : ''}`,
    [q.m && `${t.monthly}: ${money(q.m)}`, q.o && `${t.once}: ${money(q.o)}`].filter(Boolean).join(' · '),
  ].filter(Boolean).join('\n');
  area.value = lastPitch && area.value.includes(lastPitch)
    ? area.value.replace(lastPitch, pitch)
    : [area.value.trim(), pitch].filter(Boolean).join('\n\n');
  lastPitch = pitch;
  if (q.on.includes('social')) $$('[name="siete"]', form).forEach(c => { if (q.nets.includes(c.value)) c.checked = true; });
  $('#kontakt').scrollIntoView();
  form.elements.meno.focus({ preventScroll: true });
});

calcLabels();
renderCalc();
