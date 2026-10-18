/**
 * Страница /zapis: запись на Check-up через Telegram-бота.
 * Тексты — в объекте TEXTS ниже, данные клиники, бот и пиксель — в /config.js.
 */
(function () {
  'use strict';

  var CONFIG = window.MEDELA_CONFIG || {};
  var CLINIC = CONFIG.clinic || {};
  var LANGS = ['ru', 'uz'];

  var TEXTS = {
    ru: {
      title: 'Запись на Check-up — MEDELA',
      htmlLang: 'ru',
      logoAlt: 'MEDELA — медицинская клиника в Ташкенте',
      langSwitch: 'Язык',
      badge: 'Запись через Telegram',
      h1: 'Запишитесь на Check-up в MEDELA за 1 минуту',
      lead: 'Откройте нашего Telegram-бота и оставьте заявку. Менеджер свяжется с вами, поможет подобрать формат обследования и удобное время.',
      cta: 'Записаться в Telegram',
      ctaNote: 'Отвечаем Пн–Сб с 8:00 до 18:00',
      benefitsTitle: 'Почему MEDELA',
      benefits: {
        doctors: 'Врачи с опытом от 15 лет',
        equipment: 'Современное оборудование General Electric',
        rating: 'Рейтинг 5,0 на Яндекс Картах'
      },
      stepsTitle: 'Как записаться',
      steps: [
        'Нажмите «Записаться в Telegram»',
        'Оставьте заявку в боте — это займёт меньше минуты',
        'Менеджер свяжется с вами и подтвердит удобное время'
      ],
      contactsTitle: 'Контакты',
      address: 'г. Ташкент, ул. Гагарина, 40/39',
      hours: 'Пн–Сб 8:00–18:00',
      call: 'Позвонить',
      callNote: 'Если удобнее — позвоните нам:'
    },
    uz: {
      title: 'Check-up’ga yozilish — MEDELA',
      htmlLang: 'uz',
      logoAlt: 'MEDELA — Toshkentdagi tibbiyot klinikasi',
      langSwitch: 'Til',
      badge: 'Telegram orqali yozilish',
      h1: 'MEDELA’da Check-up’ga 1 daqiqada yoziling',
      lead: 'Telegram-botimizni oching va ariza qoldiring. Menejerimiz siz bilan bogʻlanadi, tekshiruv formatini va qulay vaqtni tanlashda yordam beradi.',
      cta: 'Telegram orqali yozilish',
      ctaNote: 'Du–Sha 8:00 dan 18:00 gacha javob beramiz',
      benefitsTitle: 'Nega MEDELA',
      benefits: {
        doctors: '15 yildan ortiq tajribaga ega shifokorlar',
        equipment: 'Zamonaviy General Electric uskunalari',
        rating: 'Yandex Xaritalarda 5,0 reyting'
      },
      stepsTitle: 'Qanday yozilish mumkin',
      steps: [
        '«Telegram orqali yozilish» tugmasini bosing',
        'Botda ariza qoldiring — bu bir daqiqadan kam vaqt oladi',
        'Menejerimiz siz bilan bogʻlanadi va qulay vaqtni tasdiqlaydi'
      ],
      contactsTitle: 'Kontaktlar',
      address: 'Toshkent sh., Gagarin koʻchasi, 40/39',
      hours: 'Du–Sha 8:00–18:00',
      call: 'Qoʻngʻiroq qilish',
      callNote: 'Qulayroq boʻlsa, bizga qoʻngʻiroq qiling:'
    }
  };

  var ICONS = {
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M21.4 4.1 2.9 11.2c-1 .4-1 1.5 0 1.8l4.6 1.4 1.8 5.5c.2.7 1.1.9 1.6.4l2.6-2.5 4.9 3.6c.6.4 1.4.1 1.6-.6l3.2-15.4c.2-.9-.7-1.6-1.6-1.3zM9.6 14.3l-.4 3.6-1.2-3.8 9.6-6.1-8 6.3z"/></svg>',
    doctors: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M4 3h4M12 3h4"/><path d="M10 12v2a5 5 0 0 0 10 0v-1"/><circle cx="20" cy="11" r="2"/></svg>',
    equipment: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/><path d="M6 10h3l1.5-3 3 6 1.5-3h3"/></svg>',
    rating: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>'
  };

  var state = { lang: 'ru', tracking: {} };
  var app;

  function t() { return TEXTS[state.lang]; }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- Аналитика ---------- */

  function track(event, params) {
    window.dataLayer = window.dataLayer || [];
    var data = { event: event };
    Object.keys(params || {}).forEach(function (k) { data[k] = params[k]; });
    window.dataLayer.push(data);
  }

  function pixel(method, name, params) {
    if (typeof window.fbq === 'function') window.fbq(method, name, params || {});
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

  /* ---------- Ссылка на бота ---------- */

  // Параметр start: язык и источник рекламы, чтобы бот видел, откуда пришёл человек.
  // Telegram разрешает только A–Z, a–z, 0–9, _ и -, максимум 64 символа.
  function botUrl() {
    var bot = String(CLINIC.telegramBot || '').replace(/^@/, '');
    var clean = function (v) { return String(v || '').replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 24); };
    var parts = [state.lang, clean(state.tracking.utm_source), clean(state.tracking.utm_content || state.tracking.utm_campaign)];
    var start = parts.join('-').replace(/-+$/, '').slice(0, 64);
    return 'https://t.me/' + bot + '?start=' + start;
  }

  function onBotClick(e) {
    var link = e.currentTarget;
    var placement = link.getAttribute('data-placement');
    track('zapis_bot_click', { lang: state.lang, placement: placement });
    pixel('track', 'Lead', { content_name: 'telegram_bot', lang: state.lang, placement: placement });
    // Даём пикселю долю секунды отправить событие, потом открываем Telegram
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      setTimeout(function () { window.location.href = link.href; }, 300);
    }
  }

  function onPhoneClick() {
    track('zapis_phone_click', { lang: state.lang });
    pixel('track', 'Contact', { content_name: 'phone', lang: state.lang });
  }

  /* ---------- Рендер ---------- */

  function icon(name, cls) {
    return '<span class="icon ' + (cls || '') + '">' + ICONS[name] + '</span>';
  }

  function ctaButton(placement) {
    return '<a class="btn btn--tg js-bot" data-placement="' + placement + '" href="' + esc(botUrl()) + '">' +
      icon('telegram', 'icon--tg') + '<span>' + esc(t().cta) + '</span></a>';
  }

  function render() {
    var d = t();
    document.documentElement.lang = d.htmlLang;
    document.title = d.title;
    var logo = document.getElementById('logo');
    logo.setAttribute('role', 'img');
    logo.setAttribute('aria-label', d.logoAlt);

    var sw = document.getElementById('lang-switch');
    sw.setAttribute('aria-label', d.langSwitch);
    sw.innerHTML = LANGS.map(function (l) {
      return '<button type="button" class="lang-switch__btn" data-lang="' + l + '" lang="' + l + '" aria-pressed="' + (l === state.lang) + '">' + l.toUpperCase() + '</button>';
    }).join('');

    app.innerHTML =
      '<section class="card hero">' +
        '<span class="badge">' + icon('telegram', 'icon--sm') + esc(d.badge) + '</span>' +
        '<h1 class="title">' + esc(d.h1).replace(/Check-up/g, '<span class="nowrap">Check-up</span>') + '</h1>' +
        '<p class="lead">' + esc(d.lead) + '</p>' +
        ctaButton('hero') +
        '<p class="note">' + esc(d.ctaNote) + '</p>' +
      '</section>' +

      '<section class="card">' +
        '<h2 class="h2">' + esc(d.benefitsTitle) + '</h2>' +
        '<ul class="benefits">' + ['doctors', 'equipment', 'rating'].map(function (k) {
          return '<li class="benefit">' + icon(k, 'icon--circle') + '<span>' + esc(d.benefits[k]) + '</span></li>';
        }).join('') + '</ul>' +
      '</section>' +

      '<section class="card">' +
        '<h2 class="h2">' + esc(d.stepsTitle) + '</h2>' +
        '<ol class="steps">' + d.steps.map(function (s, i) {
          return '<li class="step"><span class="step__n">' + (i + 1) + '</span><span>' + esc(s) + '</span></li>';
        }).join('') + '</ol>' +
        ctaButton('steps') +
      '</section>' +

      '<section class="card">' +
        '<h2 class="h2">' + esc(d.contactsTitle) + '</h2>' +
        '<ul class="contacts">' +
          '<li>' + icon('pin') + '<span>' + esc(d.address) + '</span></li>' +
          '<li>' + icon('clock') + '<span>' + esc(d.hours) + '</span></li>' +
          '<li>' + icon('phone') + '<span>' + esc(d.callNote) + ' <a class="js-phone nowrap" href="' + esc(CLINIC.phoneHref) + '">' + esc(CLINIC.phoneDisplay) + '</a></span></li>' +
        '</ul>' +
      '</section>' +

      '<div class="sticky" id="sticky" aria-hidden="true">' + ctaButton('sticky') + '</div>';

    Array.prototype.forEach.call(document.querySelectorAll('.js-bot'), function (a) { a.addEventListener('click', onBotClick); });
    Array.prototype.forEach.call(document.querySelectorAll('.js-phone'), function (a) { a.addEventListener('click', onPhoneClick); });
    Array.prototype.forEach.call(sw.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
    });
    setupSticky();
  }

  // Плавающая кнопка внизу экрана: видна, когда главная кнопка ушла вверх,
  // а других кнопок записи на экране нет
  var observer = null;

  function setupSticky() {
    var sticky = document.getElementById('sticky');
    var inline = app.querySelectorAll('.card .js-bot');
    if (observer) observer.disconnect();
    if (!sticky || !inline.length || !('IntersectionObserver' in window)) return;
    var stickyLink = sticky.querySelector('a');
    stickyLink.setAttribute('tabindex', '-1');
    var visible = {};
    var heroAbove = false;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var key = en.target.getAttribute('data-placement');
        visible[key] = en.isIntersecting;
        if (key === 'hero') heroAbove = !en.isIntersecting && en.boundingClientRect.top < 0;
      });
      var anyVisible = Object.keys(visible).some(function (k) { return visible[k]; });
      var show = heroAbove && !anyVisible;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', String(!show));
      stickyLink.setAttribute('tabindex', show ? '0' : '-1');
    });
    Array.prototype.forEach.call(inline, function (el) { observer.observe(el); });
  }

  function setLang(lang, fromSwitch) {
    if (LANGS.indexOf(lang) === -1 || (fromSwitch && lang === state.lang)) return;
    state.lang = lang;
    try { localStorage.setItem('medela_zapis_lang', lang); } catch (e) { /* ничего */ }
    if (fromSwitch) track('zapis_language_select', { lang: lang });
    render();
    if (fromSwitch) {
      var btn = document.querySelector('.lang-switch [data-lang="' + lang + '"]');
      if (btn) btn.focus();
    }
  }

  function init() {
    app = document.getElementById('app');
    loadGtm(CONFIG.gtmId);
    loadMetaPixel(CONFIG.metaPixelId);

    var params;
    try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      state.tracking[k] = (params && params.get(k)) || '';
    });

    var lang = params && (params.get('lang') || '').toLowerCase();
    if (LANGS.indexOf(lang) === -1) {
      try { lang = localStorage.getItem('medela_zapis_lang'); } catch (e) { lang = null; }
    }
    if (LANGS.indexOf(lang) === -1) lang = /^uz/i.test(navigator.language || '') ? 'uz' : 'ru';
    state.lang = lang;
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
