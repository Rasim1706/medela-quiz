/**
 * Все тексты интерфейса на двух языках.
 * Ключи вариантов ответов (under30, heart, ...) — машинные коды, они уходят в заявку
 * и в аналитику; менять можно только текст справа.
 * Узбекский — латиница: oʻ, gʻ (U+02BB) и тутук белгиси ʼ (U+02BC).
 */
window.I18N = {
  ru: {
    meta: {
      title: 'Какой Check-up подходит именно вам? — MEDELA',
      htmlLang: 'ru'
    },
    header: {
      logoAlt: 'MEDELA — медицинская клиника в Ташкенте',
      langSwitch: 'Язык интерфейса'
    },
    langScreen: {
      title: 'Выберите язык',
      name: 'Русский'
    },
    common: {
      back: 'Назад',
      next: 'Далее',
      stepOf: function (step, total) { return 'Шаг ' + step + ' из ' + total; },
      disclaimer: 'Квиз не является медицинской диагностикой и помогает подобрать формат обследования'
    },
    start: {
      title: 'Какой Check-up подходит именно вам?',
      subtitle: 'Ответьте на 5 коротких вопросов — это займёт меньше минуты. Мы поможем подобрать формат обследования, который подходит именно вам.',
      badge: '5 вопросов · меньше минуты',
      benefitsLabel: 'Почему MEDELA',
      benefits: {
        doctors: 'Врачи с опытом от 15 лет',
        equipment: 'Современное оборудование General Electric',
        rating: 'Рейтинг 5,0 на Яндекс Картах'
      },
      cta: 'Начать'
    },
    questions: {
      age: {
        title: 'Ваш возраст?',
        options: {
          under30: 'До 30 лет',
          '30_39': '30–39 лет',
          '40_49': '40–49 лет',
          '50_59': '50–59 лет',
          '60_69': '60–69 лет',
          '70plus': '70+'
        }
      },
      lastCheckup: {
        title: 'Когда вы в последний раз проходили комплексное обследование?',
        options: {
          within6m: 'В течение последних 6 месяцев',
          '6_12m': '6–12 месяцев назад',
          over1y: 'Более года назад',
          dont_remember: 'Не помню',
          never: 'Ни разу не проходил(а)'
        }
      },
      motivation: {
        title: 'Что сейчас больше всего мотивирует вас пройти Check-up?',
        options: {
          prevention: 'Хочу проверить здоровье профилактически',
          symptoms: 'Есть беспокоящие меня симптомы',
          age_control: 'Хочу контролировать показатели с возрастом',
          long_ago: 'Давно не проходил(а) обследование',
          parents: 'Хочу заняться здоровьем родителей',
          after_stress: 'Хочу пройти обследование после высокой нагрузки / стресса'
        },
        hints: {
          symptoms: 'Если симптомы выраженные или появились внезапно — не откладывайте визит к врачу. Наш менеджер поможет записаться быстрее.'
        }
      },
      focusAreas: {
        title: 'Что вы хотели бы проверить в первую очередь?',
        subtitle: 'Можно выбрать несколько вариантов',
        options: {
          heart: 'Сердце и сосуды',
          blood: 'Показатели крови',
          gi: 'ЖКТ',
          liver_kidney: 'Печень и почки',
          hormones: 'Гормональный фон',
          general: 'Общее состояние организма',
          complex: 'Хочу комплексную проверку'
        }
      },
      city: {
        title: 'Из какого вы города?',
        options: {
          tashkent: 'Ташкент',
          samarkand: 'Самарканд',
          bukhara: 'Бухара',
          fergana: 'Фергана',
          andijan: 'Андижан',
          namangan: 'Наманган',
          other: 'Другой город Узбекистана'
        },
        hints: {
          notTashkent: 'Наша клиника находится в Ташкенте. Менеджер поможет спланировать визит в удобный для вас день.'
        }
      }
    },
    form: {
      title: 'Оставьте ваши данные',
      subtitle: 'Менеджер свяжется с вами и поможет подобрать подходящий формат Check-up',
      nameLabel: 'Фамилия и имя',
      namePlaceholder: 'Например, Каримова Дилноза',
      phoneLabel: 'Телефон',
      callTimeLabel: 'Удобное время для звонка',
      callTime: {
        morning: 'Утро (8:00–12:00)',
        day: 'День (12:00–15:00)',
        evening: 'Вечер (15:00–18:00)',
        any: 'Любое время'
      },
      consentBefore: 'Я согласен(на) на ',
      consentLink: 'обработку персональных данных',
      consentAfter: '',
      submit: 'Получить консультацию',
      sending: 'Отправляем…',
      errors: {
        name: 'Пожалуйста, укажите фамилию и имя — хотя бы 2 символа',
        phone: 'Пожалуйста, введите номер полностью: 9 цифр после +998',
        consent: 'Чтобы отправить заявку, отметьте согласие на обработку данных'
      },
      sendError: 'Не удалось отправить, попробуйте ещё раз',
      retry: 'Попробовать ещё раз',
      sendErrorCall: 'Или позвоните нам — мы на связи Пн–Сб с 8:00 до 18:00:'
    },
    thanks: {
      title: 'Спасибо!',
      lead: 'Мы получили ваши ответы.',
      text: 'Наш менеджер свяжется с вами в ближайшее время, чтобы уточнить детали и помочь подобрать подходящий формат Check-up.',
      stay: 'Пожалуйста, оставайтесь на связи — мы скоро вам позвоним.',
      home: 'Вернуться на главную',
      callPrefix: 'Если удобнее — позвоните нам:',
      telegram: 'Написать в Telegram'
    }
  },

  uz: {
    meta: {
      title: 'Sizga qaysi Check-up mos keladi? — MEDELA',
      htmlLang: 'uz'
    },
    header: {
      logoAlt: 'MEDELA — Toshkentdagi tibbiyot klinikasi',
      langSwitch: 'Interfeys tili'
    },
    langScreen: {
      title: 'Tilni tanlang',
      name: 'Oʻzbekcha'
    },
    common: {
      back: 'Orqaga',
      next: 'Davom etish',
      stepOf: function (step, total) { return step + '-qadam, jami ' + total; },
      disclaimer: 'Test tibbiy tashxis emas, u tekshiruv formatini tanlashga yordam beradi'
    },
    start: {
      title: 'Sizga qaysi Check-up mos keladi?',
      subtitle: '5 ta qisqa savolga javob bering — bu bir daqiqadan kam vaqt oladi. Sizga mos keladigan tekshiruv formatini tanlashda yordam beramiz.',
      badge: '5 ta savol · 1 daqiqadan kam',
      benefitsLabel: 'Nega MEDELA',
      benefits: {
        doctors: '15 yildan ortiq tajribaga ega shifokorlar',
        equipment: 'Zamonaviy General Electric uskunalari',
        rating: 'Yandex Xaritalarda 5,0 reyting'
      },
      cta: 'Boshlash'
    },
    questions: {
      age: {
        title: 'Yoshingiz nechada?',
        options: {
          under30: '30 yoshgacha',
          '30_39': '30–39 yosh',
          '40_49': '40–49 yosh',
          '50_59': '50–59 yosh',
          '60_69': '60–69 yosh',
          '70plus': '70 va undan katta'
        }
      },
      lastCheckup: {
        title: 'Oxirgi marta qachon kompleks tibbiy koʻrikdan oʻtgansiz?',
        options: {
          within6m: 'Soʻnggi 6 oy ichida',
          '6_12m': '6–12 oy oldin',
          over1y: 'Bir yildan koʻproq vaqt oldin',
          dont_remember: 'Eslay olmayman',
          never: 'Hech qachon oʻtmaganman'
        }
      },
      motivation: {
        title: 'Hozir sizni Check-up’dan oʻtishga eng koʻp nima undaydi?',
        options: {
          prevention: 'Sogʻligʻimni profilaktik tekshirmoqchiman',
          symptoms: 'Meni bezovta qilayotgan alomatlar bor',
          age_control: 'Yosh oʻtishi bilan koʻrsatkichlarimni nazorat qilmoqchiman',
          long_ago: 'Ancha vaqtdan beri tekshiruvdan oʻtmaganman',
          parents: 'Ota-onamning sogʻligʻi bilan shugʻullanmoqchiman',
          after_stress: 'Yuqori yuklama / stressdan keyin tekshiruvdan oʻtmoqchiman'
        },
        hints: {
          symptoms: 'Agar alomatlar kuchli boʻlsa yoki toʻsatdan paydo boʻlgan boʻlsa, shifokorga murojaat qilishni kechiktirmang. Menejerimiz tezroq yozilishingizga yordam beradi.'
        }
      },
      focusAreas: {
        title: 'Birinchi navbatda nimani tekshirmoqchisiz?',
        subtitle: 'Bir nechta variantni tanlash mumkin',
        options: {
          heart: 'Yurak va qon tomirlar',
          blood: 'Qon koʻrsatkichlari',
          gi: 'Oshqozon-ichak tizimi',
          liver_kidney: 'Jigar va buyraklar',
          hormones: 'Gormonal fon',
          general: 'Organizmning umumiy holati',
          complex: 'Kompleks tekshiruvdan oʻtmoqchiman'
        }
      },
      city: {
        title: 'Qaysi shahardansiz?',
        options: {
          tashkent: 'Toshkent',
          samarkand: 'Samarqand',
          bukhara: 'Buxoro',
          fergana: 'Fargʻona',
          andijan: 'Andijon',
          namangan: 'Namangan',
          other: 'Oʻzbekistonning boshqa shahri'
        },
        hints: {
          notTashkent: 'Klinikamiz Toshkentda joylashgan. Menejerimiz sizga qulay kunga tashrifni rejalashtirishda yordam beradi.'
        }
      }
    },
    form: {
      title: 'Maʼlumotlaringizni qoldiring',
      subtitle: 'Menejerimiz siz bilan bogʻlanadi va mos Check-up formatini tanlashda yordam beradi',
      nameLabel: 'Familiya va ism',
      namePlaceholder: 'Masalan, Karimova Dilnoza',
      phoneLabel: 'Telefon raqami',
      callTimeLabel: 'Qoʻngʻiroq qilish uchun qulay vaqt',
      callTime: {
        morning: 'Ertalab (8:00–12:00)',
        day: 'Kunduzi (12:00–15:00)',
        evening: 'Kechqurun (15:00–18:00)',
        any: 'Istalgan vaqt'
      },
      consentBefore: '',
      consentLink: 'Shaxsiy maʼlumotlarimni qayta ishlashga',
      consentAfter: ' roziman',
      submit: 'Maslahat olish',
      sending: 'Yuborilmoqda…',
      errors: {
        name: 'Iltimos, familiya va ismingizni kiriting — kamida 2 ta belgi',
        phone: 'Iltimos, raqamni toʻliq kiriting: +998 dan keyin 9 ta raqam',
        consent: 'Arizani yuborish uchun maʼlumotlarni qayta ishlashga rozilik belgisini qoʻying'
      },
      sendError: 'Yuborib boʻlmadi, qaytadan urinib koʻring',
      retry: 'Qayta urinib koʻrish',
      sendErrorCall: 'Yoki bizga qoʻngʻiroq qiling — Du–Sha 8:00 dan 18:00 gacha aloqadamiz:'
    },
    thanks: {
      title: 'Rahmat!',
      lead: 'Javoblaringizni oldik.',
      text: 'Menejerimiz tafsilotlarni aniqlashtirish va sizga mos Check-up formatini tanlashda yordam berish uchun tez orada siz bilan bogʻlanadi.',
      stay: 'Iltimos, aloqada boʻling — tez orada sizga qoʻngʻiroq qilamiz.',
      home: 'Bosh sahifaga qaytish',
      callPrefix: 'Qulayroq boʻlsa, bizga qoʻngʻiroq qiling:',
      telegram: 'Telegramda yozish'
    }
  }
};
