// STUDIO 93 — contact form mailer (Google Apps Script web app)
// Setup: script.google.com → New project → paste this file → Deploy → New deployment →
// type "Web app", Execute as "Me", Who has access "Anyone" → copy the /exec URL into
// the form's action in alexa/index.html. After editing this file, redeploy
// (Deploy → Manage deployments → edit → New version) so the URL keeps working.

const TO = 'martinpospisil2000@gmail.com';
const MAX_PER_HOUR = 30; // crude flood guard across all visitors
const FIELDS = { meno: 'Meno', firma: 'Firma', email: 'E-mail', telefon: 'Telefón', siete: 'Siete', sprava: 'Správa' };

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d._honey) return reply(true); // bot filled the hidden field — pretend it worked
    if (!d.meno || !d.sprava || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email || '')) return reply(false, 'invalid');

    const cache = CacheService.getScriptCache();
    const sent = Number(cache.get('sent') || 0);
    if (sent >= MAX_PER_HOUR) return reply(false, 'rate');
    cache.put('sent', String(sent + 1), 3600);

    const val = k => String(d[k] || '-').slice(0, 5000);
    const rows = Object.keys(FIELDS).map(k =>
      `<tr><th align="left" valign="top" style="padding:6px 12px 6px 0">${FIELDS[k]}</th><td style="padding:6px 0">${esc(val(k)).replace(/\n/g, '<br>')}</td></tr>`
    ).join('');

    MailApp.sendEmail({
      to: TO,
      replyTo: val('email'),
      subject: `Nový dopyt — ${val('firma') !== '-' ? val('firma') : val('meno')}`.slice(0, 200),
      body: Object.keys(FIELDS).map(k => `${FIELDS[k]}: ${val(k)}`).join('\n'),
      htmlBody: `<table style="font:14px/1.5 sans-serif">${rows}</table>`,
    });
    return reply(true);
  } catch (err) {
    return reply(false, 'server');
  }
}

const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function reply(ok, error) {
  return ContentService.createTextOutput(JSON.stringify({ ok, error })).setMimeType(ContentService.MimeType.JSON);
}
