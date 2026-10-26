/**
 * Страница /zapis: медицинская клиника MEDELA, запись через Telegram-бота.
 * Тексты — в объекте TEXTS ниже, данные клиники, бот и пиксель — в /config.js.
 */
(function () {
  'use strict';

  var CONFIG = window.MEDELA_CONFIG || {};
  var CLINIC = CONFIG.clinic || {};
  var LANGS = ['ru', 'uz'];
  // Название воронки — одинаковое в пикселе и в таблице лидов (колонка «Воронка»)
  var FUNNEL_NAME = 'Сайт /zapis';
  var SERVICES = ['cardio', 'endo', 'pediatrics', 'gyneco', 'uzi', 'lab'];

  var TEXTS = {
    ru: {
      title: 'Медицинская клиника MEDELA в Ташкенте — запись в Telegram',
      htmlLang: 'ru',
      switchTo: 'Oʻzbekcha',
      switchLabel: 'Переключить язык на узбекский',
      brandLabel: 'MEDELA — медицинская клиника в Ташкенте',
      cta: 'Получить консультацию',
      pill: 'Пн–Сб, 8:00–18:00 · г. Ташкент, ул. Гагарина, 40/39',
      h1: 'Медицинская клиника для всей семьи в Ташкенте',
      lead: 'Кардиология, эндокринология, педиатрия, гинекология, УЗИ и анализы — под одной крышей. Запишитесь в Telegram за минуту.',
      checks: [
        '8 направлений и 6 профильных врачей',
        'УЗИ, ЭКГ и лаборатория на современном оборудовании',
        'Удобное время — даже в субботу'
      ],
      ctaNote: 'Займёт 1 минуту',
      stats: [
        ['15+', 'лет опыта у наших врачей'],
        ['5,0', 'рейтинг на Яндекс Картах', true],
        ['8', 'медицинских направлений'],
        ['6', 'профильных врачей']
      ],
      servicesTitle: 'Направления',
      servicesSub: 'Выберите нужное направление — бот подскажет свободное время и поможет записаться.',
      services: {
        cardio: 'Кардиология',
        endo: 'Эндокринология',
        pediatrics: 'Педиатрия',
        gyneco: 'Гинекология',
        uzi: 'УЗИ-диагностика',
        lab: 'Анализы и лаборатория'
      },
      serviceGo: 'Записаться →',
      stepsTitle: 'Как записаться',
      steps: [
        'Нажмите «Получить консультацию»',
        'Выберите услугу в Telegram-боте',
        'Администратор подтвердит запись'
      ],
      finalTitle: 'Запишитесь на приём за 1 минуту',
      finalText: 'Без ожидания на линии — выберите услугу в Telegram, а мы подтвердим запись.',
      callPrefix: 'или позвоните',
      address: 'г. Ташкент, ул. Гагарина, 40/39',
      hours: 'Пн–Сб, 8:00–18:00',
      copy: 'MEDELA — медицинская клиника в Ташкенте'
    },
    uz: {
      title: 'MEDELA tibbiyot klinikasi, Toshkent — Telegram orqali yozilish',
      htmlLang: 'uz',
      switchTo: 'Русский',
      switchLabel: 'Tilni rus tiliga oʻzgartirish',
      brandLabel: 'MEDELA — Toshkentdagi tibbiyot klinikasi',
      cta: 'Maslahat olish',
      pill: 'Du–Sha, 8:00–18:00 · Toshkent sh., Gagarin koʻchasi, 40/39',
      h1: 'Toshkentda butun oila uchun tibbiyot klinikasi',
      lead: 'Kardiologiya, endokrinologiya, pediatriya, ginekologiya, UZI va tahlillar — bir joyda. Telegram orqali bir daqiqada yoziling.',
      checks: [
        '8 ta yoʻnalish va 6 nafar mutaxassis shifokor',
        'UZI, EKG va laboratoriya — zamonaviy uskunalarda',
        'Qulay vaqt — hatto shanba kuni ham'
      ],
      ctaNote: '1 daqiqa vaqt oladi',
      stats: [
        ['15+', 'yillik shifokorlar tajribasi'],
        ['5,0', 'Yandex Xaritalarda reyting', true],
        ['8', 'ta tibbiy yoʻnalish'],
        ['6', 'nafar mutaxassis shifokor']
      ],
      servicesTitle: 'Yoʻnalishlar',
      servicesSub: 'Kerakli yoʻnalishni tanlang — bot boʻsh vaqtni koʻrsatadi va yozilishga yordam beradi.',
      services: {
        cardio: 'Kardiologiya',
        endo: 'Endokrinologiya',
        pediatrics: 'Pediatriya',
        gyneco: 'Ginekologiya',
        uzi: 'UZI diagnostikasi',
        lab: 'Tahlillar va laboratoriya'
      },
      serviceGo: 'Yozilish →',
      stepsTitle: 'Qanday yozilish mumkin',
      steps: [
        '«Maslahat olish» tugmasini bosing',
        'Telegram-botda kerakli xizmatni tanlang',
        'Administratorimiz yozilishni tasdiqlaydi'
      ],
      finalTitle: 'Qabulga 1 daqiqada yoziling',
      finalText: 'Liniyada kutmasdan — Telegramda xizmatni tanlang, biz esa yozilishni tasdiqlaymiz.',
      callPrefix: 'yoki qoʻngʻiroq qiling',
      address: 'Toshkent sh., Gagarin koʻchasi, 40/39',
      hours: 'Du–Sha, 8:00–18:00',
      copy: 'MEDELA — Toshkentdagi tibbiyot klinikasi'
    }
  };

  var ICONS = {
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M21.4 4.1 2.9 11.2c-1 .4-1 1.5 0 1.8l4.6 1.4 1.8 5.5c.2.7 1.1.9 1.6.4l2.6-2.5 4.9 3.6c.6.4 1.4.1 1.6-.6l3.2-15.4c.2-.9-.7-1.6-1.6-1.3zM9.6 14.3l-.4 3.6-1.2-3.8 9.6-6.1-8 6.3z"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    cardio: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/><path d="M5 12h3.5l1.5-2.5 2.5 5 1.5-2.5H19"/></svg>',
    endo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3 4 5 6.6 5 9.5a5 5 0 0 1-10 0C7 9.6 9 7 12 3z"/><path d="M10 14a2 2 0 0 0 2 2"/></svg>',
    pediatrics: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M9 10h.01M15 10h.01"/><path d="M9.5 14.5a3.5 3.5 0 0 0 5 0"/><path d="M12 4c-1 1-1 2 0 3"/></svg>',
    gyneco: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="5"/><path d="M12 14v7M9 18h6"/></svg>',
    uzi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v5a4 4 0 0 1-8 0z"/><path d="M12 12v2"/><path d="M7 17a7 7 0 0 0 10 0M5 20a10 10 0 0 0 14 0"/></svg>',
    lab: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/></svg>'
  };

  // Знак-листья рядом с названием (упрощённый, без копирования логотипа)
  var BRAND_MARK = '<svg class="brand__mark" viewBox="0 0 40 40" aria-hidden="true">' +
    '<g fill="#8DC63F"><ellipse cx="20" cy="7" rx="2.6" ry="4.2"/><ellipse cx="12.5" cy="10" rx="2.4" ry="3.9" transform="rotate(-40 12.5 10)"/>' +
    '<ellipse cx="27.5" cy="10" rx="2.4" ry="3.9" transform="rotate(40 27.5 10)"/><ellipse cx="9" cy="17" rx="2.2" ry="3.6" transform="rotate(-70 9 17)"/>' +
    '<ellipse cx="31" cy="17" rx="2.2" ry="3.6" transform="rotate(70 31 17)"/></g>' +
    '<g fill="#237E8C"><ellipse cx="16" cy="14" rx="2" ry="3.3" transform="rotate(-20 16 14)"/><ellipse cx="24" cy="14" rx="2" ry="3.3" transform="rotate(20 24 14)"/><circle cx="20" cy="19" r="2.4"/></g>' +
    '<path d="M8 23c2 8 8 12 12 13M32 23c-2 8-8 12-12 13M20 22v12" fill="none" stroke="#237E8C" stroke-width="2.6" stroke-linecap="round"/></svg>';

  var state = { lang: 'ru', tracking: {} };
  var app;
  var observer = null;

  function t() { return TEXTS[state.lang]; }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function icon(name, cls) {
    return '<span class="icon ' + (cls || '') + '">' + ICONS[name] + '</span>';
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

  // Параметр start: язык, направление (если выбрано) и источник рекламы.
  // Telegram разрешает только A–Z, a–z, 0–9, _ и -, максимум 64 символа.
  function botUrl(service) {
    var bot = String(CLINIC.telegramBot || '').replace(/^@/, '');
    var clean = function (v) { return String(v || '').replace(/[^A-Za-z0-9_]/g, '_').replace(/_+/g, '_').slice(0, 24); };
    var parts = [state.lang, service ? 'svc_' + service : '', clean(state.tracking.utm_source), clean(state.tracking.utm_content || state.tracking.utm_campaign)];
    var start = parts.filter(Boolean).join('-').slice(0, 64);
    return 'https://t.me/' + bot + '?start=' + start;
  }

  function botLink(placement, cls, inner, service) {
    return '<a class="' + cls + ' js-bot" data-placement="' + placement + '"' + (service ? ' data-service="' + service + '"' : '') +
      ' href="' + esc(botUrl(service)) + '">' + inner + '</a>';
  }

  function ctaInner() {
    return icon('telegram') + '<span>' + esc(t().cta) + '</span>';
  }

  function onBotClick(e) {
    var link = e.currentTarget;
    var placement = link.getAttribute('data-placement');
    var service = link.getAttribute('data-service') || '';
    track('zapis_bot_click', { lang: state.lang, placement: placement, service: service });
    pixel('track', 'Lead', { content_name: FUNNEL_NAME, lang: state.lang, placement: placement, service: service });
    // Даём пикселю долю секунды отправить событие, потом открываем Telegram
    if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      setTimeout(function () { window.location.href = link.href; }, 300);
    }
  }

  function onPhoneClick() {
    track('zapis_phone_click', { lang: state.lang });
    pixel('track', 'Contact', { content_name: FUNNEL_NAME, channel: 'phone', lang: state.lang });
  }

  /* ---------- Рендер ---------- */

  function render() {
    var d = t();
    document.documentElement.lang = d.htmlLang;
    document.title = d.title;
    var phone = '<a class="js-phone nowrap" href="' + esc(CLINIC.phoneHref) + '">' + esc(CLINIC.phoneDisplay) + '</a>';

    app.innerHTML =
      '<header class="header"><div class="container header__inner">' +
        '<span class="brand" role="img" aria-label="' + esc(d.brandLabel) + '">' + BRAND_MARK + '<span class="brand__name" aria-hidden="true">MEDELA</span></span>' +
        '<div class="header__right">' +
          '<button type="button" class="lang-btn" id="lang-btn" aria-label="' + esc(d.switchLabel) + '" lang="' + (state.lang === 'ru' ? 'uz' : 'ru') + '">' + esc(d.switchTo) + '</button>' +
          '<a class="header__phone js-phone" href="' + esc(CLINIC.phoneHref) + '">' + esc(CLINIC.phoneDisplay) + '</a>' +
          botLink('header', 'btn btn--lime header__cta', ctaInner()) +
        '</div>' +
      '</div></header>' +

      '<main>' +
        '<section class="hero"><div class="container hero__inner"><div class="hero__content">' +
          '<span class="pill"><span class="pill__dot"></span><span>' + esc(d.pill) + '</span></span>' +
          '<h1>' + esc(d.h1) + '</h1>' +
          '<p class="hero__lead">' + esc(d.lead) + '</p>' +
          '<ul class="checks">' + d.checks.map(function (c) {
            return '<li><span class="check">' + ICONS.check + '</span><span>' + esc(c) + '</span></li>';
          }).join('') + '</ul>' +
          '<div class="hero__cta">' + botLink('hero', 'btn btn--lime btn--lg', ctaInner()) +
            '<span class="hero__note">' + esc(d.ctaNote) + '</span></div>' +
        '</div></div></section>' +

        '<section class="stats"><div class="container stats__grid">' + d.stats.map(function (s) {
          return '<div class="stat"><div class="stat__n">' + esc(s[0]) + (s[2] ? '<span class="star" aria-hidden="true">★</span>' : '') +
            '</div><div class="stat__l">' + esc(s[1]) + '</div></div>';
        }).join('') + '</div></section>' +

        '<section class="section"><div class="container">' +
          '<h2 class="section__title">' + esc(d.servicesTitle) + '</h2>' +
          '<p class="section__sub">' + esc(d.servicesSub) + '</p>' +
          '<div class="services">' + SERVICES.map(function (code) {
            return botLink('service', 'service',
              '<span class="icon service__icon">' + ICONS[code] + '</span>' +
              '<span class="service__name">' + esc(d.services[code]) + '</span>' +
              '<span class="service__go">' + esc(d.serviceGo) + '</span>', code);
          }).join('') + '</div>' +
        '</div></section>' +

        '<section class="section"><div class="container">' +
          '<h2 class="section__title">' + esc(d.stepsTitle) + '</h2>' +
          '<ol class="steps">' + d.steps.map(function (s, i) {
            return '<li class="step"><span class="step__n">' + (i + 1) + '</span><div class="step__t">' + esc(s) + '</div></li>';
          }).join('') + '</ol>' +
        '</div></section>' +

        '<section class="final"><div class="container"><div class="final__box">' +
          '<div><h2 class="final__title">' + esc(d.finalTitle) + '</h2><p class="final__text">' + esc(d.finalText) + '</p></div>' +
          '<div class="final__actions">' + botLink('final', 'btn btn--lime btn--lg', ctaInner()) +
            '<a class="final__phone js-phone" href="' + esc(CLINIC.phoneHref) + '">' + esc(d.callPrefix) + ' <span class="nowrap">' + esc(CLINIC.phoneDisplay) + '</span></a></div>' +
        '</div></div></section>' +
      '</main>' +

      '<footer class="footer"><div class="container">' +
        '<div class="footer__grid">' +
          '<div><span class="brand">' + BRAND_MARK + '<span class="brand__name">MEDELA</span></span></div>' +
          '<div class="footer__item">' + icon('pin') + '<span>' + esc(d.address) + '<br>' + esc(d.hours) + '</span></div>' +
          '<div><div class="footer__item">' + icon('phone') + phone + '</div>' +
            '<div class="footer__links"><a href="' + esc(CLINIC.telegramUrl) + '" target="_blank" rel="noopener">Telegram</a>' +
            '<a href="' + esc(CLINIC.instagramUrl) + '" target="_blank" rel="noopener">Instagram</a></div></div>' +
        '</div>' +
        '<div class="footer__copy">© ' + new Date().getFullYear() + ' ' + esc(d.copy) + '</div>' +
      '</div></footer>' +

      '<div class="sticky" id="sticky" aria-hidden="true">' + botLink('sticky', 'btn btn--lime btn--block', ctaInner()) + '</div>';

    Array.prototype.forEach.call(app.querySelectorAll('.js-bot'), function (a) { a.addEventListener('click', onBotClick); });
    Array.prototype.forEach.call(app.querySelectorAll('.js-phone'), function (a) { a.addEventListener('click', onPhoneClick); });
    document.getElementById('lang-btn').addEventListener('click', function () {
      setLang(state.lang === 'ru' ? 'uz' : 'ru', true);
    });
    setupSticky();
  }

  // Плавающая кнопка на мобильных: видна, когда главная кнопка ушла вверх,
  // а других кнопок записи на экране нет
  function setupSticky() {
    var sticky = document.getElementById('sticky');
    var watched = app.querySelectorAll('.hero .js-bot, .final .js-bot, .services');
    if (observer) observer.disconnect();
    if (!sticky || !('IntersectionObserver' in window)) return;
    var stickyLink = sticky.querySelector('a');
    stickyLink.setAttribute('tabindex', '-1');
    var visible = [];
    var heroAbove = false;
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var i = Array.prototype.indexOf.call(watched, en.target);
        visible[i] = en.isIntersecting;
        if (en.target.getAttribute('data-placement') === 'hero') {
          heroAbove = !en.isIntersecting && en.boundingClientRect.top < 0;
        }
      });
      var show = heroAbove && !visible.some(Boolean);
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', String(!show));
      stickyLink.setAttribute('tabindex', show ? '0' : '-1');
    });
    Array.prototype.forEach.call(watched, function (el) { observer.observe(el); });
  }

  function setLang(lang, fromSwitch) {
    if (LANGS.indexOf(lang) === -1) return;
    state.lang = lang;
    try { localStorage.setItem('medela_zapis_lang', lang); } catch (e) { /* ничего */ }
    if (fromSwitch) track('zapis_language_select', { lang: lang });
    render();
    if (fromSwitch) {
      var btn = document.getElementById('lang-btn');
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
