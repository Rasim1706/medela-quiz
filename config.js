/**
 * Настройки квиза MEDELA.
 * Здесь всё, что может понадобиться поменять без правки логики:
 * данные клиники, цвета, логотип, адрес отправки заявок, GTM.
 */
window.MEDELA_CONFIG = {
  clinic: {
    name: 'MEDELA',
    siteUrl: 'https://medela.uz/',
    phoneDisplay: '+998 90 906 55 00',
    phoneHref: 'tel:+998909065500',
    email: 'info@medela.uz',
    address: 'г. Ташкент, ул. Гагарина, 40/39',
    hours: 'Пн–Сб 8:00–18:00',
    telegramUrl: 'https://t.me/Medela_uz',
    // Бот для записи — на него ведёт страница /zapis (имя без @)
    telegramBot: 'medelazapisbot',
    instagramUrl: 'https://www.instagram.com/medela.clinic'
  },

  // Логотип. Если файла нет или он не загрузился, в шапке остаётся текстовый логотип «MEDELA».
  // logoMobile используется на экранах до 480px (можно оставить пустым).
  logo: {
    src: 'assets/logo.png',
    srcMobile: 'assets/logo-mob.png'
  },

  // Фирменные цвета (становятся CSS-переменными: brand → --brand, brandLight → --brand-light и т.д.)
  colors: {
    brand: '#3398A7',
    brandLight: '#57CCC3',
    brandSoft: 'rgba(51,152,167,0.1)',
    // Тёмный оттенок бирюзового для мелкого текста на белом (контраст WCAG AA)
    brandText: '#247987',
    accent: '#FD556D',
    bg: '#F5F8FD',
    surface: '#FFFFFF',
    text: '#1F2937',
    textMuted: '#6B7280',
    border: '#E8E8E8'
  },

  // Куда отправлять заявку (POST, JSON). Пустая строка — режим разработки:
  // заявка выводится в консоль, а пользователь видит экран «Спасибо».
  // Для serverless-функции из папки server/ укажите '/api/lead'.
  // Сейчас: '/api/lead' — функция из server/ (нужны переменные TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в Vercel).
  leadEndpoint: '/api/lead/', // со слэшем: в vercel.json включён trailingSlash
  requestTimeoutMs: 15000,

  // Google Tag Manager. Пустая строка — GTM не подключается.
  gtmId: 'GTM-T8TNNP82',

  // Meta Pixel (Facebook / Instagram). Пустая строка — пиксель не подключается.
  // Если пиксель подключён здесь, НЕ добавляйте его ещё раз в GTM — события задвоятся.
  metaPixelId: '928181753700398',

  // Ссылка на политику конфиденциальности. Пустая строка — текст согласия без ссылки.
  privacyUrl: '',

  // Сохранение ответов в localStorage (чтобы не потерять их при перезагрузке страницы)
  storageKey: 'medela_checkup_quiz_v1',
  storageTtlHours: 72
};
