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
  if (data.get('_honey')) return; // bot filled the hidden field
  // FormSubmit takes JSON; multi-value fields (siete) get joined so none are lost
  const body = {
    _subject: `Nový dopyt — ${data.get('firma') || data.get('meno')}`,
    _template: 'table',
    _replyto: data.get('email'),
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
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || res.status);
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
    social: 'Správa sociálnych sietí', content: 'Foto & video', reels: 'Reels & TikTok', ads: 'Platená reklama',
    web: 'Web design', care: 'Hosting a údržba webu', strategy: 'Audit & stratégia',
    landing: 'Landing page', business: 'Firemný web', eshop: 'E-shop',
    posts: n => plSk(n, 'post', 'posty', 'postov'), days: n => plSk(n, 'natáčací deň', 'natáčacie dni', 'natáčacích dní'),
    videos: n => plSk(n, 'video', 'videá', 'videí'), months: n => plSk(n, 'mesiac', 'mesiace', 'mesiacov'),
    community: 'komentáre a DM', drone: 'dron', copy: 'texty', lang: '2 jazyky',
    mo: '/ mes.', once: 'jednorazovo', monthly: 'Mesačne', oneoff: 'Jednorazovo', spend: 'Rozpočet', term: 'Spolupráca',
    empty: 'Zatiaľ prázdne — vyber si službu.',
    intro: 'Ahoj, mám záujem o ponuku z kalkulačky:',
  },
  en: {
    social: 'Social media management', content: 'Photo & video', reels: 'Reels & TikTok', ads: 'Paid ads',
    web: 'Web design', care: 'Hosting & maintenance', strategy: 'Audit & strategy',
    landing: 'Landing page', business: 'Business site', eshop: 'E-shop',
    posts: n => plEn(n, 'post'), days: n => plEn(n, 'shoot day'), videos: n => plEn(n, 'video'), months: n => plEn(n, 'month'),
    community: 'comments & DMs', drone: 'drone', copy: 'copy', lang: '2 languages',
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
  if (on.includes('web')) {
    add('web', [t[d.get('webtype')], d.has('webcopy') && t.copy, d.has('seo') && 'SEO', d.has('weblang') && t.lang], false);
    if (d.has('care')) add('web', [], true, t.care);
  }
  if (on.includes('strategy')) add('strategy', [], false);

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
