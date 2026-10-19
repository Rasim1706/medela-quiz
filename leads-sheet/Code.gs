/**
 * MEDELA — учёт лидов в Google Таблице.
 *
 * Что делает:
 *  • setup()  — создаёт листы «Лиды», «Сводка», «Справочники» с колонками, выпадающими списками,
 *               цветами статусов и формулами сводки. Запустить один раз.
 *  • doPost() — приёмник заявок (веб-приложение). Боты отправляют сюда заявку:
 *               либо JSON с полями, либо просто текст сообщения из Telegram-группы ({"text": "..."}).
 *               Текст разбирается автоматически (форматы «Квиз Check-up» и «MedelaStaffBot»).
 *
 * Установка — в leads-sheet/README.md.
 */

var SHEET_LEADS = 'Лиды';
var SHEET_SUMMARY = 'Сводка';
var SHEET_LISTS = 'Справочники';

// Порядок колонок листа «Лиды». Меняя порядок, запустите setup() заново на пустой таблице.
var COLUMNS = [
  { key: 'n', title: '№', width: 50 },
  { key: 'date', title: 'Дата и время', width: 140 },
  { key: 'channel', title: 'Канал', width: 140 },
  { key: 'platform', title: 'Площадка', width: 110 },
  { key: 'campaign', title: 'Кампания / объявление', width: 190 },
  { key: 'name', title: 'Имя', width: 170 },
  { key: 'phone', title: 'Телефон', width: 135 },
  { key: 'service', title: 'Услуга / направление', width: 190 },
  { key: 'doctor', title: 'Врач', width: 150 },
  { key: 'lang', title: 'Язык', width: 60 },
  { key: 'city', title: 'Город', width: 100 },
  { key: 'callTime', title: 'Когда удобно', width: 150 },
  { key: 'status', title: 'Статус', width: 130 },
  { key: 'visitDate', title: 'Дата визита', width: 105 },
  { key: 'amount', title: 'Сумма, сум', width: 110 },
  { key: 'manager', title: 'Ответственный', width: 120 },
  { key: 'comment', title: 'Комментарий', width: 220 },
  { key: 'repeat', title: 'Повтор', width: 75 },
  { key: 'details', title: 'Детали заявки', width: 260 },
  { key: 'tag', title: 'Метка / UTM', width: 220 },
  { key: 'telegramId', title: 'Telegram ID', width: 110 },
  { key: 'externalId', title: 'ID в системе', width: 100 }
];

var CHANNELS = ['Квиз Check-up', 'Telegram-бот', 'Сайт /zapis', 'Звонок', 'Instagram Direct', 'Telegram (личка)', 'Пришёл сам', 'Другое'];
var PLATFORMS = ['Instagram', 'Facebook', 'Meta', 'Telegram', 'Google', 'Органика', 'Не определено'];
var STATUSES = ['Новый', 'Не дозвонились', 'В работе', 'Записан', 'Пришёл', 'Отказ', 'Спам / дубль'];
var STATUS_COLORS = {
  'Новый': '#E3F2FD', 'Не дозвонились': '#FFF4E5', 'В работе': '#FFF9C4', 'Записан': '#E8F5E9',
  'Пришёл': '#C8E6C9', 'Отказ': '#F5F5F5', 'Спам / дубль': '#ECEFF1'
};
var REPEAT_DAYS = 30;

/* =========================== Меню =========================== */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('MEDELA')
    .addItem('Настроить таблицу', 'setup')
    .addItem('Показать ссылку для ботов', 'showWebhookInfo')
    .addItem('Добавить тестовые заявки', 'addTestLeads')
    .addToUi();
}

/* =========================== Настройка =========================== */

function setup() {
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetLocale('ru_RU');
  ss.setSpreadsheetTimeZone('Asia/Tashkent');

  var lists = getOrCreate_(ss, SHEET_LISTS);
  lists.clear();
  writeList_(lists, 1, 'Каналы', CHANNELS);
  writeList_(lists, 2, 'Площадки', PLATFORMS);
  writeList_(lists, 3, 'Статусы', STATUSES);
  lists.getRange(1, 4).setValue('Ответственные').setFontWeight('bold');
  if (!lists.getRange(2, 4).getValue()) lists.getRange(2, 4, 2, 1).setValues([['Администратор 1'], ['Администратор 2']]);
  lists.setColumnWidths(1, 4, 170);

  var sh = getOrCreate_(ss, SHEET_LEADS);
  var header = COLUMNS.map(function (c) { return c.title; });
  sh.getRange(1, 1, 1, header.length).setValues([header])
    .setFontWeight('bold').setBackground('#0F4650').setFontColor('#FFFFFF')
    .setVerticalAlignment('middle').setWrap(true);
  sh.setRowHeight(1, 40);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(2);
  COLUMNS.forEach(function (c, i) { sh.setColumnWidth(i + 1, c.width); });

  var rows = sh.getMaxRows() - 1;
  col_(sh, 'date').offset(1, 0, rows).setNumberFormat('dd.mm.yyyy hh:mm');
  col_(sh, 'visitDate').offset(1, 0, rows).setNumberFormat('dd.mm.yyyy');
  col_(sh, 'amount').offset(1, 0, rows).setNumberFormat('#,##0');
  col_(sh, 'phone').offset(1, 0, rows).setNumberFormat('@');

  validation_(sh, 'channel', lists.getRange('A2:A50'));
  validation_(sh, 'platform', lists.getRange('B2:B50'));
  validation_(sh, 'status', lists.getRange('C2:C50'));
  validation_(sh, 'manager', lists.getRange('D2:D50'), true);

  // Цвет строки по статусу
  var statusLetter = letter_(colIndex_('status'));
  var lastLetter = letter_(COLUMNS.length);
  var range = sh.getRange('A2:' + lastLetter);
  var rules = Object.keys(STATUS_COLORS).map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + statusLetter + '2="' + s + '"')
      .setBackground(STATUS_COLORS[s]).setRanges([range]).build();
  });
  sh.setConditionalFormatRules(rules);
  if (!sh.getFilter()) sh.getRange(1, 1, sh.getMaxRows(), COLUMNS.length).createFilter();

  buildSummary_(ss);
  ss.setActiveSheet(sh);
  SpreadsheetApp.getActive().toast('Таблица готова. Дальше: Развернуть → Новое развёртывание → Веб-приложение.', 'MEDELA', 8);
}

function buildSummary_(ss) {
  var s = getOrCreate_(ss, SHEET_SUMMARY);
  s.clear();
  // Формулы в setFormula всегда пишутся с запятыми (английский синтаксис), Таблица сама покажет их по-русски
  var L = "'" + SHEET_LEADS + "'!";
  var c = function (key) { var l = letter_(colIndex_(key)); return L + '$' + l + '$2:$' + l; };
  var D = c('date'), P = c('platform'), CH = c('channel'), ST = c('status'), AM = c('amount'), RP = c('repeat');
  var period = D + ',">="&$B$2,' + D + ',"<"&$D$2+1';
  var cnt = function (cond) { return 'COUNTIFS(' + cond + ',' + period + ')'; };

  s.getRange('A1').setValue('Сводка по лидам MEDELA').setFontSize(16).setFontWeight('bold');
  s.getRange('A2').setValue('Период с');
  s.getRange('C2').setValue('по');
  s.getRange('B2').setFormula('=EOMONTH(TODAY(),-1)+1');
  s.getRange('D2').setFormula('=TODAY()');
  s.getRange('B2:D2').setNumberFormat('dd.mm.yyyy');
  s.getRange('B2').setBackground('#FFF9C4').setNote('Дату можно поменять вручную');
  s.getRange('D2').setBackground('#FFF9C4').setNote('Дату можно поменять вручную');

  // По площадкам
  var head = ['Площадка', 'Лиды', 'Без повторов', 'Записан', 'Пришёл', 'Конверсия в визит', 'Выручка, сум', 'Расход на рекламу, сум', 'Цена лида', 'Цена визита'];
  s.getRange(4, 1, 1, head.length).setValues([head]);
  PLATFORMS.forEach(function (p, i) {
    var r = 5 + i, k = P + ',$A' + r;
    s.getRange(r, 1).setValue(p);
    s.getRange(r, 2).setFormula('=' + cnt(k));
    s.getRange(r, 3).setFormula('=' + cnt(k + ',' + RP + ',"<>Повтор"'));
    s.getRange(r, 4).setFormula('=' + cnt(k + ',' + ST + ',"Записан"') + '+E' + r);
    s.getRange(r, 5).setFormula('=' + cnt(k + ',' + ST + ',"Пришёл"'));
    s.getRange(r, 6).setFormula('=IFERROR(E' + r + '/C' + r + ',0)');
    s.getRange(r, 7).setFormula('=SUMIFS(' + AM + ',' + k + ',' + period + ')');
    s.getRange(r, 8).setBackground('#FFF9C4');
    s.getRange(r, 9).setFormula('=IF(H' + r + '="","",IFERROR(H' + r + '/C' + r + ',""))');
    s.getRange(r, 10).setFormula('=IF(H' + r + '="","",IFERROR(H' + r + '/E' + r + ',""))');
  });
  var tr = 5 + PLATFORMS.length;
  s.getRange(tr, 1).setValue('Итого');
  ['B', 'C', 'D', 'E', 'G', 'H'].forEach(function (col) {
    s.getRange(col + tr).setFormula('=SUM(' + col + '5:' + col + (tr - 1) + ')');
  });
  s.getRange('F' + tr).setFormula('=IFERROR(E' + tr + '/C' + tr + ',0)');
  s.getRange('I' + tr).setFormula('=IF(H' + tr + '=0,"",IFERROR(H' + tr + '/C' + tr + ',""))');
  s.getRange('J' + tr).setFormula('=IF(H' + tr + '=0,"",IFERROR(H' + tr + '/E' + tr + ',""))');
  styleTable_(s, 4, tr, head.length);
  s.getRange(tr, 1, 1, head.length).setFontWeight('bold');
  s.getRange(5, 6, tr - 4, 1).setNumberFormat('0%');
  s.getRange(5, 7, tr - 4, 4).setNumberFormat('#,##0');

  // По каналам
  var r0 = tr + 3;
  s.getRange(r0 - 1, 1).setValue('По каналам').setFontWeight('bold');
  s.getRange(r0, 1, 1, 5).setValues([['Канал', 'Лиды', 'Записан', 'Пришёл', 'Конверсия в визит']]);
  CHANNELS.forEach(function (ch, i) {
    var r = r0 + 1 + i, k = CH + ',$A' + r;
    s.getRange(r, 1).setValue(ch);
    s.getRange(r, 2).setFormula('=' + cnt(k));
    s.getRange(r, 3).setFormula('=' + cnt(k + ',' + ST + ',"Записан"') + '+D' + r);
    s.getRange(r, 4).setFormula('=' + cnt(k + ',' + ST + ',"Пришёл"'));
    s.getRange(r, 5).setFormula('=IFERROR(D' + r + '/B' + r + ',0)');
  });
  var rEnd = r0 + CHANNELS.length;
  styleTable_(s, r0, rEnd, 5);
  s.getRange(r0 + 1, 5, CHANNELS.length, 1).setNumberFormat('0%');

  // По статусам
  var q0 = rEnd + 3;
  s.getRange(q0 - 1, 1).setValue('По статусам').setFontWeight('bold');
  s.getRange(q0, 1, 1, 2).setValues([['Статус', 'Лиды']]);
  STATUSES.forEach(function (st, i) {
    var r = q0 + 1 + i;
    s.getRange(r, 1).setValue(st).setBackground(STATUS_COLORS[st]);
    s.getRange(r, 2).setFormula('=' + cnt(ST + ',$A' + r));
  });
  styleTable_(s, q0, q0 + STATUSES.length, 2);

  // По дням (последние 14 дней), колонки M–O
  var d0 = 4, dc = 13;
  s.getRange(d0 - 1, dc).setValue('Последние 14 дней').setFontWeight('bold');
  s.getRange(d0, dc, 1, 3).setValues([['День', 'Лиды', 'Пришёл']]);
  for (var i = 0; i < 14; i++) {
    var r = d0 + 1 + i, day = D + ',">="&M' + r + ',' + D + ',"<"&M' + r + '+1';
    s.getRange(r, dc).setFormula('=TODAY()-' + i);
    s.getRange(r, dc + 1).setFormula('=COUNTIFS(' + day + ')');
    s.getRange(r, dc + 2).setFormula('=COUNTIFS(' + day + ',' + ST + ',"Пришёл")');
  }
  s.getRange(d0 + 1, dc, 14, 1).setNumberFormat('dd.mm ddd');
  styleTable_(s, d0, d0 + 14, 3, dc);

  s.setColumnWidth(1, 170);
  s.setColumnWidths(2, 9, 110);
  s.setColumnWidths(11, 2, 30);
  s.setColumnWidth(13, 110);
  s.setFrozenRows(2);
}

/* =========================== Приём заявок =========================== */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var key = PropertiesService.getScriptProperties().getProperty('KEY');
    if (key && (!e.parameter || e.parameter.key !== key)) return json_({ ok: false, error: 'bad_key' });

    var body = {};
    try { body = JSON.parse(e.postData.contents); } catch (err) { body = { text: e.postData ? e.postData.contents : '' }; }
    var lead = body.text && !body.phone ? parseText(body.text) : normalizeFields(body);
    if (!lead.phone && !lead.name) return json_({ ok: false, error: 'empty_lead' });

    lock.waitLock(20000);
    var row = appendLead_(lead);
    return json_({ ok: true, row: row });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) { /* ничего */ }
  }
}

function doGet() {
  return json_({ ok: true, service: 'MEDELA leads', hint: 'POST JSON or {"text": "..."}' });
}

function appendLead_(lead) {
  var sh = SpreadsheetApp.getActive().getSheetByName(SHEET_LEADS);
  var last = sh.getLastRow();
  lead.n = last; // номер = номер строки - 1
  lead.date = lead.date || new Date();
  lead.status = lead.status || 'Новый';
  lead.repeat = isRepeat_(sh, lead.phone) ? 'Повтор' : '';
  var values = COLUMNS.map(function (c) { return lead[c.key] === undefined ? '' : lead[c.key]; });
  sh.getRange(last + 1, 1, 1, values.length).setValues([values]);
  return last + 1;
}

function isRepeat_(sh, phone) {
  if (!phone || sh.getLastRow() < 2) return false;
  var n = sh.getLastRow() - 1;
  var phones = col_(sh, 'phone').offset(1, 0, n).getValues();
  var dates = col_(sh, 'date').offset(1, 0, n).getValues();
  var since = Date.now() - REPEAT_DAYS * 24 * 3600 * 1000;
  for (var i = 0; i < n; i++) {
    if (String(phones[i][0]) === phone && dates[i][0] instanceof Date && dates[i][0].getTime() >= since) return true;
  }
  return false;
}

/* =========================== Разбор заявок =========================== */

/** Заявка JSON с полями (например, из функции квиза server/lib/lead.js). */
function normalizeFields(b) {
  var details = [];
  if (b.age) details.push('Возраст: ' + b.age);
  if (b.lastCheckup) details.push('Последнее обследование: ' + b.lastCheckup);
  if (b.motivation) details.push('Мотивация: ' + b.motivation);
  if (b.details) details.push(b.details);
  var focus = Array.isArray(b.focusAreas) ? b.focusAreas.join(', ') : (b.focusAreas || '');
  var tag = utmTag_(b);
  return {
    channel: b.channel || 'Квиз Check-up',
    platform: b.platform || detectPlatform_(b.utm_source, b.fbclid, b.referrer),
    campaign: b.campaign || [b.utm_campaign, b.utm_content].filter(Boolean).join(' / '),
    name: clean_(b.name),
    phone: normalizePhone(b.phone),
    service: clean_(b.service || focus),
    doctor: clean_(b.doctor),
    lang: String(b.lang || '').toUpperCase(),
    city: clean_(b.city),
    callTime: clean_(b.callTime),
    details: details.join('\n'),
    tag: tag,
    telegramId: clean_(b.telegramId),
    externalId: clean_(b.externalId)
  };
}

/** Текст сообщения из Telegram-группы. */
function parseText(text) {
  text = String(text || '').replace(/\r/g, '');
  if (/Заявка\s*#\s*\d+/.test(text)) return parseStaffBot_(text);
  return parseQuiz_(text);
}

// Формат «КВИЗ CHECK-UP / Новая заявка на Check-up» (поля «Метка: значение»)
function parseQuiz_(text) {
  var f = function (label) {
    var m = new RegExp(label + '\\s*:\\s*([^\\n]+(?:\\n(?![^\\n]*:)[^\\n]+)*)', 'i').exec(text);
    return m ? m[1].replace(/\s*\n\s*/g, ' ').trim() : '';
  };
  var utmLine = f('UTM');
  var utm = {};
  utmLine.split('·').forEach(function (part) {
    var kv = part.split('=');
    if (kv.length === 2) utm[kv[0].trim()] = kv[1].trim();
  });
  var details = [
    ['Возраст', f('Возраст')], ['Последнее обследование', f('Последнее обследование')], ['Мотивация', f('Мотивация')]
  ].filter(function (x) { return x[1]; }).map(function (x) { return x[0] + ': ' + x[1]; });
  return {
    channel: 'Квиз Check-up',
    platform: detectPlatform_(utm.source, /fbclid|meta/i.test(f('Источник')) ? 'yes' : '', f('Referrer')),
    campaign: [utm.campaign, utm.content].filter(Boolean).join(' / '),
    name: f('Имя'),
    phone: normalizePhone(f('Телефон')),
    service: f('Проверить в первую очередь'),
    lang: f('Язык').toUpperCase(),
    city: f('Город'),
    callTime: f('Удобное время'),
    details: details.join('\n'),
    tag: utmLine
  };
}

// Формат MedelaStaffBot: «Заявка #2 · Новая», строки с эмодзи и «• Поле: значение»
function parseStaffBot_(text) {
  var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  var byEmoji = function (emoji) {
    for (var i = 0; i < lines.length; i++) if (lines[i].indexOf(emoji) === 0) return lines[i].slice(emoji.length).trim();
    return '';
  };
  var bullet = function (label) {
    var m = new RegExp('[•·-]\\s*' + label + '\\s*:\\s*(.+)', 'i').exec(text);
    return m ? m[1].trim() : '';
  };
  var id = /Заявка\s*#\s*(\d+)/.exec(text);
  var tag = byEmoji('📣');
  // Метка вида «ru-fb-120253939186340684» или «ru-svc_uzi-instagram-c3»
  var parts = tag.split('-');
  var src = parts.length > 1 ? parts[1] : '';
  if (/^svc_/.test(src)) src = parts[2] || '';
  var langWord = bullet('Язык');
  var lang = /узб|uz/i.test(langWord) ? 'UZ' : (/рус|ru/i.test(langWord) ? 'RU' : (parts[0] || '').toUpperCase());
  var phone = byEmoji('📞');
  var tgId = (bullet('Telegram').match(/\d{5,}/) || [''])[0];
  return {
    channel: 'Telegram-бот',
    platform: detectPlatform_(src),
    campaign: parts.slice(2).join('-').replace(/^svc_[^-]*-?/, ''),
    name: byEmoji('👤'),
    phone: normalizePhone(phone),
    service: byEmoji('🩺'),
    doctor: bullet('Врач'),
    lang: lang,
    callTime: bullet('Когда удобно'),
    details: byEmoji('📍') ? 'Откуда: ' + byEmoji('📍') : '',
    tag: tag,
    telegramId: tgId,
    externalId: id ? '#' + id[1] : ''
  };
}

/* =========================== Помощники =========================== */

function normalizePhone(v) {
  var d = String(v || '').replace(/\D/g, '');
  if (d.length === 9) d = '998' + d;
  return d ? '+' + d : '';
}

function detectPlatform_(source, fbclid, referrer) {
  var s = String(source || '').toLowerCase();
  if (/^(ig|insta|instagram)/.test(s)) return 'Instagram';
  if (/^(fb|facebook)/.test(s)) return 'Facebook';
  if (/^(meta|an|msg|messenger)/.test(s)) return 'Meta';
  if (/^(tg|telegram)/.test(s)) return 'Telegram';
  if (/^(google|gads|yt|youtube)/.test(s)) return 'Google';
  if (fbclid) return 'Meta';
  var r = String(referrer || '').toLowerCase();
  if (r.indexOf('instagram') !== -1) return 'Instagram';
  if (r.indexOf('facebook') !== -1) return 'Facebook';
  if (r.indexOf('t.me') !== -1 || r.indexOf('telegram') !== -1) return 'Telegram';
  if (r.indexOf('google') !== -1) return 'Google';
  return s ? 'Не определено' : 'Органика';
}

function utmTag_(b) {
  return ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    .filter(function (k) { return b[k]; })
    .map(function (k) { return k.replace('utm_', '') + '=' + b[k]; }).join(' · ');
}

function clean_(v) { return String(v === undefined || v === null ? '' : v).trim(); }

function colIndex_(key) {
  for (var i = 0; i < COLUMNS.length; i++) if (COLUMNS[i].key === key) return i + 1;
  throw new Error('Нет колонки ' + key);
}

function col_(sh, key) { return sh.getRange(1, colIndex_(key)); }

function letter_(n) {
  var s = '';
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function getOrCreate_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }

function writeList_(sh, col, title, items) {
  sh.getRange(1, col).setValue(title).setFontWeight('bold');
  sh.getRange(2, col, items.length, 1).setValues(items.map(function (x) { return [x]; }));
}

function validation_(sh, key, listRange, allowOther) {
  var rule = SpreadsheetApp.newDataValidation().requireValueInRange(listRange, true).setAllowInvalid(!!allowOther).build();
  col_(sh, key).offset(1, 0, sh.getMaxRows() - 1).setDataValidation(rule);
}

function styleTable_(s, r1, r2, ncols, c1) {
  c1 = c1 || 1;
  s.getRange(r1, c1, 1, ncols).setFontWeight('bold').setBackground('#0F4650').setFontColor('#FFFFFF');
  s.getRange(r1, c1, r2 - r1 + 1, ncols).setBorder(true, true, true, true, true, true, '#D9D9D9', SpreadsheetApp.BorderStyle.SOLID);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function showWebhookInfo() {
  var url = ScriptApp.getService().getUrl();
  var key = PropertiesService.getScriptProperties().getProperty('KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
    PropertiesService.getScriptProperties().setProperty('KEY', key);
  }
  var msg = url
    ? 'Ссылка для ботов (никому не публикуйте):\n\n' + url + '?key=' + key
    : 'Сначала разверните скрипт: Развернуть → Новое развёртывание → Веб-приложение (доступ: все). Ключ: ' + key;
  SpreadsheetApp.getUi().alert(msg);
}

function addTestLeads() {
  var quiz = '🩺 КВИЗ CHECK-UP\n🩺 Новая заявка на Check-up\n\n👤 Имя: Тест Квиз\n📞 Телефон: +998 90 000 00 01\n🕐 Удобное время: Утро (8:00–12:00)\n🌐 Язык: RU\n\n🎂 Возраст: 40–49 лет\n📅 Последнее обследование: Более года назад\n💡 Мотивация: Хочу проверить здоровье профилактически\n🔍 Проверить в первую очередь: Хочу комплексную проверку\n📍 Город: Ташкент\n\n📊 UTM: source=ig · medium=paid · campaign=120253685775280684 · content=120253687256000684\n📣 Источник: Meta (fbclid)\n🔗 Referrer: https://instagram.com/';
  var bot = '🆕 Заявка #999 · Новая\n\n👤 Тест Бот\n📞 +998900000002\n🩺 Эндокринология\n📍 Telegram-бот\n📣 ru-fb-120253939186340684\n• Telegram: id 6010887956\n• Врач: Ахмедшина Эльмира\n• Язык: Узбекский\n• Когда удобно: Обсудить с администратором';
  appendLead_(parseText(quiz));
  appendLead_(parseText(bot));
  SpreadsheetApp.getActive().toast('Добавлены 2 тестовые заявки — удалите их после проверки.', 'MEDELA', 6);
}

// Для проверки разбора вне Google (Node.js)
if (typeof module !== 'undefined') module.exports = { parseText: parseText, normalizeFields: normalizeFields, normalizePhone: normalizePhone };
