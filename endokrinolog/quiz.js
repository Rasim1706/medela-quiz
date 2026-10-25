/**
 * Квиз «Эндокринолог»: вопросы и тексты. Движок, стили и общие тексты — общие для всех квизов (../app.js, ../i18n.js).
 * Вопросы «Возраст» и «Город» берут тексты из общего i18n.js.
 * Ключи вариантов (fatigue, thyroid, …) — машинные коды, они уходят в заявку; менять можно только текст.
 */
(function () {
  'use strict';

  window.MEDELA_QUIZ = {
    id: 'endokrinolog',
    funnel: 'Квиз Эндокринолог', // так квиз называется в пикселе Meta и в таблице лидов
    questions: [
      {
        key: 'concern', label: 'Беспокоит', type: 'multi', exclusive: 'prevention',
        options: ['fatigue', 'weight', 'thyroid', 'sugar', 'hormones', 'hair_skin', 'prevention']
      },
      { key: 'duration', label: 'Как давно', type: 'single', options: ['lt1m', '1_6m', 'gt6m', 'observed', 'none'] },
      { key: 'tests', label: 'Анализы', type: 'single', options: ['recent', 'year', 'long', 'never'] },
      { key: 'age', label: 'Возраст', type: 'single', options: ['under30', '30_39', '40_49', '50_59', '60_69', '70plus'] },
      {
        key: 'city', label: 'Город', type: 'single',
        options: ['tashkent', 'samarkand', 'bukhara', 'fergana', 'andijan', 'namangan', 'other'],
        hintFor: function (code) { return code && code !== 'tashkent' ? 'notTashkent' : null; }
      }
    ]
  };

  var TEXTS = {
    ru: {
      meta: { title: 'Запись к эндокринологу — MEDELA' },
      start: {
        title: 'Подберём приём эндокринолога для вас',
        subtitle: 'Ответьте на 5 коротких вопросов — это займёт меньше минуты. Мы подскажем, с чего начать, и поможем записаться в удобное время.',
        badge: '5 вопросов · меньше минуты'
      },
      form: { subtitle: 'Менеджер свяжется с вами и поможет записаться к эндокринологу в удобное время' },
      thanks: { text: 'Наш менеджер свяжется с вами в ближайшее время, чтобы уточнить детали и записать вас к эндокринологу в удобное время.' },
      questions: {
        concern: {
          title: 'Что вас беспокоит или что хотите проверить?',
          subtitle: 'Можно выбрать несколько вариантов',
          options: {
            fatigue: 'Постоянная усталость, слабость',
            weight: 'Изменение веса без явной причины',
            thyroid: 'Щитовидная железа',
            sugar: 'Уровень сахара в крови',
            hormones: 'Гормональный фон',
            hair_skin: 'Выпадение волос, состояние кожи',
            prevention: 'Хочу проверить профилактически'
          }
        },
        duration: {
          title: 'Как давно это вас беспокоит?',
          options: {
            lt1m: 'Меньше месяца',
            '1_6m': '1–6 месяцев',
            gt6m: 'Больше полугода',
            observed: 'Уже наблюдаюсь у врача',
            none: 'Ничего не беспокоит — для профилактики'
          }
        },
        tests: {
          title: 'Когда вы последний раз сдавали анализы на гормоны или сахар?',
          options: {
            recent: 'В последние 3 месяца',
            year: 'В течение года',
            long: 'Больше года назад',
            never: 'Ни разу не сдавал(а)'
          }
        }
      }
    },
    uz: {
      meta: { title: 'Endokrinolog qabuliga yozilish — MEDELA' },
      start: {
        title: 'Sizga mos endokrinolog qabulini tanlaymiz',
        subtitle: '5 ta qisqa savolga javob bering — bu bir daqiqadan kam vaqt oladi. Nimadan boshlashni aytamiz va qulay vaqtga yozilishga yordam beramiz.',
        badge: '5 ta savol · 1 daqiqadan kam'
      },
      form: { subtitle: 'Menejerimiz siz bilan bogʻlanadi va endokrinolog qabuliga qulay vaqtga yozilishga yordam beradi' },
      thanks: { text: 'Menejerimiz tafsilotlarni aniqlashtirish va sizni qulay vaqtga endokrinolog qabuliga yozish uchun tez orada siz bilan bogʻlanadi.' },
      questions: {
        concern: {
          title: 'Sizni nima bezovta qilmoqda yoki nimani tekshirmoqchisiz?',
          subtitle: 'Bir nechta variantni tanlash mumkin',
          options: {
            fatigue: 'Doimiy charchoq, holsizlik',
            weight: 'Sababsiz vazn oʻzgarishi',
            thyroid: 'Qalqonsimon bez',
            sugar: 'Qondagi qand miqdori',
            hormones: 'Gormonal fon',
            hair_skin: 'Soch toʻkilishi, teri holati',
            prevention: 'Profilaktik tekshirmoqchiman'
          }
        },
        duration: {
          title: 'Bu sizni qancha vaqtdan beri bezovta qilmoqda?',
          options: {
            lt1m: 'Bir oydan kam',
            '1_6m': '1–6 oy',
            gt6m: 'Yarim yildan koʻproq',
            observed: 'Shifokor kuzatuvidaman',
            none: 'Hech narsa bezovta qilmaydi — profilaktika uchun'
          }
        },
        tests: {
          title: 'Gormonlar yoki qand tahlilini oxirgi marta qachon topshirgansiz?',
          options: {
            recent: 'Soʻnggi 3 oy ichida',
            year: 'Bir yil ichida',
            long: 'Bir yildan koʻproq vaqt oldin',
            never: 'Hech qachon topshirmaganman'
          }
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
