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
