/**
 * Квиз «Гинеколог»: вопросы и тексты. Движок, стили и общие тексты — общие для всех квизов (../app.js, ../i18n.js).
 * Ключи вариантов (prevention, uzi, …) — машинные коды, они уходят в заявку; менять можно только текст.
 */
(function () {
  'use strict';

  window.MEDELA_QUIZ = {
    id: 'ginekolog',
    funnel: 'Квиз Гинеколог', // так квиз называется в пикселе Meta и в таблице лидов
    questions: [
      {
        key: 'goal', label: 'Цель визита', type: 'single',
        options: ['prevention', 'symptoms', 'pregnancy_plan', 'pregnancy', 'contraception', 'second_opinion'],
        hintFor: function (code) { return code === 'symptoms' ? 'symptoms' : null; }
      },
      { key: 'age', label: 'Возраст', type: 'single', options: ['under25', '25_34', '35_44', '45_54', '55plus'] },
      {
        key: 'services', label: 'Услуга', type: 'multi', exclusive: ['complex', 'not_sure'],
        options: ['consult', 'uzi', 'tests', 'colposcopy', 'complex', 'not_sure']
      },
      { key: 'when', label: 'Когда удобно прийти', type: 'single', options: ['asap', 'this_week', 'this_month', 'choosing'] },
      {
        key: 'city', label: 'Город', type: 'single',
        options: ['tashkent', 'samarkand', 'bukhara', 'fergana', 'andijan', 'namangan', 'other'],
        hintFor: function (code) { return code && code !== 'tashkent' ? 'notTashkent' : null; }
      }
    ]
  };

  var TEXTS = {
    ru: {
      meta: { title: 'Запись к гинекологу — MEDELA' },
      start: {
        title: 'Подберём приём гинеколога для вас',
        subtitle: 'Ответьте на 5 коротких вопросов — это займёт меньше минуты. Мы подскажем подходящий формат приёма и поможем записаться в удобное время.',
        badge: '5 вопросов · меньше минуты'
      },
      form: { subtitle: 'Менеджер свяжется с вами и поможет записаться к гинекологу в удобное время' },
      thanks: { text: 'Наш менеджер свяжется с вами в ближайшее время, чтобы уточнить детали и записать вас к гинекологу в удобное время.' },
      questions: {
        goal: {
          title: 'С какой целью вы планируете визит?',
          options: {
            prevention: 'Профилактический осмотр',
            symptoms: 'Есть беспокоящие симптомы',
            pregnancy_plan: 'Планирование беременности',
            pregnancy: 'Ведение беременности',
            contraception: 'Подбор контрацепции',
            second_opinion: 'Хочу второе мнение по результатам обследования'
          },
          hints: {
            symptoms: 'Если симптомы выраженные или появились внезапно — не откладывайте визит к врачу. Наш менеджер поможет записаться быстрее.'
          }
        },
        age: {
          title: 'Ваш возраст?',
          options: { under25: 'До 25 лет', '25_34': '25–34 года', '35_44': '35–44 года', '45_54': '45–54 года', '55plus': '55 лет и старше' }
        },
        services: {
          title: 'Что вас интересует?',
          subtitle: 'Можно выбрать несколько вариантов',
          options: {
            consult: 'Консультация гинеколога',
            uzi: 'УЗИ органов малого таза',
            tests: 'Анализы и мазки',
            colposcopy: 'Кольпоскопия',
            complex: 'Комплексное обследование',
            not_sure: 'Пока не знаю — нужна консультация'
          }
        },
        when: {
          title: 'Когда вам было бы удобно прийти?',
          options: { asap: 'Как можно скорее', this_week: 'На этой неделе', this_month: 'В течение месяца', choosing: 'Пока выбираю клинику' }
        }
      }
    },
    uz: {
      meta: { title: 'Ginekolog qabuliga yozilish — MEDELA' },
      start: {
        title: 'Sizga mos ginekolog qabulini tanlaymiz',
        subtitle: '5 ta qisqa savolga javob bering — bu bir daqiqadan kam vaqt oladi. Mos qabul formatini aytamiz va qulay vaqtga yozilishga yordam beramiz.',
        badge: '5 ta savol · 1 daqiqadan kam'
      },
      form: { subtitle: 'Menejerimiz siz bilan bogʻlanadi va ginekolog qabuliga qulay vaqtga yozilishga yordam beradi' },
      thanks: { text: 'Menejerimiz tafsilotlarni aniqlashtirish va sizni qulay vaqtga ginekolog qabuliga yozish uchun tez orada siz bilan bogʻlanadi.' },
      questions: {
        goal: {
          title: 'Qabulga qanday maqsadda kelmoqchisiz?',
          options: {
            prevention: 'Profilaktik koʻrik',
            symptoms: 'Meni bezovta qilayotgan alomatlar bor',
            pregnancy_plan: 'Homiladorlikni rejalashtirish',
            pregnancy: 'Homiladorlikni kuzatish',
            contraception: 'Kontratseptsiyani tanlash',
            second_opinion: 'Tekshiruv natijalari boʻyicha ikkinchi fikr olmoqchiman'
          },
          hints: {
            symptoms: 'Agar alomatlar kuchli boʻlsa yoki toʻsatdan paydo boʻlgan boʻlsa, shifokorga murojaat qilishni kechiktirmang. Menejerimiz tezroq yozilishingizga yordam beradi.'
          }
        },
        age: {
          title: 'Yoshingiz nechada?',
          options: { under25: '25 yoshgacha', '25_34': '25–34 yosh', '35_44': '35–44 yosh', '45_54': '45–54 yosh', '55plus': '55 va undan katta' }
        },
        services: {
          title: 'Sizni nima qiziqtiradi?',
          subtitle: 'Bir nechta variantni tanlash mumkin',
          options: {
            consult: 'Ginekolog maslahati',
            uzi: 'Kichik chanoq aʼzolari UZI',
            tests: 'Tahlillar va surtmalar',
            colposcopy: 'Kolposkopiya',
            complex: 'Kompleks tekshiruv',
            not_sure: 'Hali bilmayman — maslahat kerak'
          }
        },
        when: {
          title: 'Qachon kelish qulay boʻladi?',
          options: { asap: 'Imkon qadar tezroq', this_week: 'Shu hafta', this_month: 'Bir oy ichida', choosing: 'Hozircha klinika tanlayapman' }
        }
      }
    }
  };

  // Подмешиваем тексты квиза в общие тексты (i18n.js)
  ['ru', 'uz'].forEach(function (lang) {
    var base = window.I18N[lang], add = TEXTS[lang];
    ['meta', 'start', 'form', 'thanks', 'questions'].forEach(function (part) {
      Object.keys(add[part] || {}).forEach(function (k) { base[part][k] = add[part][k]; });
    });
  });
})();
