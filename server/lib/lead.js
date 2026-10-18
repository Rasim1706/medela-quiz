/**
 * Общая логика приёма заявки: проверка данных, карточка для Telegram, отправка через Bot API.
 * Используется адаптерами для Vercel (server/vercel) и Netlify (server/netlify).
 *
 * Переменные окружения (задаются только на сервере, никогда во фронтенде):
 *   TELEGRAM_BOT_TOKEN — токен бота от @BotFather
 *   TELEGRAM_CHAT_ID   — id чата/группы менеджеров (например, -1001234567890)
 *   ALLOWED_ORIGIN     — необязательно: домен квиза, если он отличается от домена функции
 *                        (например, https://quiz.medela.uz). Можно несколько через запятую.
 */
'use strict';

const LANGS = ['ru', 'uz'];
const PHONE_RE = /^\+998\d{9}$/;

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 200);
}

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatPhone(phone) {
  const d = phone.slice(4);
  return '+998 ' + d.slice(0, 2) + ' ' + d.slice(2, 5) + ' ' + d.slice(5, 7) + ' ' + d.slice(7, 9);
}

function validateLead(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'invalid_body' };
  }
  // Ловушка для ботов (поле website скрыто от людей)
  if (body.website) return { spam: true };

  const lead = {
    lang: LANGS.includes(body.lang) ? body.lang : 'ru',
    age: clean(body.age, 60),
    lastCheckup: clean(body.lastCheckup, 120),
    motivation: clean(body.motivation, 200),
    focusAreas: Array.isArray(body.focusAreas) ? body.focusAreas.slice(0, 10).map((v) => clean(v, 80)).filter(Boolean) : [],
    city: clean(body.city, 80),
    name: clean(body.name, 80),
    phone: clean(body.phone, 20).replace(/[^\d+]/g, ''),
    callTime: clean(body.callTime, 60),
    utm_source: clean(body.utm_source),
    utm_medium: clean(body.utm_medium),
    utm_campaign: clean(body.utm_campaign),
    utm_content: clean(body.utm_content),
    utm_term: clean(body.utm_term),
    fbclid: clean(body.fbclid, 300),
    referrer: clean(body.referrer, 300),
    submittedAt: clean(body.submittedAt, 40)
  };

  if (lead.name.length < 2) return { error: 'invalid_name' };
  if (!PHONE_RE.test(lead.phone)) return { error: 'invalid_phone' };
  return { lead };
}

function buildMessage(lead) {
  const time = new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent', dateStyle: 'short', timeStyle: 'short' });
  const line = (emoji, label, value) => (value ? emoji + ' <b>' + label + ':</b> ' + escapeHtml(value) : null);

  const utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .filter((k) => lead[k])
    .map((k) => k.replace('utm_', '') + '=' + lead[k])
    .join(' · ');

  const rows = [
    '🩺 <b>Новая заявка на Check-up</b>',
    '',
    line('👤', 'Имя', lead.name),
    line('📞', 'Телефон', formatPhone(lead.phone)),
    line('🕐', 'Удобное время', lead.callTime),
    '🌐 <b>Язык:</b> ' + lead.lang.toUpperCase(),
    '',
    line('🎂', 'Возраст', lead.age),
    line('📅', 'Последнее обследование', lead.lastCheckup),
    line('💡', 'Мотивация', lead.motivation),
    line('🔍', 'Проверить в первую очередь', lead.focusAreas.join(', ')),
    line('📍', 'Город', lead.city),
    '',
    line('📊', 'UTM', utm),
    lead.fbclid ? '📣 <b>Источник:</b> Meta (fbclid)' : null,
    line('🔗', 'Referrer', lead.referrer),
    line('🗓', 'Получено', time + ' (Ташкент)')
  ];

  return rows
    .filter((r) => r !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function sendToTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set');

  const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML', disable_web_page_preview: true })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error('Telegram API error: ' + res.status + ' ' + (data.description || ''));
}

function corsHeaders(origin) {
  const allowed = (process.env.ALLOWED_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin'
  };
}

/**
 * Платформо-независимый обработчик.
 * @returns {{status:number, headers:object, body:object|null}}
 */
async function handleLead({ method, origin, body }) {
  const headers = corsHeaders(origin);
  if (method === 'OPTIONS') return { status: 204, headers, body: null };
  if (method !== 'POST') return { status: 405, headers: Object.assign({ Allow: 'POST, OPTIONS' }, headers), body: { ok: false, error: 'method_not_allowed' } };

  const result = validateLead(body);
  if (result.spam) return { status: 200, headers, body: { ok: true } };
  if (result.error) return { status: 400, headers, body: { ok: false, error: result.error } };

  try {
    await sendToTelegram(buildMessage(result.lead));
    return { status: 200, headers, body: { ok: true } };
  } catch (err) {
    console.error('[lead] ' + err.message);
    return { status: 502, headers, body: { ok: false, error: 'delivery_failed' } };
  }
}

module.exports = { handleLead, validateLead, buildMessage };
