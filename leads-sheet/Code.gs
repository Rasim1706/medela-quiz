/**
 * MEDELA — учёт лидов в Google Таблице + Telegram-бот для пересылки заявок.
 *
 * Что делает:
 *  • setup()          — создаёт / обновляет листы «Лиды», «Итоги», «Списки»: колонки, выпадающие списки,
 *                       цвета статусов (Квал / Не квал / Недозвон), Прозвон 1–3 и формулы итогов.
 *                       Если в таблице уже есть заявки, переносит их в новые колонки.
 *  • Telegram-бот     — администратор пересылает боту заявки из группы (можно сразу пачкой),
 *                       скрипт раз в минуту забирает их (pollTelegram), разбирает и добавляет строки.
 *                       Сервер не нужен.
 *  • doPost()         — тот же приёмник принимает заявки и напрямую от ботов/сайта:
 *                       JSON с полями или {"text": "текст сообщения"}.
 *
 * Установка — в leads-sheet/README.md.
 */

var SHEET_LEADS = 'Заявки';
var OLD_LEADS_NAMES = ['Лиды']; // прошлые названия листа — переименуются в «Заявки»
var SHEET_SUMMARY = 'Итоги';
var SHEET_LISTS = 'Списки';
var TZ = 'Asia/Tashkent';

// Порядок колонок листа «Лиды». После изменения запустите setup() — данные перенесутся сами.
var COLUMNS = [
  { key: 'n', title: '№', width: 45 },
  { key: 'date', title: 'Дата', width: 90 },
  { key: 'time', title: 'Время', width: 60 },
  { key: 'name', title: 'Имя', width: 210 },
  { key: 'phone', title: 'Телефон', width: 130 },
  { key: 'funnel', title: 'Воронка', width: 160 },
  { key: 'platform', title: 'Площадка', width: 95 },
  { key: 'service', title: 'Услуга / жалоба', width: 180 },
  { key: 'call1', title: 'Прозвон 1', width: 125 },
  { key: 'call2', title: 'Прозвон 2', width: 125 },
  { key: 'call3', title: 'Прозвон 3', width: 125 },
  { key: 'status', title: 'Статус', width: 95 },
  { key: 'reason', title: 'Причина «не квал»', width: 165 },
  { key: 'operator', title: 'Оператор', width: 130 },
  { key: 'comment', title: 'Комментарий', width: 220 },
  { key: 'repeat', title: 'Повтор', width: 70 },
  { key: 'doctor', title: 'Врач', width: 150 },
  { key: 'lang', title: 'Язык', width: 55 },
  { key: 'city', title: 'Город', width: 100 },
  { key: 'callTime', title: 'Когда удобно', width: 150 },
  { key: 'campaign', title: 'Кампания / объявление', width: 190 },
  { key: 'details', title: 'Детали заявки', width: 280 },
  { key: 'tag', title: 'Метка / UTM', width: 220 },
  { key: 'telegramId', title: 'Telegram ID', width: 105 },
  { key: 'externalId', title: 'ID в системе', width: 90 }
];
// Старые названия колонок (из прошлых версий) — для переноса данных
// Колонки по центру; остальные — по левому краю. Длинные — обрезаются в ячейке, строка не растягивается.
var CENTER_KEYS = ['n', 'date', 'time', 'phone', 'platform', 'call1', 'call2', 'call3', 'status', 'repeat', 'lang', 'telegramId', 'externalId'];
var ROW_HEIGHT = 30;
var FONT = 'Roboto';

var OLD_TITLES = { 'Дата и время': 'datetime', 'Канал': 'funnel', 'Ответственный': 'operator', 'Услуга': 'service' };

var FUNNELS = ['Квиз Check-up', 'Квиз по самочувствию', 'Бот записи', 'Сайт /zapis', 'Звонок', 'Instagram Direct', 'Telegram (личка)', 'Пришёл сам', 'Другое'];
var PLATFORMS = ['Instagram', 'Facebook', 'Meta', 'Telegram', 'Google', 'Органика', 'Не определено'];
var CALL_RESULTS = ['✅ Дозвонился', '📵 Не взял трубку', '🔕 Выключен / недоступен', '⏰ Просил перезвонить', '❌ Неверный номер'];
var STATUSES = ['Квал', 'Не квал', 'Недозвон'];
// Цвет всей строки по статусу: Квал — зелёный, Не квал — красный, Недозвон — синий
var STATUS_COLORS = { 'Квал': '#B6D7A8', 'Не квал': '#EA9999', 'Недозвон': '#A4C2F4' };
var REASONS = ['Дорого', 'Нет нужной услуги', 'Другой город', 'Только узнать цену', 'Записался в другом месте', 'Ошибся номером', 'Спам', 'Другое'];
var DEFAULT_OPERATORS = ['Оператор 1', 'Оператор 2', 'Оператор 3'];
var REPEAT_DAYS = 30;

/* =========================== Меню =========================== */

function onOpen() {
  // Таблица всегда открывается на листе «Заявки»
  try {
    var ss = SpreadsheetApp.getActive();
    var leads = leadsSheet_(ss);
    if (leads.getIndex() !== 1) { ss.setActiveSheet(leads); ss.moveActiveSheet(1); }
    ss.setActiveSheet(leads);
  } catch (err) { /* не мешаем открытию таблицы */ }

  SpreadsheetApp.getUi().createMenu('MEDELA')
    .addItem('1. Настроить / обновить таблицу', 'setup')
    .addItem('2. Подключить Telegram-бота', 'connectTelegramBot')
    .addItem('Оформить таблицу (без изменения данных)', 'beautify')
    .addSeparator()
    .addItem('Ссылка для приёма заявок от ботов/сайта', 'showWebhookInfo')
    .addItem('Добавить тестовые заявки', 'addTestLeads')
    .addToUi();
}

/**
 * Прозвон: при выборе результата в ячейку пишется примечание со временем звонка и оператором.
 * Если все три прозвона без ответа и статус пустой — статус становится «Недозвон».
 */
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    if ([SHEET_LEADS].concat(OLD_LEADS_NAMES).indexOf(sh.getName()) === -1 || e.range.getRow() < 2 || e.range.getNumRows() > 1) return;
    var col = e.range.getColumn();
    var callCols = ['call1', 'call2', 'call3'].map(colIndex_);
    if (callCols.indexOf(col) === -1) return;
    var value = String(e.range.getValue() || '');
    var stamp = Utilities.formatDate(new Date(), TZ, 'dd.MM HH:mm');
    var who = e.user && e.user.getEmail ? e.user.getEmail() : '';
    e.range.setNote(value ? 'Звонок: ' + stamp + (who ? '\n' + who : '') : '');

    var row = e.range.getRow();
    var calls = callCols.map(function (c) { return String(sh.getRange(row, c).getValue() || ''); });
    var statusCell = sh.getRange(row, colIndex_('status'));
    if (!statusCell.getValue() && calls.every(function (v) { return v && v.indexOf('Дозвонился') === -1; })) {
      statusCell.setValue('Недозвон');
    }
  } catch (err) { /* простой триггер не должен мешать работе */ }
}

/* =========================== Настройка таблицы =========================== */

function setup() {
  var ss = SpreadsheetApp.getActive();
  ss.setSpreadsheetLocale('ru_RU');
  ss.setSpreadsheetTimeZone(TZ);

  var lists = getOrCreate_(ss, SHEET_LISTS);
  var oldOps = readListByTitle_(lists, ['Операторы', 'Ответственные']);
  var operators = oldOps.filter(function (v) { return !/^Администратор \d$/.test(v); });
  lists.clear();
  lists.getRange(1, 1, lists.getMaxRows(), Math.max(lists.getMaxColumns(), 8)).clearDataValidations();
  writeList_(lists, 1, 'Воронки', FUNNELS);
  writeList_(lists, 2, 'Площадки', PLATFORMS);
  writeList_(lists, 3, 'Статусы', STATUSES);
  writeList_(lists, 4, 'Причины «не квал»', REASONS);
  writeList_(lists, 5, 'Операторы', operators.length ? operators : DEFAULT_OPERATORS);
  writeList_(lists, 6, 'Результат прозвона', CALL_RESULTS);
  lists.setColumnWidths(1, 6, 190);
  lists.getRange('E2:E30').setBackground('#FFF2CC');
  lists.getRange('H1').setValue('Впишите имена операторов в жёлтые ячейки колонки E — они появятся в выпадающем списке «Оператор».').setFontStyle('italic');

  var sh = leadsSheet_(ss);
  migrateLeads_(sh);

  var header = COLUMNS.map(function (c) { return c.title; });
  if (sh.getMaxColumns() < header.length) sh.insertColumnsAfter(sh.getMaxColumns(), header.length - sh.getMaxColumns());
  sh.getRange(1, 1, 1, header.length).setValues([header])
    .setFontWeight('bold').setBackground('#0F4650').setFontColor('#FFFFFF')
    .setVerticalAlignment('middle').setWrap(true);
  ['call1', 'call2', 'call3'].forEach(function (k) { col_(sh, k).setBackground('#2E6B75'); });
  sh.setRowHeight(1, 36);
  sh.setFrozenRows(1);
  sh.setFrozenColumns(4);
  COLUMNS.forEach(function (c, i) { sh.setColumnWidth(i + 1, c.width); });

  var rows = sh.getMaxRows() - 1;
  sh.getRange(2, 1, rows, header.length).clearDataValidations();
  col_(sh, 'date').offset(1, 0, rows).setNumberFormat('dd.mm.yyyy');
  col_(sh, 'time').offset(1, 0, rows).setNumberFormat('@').setHorizontalAlignment('center');
  col_(sh, 'phone').offset(1, 0, rows).setNumberFormat('@');
  col_(sh, 'status').offset(1, 0, rows).setHorizontalAlignment('center');

  validation_(sh, 'funnel', lists.getRange('A2:A30'), true);
  validation_(sh, 'platform', lists.getRange('B2:B30'));
  validation_(sh, 'status', lists.getRange('C2:C30'));
  validation_(sh, 'reason', lists.getRange('D2:D30'), true);
  validation_(sh, 'operator', lists.getRange('E2:E30'), true);
  ['call1', 'call2', 'call3'].forEach(function (k) { validation_(sh, k, lists.getRange('F2:F30'), true); });

  var statusLetter = letter_(colIndex_('status'));
  var range = sh.getRange('A2:' + letter_(COLUMNS.length));
  sh.setConditionalFormatRules(Object.keys(STATUS_COLORS).map(function (s) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + statusLetter + '2="' + s + '"')
      .setBackground(STATUS_COLORS[s]).setRanges([range]).build();
  }));
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, sh.getMaxRows(), COLUMNS.length).createFilter();

  buildSummary_(ss);
  beautify_(ss);
  var def = ss.getSheetByName('Лист1') || ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  ss.setActiveSheet(sh);
  ss.moveActiveSheet(1);
  ss.toast('Таблица обновлена. Впишите имена операторов на листе «Списки» (колонка E).', 'MEDELA', 8);
}

// Переносит существующие строки в новый порядок колонок (по названиям колонок в шапке)
function migrateLeads_(sh) {
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return;
  var oldHeader = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  var newHeader = COLUMNS.map(function (c) { return c.title; });
  if (oldHeader.join('|') === newHeader.join('|')) return;

  var keyByTitle = {};
  COLUMNS.forEach(function (c) { keyByTitle[c.title] = c.key; });
  Object.keys(OLD_TITLES).forEach(function (t) { keyByTitle[t] = OLD_TITLES[t]; });
  // Шапка не узнана (пустая или чужая) — ничего не переносим, чтобы не потерять данные
  var known = oldHeader.filter(function (t) { return keyByTitle[t]; }).length;
  if (known < 3) return;

  // Резервная копия листа перед переносом — на всякий случай
  var stamp = Utilities.formatDate(new Date(), TZ, 'dd.MM HH-mm');
  sh.copyTo(sh.getParent()).setName('Резерв лидов ' + stamp);

  var data = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var rows = data.filter(function (r) { return r.some(function (v) { return v !== ''; }); }).map(function (r) {
    var o = {};
    oldHeader.forEach(function (t, i) { var k = keyByTitle[t]; if (k && r[i] !== '') o[k] = r[i]; });
    if (o.datetime instanceof Date) {
      o.date = dateOnly_(o.datetime);
      o.time = Utilities.formatDate(o.datetime, TZ, 'HH:mm');
    }
    if (o.funnel === 'Telegram-бот') o.funnel = 'Бот записи';
    return COLUMNS.map(function (c) { return o[c.key] === undefined ? '' : o[c.key]; });
  });

  // Старые проверки данных и форматирование мешают записи в новые колонки — снимаем их до записи
  var all = sh.getRange(1, 1, sh.getMaxRows(), Math.max(sh.getMaxColumns(), COLUMNS.length));
  all.clearDataValidations();
  sh.setConditionalFormatRules([]);
  if (sh.getFilter()) sh.getFilter().remove();
  if (sh.getMaxColumns() < COLUMNS.length) sh.insertColumnsAfter(sh.getMaxColumns(), COLUMNS.length - sh.getMaxColumns());
  sh.getRange(1, 1, lastRow, lastCol).clearContent().clearNote();
  if (rows.length) sh.getRange(2, 1, rows.length, COLUMNS.length).setValues(rows);
}

function buildSummary_(ss) {
  var s = getOrCreate_(ss, SHEET_SUMMARY);
  s.clear();
  // В setFormula формулы пишутся с запятыми (английский синтаксис) — Таблица сама покажет их по-русски
  var L = "'" + SHEET_LEADS + "'!";
  var c = function (key) { var l = letter_(colIndex_(key)); return L + '$' + l + '$2:$' + l; };
  var D = c('date'), N = c('name'), P = c('platform'), F = c('funnel'), ST = c('status'), RS = c('reason'), RP = c('repeat'), OP = c('operator');
  var period = D + ',">="&$B$2,' + D + ',"<"&$D$2+1';
  var cnt = function (cond) { return 'COUNTIFS(' + period + (cond ? ',' + cond : '') + ')'; };

  s.getRange('A1').setValue('Итоги по лидам MEDELA').setFontSize(16).setFontWeight('bold');
  s.getRange('A2').setValue('Период с');
  s.getRange('C2').setValue('по');
  s.getRange('B2').setFormula('=EOMONTH(TODAY(),-1)+1');
  s.getRange('D2').setFormula('=TODAY()');
  s.getRange('B2:D2').setNumberFormat('dd.mm.yyyy');
  ['B2', 'D2'].forEach(function (a) { s.getRange(a).setBackground('#FFF2CC').setFontWeight('bold').setNote('Дату можно поменять вручную'); });

  var head = ['', 'Лиды', 'Без повторов', 'Квал', 'Не квал', 'Недозвон', 'Не обработано', '% квал'];
  // items — массив значений или функция (i) → формула значения (например, ссылка на лист «Списки»)
  var block = function (row, title, firstCol, field, items, withSpend) {
    s.getRange(row - 1, 1).setValue(title).setFontWeight('bold').setFontSize(12);
    var h = head.slice(); h[0] = firstCol;
    if (withSpend) h = h.concat(['Расход на рекламу, сум', 'Цена лида', 'Цена квал-лида']);
    s.getRange(row, 1, 1, h.length).setValues([h]);
    items.forEach(function (it, i) {
      var r = row + 1 + i, k = field + ',$A' + r;
      if (/^=/.test(it)) s.getRange(r, 1).setFormula(it); else s.getRange(r, 1).setValue(it);
      s.getRange(r, 2).setFormula('=IF($A' + r + '="","",' + cnt(k + ',' + N + ',"<>"') + ')');
      s.getRange(r, 3).setFormula('=IF($A' + r + '="","",' + cnt(k + ',' + N + ',"<>",' + RP + ',"<>Повтор"') + ')');
      s.getRange(r, 4).setFormula('=IF($A' + r + '="","",' + cnt(k + ',' + ST + ',"Квал"') + ')');
      s.getRange(r, 5).setFormula('=IF($A' + r + '="","",' + cnt(k + ',' + ST + ',"Не квал"') + ')');
      s.getRange(r, 6).setFormula('=IF($A' + r + '="","",' + cnt(k + ',' + ST + ',"Недозвон"') + ')');
      s.getRange(r, 7).setFormula('=IF($A' + r + '="","",B' + r + '-D' + r + '-E' + r + '-F' + r + ')');
      s.getRange(r, 8).setFormula('=IF($A' + r + '="","",IFERROR(D' + r + '/B' + r + ',0))');
      if (withSpend) {
        s.getRange(r, 9).setBackground('#FFF2CC');
        s.getRange(r, 10).setFormula('=IF(I' + r + '="","",IFERROR(I' + r + '/B' + r + ',""))');
        s.getRange(r, 11).setFormula('=IF(I' + r + '="","",IFERROR(I' + r + '/D' + r + ',""))');
      }
    });
    var t = row + 1 + items.length;
    s.getRange(t, 1).setValue('Итого');
    ['B', 'C', 'D', 'E', 'F', 'G'].concat(withSpend ? ['I'] : []).forEach(function (col) {
      s.getRange(col + t).setFormula('=SUM(' + col + (row + 1) + ':' + col + (t - 1) + ')');
    });
    s.getRange('H' + t).setFormula('=IFERROR(D' + t + '/B' + t + ',0)');
    if (withSpend) {
      s.getRange('J' + t).setFormula('=IF(I' + t + '=0,"",IFERROR(I' + t + '/B' + t + ',""))');
      s.getRange('K' + t).setFormula('=IF(I' + t + '=0,"",IFERROR(I' + t + '/D' + t + ',""))');
      s.getRange(row + 1, 9, items.length + 1, 3).setNumberFormat('#,##0');
    }
    s.getRange(row + 1, 8, items.length + 1, 1).setNumberFormat('0%');
    styleTable_(s, row, t, h.length);
    s.getRange(t, 1, 1, h.length).setFontWeight('bold');
    return t;
  };

  var end1 = block(5, 'По воронкам', 'Воронка', F, FUNNELS, false);
  var end2 = block(end1 + 4, 'По площадкам (реклама)', 'Площадка', P, PLATFORMS, true);
  var opItems = [];
  for (var o = 0; o < 8; o++) opItems.push("=IF('" + SHEET_LISTS + "'!E" + (o + 2) + "=\"\",\"\",'" + SHEET_LISTS + "'!E" + (o + 2) + ')');
  var end3 = block(end2 + 4, 'По операторам', 'Оператор', OP, opItems, false);

  var q0 = end3 + 4;
  s.getRange(q0 - 1, 1).setValue('Причины «не квал»').setFontWeight('bold').setFontSize(12);
  s.getRange(q0, 1, 1, 2).setValues([['Причина', 'Лиды']]);
  REASONS.forEach(function (rs, i) {
    var r = q0 + 1 + i;
    s.getRange(r, 1).setValue(rs);
    s.getRange(r, 2).setFormula('=' + cnt(ST + ',"Не квал",' + RS + ',$A' + r));
  });
  styleTable_(s, q0, q0 + REASONS.length, 2);

  // По дням — последние 14 дней (колонки M–O)
  var d0 = 5, dc = 13;
  s.getRange(d0 - 1, dc).setValue('Последние 14 дней').setFontWeight('bold').setFontSize(12);
  s.getRange(d0, dc, 1, 3).setValues([['День', 'Лиды', 'Квал']]);
  for (var i = 0; i < 14; i++) {
    var r = d0 + 1 + i;
    s.getRange(r, dc).setFormula('=TODAY()-' + i);
    s.getRange(r, dc + 1).setFormula('=COUNTIFS(' + D + ',M' + r + ',' + N + ',"<>")');
    s.getRange(r, dc + 2).setFormula('=COUNTIFS(' + D + ',M' + r + ',' + ST + ',"Квал")');
  }
  s.getRange(d0 + 1, dc, 14, 1).setNumberFormat('dd.mm ddd');
  styleTable_(s, d0, d0 + 14, 3, dc);

  s.setColumnWidth(1, 190);
  s.setColumnWidths(2, 10, 105);
  s.setColumnWidth(12, 24);
  s.setColumnWidth(13, 105);
  s.setFrozenRows(2);
}

/* =========================== Оформление =========================== */

// Пункт меню: только внешний вид, данные не меняются
function beautify() {
  beautify_(SpreadsheetApp.getActive());
  SpreadsheetApp.getActive().toast('Готово: таблица оформлена.', 'MEDELA', 4);
}

function beautify_(ss) {
  var line = '#E3E6EA';
  var sh = leadsSheet_(ss);
  if (sh) {
    var rows = sh.getMaxRows(), cols = COLUMNS.length;
    var all = sh.getRange(1, 1, rows, cols);
    all.setFontFamily(FONT).setFontSize(10).setFontColor('#1F2937').setVerticalAlignment('middle')
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    var body = sh.getRange(2, 1, rows - 1, cols);
    body.setHorizontalAlignment('left')
      .setBorder(true, true, true, true, true, true, line, SpreadsheetApp.BorderStyle.SOLID);
    CENTER_KEYS.forEach(function (k) { col_(sh, k).offset(1, 0, rows - 1).setHorizontalAlignment('center'); });
    col_(sh, 'status').offset(1, 0, rows - 1).setFontWeight('bold');
    col_(sh, 'name').offset(1, 0, rows - 1).setFontWeight('bold');
    sh.setRowHeightsForced(2, rows - 1, ROW_HEIGHT);

    var head = sh.getRange(1, 1, 1, cols);
    head.setFontFamily(FONT).setFontSize(10).setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#0F4650')
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP)
      .setBorder(true, true, true, true, true, true, '#0B3740', SpreadsheetApp.BorderStyle.SOLID);
    ['call1', 'call2', 'call3'].forEach(function (k) { col_(sh, k).setBackground('#2E6B75'); });
    sh.setRowHeightsForced(1, 1, 42);
    COLUMNS.forEach(function (c, i) { sh.setColumnWidth(i + 1, c.width); });
    if (sh.getMaxColumns() > cols) sh.hideColumns(cols + 1, sh.getMaxColumns() - cols);
    sh.setHiddenGridlines(true);
  }

  var s = ss.getSheetByName(SHEET_SUMMARY);
  if (s) {
    var r = s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns());
    r.setFontFamily(FONT).setVerticalAlignment('middle');
    s.getRange(3, 2, s.getMaxRows() - 2, s.getMaxColumns() - 1).setHorizontalAlignment('center');
    s.setRowHeightsForced(3, s.getMaxRows() - 2, 26);
    s.setRowHeightsForced(1, 1, 40);
    s.setHiddenGridlines(true);
  }

  var l = ss.getSheetByName(SHEET_LISTS);
  if (l) {
    l.getRange(1, 1, l.getMaxRows(), l.getMaxColumns()).setFontFamily(FONT).setVerticalAlignment('middle');
    l.setRowHeightsForced(1, l.getMaxRows(), 26);
    l.setHiddenGridlines(true);
  }
}

/* =========================== Приём заявок =========================== */

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { body = { text: e.postData ? e.postData.contents : '' }; }
  var key = PropertiesService.getScriptProperties().getProperty('KEY');
  if (key && (!e.parameter || e.parameter.key !== key)) return json_({ ok: false, error: 'bad_key' });

  try {
    if (body.update_id !== undefined) return json_({ ok: true }); // бот работает через pollTelegram()
    var lead = body.text && !body.phone ? parseText(body.text) : normalizeFields(body);
    var res = addLead_(lead, body.text || JSON.stringify(body));
    return json_(res);
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String(err) });
  }
}

function doGet() {
  return json_({ ok: true, service: 'MEDELA leads' });
}

/**
 * Добавляет заявку, если её ещё нет. Возвращает {ok, row, duplicate, error}.
 * Дубли: тот же текст за 6 часов (повторная пересылка) или тот же «ID в системе».
 */
function addLead_(lead, rawText) {
  if (!lead.phone && !lead.name) return { ok: false, error: 'empty_lead' };
  var lock = LockService.getDocumentLock();
  lock.waitLock(20000);
  try {
    var cache = CacheService.getScriptCache();
    var hash = rawText ? digest_(rawText) : '';
    if (hash && cache.get('lead_' + hash)) return { ok: true, duplicate: true };
    var sh = leadsSheet_(SpreadsheetApp.getActive());
    if (lead.externalId && findRow_(sh, 'externalId', lead.externalId)) {
      if (hash) cache.put('lead_' + hash, '1', 21600);
      return { ok: true, duplicate: true };
    }
    var row = appendLead_(sh, lead);
    if (hash) cache.put('lead_' + hash, String(row), 21600);
    return { ok: true, row: row };
  } finally {
    lock.releaseLock();
  }
}

function appendLead_(sh, lead) {
  var last = sh.getLastRow();
  var when = lead.when || new Date();
  lead.n = last; // № = номер строки − 1
  lead.date = dateOnly_(when);
  lead.time = Utilities.formatDate(when, TZ, 'HH:mm');
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
    var d = dates[i][0];
    if (String(phones[i][0]) === phone && d instanceof Date && d.getTime() >= since) return true;
  }
  return false;
}

function findRow_(sh, key, value) {
  if (sh.getLastRow() < 2) return 0;
  var vals = col_(sh, key).offset(1, 0, sh.getLastRow() - 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(value)) return i + 2;
  return 0;
}

// Полночь этого дня по Ташкенту (чтобы фильтры и итоги по датам работали)
function dateOnly_(d) {
  return Utilities.parseDate(Utilities.formatDate(d, TZ, 'yyyy-MM-dd'), TZ, 'yyyy-MM-dd');
}

function readListByTitle_(sh, titles) {
  if (sh.getLastRow() < 2) return [];
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  for (var i = 0; i < head.length; i++) {
    if (titles.indexOf(String(head[i])) !== -1) {
      return sh.getRange(2, i + 1, Math.max(sh.getLastRow() - 1, 1), 1).getValues()
        .map(function (r) { return String(r[0]).trim(); }).filter(Boolean);
    }
  }
  return [];
}

/* =========================== Telegram-бот =========================== */

function connectTelegramBot() {
  var ui = SpreadsheetApp.getUi();
  var res = ui.prompt('Подключение Telegram-бота', 'Вставьте токен бота от @BotFather (вида 123456:ABC...):', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  var token = res.getResponseText().trim();
  var me = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getMe', { muteHttpExceptions: true }).getContentText() || '{}');
  if (!me.ok) { ui.alert('Токен не подошёл: ' + (me.description || 'проверьте, что скопировали его целиком')); return; }

  var props = PropertiesService.getScriptProperties();
  props.setProperty('BOT_TOKEN', token);
  props.deleteProperty('TG_OFFSET');
  // Бот забирает сообщения сам (getUpdates) — webhook не нужен
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/deleteWebhook', { muteHttpExceptions: true });
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'pollTelegram') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('pollTelegram').timeBased().everyMinutes(1).create();

  ui.alert('Бот @' + me.result.username + ' подключён.\n\nОткройте его в Telegram и нажмите «Старт» — первый, кто это сделает, станет администратором. ' +
    'Потом пересылайте ему заявки из группы: они появятся в таблице в течение минуты.');
}

// Запускается раз в минуту по триггеру: забирает новые сообщения бота и обрабатывает их
function pollTelegram() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var props = PropertiesService.getScriptProperties();
    var token = props.getProperty('BOT_TOKEN');
    if (!token) return;
    var offset = Number(props.getProperty('TG_OFFSET') || 0);
    var r = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates?timeout=0&limit=100&allowed_updates=%5B%22message%22%5D' +
      (offset ? '&offset=' + offset : ''), { muteHttpExceptions: true });
    var data = JSON.parse(r.getContentText() || '{}');
    if (!data.ok) { console.error('getUpdates: ' + r.getContentText()); return; }
    data.result.forEach(function (u) {
      props.setProperty('TG_OFFSET', String(u.update_id + 1)); // сначала сдвигаем, чтобы не обработать дважды
      try { handleTelegramUpdate_(u); } catch (err) { console.error(err); }
    });
  } finally {
    lock.releaseLock();
  }
}

function handleTelegramUpdate_(update) {
  var msg = update.message;
  if (!msg || !msg.chat || msg.chat.type !== 'private') return;
  var userId = String(msg.from && msg.from.id);
  var text = msg.text || msg.caption || '';

  var props = PropertiesService.getScriptProperties();
  var allowed = (props.getProperty('ALLOWED_IDS') || '').split(',').filter(String);
  if (!allowed.length) { // первый пользователь становится администратором
    allowed = [userId];
    props.setProperty('ALLOWED_IDS', userId);
    tgSend_(msg.chat.id, '👋 Вы — администратор этого бота.\n\nПересылайте сюда заявки из группы (можно выделить несколько и переслать сразу) — я добавлю их в таблицу.\n\nЧтобы дать доступ коллеге: /add ID (ID он увидит, написав боту).');
    if (/^\/start/.test(text)) return;
  }
  if (allowed.indexOf(userId) === -1) {
    tgSend_(msg.chat.id, '⛔ Нет доступа. Ваш ID: ' + userId + '\nПопросите администратора отправить боту: /add ' + userId);
    return;
  }

  if (/^\/start|^\/help/.test(text)) {
    tgSend_(msg.chat.id, 'Пересылайте сюда заявки из группы — я добавлю их в таблицу «Лиды».\n\n/add ID — дать доступ коллеге\n/stats — лиды за сегодня');
    return;
  }
  var add = /^\/add\s+(\d+)/.exec(text);
  if (add) {
    if (allowed.indexOf(add[1]) === -1) allowed.push(add[1]);
    props.setProperty('ALLOWED_IDS', allowed.join(','));
    tgSend_(msg.chat.id, '✅ Доступ выдан: ' + add[1]);
    return;
  }
  if (/^\/stats/.test(text)) {
    tgSend_(msg.chat.id, statsToday_());
    return;
  }

  var lead = parseText(text);
  if (!lead.phone) {
    tgSend_(msg.chat.id, '🤔 Не нашёл в сообщении телефон. Перешлите заявку целиком.', msg.message_id);
    return;
  }
  // Дата заявки = время исходного сообщения в группе
  var origin = msg.forward_origin && msg.forward_origin.date ? msg.forward_origin.date : (msg.forward_date || msg.date);
  lead.when = new Date(origin * 1000);
  var res = addLead_(lead, text);
  var who = (lead.name || lead.phone) + (lead.funnel ? ' · ' + lead.funnel : '');
  if (res.duplicate) tgSend_(msg.chat.id, '⚠️ Уже в таблице: ' + who, msg.message_id);
  else if (res.ok) tgSend_(msg.chat.id, '✅ Добавлено (строка ' + res.row + '): ' + who, msg.message_id);
  else tgSend_(msg.chat.id, '❌ Не получилось добавить: ' + res.error, msg.message_id);
}

function statsToday_() {
  var sh = leadsSheet_(SpreadsheetApp.getActive());
  if (sh.getLastRow() < 2) return 'Сегодня лидов пока нет.';
  var n = sh.getLastRow() - 1;
  var dates = col_(sh, 'date').offset(1, 0, n).getValues();
  var st = col_(sh, 'status').offset(1, 0, n).getValues();
  var today = Utilities.formatDate(new Date(), 'Asia/Tashkent', 'yyyy-MM-dd');
  var c = { total: 0, 'Квал': 0, 'Не квал': 0, 'Недозвон': 0 };
  for (var i = 0; i < n; i++) {
    if (!(dates[i][0] instanceof Date) || Utilities.formatDate(dates[i][0], 'Asia/Tashkent', 'yyyy-MM-dd') !== today) continue;
    c.total++;
    if (c[st[i][0]] !== undefined) c[st[i][0]]++;
  }
  return '📊 Лидов сегодня: ' + c.total + '\n✅ Квал: ' + c['Квал'] + '\n❌ Не квал: ' + c['Не квал'] + '\n📵 Недозвон: ' + c['Недозвон'] +
    '\n⏳ Не обработано: ' + (c.total - c['Квал'] - c['Не квал'] - c['Недозвон']);
}

function tgSend_(chatId, text, replyTo) {
  var token = PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
  if (!token) return;
  var payload = { chat_id: chatId, text: text, disable_web_page_preview: true };
  if (replyTo) payload.reply_parameters = { message_id: replyTo, allow_sending_without_reply: true };
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
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
  return {
    funnel: b.funnel || b.channel || 'Квиз Check-up',
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
    tag: utmTag_(b),
    telegramId: clean_(b.telegramId),
    externalId: clean_(b.externalId)
  };
}

// Синонимы подписей полей (нижний регистр, сравнение по началу подписи)
var FIELD_LABELS = {
  name: ['имя', 'фио', 'ism', 'клиент', 'пациент'],
  phone: ['телефон', 'тел', 'номер', 'phone', 'raqam'],
  callTime: ['удобное время', 'позвонить', 'когда удобно', 'время звонка', 'когда звонить', 'qulay vaqt'],
  lang: ['язык', 'til'],
  city: ['город', 'shahar', 'регион'],
  doctor: ['врач', 'доктор', 'shifokor'],
  service: ['проверить в первую очередь', 'услуга', 'направление', 'xizmat', 'что проверить', 'беспокоит', 'жалоб']
};
// Подписи, которые разбираются отдельно и не дублируются в «Детали»
var SKIP_LABELS = ['utm', 'источник', 'referrer', 'реферер', 'получено', 'telegram'];

/**
 * Разбирает текст заявки любого формата: «Метка: значение», строки с эмодзи (👤 📞 🩺 📍 📣),
 * UTM-метки (source=…, utm_source=…). Неизвестные поля попадают в «Детали заявки».
 */
function parseText(text) {
  text = String(text || '').replace(/\r/g, '');
  var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  var lead = { details: '' };
  var details = [];
  var used = {};

  var emojiLine = function (emojis) {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      for (var j = 0; j < emojis.length; j++) {
        if (l.indexOf(emojis[j]) === 0) {
          var rest = l.slice(emojis[j].length).replace(/^[️\s]+/, '');
          if (rest.indexOf(':') === -1 || /^\+?[\d\s()\-]+$/.test(rest)) { used[i] = true; return rest; }
        }
      }
    }
    return '';
  };

  // 1) Поля «Метка: значение»
  lines.forEach(function (line, i) {
    var m = /^[^A-Za-zА-Яа-яЁё0-9]*([A-Za-zА-Яа-яЁёʻ’'«»\s,\/()\-]{2,45}?)\s*:\s*(.*)$/.exec(line);
    if (!m) return;
    var label = m[1].trim().toLowerCase(), value = m[2].trim();
    if (/^https?$/.test(label)) return;
    used[i] = true;
    if (SKIP_LABELS.some(function (s) { return label.indexOf(s) === 0; })) return;
    var field = Object.keys(FIELD_LABELS).filter(function (f) {
      return FIELD_LABELS[f].some(function (s) { return label.indexOf(s) === 0; });
    })[0];
    if (field && value && !lead[field]) lead[field] = value;
    else if (value) details.push(m[1].trim() + ': ' + value);
  });

  // 2) Строки с эмодзи без подписи (формат MedelaStaffBot и похожие)
  if (!lead.name) lead.name = emojiLine(['👤']);
  var phoneLine = emojiLine(['📞', '☎️', '☎', '📱']);
  var serviceLine = '';
  lines.forEach(function (l, i) {
    if (!serviceLine && !used[i] && l.indexOf('🩺') === 0 && !/заявк|квиз|check-up|ariza/i.test(l)) {
      serviceLine = l.replace(/^🩺[️\s]*/, ''); used[i] = true;
    }
  });
  if (!lead.service) lead.service = serviceLine;
  var from = emojiLine(['📍']);
  if (from) details.push('Откуда: ' + from);
  var tag = emojiLine(['📣']);

  // 3) Телефон — где угодно в тексте
  var phone = lead.phone || phoneLine || findPhone_(text);
  lead.phone = normalizePhone(phone);
  if (!lead.phone) lead.phone = normalizePhone(findPhone_(text));

  // 4) Прочие свободные строки: «горячий» лид, хэштеги
  lines.forEach(function (l, i) {
    if (used[i]) return;
    if (/🔥|горяч/i.test(l)) details.unshift(l.replace(/^[^A-Za-zА-Яа-яЁё]+/, '🔥 '));
    else if (/^#/.test(l)) details.push(l);
  });

  // 5) Источник: UTM-метки в любом виде, метка бота, fbclid, referrer
  var utm = {};
  text.replace(/(?:utm_)?(source|medium|campaign|content|term)\s*=\s*([^\s·,;&]+)/gi, function (_, k, v) {
    if (!utm[k.toLowerCase()]) utm[k.toLowerCase()] = v; return _;
  });
  var tagParts = tag ? tag.split('-') : [];
  var tagSrc = tagParts.length > 1 ? (/^svc_/.test(tagParts[1]) ? tagParts[2] || '' : tagParts[1]) : '';
  var referrer = (/(?:referrer|реферер)\s*:\s*(\S+)/i.exec(text) || [])[1] || '';
  var fbclid = /fbclid/i.test(text) ? 'yes' : '';
  lead.platform = detectPlatform_(utm.source || tagSrc, fbclid, referrer);
  lead.campaign = [utm.campaign, utm.content].filter(Boolean).join(' / ') ||
    (tagParts.length > 2 ? tagParts.slice(2).join('-').replace(/^svc_[^-]*-?/, '') : '');
  lead.tag = Object.keys(utm).length
    ? ['source', 'medium', 'campaign', 'content', 'term'].filter(function (k) { return utm[k]; }).map(function (k) { return k + '=' + utm[k]; }).join(' · ')
    : tag;

  // 6) Канал, язык, номер заявки, Telegram ID
  var ext = /Заявка\s*#\s*(\d+)/i.exec(text);
  lead.externalId = ext ? '#' + ext[1] : '';
  lead.funnel = detectFunnel_(text, lines, !!ext);
  var lang = String(lead.lang || '').toLowerCase();
  lead.lang = /узб|uz|o.zbek/i.test(lang) ? 'UZ' : (/рус|ru/i.test(lang) ? 'RU' : (tagParts[0] && tagParts[0].length === 2 ? tagParts[0].toUpperCase() : ''));
  var tg = /telegram\s*:?\s*(?:id\s*)?(\d{5,})/i.exec(text);
  lead.telegramId = tg ? tg[1] : '';

  // Свободный текст без полей — сохраняем целиком, чтобы администратор видел всё
  if (!details.length && !lead.name && !lead.service) details.push(text.slice(0, 1000));
  lead.details = details.join('\n');
  Object.keys(lead).forEach(function (k) { if (typeof lead[k] === 'string') lead[k] = lead[k].trim(); });
  return lead;
}

// С какой воронки пришёл лид — по заголовку заявки. Новые форматы получают название из своего заголовка.
function detectFunnel_(text, lines, isBooking) {
  if (/КВИЗ CHECK-UP|заявка на check-up/i.test(text)) return 'Квиз Check-up';
  if (/заявка с квиза/i.test(text)) return 'Квиз по самочувствию';
  if (isBooking) return 'Бот записи';
  if (/\/zapis|сайт/i.test(lines[0] || '')) return 'Сайт /zapis';
  var head = String(lines[0] || '').replace(/^[^A-Za-zА-Яа-яЁё0-9]+/, '').trim();
  if (head && head.indexOf(':') === -1 && head.length <= 50 && !findPhone_(head)) return head;
  return 'Другое';
}

// Узбекский номер: +998 (77) 307-71-71, 998901234567, 90 123 45 67 … (не цепляет длинные ID кампаний)
function findPhone_(text) {
  var m = /(?:^|[^\d])((?:\+?\s*998[\s\-()]*)?\(?\d{2}\)?[\s\-]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2})(?!\d)/.exec(String(text || ''));
  return m ? m[1] : '';
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

// Лист с заявками: «Заявки» (старый «Лиды» переименовывается автоматически)
function leadsSheet_(ss) {
  var sh = ss.getSheetByName(SHEET_LEADS);
  if (sh) return sh;
  for (var i = 0; i < OLD_LEADS_NAMES.length; i++) {
    var old = ss.getSheetByName(OLD_LEADS_NAMES[i]);
    if (old) { old.setName(SHEET_LEADS); return old; }
  }
  return ss.insertSheet(SHEET_LEADS, 0);
}

function getOrCreate_(ss, name) { return ss.getSheetByName(name) || ss.insertSheet(name); }

function writeList_(sh, col, title, items) {
  sh.getRange(1, col).setValue(title).setFontWeight('bold').setBackground('#0F4650').setFontColor('#FFFFFF');
  sh.getRange(2, col, items.length, 1).setValues(items.map(function (x) { return [x]; }));
}

function validation_(sh, key, listRange, allowOther) {
  var rule = SpreadsheetApp.newDataValidation().requireValueInRange(listRange, true).setAllowInvalid(!!allowOther).build();
  col_(sh, key).offset(1, 0, sh.getMaxRows() - 1).setDataValidation(rule);
}

function styleTable_(s, r1, r2, ncols, c1) {
  c1 = c1 || 1;
  s.getRange(r1, c1, 1, ncols).setFontWeight('bold').setBackground('#0F4650').setFontColor('#FFFFFF').setWrap(true);
  s.getRange(r1, c1, r2 - r1 + 1, ncols).setBorder(true, true, true, true, true, true, '#D9D9D9', SpreadsheetApp.BorderStyle.SOLID);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function digest_(text) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(text).replace(/\s+/g, ' ').trim(), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function ensureKey_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('KEY');
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, '').slice(0, 20);
    props.setProperty('KEY', key);
  }
  return key;
}

// Ссылка, по которой боты и сайт могут присылать заявки напрямую (без пересылки)
function showWebhookInfo() {
  var url = ScriptApp.getService().getUrl();
  var key = ensureKey_();
  SpreadsheetApp.getUi().alert(url
    ? 'Ссылка для приёма заявок (никому не публикуйте):\n\n' + url + '?key=' + key
    : 'Сначала разверните скрипт: Развернуть → Новое развёртывание → Веб-приложение (выполнять от: я, доступ: все).');
}

function addTestLeads() {
  var quiz = '🩺 КВИЗ CHECK-UP\n🩺 Новая заявка на Check-up\n\n👤 Имя: Тест Квиз\n📞 Телефон: +998 90 000 00 01\n🕐 Удобное время: Утро (8:00–12:00)\n🌐 Язык: RU\n\n🎂 Возраст: 40–49 лет\n📅 Последнее обследование: Более года назад\n💡 Мотивация: Хочу проверить здоровье профилактически\n🔍 Проверить в первую очередь: Хочу комплексную проверку\n📍 Город: Ташкент\n\n📊 UTM: source=ig · medium=paid · campaign=120253685775280684 · content=120253687256000684\n📣 Источник: Meta (fbclid)\n🔗 Referrer: https://instagram.com/';
  var bot = '🆕 Заявка #999 · Новая\n\n👤 Тест Бот\n📞 +998900000002\n🩺 Эндокринология\n📍 Telegram-бот\n📣 ru-fb-120253939186340684\n• Telegram: id 6010887956\n• Врач: Ахмедшина Эльмира\n• Язык: Узбекский\n• Когда удобно: Обсудить с администратором';
  addLead_(parseText(quiz), quiz);
  addLead_(parseText(bot), bot);
  SpreadsheetApp.getActive().toast('Добавлены 2 тестовые заявки — удалите их после проверки.', 'MEDELA', 6);
}

// Для проверки вне Google (Node.js)
if (typeof module !== 'undefined') {
  module.exports = { parseText: parseText, normalizeFields: normalizeFields, normalizePhone: normalizePhone };
}
