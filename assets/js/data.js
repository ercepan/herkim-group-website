/* ============================================================
   HERKİM KİMYA — Veri Katmanı (gerçek şirket bilgileri)
   Kaynak: herkim.com.tr — 1975 kuruluşlu deri & tekstil kimyasalları
   Deri & tekstil kimyasalları · binder üretimi
   Ürün adları / kategoriler üç dillidir (tr/en/ru).
   NOT: Bireysel ürünler temsilîdir; gerçek SKU listesi talep/giriş
   ile paylaşılır (tıpkı herkim.com.tr'deki gibi). Kendi portföyünüze
   göre HK_PRODUCTS dizisini düzenlemeniz yeterlidir.
   ============================================================ */

/* Şirket bilgileri — tek kaynaktan düzenleyin */
const HK_COMPANY = {
  name: "Herkim Kimya",
  legal: "Herkim Group Kimyevi Maddeler A.Ş.",
  founded: 1975,
  experience: 54,
  salesPoints: 12,
  address: "Deri OSB Mah. Pres Sok. No: 3, Tuzla — İstanbul / Türkiye",
  phone: "444 56 58",
  phone2: "+90 216 394 11 33 (Dahili 224)",
  phoneTel: "+902163941133",
  fax: "+90 216 394 10 04",
  email: "info@herkimgroup.com",
  mailQuote: "sales@herkimgroup.com",
  whatsapp: "902163941125",   // wa.me — WhatsApp Business hattınızla değiştirin
  web3forms: "",              // Web3Forms erişim anahtarı — girilince form/teklif/sipariş/talep
                              // bildirimleri şirket e-postasına ANINDA düşer. Anahtar almak:
                              // web3forms.com → e-postayı gir → gelen anahtarı buraya yapıştır.
  group: "https://www.herkimgroup.com",
  brands: ["Herkim", "Herkim", "Herkim"]
};

/* Ana kategoriler (üç dilli) — kaynak: resmî Herkim Group ürün listesi */
const HK_CATS = {
  asit:    { tr: "Asitler",                             en: "Acids",                          ru: "Кислоты" },
  alkol:   { tr: "Alkoller & Glikoller",                en: "Alcohols & Glycols",             ru: "Спирты и гликоли" },
  amonyum: { tr: "Amonyum Bazlı Ürünler",               en: "Ammonium Based Products",        ru: "Продукты на основе аммония" },
  deri:    { tr: "Deri & Tabaklama Kimyasalları",       en: "Leather & Tanning Chemicals",    ru: "Химия для кожи и дубления" },
  sodyum:  { tr: "Sodyum Bazlı Kimyasallar",            en: "Sodium Based Chemicals",         ru: "Химия на основе натрия" },
  solvent: { tr: "Solventler & Endüstriyel Kimyasallar",en: "Solvents & Industrial Chemicals",ru: "Растворители и промышленная химия" }
};

/* Alt kategoriler ana kategorilerle bire bir (düz katalog yapısı) */
const HK_SUBS = {
  asit:    { cat: "asit",    code: "ACD", tr: "Asitler",                              en: "Acids",                           ru: "Кислоты" },
  alkol:   { cat: "alkol",   code: "ALK", tr: "Alkoller & Glikoller",                 en: "Alcohols & Glycols",              ru: "Спирты и гликоли" },
  amonyum: { cat: "amonyum", code: "AMN", tr: "Amonyum Bazlı Ürünler",                en: "Ammonium Based Products",         ru: "Продукты на основе аммония" },
  deri:    { cat: "deri",    code: "DER", tr: "Deri & Tabaklama Kimyasalları",        en: "Leather & Tanning Chemicals",     ru: "Химия для кожи и дубления" },
  sodyum:  { cat: "sodyum",  code: "SOD", tr: "Sodyum Bazlı Kimyasallar",             en: "Sodium Based Chemicals",          ru: "Химия на основе натрия" },
  solvent: { cat: "solvent", code: "SLV", tr: "Solventler & Endüstriyel Kimyasallar", en: "Solvents & Industrial Chemicals", ru: "Растворители и промышленная химия" }
};

/* Ürünler — resmî Herkim Group ürün listesi (Temmuz 2026 flyer).
   n: ad (tr/en/ru), brand: marka/menşei, pack: ambalaj, tag: "yeni"|"one"|null */
const HK_PRODUCTS = [
  // ---- Asitler ----
  { id: 1,  sub: "asit",    n: { tr: "Asetik Asit",                          en: "Acetic Acid",                                        ru: "Уксусная кислота" },                          brand: "Herkim",   pack: "30 kg bidon / IBC", tag: null },
  { id: 2,  sub: "asit",    n: { tr: "Akrilik Asit",                         en: "Acrylic Acid",                                       ru: "Акриловая кислота" },                         brand: "Herkim",   pack: "200 kg varil",      tag: null },
  { id: 3,  sub: "asit",    n: { tr: "Sitrik Asit Monohidrat",               en: "Citric Acid Monohydrate",                            ru: "Лимонная кислота моногидрат" },               brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 4,  sub: "asit",    n: { tr: "HEDP (Hidroksietiliden Difosfonik Asit)", en: "HEDP (Hydroxyethylidene Diphosphonic Acid)",      ru: "HEDP (оксиэтилидендифосфоновая кислота)" },   brand: "Herkim",   pack: "30 kg bidon",       tag: null },
  { id: 5,  sub: "asit",    n: { tr: "Formik Asit %85",                      en: "Formic Acid 85%",                                    ru: "Муравьиная кислота 85%" },                    brand: "Luxi",     pack: "35 kg bidon / IBC", tag: "one" },
  { id: 6,  sub: "asit",    n: { tr: "Oksalik Asit",                         en: "Oxalic Acid",                                        ru: "Щавелевая кислота" },                         brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 7,  sub: "asit",    n: { tr: "Fosforik Asit %85",                    en: "Phosphoric Acid 85%",                                ru: "Ортофосфорная кислота 85%" },                 brand: "Herkim",   pack: "35 kg bidon / IBC", tag: null },
  { id: 8,  sub: "asit",    n: { tr: "Sülfürik Asit",                        en: "Sulphuric Acid",                                     ru: "Серная кислота" },                            brand: "Herkim",   pack: "IBC / dökme",       tag: null },

  // ---- Alkoller & Glikoller ----
  { id: 9,  sub: "alkol",   n: { tr: "Butil Glikol",                         en: "Butyl Glycol",                                       ru: "Бутилгликоль" },                              brand: "Herkim",   pack: "180 kg varil",      tag: null },
  { id: 10, sub: "alkol",   n: { tr: "İzopropil Alkol (IPA)",                en: "IPA (Isopropyl Alcohol)",                            ru: "Изопропиловый спирт (IPA)" },                 brand: "Herkim",   pack: "160 kg varil",      tag: null },
  { id: 11, sub: "alkol",   n: { tr: "Monoetilen Glikol (MEG)",              en: "MEG (Monoethylene Glycol)",                          ru: "Моноэтиленгликоль (MEG)" },                   brand: "Herkim",   pack: "230 kg varil / IBC",tag: "one" },
  { id: 12, sub: "alkol",   n: { tr: "Monopropilen Glikol (MPG)",            en: "Mono Propylene Glycol (MPG)",                        ru: "Монопропиленгликоль (MPG)" },                 brand: "Herkim",   pack: "215 kg varil",      tag: null },

  // ---- Amonyum Bazlı Ürünler ----
  { id: 13, sub: "amonyum", n: { tr: "Amonyum Bikarbonat",                   en: "Ammonium Bicarbonate",                               ru: "Бикарбонат аммония" },                        brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 14, sub: "amonyum", n: { tr: "Amonyum Klorür",                       en: "Ammonium Chloride",                                  ru: "Хлорид аммония" },                            brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 15, sub: "amonyum", n: { tr: "Amonyum Sülfat",                       en: "Ammonium Sulphate",                                  ru: "Сульфат аммония" },                           brand: "Herkim",   pack: "25 kg torba",       tag: null },

  // ---- Deri & Tabaklama ----
  { id: 16, sub: "deri",    n: { tr: "Mimoza Tozu",                          en: "Mimosa Powder",                                      ru: "Порошок мимозы" },                            brand: "Tanac",    pack: "25 kg torba",       tag: "one" },
  { id: 17, sub: "deri",    n: { tr: "Kebrako (Quebracho)",                  en: "Quebracho",                                          ru: "Квебрахо" },                                  brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 18, sub: "deri",    n: { tr: "Saviotan A (Astrenjan)",               en: "Saviotan A (Astringent)",                            ru: "Saviotan A (вяжущий)" },                      brand: "Saviotan", pack: "25 kg torba",       tag: null },
  { id: 19, sub: "deri",    n: { tr: "Saviotan RS (Tatlandırılmış)",         en: "Saviotan RS (Sweetened)",                            ru: "Saviotan RS (подслащённый)" },                brand: "Saviotan", pack: "25 kg torba",       tag: null },
  { id: 20, sub: "deri",    n: { tr: "Tara Tozu",                            en: "Tara Powder",                                        ru: "Порошок тары" },                              brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 21, sub: "deri",    n: { tr: "Valeks (Palamut Ekstraktı)",           en: "Valex (Valonia Extract)",                            ru: "Валекс (экстракт валлонеи)" },                brand: "Valex",    pack: "25 kg torba",       tag: null },

  // ---- Sodyum Bazlı Kimyasallar ----
  { id: 22, sub: "sodyum",  n: { tr: "Kostik Soda",                          en: "Caustic Soda",                                       ru: "Каустическая сода" },                         brand: "Herkim",   pack: "25 kg torba",       tag: "one" },
  { id: 23, sub: "sodyum",  n: { tr: "Nanocon (Povercon) — Sodyum Naftalin Sülfonat (Açık Renk)", en: "Nanocon (Povercon) — Sodium Naphthalene Sulfonate (Light Colour)", ru: "Nanocon (Povercon) — нафталинсульфонат натрия (светлый)" }, brand: "Povercon", pack: "25 kg torba", tag: null },
  { id: 24, sub: "sodyum",  n: { tr: "Povercon 100 — Sodyum Naftalin Sülfonat", en: "Povercon 100 — Sodium Naphthalene Sulfonate",     ru: "Povercon 100 — нафталинсульфонат натрия" },   brand: "Povercon", pack: "25 kg torba",       tag: "yeni" },
  { id: 25, sub: "sodyum",  n: { tr: "Sodyum Bikarbonat",                    en: "Sodium Bicarbonate",                                 ru: "Бикарбонат натрия" },                         brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 26, sub: "sodyum",  n: { tr: "Sodyum Karbonat",                      en: "Sodium Carbonate",                                   ru: "Карбонат натрия" },                           brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 27, sub: "sodyum",  n: { tr: "Sodyum Format",                        en: "Sodium Formate",                                     ru: "Формиат натрия" },                            brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 28, sub: "sodyum",  n: { tr: "Sodyum Sülfhidrat",                    en: "Sodium Sulphhydrate",                                ru: "Гидросульфид натрия" },                       brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 29, sub: "sodyum",  n: { tr: "Sodyum Hidrosülfit",                   en: "Sodium Hydrosulphite",                               ru: "Гидросульфит натрия" },                       brand: "Herkim",   pack: "50 kg bidon",       tag: null },
  { id: 30, sub: "sodyum",  n: { tr: "Sodyum Metabisülfit (TLG)",            en: "Sodium Metabisulphite (TLG Grade)",                  ru: "Метабисульфит натрия (TLG)" },                brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 31, sub: "sodyum",  n: { tr: "Sodyum Perkarbonat",                   en: "Sodium Percarbonate",                                ru: "Перкарбонат натрия" },                        brand: "Herkim",   pack: "25 kg torba",       tag: "yeni" },
  { id: 32, sub: "sodyum",  n: { tr: "Sodyum Sülfür",                        en: "Sodium Sulphide",                                    ru: "Сульфид натрия" },                            brand: "Herkim",   pack: "25 kg torba",       tag: null },

  // ---- Solventler & Endüstriyel Kimyasallar ----
  { id: 33, sub: "solvent", n: { tr: "Amonyak",                              en: "Ammonia",                                            ru: "Аммиак" },                                    brand: "Herkim",   pack: "30 kg bidon / IBC", tag: null },
  { id: 34, sub: "solvent", n: { tr: "Butil Asetat",                         en: "Butyl Acetate",                                      ru: "Бутилацетат" },                               brand: "Herkim",   pack: "180 kg varil",      tag: null },
  { id: 35, sub: "solvent", n: { tr: "Ham Gliserin",                         en: "Crude Glycerine",                                    ru: "Глицерин технический" },                      brand: "Herkim",   pack: "IBC 1250 kg",       tag: null },
  { id: 36, sub: "solvent", n: { tr: "Dietanolamin (DEA)",                   en: "Diethanolamine (DEA)",                               ru: "Диэтаноламин (DEA)" },                        brand: "Herkim",   pack: "220 kg varil",      tag: null },
  { id: 37, sub: "solvent", n: { tr: "Magnezyum Klorür (Pul)",               en: "Magnesium Chloride Flakes",                          ru: "Хлорид магния (чешуйки)" },                   brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 38, sub: "solvent", n: { tr: "Metilen Klorür",                       en: "Methylene Chloride",                                 ru: "Метиленхлорид" },                             brand: "Herkim",   pack: "270 kg varil",      tag: null },
  { id: 39, sub: "solvent", n: { tr: "Polivinil Alkol (PVA)",                en: "Polyvinyl Alcohol (PVA)",                            ru: "Поливиниловый спирт (PVA)" },                 brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 40, sub: "solvent", n: { tr: "Potasyum Klorür",                      en: "Potassium Chloride",                                 ru: "Хлорид калия" },                              brand: "Herkim",   pack: "25 kg torba",       tag: null },
  { id: 41, sub: "solvent", n: { tr: "Soya Lesitini",                        en: "Soya Lecithin",                                      ru: "Соевый лецитин" },                            brand: "Herkim",   pack: "200 kg varil / IBC",tag: "yeni" },
  { id: 42, sub: "solvent", n: { tr: "Triizobutil Fosfat",                   en: "Triisobutyl Phosphate",                              ru: "Триизобутилфосфат" },                         brand: "Herkim",   pack: "200 kg varil",      tag: null }
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
