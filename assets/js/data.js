/* ============================================================
   HERKİM KİMYA — Veri Katmanı (gerçek şirket bilgileri)
   Kaynak: herkim.com.tr — 1975 kuruluşlu deri & tekstil kimyasalları
   Distribütör: Türk Henkel · Camsar · BASF Türk
   Ürün adları / kategoriler üç dillidir (tr/en/ru).
   NOT: Bireysel ürünler temsilîdir; gerçek SKU listesi talep/giriş
   ile paylaşılır (tıpkı herkim.com.tr'deki gibi). Kendi portföyünüze
   göre HK_PRODUCTS dizisini düzenlemeniz yeterlidir.
   ============================================================ */

/* Şirket bilgileri — tek kaynaktan düzenleyin */
const HK_COMPANY = {
  name: "Herkim Kimya",
  legal: "Herkim Kimya San. ve Tic.",
  founded: 1975,
  experience: 54,
  salesPoints: 12,
  address: "Organize Deri San. Böl. 19. Yol 12/6 Parsel, Tuzla — İstanbul / Türkiye",
  phone: "+90 216 394 11 25",
  phoneTel: "+902163941125",
  fax: "+90 216 394 10 04",
  email: "info@herkim.com.tr",
  mailQuote: "info@herkim.com.tr",
  whatsapp: "902163941125",   // wa.me — WhatsApp Business hattınızla değiştirin
  group: "https://www.herkimgroup.com",
  brands: ["Türk Henkel", "Camsar", "BASF Türk"]
};

/* Ana kategoriler (üç dilli) */
const HK_CATS = {
  deri:    { tr: "Deri Kimyasalları",    en: "Leather Chemicals", ru: "Кожевенная химия" },
  tekstil: { tr: "Tekstil Kimyasalları", en: "Textile Chemicals", ru: "Текстильная химия" },
  binder:  { tr: "Binderler",            en: "Binders",           ru: "Биндеры" }
};

/* Alt kategoriler (üç dilli) — cat: ana kategori anahtarı */
const HK_SUBS = {
  altkat:  { cat: "deri",    code: "ALT", tr: "Altkat Kimyasalları",    en: "Base-Coat Chemicals",   ru: "Грунтовая химия" },
  finisaj: { cat: "deri",    code: "FIN", tr: "Finisaj Kimyasalları",   en: "Finishing Chemicals",   ru: "Финишная химия" },
  dolap:   { cat: "deri",    code: "DLP", tr: "Dolap Boyaları",         en: "Drum Dyes",             ru: "Барабанные красители" },
  proses:  { cat: "tekstil", code: "PRS", tr: "Proses Kimyasalları",    en: "Process Chemicals",     ru: "Химия процессов" },
  tekboya: { cat: "tekstil", code: "BOY", tr: "Tekstil Boyaları",       en: "Textile Dyes",          ru: "Текстильные красители" },
  insaatB: { cat: "binder",  code: "İNŞ", tr: "İnşaat Boya Binderleri", en: "Construction Binders",  ru: "Строительные биндеры" },
  matbaaB: { cat: "binder",  code: "MTB", tr: "Matbaa Binderleri",      en: "Printing Binders",      ru: "Печатные биндеры" },
  tekstilB:{ cat: "binder",  code: "TKS", tr: "Tekstil Binderleri",     en: "Textile Binders",       ru: "Текстильные биндеры" }
};

/* Ürünler — cat, sub anahtarları HK_SUBS'tan türetilir.
   n: ad (tr/en/ru), brand: marka, pack: ambalaj, tag: "yeni"|"one"|null */
const HK_PRODUCTS = [
  // ---- Deri · Altkat ----
  { id: 1,  sub: "altkat",  n: { tr: "Altkat Penetratörü",        en: "Base-Coat Penetrator",       ru: "Пенетратор грунта" },        brand: "Türk Henkel", pack: "120 kg varil", tag: "one" },
  { id: 2,  sub: "altkat",  n: { tr: "İmpregnasyon Reçinesi",     en: "Impregnation Resin",         ru: "Пропиточная смола" },        brand: "BASF Türk",   pack: "120 kg varil", tag: null },
  { id: 3,  sub: "altkat",  n: { tr: "Altkat Pigment Pastası",    en: "Base-Coat Pigment Paste",    ru: "Пигментная паста грунта" },  brand: "Camsar",      pack: "25 kg bidon",  tag: null },
  { id: 4,  sub: "altkat",  n: { tr: "Alpine Altkat Binderi",     en: "Alpine Base-Coat Binder",    ru: "Грунтовый биндер Alpine" },  brand: "Herkim",      pack: "120 kg varil", tag: "one" },
  { id: 5,  sub: "altkat",  n: { tr: "Dolgu Altkat Sistemi",      en: "Filler Base-Coat System",    ru: "Наполняющий грунт" },        brand: "Türk Henkel", pack: "120 kg varil", tag: null },

  // ---- Deri · Finisaj ----
  { id: 6,  sub: "finisaj", n: { tr: "Nitroselülozik Lak",        en: "Nitrocellulose Lacquer",     ru: "Нитроцеллюлозный лак" },     brand: "BASF Türk",   pack: "25 kg bidon",  tag: null },
  { id: 7,  sub: "finisaj", n: { tr: "Su Bazlı Top Coat",         en: "Water-Based Top Coat",       ru: "Водный топ-кот" },           brand: "Türk Henkel", pack: "120 kg varil", tag: "yeni" },
  { id: 8,  sub: "finisaj", n: { tr: "Tutuş (Handle) Ajanı",      en: "Handle Agent",               ru: "Агент грифа" },              brand: "Camsar",      pack: "25 kg bidon",  tag: null },
  { id: 9,  sub: "finisaj", n: { tr: "Matlaştırıcı Ajan",         en: "Matting Agent",              ru: "Матирующий агент" },         brand: "BASF Türk",   pack: "25 kg bidon",  tag: null },
  { id: 10, sub: "finisaj", n: { tr: "Kaymazlık Ajanı",           en: "Anti-Slip Agent",            ru: "Антискользящий агент" },     brand: "Türk Henkel", pack: "25 kg bidon",  tag: null },
  { id: 11, sub: "finisaj", n: { tr: "Parlaklık (Gloss) Ajanı",   en: "Gloss Agent",                ru: "Агент блеска" },             brand: "Camsar",      pack: "25 kg bidon",  tag: null },

  // ---- Deri · Dolap Boyaları ----
  { id: 12, sub: "dolap",   n: { tr: "Anilin Deri Boyası",        en: "Aniline Leather Dye",        ru: "Анилиновый краситель" },     brand: "BASF Türk",   pack: "25 kg torba",  tag: null },
  { id: 13, sub: "dolap",   n: { tr: "Asit Deri Boyası",          en: "Acid Leather Dye",           ru: "Кислотный краситель" },      brand: "BASF Türk",   pack: "25 kg torba",  tag: null },
  { id: 14, sub: "dolap",   n: { tr: "Direkt Deri Boyası",        en: "Direct Leather Dye",         ru: "Прямой краситель кожи" },    brand: "Camsar",      pack: "25 kg torba",  tag: null },

  // ---- Tekstil · Proses ----
  { id: 15, sub: "proses",  n: { tr: "Islatıcı Ajan",             en: "Wetting Agent",              ru: "Смачиватель" },              brand: "Türk Henkel", pack: "60 kg bidon",  tag: null },
  { id: 16, sub: "proses",  n: { tr: "Yıkama / Sabunlama Ajanı",  en: "Scouring / Soaping Agent",   ru: "Моющий агент" },             brand: "BASF Türk",   pack: "60 kg bidon",  tag: null },
  { id: 17, sub: "proses",  n: { tr: "Düzgünleştirici (Leveling)",en: "Leveling Agent",             ru: "Выравниватель" },            brand: "BASF Türk",   pack: "60 kg bidon",  tag: null },
  { id: 18, sub: "proses",  n: { tr: "Silikon Yumuşatıcı",        en: "Silicone Softener",          ru: "Силиконовый смягчитель" },   brand: "Camsar",      pack: "120 kg varil", tag: "yeni" },
  { id: 19, sub: "proses",  n: { tr: "Fikse Ajanı",               en: "Fixing Agent",               ru: "Фиксирующий агент" },        brand: "Türk Henkel", pack: "60 kg bidon",  tag: null },

  // ---- Tekstil · Boyalar ----
  { id: 20, sub: "tekboya", n: { tr: "Reaktif Boya",              en: "Reactive Dye",               ru: "Активный краситель" },       brand: "BASF Türk",   pack: "25 kg torba",  tag: null },
  { id: 21, sub: "tekboya", n: { tr: "Dispers Boya",              en: "Disperse Dye",               ru: "Дисперсный краситель" },     brand: "BASF Türk",   pack: "25 kg torba",  tag: null },
  { id: 22, sub: "tekboya", n: { tr: "Asit Boya (Tekstil)",       en: "Acid Dye (Textile)",         ru: "Кислотный краситель" },      brand: "Camsar",      pack: "25 kg torba",  tag: null },

  // ---- Binder · İnşaat Boya ----
  { id: 23, sub: "insaatB", n: { tr: "Akrilik İnşaat Binderi",    en: "Acrylic Construction Binder",ru: "Акриловый биндер" },         brand: "Herkim",      pack: "1000 kg IBC",  tag: "one" },
  { id: 24, sub: "insaatB", n: { tr: "Stiren-Akrilik Binder",     en: "Styrene-Acrylic Binder",     ru: "Стирол-акриловый биндер" },  brand: "Herkim",      pack: "1000 kg IBC",  tag: null },
  { id: 25, sub: "insaatB", n: { tr: "Saf Akrilik Emülsiyon",     en: "Pure Acrylic Emulsion",      ru: "Чистая акриловая эмульсия" },brand: "Herkim",      pack: "1000 kg IBC",  tag: null },

  // ---- Binder · Matbaa ----
  { id: 26, sub: "matbaaB", n: { tr: "Su Bazlı Baskı Binderi",    en: "Water-Based Printing Binder",ru: "Водный печатный биндер" },   brand: "Herkim",      pack: "120 kg varil", tag: null },
  { id: 27, sub: "matbaaB", n: { tr: "Laminasyon Binderi",        en: "Lamination Binder",          ru: "Ламинирующий биндер" },      brand: "Herkim",      pack: "120 kg varil", tag: null },

  // ---- Binder · Tekstil ----
  { id: 28, sub: "tekstilB",n: { tr: "Pigment Baskı Binderi",     en: "Pigment Printing Binder",    ru: "Пигментный печатный биндер" },brand: "Herkim",     pack: "120 kg varil", tag: "yeni" },
  { id: 29, sub: "tekstilB",n: { tr: "Fikse Binderi",             en: "Fixing Binder",              ru: "Фиксирующий биндер" },       brand: "Herkim",      pack: "120 kg varil", tag: null }
];

/* Duyurular (üç dilli) */
const HK_NEWS = [
  {
    date: "2026-06-20", tag: { tr: "Fuar", en: "Expo", ru: "Выставка" },
    title: {
      tr: "APLF / Deri Fuarı'nda standımıza bekleriz",
      en: "Visit our stand at the APLF Leather Fair",
      ru: "Ждём вас на нашем стенде на выставке кожи APLF"
    },
    body: {
      tr: "Uluslararası deri fuarında yeni finisaj ve altkat serilerimizi tanıtıyoruz. Randevu için satış ekibimizle iletişime geçin.",
      en: "We are presenting our new finishing and base-coat series at the international leather fair. Contact our sales team for an appointment.",
      ru: "Представляем новые серии финиша и грунта на международной выставке кожи. Свяжитесь с отделом продаж для встречи."
    },
    href: "iletisim.html"
  },
  {
    date: "2026-05-15", tag: { tr: "Ürün", en: "Product", ru: "Продукт" },
    title: {
      tr: "Su bazlı finisaj ürün grubumuz genişledi",
      en: "Our water-based finishing range has expanded",
      ru: "Расширена линейка водного финиша"
    },
    body: {
      tr: "Çevre dostu, düşük VOC'lu su bazlı top coat ve tutuş ajanları stoklarımıza eklendi. Numune talep edebilirsiniz.",
      en: "Eco-friendly, low-VOC water-based top coats and handle agents are now in stock. Samples available on request.",
      ru: "Экологичные водные топ-коты и агенты грифа с низким VOC уже на складе. Доступны образцы."
    },
    href: "urunler.html"
  },
  {
    date: "2026-04-02", tag: { tr: "Duyuru", en: "Notice", ru: "Объявление" },
    title: {
      tr: "2026 fiyat listesi güncellendi",
      en: "2026 price list updated",
      ru: "Обновлён прайс-лист 2026"
    },
    body: {
      tr: "Kur ve navlun koşullarına göre güncellenen fiyat listemizi satış temsilcinizden talep edebilirsiniz.",
      en: "You can request our updated price list — revised for exchange rates and freight — from your sales representative.",
      ru: "Обновлённый прайс-лист (с учётом курса и фрахта) можно запросить у вашего менеджера."
    },
    href: "iletisim.html"
  },
  {
    date: "2026-02-10", tag: { tr: "Kurumsal", en: "Corporate", ru: "Компания" },
    title: {
      tr: "12. satış noktamız hizmete girdi",
      en: "Our 12th sales point is now open",
      ru: "Открыта 12-я точка продаж"
    },
    body: {
      tr: "Büyüyen talebe paralel olarak yeni bölge satış noktamızı açtık; sevkiyat sürelerimiz daha da kısaldı.",
      en: "In line with growing demand, we opened a new regional sales point; our delivery times are now even shorter.",
      ru: "В ответ на рост спроса мы открыли новую региональную точку; сроки доставки стали ещё короче."
    },
    href: "kurumsal.html#biz-kimiz"
  },
  {
    date: "2025-11-18", tag: { tr: "Ürün", en: "Product", ru: "Продукт" },
    title: {
      tr: "İnşaat boya binderleri üretim kapasitemiz arttı",
      en: "Increased capacity for construction paint binders",
      ru: "Увеличены мощности по строительным биндерам"
    },
    body: {
      tr: "Kendi üretimimiz olan akrilik ve stiren-akrilik binder kapasitemizi artırdık; büyük hacimli talepleri IBC ile karşılıyoruz.",
      en: "We increased our in-house acrylic and styrene-acrylic binder capacity; we serve high-volume demand in IBCs.",
      ru: "Мы увеличили собственные мощности по акриловым и стирол-акриловым биндерам; крупные объёмы — в IBC."
    },
    href: "urunler.html"
  },
  {
    date: "2025-09-05", tag: { tr: "Duyuru", en: "Notice", ru: "Объявление" },
    title: {
      tr: "Teknik servis ekibimiz sahada",
      en: "Our technical service team is in the field",
      ru: "Наша техническая служба — на местах"
    },
    body: {
      tr: "AR-GE ve teknik servis ekibimiz, tabakhanelerde reçete optimizasyonu ve uygulama desteği için ücretsiz ziyaret sunuyor.",
      en: "Our R&D and technical service team offers free visits for recipe optimization and application support at tanneries.",
      ru: "Наша команда НИОКР и техподдержки предлагает бесплатные визиты для оптимизации рецептур на заводах."
    },
    href: "hizmetler.html"
  }
];

/* Dokümanlar (üç dilli) */
const HK_DOCS = [
  { ext: "PDF", cat: "katalog",   title: { tr: "Ürün Kataloğu 2026", en: "Product Catalog 2026", ru: "Каталог продукции 2026" }, desc: { tr: "Deri, tekstil ve binder ürün gruplarımız uygulama alanlarıyla.", en: "Our leather, textile and binder product groups with application areas.", ru: "Наши группы: кожа, текстиль и биндеры с областями применения." }, meta: { tr: "v2026 · TR/EN", en: "v2026 · TR/EN", ru: "v2026 · TR/EN" } },
  { ext: "PDF", cat: "katalog",   title: { tr: "Genel Fiyat Listesi", en: "General Price List", ru: "Общий прайс-лист" }, desc: { tr: "Güncel fiyat listemiz talep üzerine paylaşılır.", en: "Our current price list is shared on request.", ru: "Актуальный прайс-лист предоставляется по запросу." }, meta: { tr: "Aylık", en: "Monthly", ru: "Ежемесячно" } },
  { ext: "PDF", cat: "teknik",    title: { tr: "TDS — Teknik Veri Sayfaları", en: "TDS — Technical Data Sheets", ru: "TDS — Технические паспорта" }, desc: { tr: "Ürün bazlı teknik özellikler ve uygulama önerileri.", en: "Product-based technical specs and application advice.", ru: "Технические данные по продуктам и рекомендации." }, meta: { tr: "Ürün başına", en: "Per product", ru: "На продукт" } },
  { ext: "PDF", cat: "teknik",    title: { tr: "SDS — Güvenlik Bilgi Formları", en: "SDS — Safety Data Sheets", ru: "SDS — Паспорта безопасности" }, desc: { tr: "GHS/CLP uyumlu güvenlik bilgi formları.", en: "GHS/CLP-compliant safety data sheets.", ru: "Паспорта безопасности по GHS/CLP." }, meta: { tr: "TR/EN", en: "TR/EN", ru: "TR/EN" } },
  { ext: "PDF", cat: "sertifika", title: { tr: "ISO 9001 Kalite Belgesi", en: "ISO 9001 Quality Certificate", ru: "Сертификат качества ISO 9001" }, desc: { tr: "Kalite yönetim sistemi sertifikamız.", en: "Our quality management system certificate.", ru: "Сертификат системы менеджмента качества." }, meta: { tr: "Güncel", en: "Current", ru: "Актуальный" } },
  { ext: "ZIP", cat: "marka",     title: { tr: "Kurumsal Kimlik Kiti", en: "Brand Identity Kit", ru: "Комплект фирменного стиля" }, desc: { tr: "Logo, renk paleti, tipografi ve kullanım kuralları.", en: "Logo, color palette, typography and usage rules.", ru: "Логотип, палитра, типографика и правила." }, meta: { tr: "Logo + kılavuz", en: "Logo + guide", ru: "Лого + гайд" } },
  { ext: "PDF", cat: "marka",     title: { tr: "Şirket Tanıtım Sunumu", en: "Company Profile", ru: "Презентация компании" }, desc: { tr: "Herkim Kimya'yı tanıtan kurumsal sunum.", en: "Corporate presentation introducing Herkim Kimya.", ru: "Корпоративная презентация Herkim Kimya." }, meta: { tr: "TR/EN/RU", en: "TR/EN/RU", ru: "TR/EN/RU" } },
  { ext: "PDF", cat: "hukuki",    title: { tr: "KVKK Aydınlatma Metni", en: "Privacy Notice (KVKK)", ru: "Уведомление о конфиденциальности" }, desc: { tr: "Kişisel verilerin korunmasına ilişkin metin.", en: "Notice on the protection of personal data.", ru: "Уведомление о защите персональных данных." }, meta: { tr: "Hukuki", en: "Legal", ru: "Юридический" } }
];

const HK_RATES_FALLBACK = { usd: 41.24, eur: 48.67 };
