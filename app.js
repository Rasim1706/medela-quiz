/**
 * Квиз MEDELA «Какой Check-up подходит именно вам?»
 * Чистый JavaScript без зависимостей. Все тексты — в i18n.js, настройки — в config.js.
 */
(function () {
  'use strict';

  var CONFIG = window.MEDELA_CONFIG || {};
  var I18N = window.I18N || {};
  var LANGS = ['ru', 'uz'];
  var TOTAL_STEPS = 6;
  var AUTO_ADVANCE_MS = 220;

  // Порядок вопросов и машинные коды вариантов. Тексты вариантов — в i18n.js.
  var QUESTIONS = [
    { key: 'age', type: 'single', options: ['under30', '30_39', '40_49', '50_59', '60_69', '70plus'] },
    { key: 'lastCheckup', type: 'single', options: ['within6m', '6_12m', 'over1y', 'dont_remember', 'never'] },
    {
      key: 'motivation', type: 'single',
      options: ['prevention', 'symptoms', 'age_control', 'long_ago', 'parents', 'after_stress'],
      hintFor: function (code) { return code === 'symptoms' ? 'symptoms' : null; }
    },
    {
      key: 'focusAreas', type: 'multi', exclusive: 'complex',
      options: ['heart', 'blood', 'gi', 'liver_kidney', 'hormones', 'general', 'complex']
    },
    {
      key: 'city', type: 'single',
      options: ['tashkent', 'samarkand', 'bukhara', 'fergana', 'andijan', 'namangan', 'other'],
      hintFor: function (code) { return code && code !== 'tashkent' ? 'notTashkent' : null; }
    }
  ];
  var CALL_TIMES = ['morning', 'day', 'evening', 'any'];
  var TRACKING_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'];
  var PHONE_PREFIX = '+998';
  var PHONE_MASK = '+998 (__) ___-__-__';

  var ICONS = {
    doctors: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M4 3h4M12 3h4"/><path d="M10 12v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="11" r="2"/></svg>',
    equipment: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M6 10h3l1.5-3 3 6 1.5-3h3"/></svg>',
    rating: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4L3 11l6 2.5M21 4l-3 16-6.5-5M21 4L9 13.5v5l2.5-3.5"/></svg>',
    done: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><path d="M15 24.5l6 6 12-13"/></svg>',
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'
  };

  var state = {
    lang: null,
    screen: 'lang', // lang | start | question | form | thanks
    step: 1,        // 1–5 вопросы, 6 — форма
    answers: { age: null, lastCheckup: null, motivation: null, focusAreas: [], city: null },
    form: { name: '', phoneDigits: '', callTime: 'any', consent: false, honeypot: '' },
    touched: {},
    status: 'idle', // idle | sending | error
    submitted: false,
    tracking: {}
  };

  var app, advancing = false, lastProgress = 0;

  /* ---------- Утилиты ---------- */

  function t() { return I18N[state.lang || 'ru']; }

  function h(tag, props, children) {
    var el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var val = props[key];
        if (val === null || val === undefined || val === false) return;
        if (key === 'class') el.className = val;
        else if (key === 'text') el.textContent = val;
        else if (key === 'html') el.innerHTML = val;
        else if (key === 'value') el.value = val;
        else if (key === 'checked') el.checked = !!val;
        else if (key.indexOf('on') === 0) el.addEventListener(key.slice(2).toLowerCase(), val);
        else el.setAttribute(key, val === true ? '' : val);
      });
    }
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return el;
  }

  function icon(name, cls) {
    return h('span', { class: 'icon ' + (cls || ''), html: ICONS[name] });
  }

  // Какие события дублируются в Meta Pixel. Ответы квиза (здоровье, возраст, город) в Meta
  // не передаём: это чувствительные данные, Meta ограничивает за них пиксель.
  var PIXEL_EVENTS = {
    quiz_start: ['trackCustom', 'QuizStart'],
    quiz_step: ['trackCustom', 'QuizStep'],
    quiz_submit_click: ['trackCustom', 'SubmitClick'],
    quiz_lead_submit: ['track', 'Lead'],
    contact_click: ['track', 'Contact']
  };

  function track(event, params) {
    window.dataLayer = window.dataLayer || [];
    var data = { event: event };
    Object.keys(params || {}).forEach(function (k) { data[k] = params[k]; });
    window.dataLayer.push(data);

    var px = PIXEL_EVENTS[event];
    if (px && typeof window.fbq === 'function') {
      var pxParams = { content_name: 'checkup_quiz', lang: state.lang };
      if (event === 'quiz_step') pxParams.step = params.step;
      if (event === 'contact_click') pxParams.channel = params.channel;
      window.fbq(px[0], px[1], pxParams);
    }
  }

  /* ---------- localStorage (только как удобство) ---------- */

  function saveProgress() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify({ answers: state.answers, savedAt: Date.now() }));
    } catch (e) { /* хранилище недоступно — работаем только в памяти */ }
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (!raw) return;
      var data = JSON.parse(raw);
      var ttl = (CONFIG.storageTtlHours || 72) * 3600 * 1000;
      if (!data || !data.answers || Date.now() - data.savedAt > ttl) return;
      QUESTIONS.forEach(function (q) {
        var v = data.answers[q.key];
        if (q.type === 'multi') {
          if (Array.isArray(v)) state.answers[q.key] = v.filter(function (c) { return q.options.indexOf(c) !== -1; });
        } else if (q.options.indexOf(v) !== -1) {
          state.answers[q.key] = v;
        }
      });
    } catch (e) { /* игнорируем повреждённые данные */ }
  }

  function clearProgress() {
    try { localStorage.removeItem(CONFIG.storageKey); } catch (e) { /* ничего */ }
  }

  /* ---------- Инициализация окружения ---------- */

  function applyColors() {
    var colors = CONFIG.colors || {};
    var root = document.documentElement.style;
    Object.keys(colors).forEach(function (key) {
      root.setProperty('--' + key.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); }), colors[key]);
    });
  }

  function loadGtm(id) {
    if (!id) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
  }

  // Стандартный код Meta Pixel (тот же, что выдаёт Events Manager)
  function loadMetaPixel(id) {
    if (!id || window.fbq) return;
    /* eslint-disable */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function trackContact(channel) {
    return function () { track('contact_click', { channel: channel }); };
  }

  function readTracking() {
    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }
    TRACKING_KEYS.forEach(function (k) { state.tracking[k] = (params && params.get(k)) || ''; });
    state.tracking.referrer = document.referrer || '';
    var lang = params && (params.get('lang') || '').toLowerCase();
    return LANGS.indexOf(lang) !== -1 ? lang : null;
  }

  function setupLogo() {
    var el = document.getElementById('logo');
    var logo = CONFIG.logo || {};
    var small = window.matchMedia && window.matchMedia('(max-width: 480px)').matches;
    var src = (small && logo.srcMobile) || logo.src;
    if (!src) return;
    var img = new Image();
    img.onload = function () {
      img.className = 'logo__img';
      img.alt = '';
      el.textContent = '';
      el.appendChild(img);
    };
    img.onerror = function () {
      // Мобильная версия не найдена — пробуем основной логотип, иначе остаётся текст
      if (src !== logo.src && logo.src) { src = logo.src; img.src = src; }
    };
    img.src = src;
  }

  /* ---------- Навигация ---------- */

  function firstUnansweredStep() {
    for (var i = 0; i < QUESTIONS.length; i++) {
      var v = state.answers[QUESTIONS[i].key];
      if (!v || (Array.isArray(v) && !v.length)) return i + 1;
    }
    return TOTAL_STEPS;
  }

  function stepToScreen(step) { return step >= TOTAL_STEPS ? 'form' : 'question'; }

  function go(screen, step, opts) {
    opts = opts || {};
    var dir = opts.back ? 'back' : 'forward';
    state.screen = screen;
    if (step) state.step = step;
    advancing = false;
    if (!opts.fromHistory) {
      try { history.pushState({ screen: state.screen, step: state.step }, ''); } catch (e) { /* ничего */ }
    }
    render({ animate: dir, focusHeading: true });
    window.scrollTo(0, 0);
  }

  function goToStep(step, opts) { go(stepToScreen(step), step, opts); }

  function goBack() {
    if (state.screen === 'question' && state.step === 1) go('start', 1, { back: true });
    else goToStep(state.step - 1, { back: true });
  }

  function onPopState(e) {
    var s = e.state;
    if (state.submitted) {
      // После отправки заявки назад в форму не возвращаем
      try { history.pushState({ screen: 'thanks', step: TOTAL_STEPS }, ''); } catch (err) { /* ничего */ }
      return;
    }
    if (!s || !s.screen) return;
    var screen = s.screen;
    var step = s.step || 1;
    if (!state.lang) screen = 'lang';
    if (screen === 'thanks') screen = 'form';
    if (screen === 'question' || screen === 'form') {
      var allowed = firstUnansweredStep();
      if (step > allowed) step = allowed;
      screen = stepToScreen(step);
    }
    var back = screenOrder(screen, step) < screenOrder(state.screen, state.step);
    go(screen, step, { fromHistory: true, back: back });
  }

  function screenOrder(screen, step) {
    return { lang: 0, start: 1, question: 2 + step, form: 2 + TOTAL_STEPS, thanks: 3 + TOTAL_STEPS }[screen];
  }

  /* ---------- Язык ---------- */

  function applyLangMeta() {
    var dict = t();
    if (state.lang) {
      document.documentElement.lang = dict.meta.htmlLang;
      document.title = dict.meta.title;
    }
    var logo = document.getElementById('logo');
    logo.setAttribute('role', 'img');
    logo.setAttribute('aria-label', dict.header.logoAlt);
  }

  function selectLang(lang, source) {
    if (LANGS.indexOf(lang) === -1) return;
    var changed = state.lang !== lang;
    state.lang = lang;
    applyLangMeta();
    if (changed || source !== 'switch') track('quiz_language_select', { lang: lang, source: source });
    if (state.screen === 'lang') {
      go('start', 1);
    } else {
      renderHeader();
      render({ animate: false });
      var btn = document.querySelector('.lang-switch [data-lang="' + lang + '"]');
      if (btn && source === 'switch') btn.focus();
    }
  }

  function renderHeader() {
    var wrap = document.getElementById('lang-switch');
    wrap.textContent = '';
    wrap.setAttribute('aria-label', (state.lang ? t() : I18N.ru).header.langSwitch + ' / ' + I18N.uz.header.langSwitch);
    LANGS.forEach(function (lang) {
      wrap.appendChild(h('button', {
        type: 'button',
        class: 'lang-switch__btn',
        'data-lang': lang,
        lang: lang,
        'aria-pressed': String(state.lang === lang),
        'aria-label': I18N[lang].langScreen.name,
        onClick: function () { selectLang(lang, state.screen === 'lang' ? 'screen' : 'switch'); }
      }, [lang.toUpperCase()]));
    });
  }

  /* ---------- Рендер ---------- */

  function render(opts) {
    opts = opts || {};
    var screen = h('div', {
      class: 'screen' + (opts.animate ? ' screen--enter screen--' + opts.animate : '')
    });
    var renderers = {
      lang: renderLang, start: renderStart, question: renderQuestion, form: renderForm, thanks: renderThanks
    };
    renderers[state.screen](screen, opts);
    app.textContent = '';
    app.appendChild(screen);
    animateProgress();
    if (opts.focusHeading) {
      var heading = app.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
    }
  }

  function heading(text) {
    return h('h1', { class: 'title', tabindex: '-1', text: text });
  }

  function disclaimer() {
    return h('p', { class: 'disclaimer' }, [icon('info', 'icon--sm'), h('span', { text: t().common.disclaimer })]);
  }

  function renderProgress(parent) {
    var dict = t();
    var label = dict.common.stepOf(state.step, TOTAL_STEPS);
    parent.appendChild(h('div', { class: 'progress-head' }, [
      h('button', { type: 'button', class: 'back-btn', onClick: goBack }, [icon('back'), h('span', { text: dict.common.back })]),
      h('span', { class: 'step-label', 'aria-hidden': 'true', text: label })
    ]));
    parent.appendChild(h('div', {
      class: 'progress',
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': String(TOTAL_STEPS),
      'aria-valuenow': String(state.step),
      'aria-valuetext': label,
      'aria-label': label
    }, [h('div', { class: 'progress__bar', style: 'width:' + lastProgress + '%' })]));
  }

  function animateProgress() {
    var bar = app.querySelector('.progress__bar');
    var target = state.screen === 'form' || state.screen === 'question' ? (state.step / TOTAL_STEPS) * 100 : 0;
    if (!bar) { lastProgress = target; return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.style.width = target + '%'; }); });
    lastProgress = target;
  }

  function renderLang(root) {
    root.classList.add('screen--center');
    root.appendChild(h('div', { class: 'lang-icon' }, [icon('globe', 'icon--lg')]));
    root.appendChild(h('h1', { class: 'title title--center', tabindex: '-1' }, [
      h('span', { lang: 'ru', text: I18N.ru.langScreen.title }),
      h('span', { class: 'title__sep', 'aria-hidden': 'true', text: ' · ' }),
      h('span', { lang: 'uz', text: I18N.uz.langScreen.title })
    ]));
    root.appendChild(h('div', { class: 'lang-choice' }, LANGS.map(function (lang) {
      return h('button', {
        type: 'button', class: 'btn btn--outline btn--lang', lang: lang,
        onClick: function () { selectLang(lang, 'screen'); }
      }, [I18N[lang].langScreen.name]);
    })));
  }

  function renderStart(root) {
    var d = t().start;
    root.appendChild(h('span', { class: 'badge', text: d.badge }));
    root.appendChild(heading(d.title));
    root.appendChild(h('p', { class: 'lead', text: d.subtitle }));
    root.appendChild(h('ul', { class: 'benefits', 'aria-label': d.benefitsLabel }, ['doctors', 'equipment', 'rating'].map(function (k) {
      return h('li', { class: 'benefit' }, [icon(k, 'icon--circle'), h('span', { text: d.benefits[k] })]);
    })));
    root.appendChild(h('button', {
      type: 'button', class: 'btn btn--primary',
      onClick: function () {
        track('quiz_start', { lang: state.lang });
        goToStep(1);
      }
    }, [d.cta]));
    root.appendChild(disclaimer());
  }

  function renderQuestion(root) {
    var q = QUESTIONS[state.step - 1];
    var d = t().questions[q.key];
    var value = state.answers[q.key];
    renderProgress(root);
    root.appendChild(heading(d.title));
    var subtitleId = 'q-sub-' + q.key;
    if (d.subtitle) root.appendChild(h('p', { class: 'subtitle', id: subtitleId, text: d.subtitle }));

    var isMulti = q.type === 'multi';
    var list = h('div', {
      class: 'options',
      role: isMulti ? 'group' : 'radiogroup',
      'aria-label': d.title,
      'aria-describedby': d.subtitle ? subtitleId : null
    });
    q.options.forEach(function (code) {
      var selected = isMulti ? value.indexOf(code) !== -1 : value === code;
      list.appendChild(h('button', {
        type: 'button',
        class: 'option' + (isMulti ? ' option--multi' : ''),
        role: isMulti ? 'checkbox' : 'radio',
        'aria-checked': String(selected),
        'data-code': code,
        onClick: function () { isMulti ? toggleMulti(q, code) : chooseSingle(q, code); }
      }, [
        h('span', { class: 'option__text', text: d.options[code] }),
        h('span', { class: 'option__mark', html: ICONS.check })
      ]));
    });
    root.appendChild(list);

    var hintKey = !isMulti && q.hintFor ? q.hintFor(value) : null;
    if (hintKey) {
      root.appendChild(h('div', { class: 'hint', role: 'status' }, [icon('info'), h('p', { text: d.hints[hintKey] })]));
    }

    // «Далее»: всегда в мультивыборе; в одиночном — при подсказке или при возврате к уже отвеченному вопросу
    if (isMulti || value) {
      root.appendChild(h('button', {
        type: 'button', class: 'btn btn--primary btn--next',
        disabled: isMulti && !value.length,
        onClick: function () { advance(q); }
      }, [t().common.next]));
    }
  }

  function chooseSingle(q, code) {
    if (advancing) return;
    state.answers[q.key] = code;
    saveProgress();
    var hintKey = q.hintFor ? q.hintFor(code) : null;
    if (hintKey) {
      // Показываем подсказку и кнопку «Далее» вместо автоперехода
      render({ animate: false });
      var btn = app.querySelector('.option[data-code="' + code + '"]');
      if (btn) btn.focus({ preventScroll: true });
      var hint = app.querySelector('.hint');
      if (hint && hint.scrollIntoView) hint.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return;
    }
    Array.prototype.forEach.call(app.querySelectorAll('.option'), function (el) {
      el.setAttribute('aria-checked', String(el.getAttribute('data-code') === code));
    });
    var hintEl = app.querySelector('.hint');
    if (hintEl) hintEl.parentNode.removeChild(hintEl);
    advancing = true;
    setTimeout(function () { advance(q); }, AUTO_ADVANCE_MS);
  }

  function toggleMulti(q, code) {
    var selected = state.answers[q.key].slice();
    var idx = selected.indexOf(code);
    if (idx !== -1) {
      selected.splice(idx, 1);
    } else if (code === q.exclusive) {
      selected = [code];
    } else {
      selected = selected.filter(function (c) { return c !== q.exclusive; });
      selected.push(code);
    }
    state.answers[q.key] = q.options.filter(function (c) { return selected.indexOf(c) !== -1; });
    saveProgress();
    Array.prototype.forEach.call(app.querySelectorAll('.option'), function (el) {
      el.setAttribute('aria-checked', String(state.answers[q.key].indexOf(el.getAttribute('data-code')) !== -1));
    });
    var next = app.querySelector('.btn--next');
    if (next) next.disabled = !state.answers[q.key].length;
  }

  function advance(q) {
    var value = state.answers[q.key];
    if (!value || (Array.isArray(value) && !value.length)) return;
    track('quiz_step', { step: state.step, answer_code: Array.isArray(value) ? value.join(',') : value });
    goToStep(state.step + 1);
  }

  /* ---------- Телефон ---------- */

  function formatPhone(digits) {
    var s = PHONE_PREFIX + ' ';
    if (!digits.length) return s;
    s += '(' + digits.slice(0, 2);
    if (digits.length > 2) s += ') ' + digits.slice(2, 5);
    if (digits.length > 5) s += '-' + digits.slice(5, 7);
    if (digits.length > 7) s += '-' + digits.slice(7, 9);
    return s;
  }

  function localDigits(raw) {
    var d;
    if (raw.indexOf(PHONE_PREFIX) === 0) {
      d = raw.slice(PHONE_PREFIX.length).replace(/\D/g, '');
      if (d.length > 9 && d.indexOf('998') === 0) d = d.slice(3);
    } else {
      d = raw.replace(/\D/g, '');
      if (d.length > 9 && d.indexOf('998') === 0) d = d.slice(3);
    }
    return d;
  }

  function onPhoneInput(e) {
    var input = e.target;
    var raw = input.value;
    var prev = state.form.phoneDigits;
    var type = e.inputType || '';
    var caret = input.selectionStart === null ? raw.length : input.selectionStart;
    var hasPrefix = raw.indexOf(PHONE_PREFIX) === 0;
    var digits;
    var before;

    if (!hasPrefix && type.indexOf('delete') === 0) {
      // Префикс +998 стереть нельзя
      digits = prev;
      before = 0;
    } else {
      digits = localDigits(raw);
      var head = raw.slice(0, caret);
      before = (hasPrefix ? head.slice(PHONE_PREFIX.length) : head).replace(/\D/g, '').length;
      // Backspace по скобке/дефису удаляет цифру перед ним
      if (type === 'deleteContentBackward' && digits === prev && before > 0) {
        digits = digits.slice(0, before - 1) + digits.slice(before);
        before -= 1;
      }
    }
    digits = digits.slice(0, 9);
    before = Math.min(before, digits.length);
    state.form.phoneDigits = digits;
    var formatted = formatPhone(digits);
    input.value = formatted;
    updatePhoneMask(input);

    if (document.activeElement === input) {
      var pos = formatted.length;
      if (before < digits.length) {
        var count = 0;
        for (var i = PHONE_PREFIX.length; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) count++;
          if (count === before) { pos = i + 1; break; }
        }
        if (before === 0) pos = Math.min(formatted.length, PHONE_PREFIX.length + 2);
      }
      try { input.setSelectionRange(pos, pos); } catch (err) { /* ничего */ }
    }
    if (state.touched.phone) validateField('phone');
  }

  function onPhoneKeydown(e) {
    var input = e.target;
    var min = PHONE_PREFIX.length + 1;
    if (e.key === 'Backspace' && input.selectionStart === input.selectionEnd && input.selectionStart <= min) {
      e.preventDefault();
    }
  }

  function keepCaretAfterPrefix(e) {
    var input = e.target;
    var min = PHONE_PREFIX.length + 1;
    setTimeout(function () {
      if (input.selectionStart < min && input.selectionStart === input.selectionEnd) {
        try { input.setSelectionRange(input.value.length, input.value.length); } catch (err) { /* ничего */ }
      }
    }, 0);
  }

  function updatePhoneMask(input) {
    var mask = input.parentNode.querySelector('.phone-mask');
    if (!mask) return;
    mask.textContent = '';
    mask.appendChild(h('span', { class: 'phone-mask__typed', text: input.value }));
    mask.appendChild(document.createTextNode(PHONE_MASK.slice(input.value.length)));
  }

  /* ---------- Форма ---------- */

  function fieldErrors() {
    var f = state.form;
    return {
      name: f.name.trim().length < 2 ? 'name' : null,
      phone: f.phoneDigits.length !== 9 ? 'phone' : null,
      consent: !f.consent ? 'consent' : null
    };
  }

  function validateField(name) {
    var err = fieldErrors()[name];
    var show = state.touched[name] ? err : null;
    var input = app.querySelector('[data-field="' + name + '"]');
    var box = app.querySelector('#err-' + name);
    if (input) {
      if (show) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
    if (box) box.textContent = show ? t().form.errors[show] : '';
    var wrap = input && input.closest('.field, .consent');
    if (wrap) wrap.classList.toggle('is-invalid', !!show);
    return !err;
  }

  function renderForm(root) {
    var d = t().form;
    var f = state.form;
    renderProgress(root);
    root.appendChild(heading(d.title));
    root.appendChild(h('p', { class: 'subtitle', text: d.subtitle }));

    var form = h('form', { class: 'form', novalidate: true, onSubmit: function (e) { e.preventDefault(); submit(); } });

    // Имя
    form.appendChild(h('div', { class: 'field' }, [
      h('label', { class: 'field__label', for: 'f-name', text: d.nameLabel }),
      h('input', {
        class: 'input', id: 'f-name', name: 'name', type: 'text', 'data-field': 'name',
        autocomplete: 'name', autocapitalize: 'words', enterkeyhint: 'next', maxlength: '80',
        placeholder: d.namePlaceholder, value: f.name,
        'aria-required': 'true', 'aria-describedby': 'err-name',
        onInput: function (e) { f.name = e.target.value; if (state.touched.name) validateField('name'); },
        onBlur: function () { if (f.name.trim()) { state.touched.name = true; validateField('name'); } }
      }),
      h('p', { class: 'field__error', id: 'err-name', 'aria-live': 'polite' })
    ]));

    // Телефон
    form.appendChild(h('div', { class: 'field' }, [
      h('label', { class: 'field__label', for: 'f-phone', text: d.phoneLabel }),
      h('div', { class: 'phone-wrap' }, [
        h('span', { class: 'phone-mask', 'aria-hidden': 'true' }),
        h('input', {
          class: 'input input--phone', id: 'f-phone', name: 'phone', type: 'tel', 'data-field': 'phone',
          inputmode: 'tel', autocomplete: 'tel', enterkeyhint: 'done', maxlength: '24',
          value: formatPhone(f.phoneDigits),
          'aria-required': 'true', 'aria-describedby': 'err-phone',
          onInput: onPhoneInput,
          onKeydown: onPhoneKeydown,
          onFocus: keepCaretAfterPrefix,
          onClick: keepCaretAfterPrefix,
          onBlur: function () { if (f.phoneDigits.length) { state.touched.phone = true; validateField('phone'); } }
        })
      ]),
      h('p', { class: 'field__error', id: 'err-phone', 'aria-live': 'polite' })
    ]));

    // Удобное время
    form.appendChild(h('fieldset', { class: 'field field--group' }, [
      h('legend', { class: 'field__label', text: d.callTimeLabel }),
      h('div', { class: 'chips' }, CALL_TIMES.map(function (code) {
        return h('label', { class: 'chip' }, [
          h('input', {
            type: 'radio', name: 'callTime', value: code, class: 'chip__input', checked: f.callTime === code,
            onChange: function () { f.callTime = code; }
          }),
          chipText(d.callTime[code])
        ]);
      }))
    ]));

    // Согласие
    var consentText = [d.consentBefore];
    if (CONFIG.privacyUrl) {
      consentText.push(h('a', { href: CONFIG.privacyUrl, target: '_blank', rel: 'noopener', text: d.consentLink }));
    } else {
      consentText.push(d.consentLink);
    }
    consentText.push(d.consentAfter);
    form.appendChild(h('div', { class: 'consent' }, [
      h('label', { class: 'consent__label' }, [
        h('input', {
          type: 'checkbox', class: 'consent__input', id: 'f-consent', 'data-field': 'consent',
          checked: f.consent, 'aria-required': 'true', 'aria-describedby': 'err-consent',
          onChange: function (e) { f.consent = e.target.checked; state.touched.consent = true; validateField('consent'); }
        }),
        h('span', { class: 'consent__box', html: ICONS.check }),
        h('span', { class: 'consent__text' }, consentText)
      ]),
      h('p', { class: 'field__error', id: 'err-consent', 'aria-live': 'polite' })
    ]));

    // Ловушка для ботов: люди это поле не видят
    form.appendChild(h('div', { class: 'hp', 'aria-hidden': 'true' }, [
      h('input', {
        type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', value: f.honeypot,
        onInput: function (e) { f.honeypot = e.target.value; }
      })
    ]));

    form.appendChild(h('div', { class: 'send-error', id: 'send-error', role: 'alert' }));
    form.appendChild(h('button', { type: 'submit', class: 'btn btn--primary btn--submit' }, [
      h('span', { class: 'spinner', 'aria-hidden': 'true' }),
      h('span', { class: 'btn__label', text: d.submit })
    ]));
    form.appendChild(disclaimer());
    root.appendChild(form);

    // Восстанавливаем маску, ошибки и состояние отправки после смены языка
    setTimeout(function () {
      var phone = app.querySelector('#f-phone');
      if (phone) updatePhoneMask(phone);
      ['name', 'phone', 'consent'].forEach(validateField);
      updateSubmitState();
    }, 0);
  }

  // «Утро (8:00–12:00)» → название и время отдельными строками
  function chipText(label) {
    var m = /^(.*?)\s*\((.+)\)$/.exec(label);
    if (!m) return h('span', { class: 'chip__text', text: label });
    return h('span', { class: 'chip__text' }, [
      h('span', { class: 'chip__name', text: m[1] }),
      h('span', { class: 'chip__time', text: m[2] })
    ]);
  }

  function updateSubmitState() {
    var d = t().form;
    var btn = app.querySelector('.btn--submit');
    var box = app.querySelector('#send-error');
    if (!btn) return;
    var sending = state.status === 'sending';
    btn.disabled = sending;
    btn.classList.toggle('is-loading', sending);
    btn.setAttribute('aria-busy', String(sending));
    btn.querySelector('.btn__label').textContent = sending ? d.sending : d.submit;
    if (!box) return;
    box.textContent = '';
    if (state.status === 'error') {
      box.classList.add('is-visible');
      box.appendChild(h('p', { class: 'send-error__title', text: d.sendError }));
      box.appendChild(h('button', { type: 'button', class: 'btn btn--outline btn--retry', onClick: submit }, [d.retry]));
      box.appendChild(h('p', { class: 'send-error__call' }, [
        d.sendErrorCall + ' ',
        h('a', { href: CONFIG.clinic.phoneHref, class: 'nowrap', text: CONFIG.clinic.phoneDisplay, onClick: trackContact('phone') })
      ]));
    } else {
      box.classList.remove('is-visible');
    }
  }

  function ruLabel(key, code) {
    return code ? I18N.ru.questions[key].options[code] : '';
  }

  function buildPayload() {
    var a = state.answers;
    var f = state.form;
    var payload = {
      lang: state.lang,
      age: ruLabel('age', a.age),
      lastCheckup: ruLabel('lastCheckup', a.lastCheckup),
      motivation: ruLabel('motivation', a.motivation),
      focusAreas: a.focusAreas.map(function (c) { return ruLabel('focusAreas', c); }),
      city: ruLabel('city', a.city),
      name: f.name.trim().replace(/\s+/g, ' '),
      phone: PHONE_PREFIX + f.phoneDigits,
      callTime: I18N.ru.form.callTime[f.callTime],
      codes: {
        age: a.age,
        lastCheckup: a.lastCheckup,
        motivation: a.motivation,
        focusAreas: a.focusAreas.slice(),
        city: a.city,
        callTime: f.callTime
      }
    };
    TRACKING_KEYS.forEach(function (k) { payload[k] = state.tracking[k]; });
    payload.referrer = state.tracking.referrer;
    payload.submittedAt = new Date().toISOString();
    return payload;
  }

  function sendLead(payload) {
    var endpoint = CONFIG.leadEndpoint;
    if (!endpoint) {
      // Режим разработки: endpoint не задан
      console.info('[MEDELA quiz] leadEndpoint пуст — заявка не отправлена (режим разработки):', payload);
      return new Promise(function (resolve) { setTimeout(resolve, 600); });
    }
    var controller = window.AbortController ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, CONFIG.requestTimeoutMs || 15000) : null;
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res;
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  function submit() {
    if (state.status === 'sending') return;
    track('quiz_submit_click', { lang: state.lang });
    state.touched = { name: true, phone: true, consent: true };
    var errors = fieldErrors();
    ['name', 'phone', 'consent'].forEach(validateField);
    var firstInvalid = ['name', 'phone', 'consent'].filter(function (k) { return errors[k]; })[0];
    if (firstInvalid) {
      var el = app.querySelector('[data-field="' + firstInvalid + '"]');
      if (el) el.focus();
      return;
    }

    if (state.form.honeypot) { finish(); return; }

    state.status = 'sending';
    updateSubmitState();
    var payload = buildPayload();
    sendLead(payload).then(function () {
      track('quiz_lead_submit', { lang: state.lang, city: state.answers.city, age: state.answers.age });
      finish();
    }).catch(function (err) {
      console.warn('[MEDELA quiz] не удалось отправить заявку:', err);
      state.status = 'error';
      updateSubmitState();
      var retry = app.querySelector('.btn--retry');
      if (retry && retry.scrollIntoView) retry.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  function finish() {
    state.status = 'idle';
    state.submitted = true;
    clearProgress();
    go('thanks', TOTAL_STEPS);
  }

  function renderThanks(root) {
    var d = t().thanks;
    var c = CONFIG.clinic;
    root.classList.add('screen--center');
    root.appendChild(h('div', { class: 'done-icon' }, [icon('done', 'icon--xl')]));
    root.appendChild(heading(d.title));
    root.appendChild(h('p', { class: 'lead lead--strong', text: d.lead }));
    root.appendChild(h('p', { class: 'text', text: d.text }));
    root.appendChild(h('p', { class: 'text', text: d.stay }));
    root.appendChild(h('a', { class: 'btn btn--primary', href: c.siteUrl }, [d.home]));
    root.appendChild(h('div', { class: 'contacts' }, [
      h('p', { class: 'contacts__line' }, [
        d.callPrefix + ' ',
        h('a', { href: c.phoneHref, class: 'nowrap', text: c.phoneDisplay, onClick: trackContact('phone') })
      ]),
      h('a', { class: 'contacts__tg', href: c.telegramUrl, target: '_blank', rel: 'noopener', onClick: trackContact('telegram') }, [
        icon('telegram', 'icon--sm'), h('span', { text: d.telegram })
      ])
    ]));
  }

  /* ---------- Старт ---------- */

  function init() {
    app = document.getElementById('app');
    applyColors();
    loadGtm(CONFIG.gtmId);
    loadMetaPixel(CONFIG.metaPixelId);
    setupLogo();
    loadProgress();

    var urlLang = readTracking();
    if (urlLang) {
      state.lang = urlLang;
      state.screen = 'start';
      track('quiz_language_select', { lang: urlLang, source: 'url' });
    }
    applyLangMeta();
    try { history.replaceState({ screen: state.screen, step: state.step }, ''); } catch (e) { /* ничего */ }
    window.addEventListener('popstate', onPopState);

    renderHeader();
    render({ animate: false });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
