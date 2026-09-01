/* ============================================================
   HERKİM KİMYA — Veri Katmanı
   Kaynak: herkim.com.tr — 1975 kuruluşlu deri & tekstil kimyasalları
   Deri & tekstil kimyasalları · binder üretimi
   Ürün adları / kategoriler üç dillidir (tr/en/ru).

   İÇİNDEKİLER — bu dosyanın dışa verdikleri
     HK_COMPANY        Şirket künyesi. Yalnız bir bölümü koddan okunur;
                       hangisinin nerede okunduğu alan alan yazılıdır.
     HK_CATS           6 ana kategori (üç dilli etiket)
     HK_SUBS           6 alt kategori — ana kategoriyle bire bir + katalog kodu
     HK_PRODUCTS       42 ürün: resmî Herkim Group listesi (Temmuz 2026 flyer),
                       üç dilli. assets/docs/herkim-urun-katalogu-2026.pdf ile
                       aynı listedir; ikisi birlikte güncellenmelidir.
     HK_DOCS           Doküman merkezi kartları (üç dilli)
     HK_RATES_FALLBACK Kur servisi cevap vermezse kullanılan yedek USD/EUR

   Hepsi `const` — window'a YAZILMAZ. Diğer dosyalar bu adlara çıplak isimle
   başvurduğu için data.js her sayfada en başta yüklenmek zorundadır.

   YAYINLANMIŞ KAYNAK BURASIDIR
     HK_PRODUCTS ve HK_DOCS, siteyi ziyaret eden HERKESİN gördüğü listelerdir.
     Portal (portal.html) bu listelere kayıt ekleyebilir; ancak o kayıtlar
     yalnızca EKLEYEN KİŞİNİN KENDİ TARAYICISINDA (localStorage) durur — başka
     bir bilgisayardan giren ziyaretçi onları GÖRMEZ. Portal eki bir önizlemedir.
     Gerçekten yayınlamak için: portaldaki dışa aktarma çıktısı aşağıdaki
     dizilere yapıştırılır ve commit edilir. Site ancak o zaman değişir.
     Ana site listeleri main.js'teki allProducts()/allDocs() ile okur: bu iki
     dizi + varsa portal ekleri.
   ============================================================ */

/* ============================================================
   YAYIN AŞAMASI — ÖZELLİK ANAHTARLARI
   Faz 1 (canlı): yalnız TEKLİF sistemi. Ziyaretçi katalogu görür,
   sepete ürün ekler, WhatsApp/e-posta ile fiyat teklifi ister.
   Müşteri girişi, hesap başvurusu ve doğrudan sipariş KAPALI —
   kod silinmedi, sonraki faz için hazır bekliyor.

   AÇMAK İÇİN: ilgili satırı true yapın. Başka hiçbir yere
   dokunmanız gerekmez; arayüz kendini buna göre kurar.
   Önerilen açılış sırası: hesapBasvurusu -> siparis -> portal.
   ============================================================ */
const HK_FEATURES = {
  hesapBasvurusu: false,  // hesap.html, giris penceresi, basliktaki hesap dugmesi
  siparis: false,         // sepetten dogrudan siparis + siparislerim.html
  portal: false,          // ic personel portali: CRM, siparisler, musteri kartlari
  urunYonetimi: true      // TEK YONETICI: portal.html yalnizca urun/dokuman
                          // yonetimi icin acilir. CRM ve siparis ekranlari
                          // "portal" bayragina baglidir, bu bayrakla ACILMAZ.
};

/* ============================================================
   YONETICI HESABI (urun yonetimi)
   Kullanici adi ve parolayi giren kisi urun ve dokuman ekleyip cikarabilir.

   PAROLA BURADA YAZMAZ. Asagidaki "ozet", kullanici adi ile parolanin
   birlesiminden PBKDF2-HMAC-SHA256 ile 600.000 turda turetildi. Bu dosyayi
   okuyan kimlikleri OGRENEMEZ. Portal girisinde ayni turetme tarayicida
   (WebCrypto) yeniden yapilir ve sonuc bu ozetle karsilastirilir.

   Yeni kimlik uretmek icin:  node tools/yonetici-kimligi.mjs
   Arac parolayi hicbir dosyaya yazmaz, yalniz ekrana basar.

   DURUST SINIR — bunun neyi koruyup neyi korumadigi:
   KORUR:   kaynagi okuyan parolayi goremez; deneme yaniltma pahalidir
            (her deneme yeniden PBKDF2 turetmesi gerektirir + artan
            kilit sureleri).
   KORUMAZ: ozet herkese aciktir, yani sabirli biri CEVRIMDISI deneme
            yapabilir. Bunu anlamsiz kilan sey parolanin uzunlugudur —
            arac 24 karakterlik (~139 bit) parola uretir; bu uzunlukta
            cevrimdisi deneme pratikte imkansizdir. KENDI parolanizi
            koyacaksaniz kisa ya da tahmin edilebilir olmasin.
   KORUMAZ: tarayicidaki kilit sayaci localStorage'dadir; devtools bilen
            biri onu silebilir. Kilit, klavye basinda deneyen birini
            durdurur — kararli bir saldirgani degil.

   ASIL koruma bunlarin hicbiri degil, sudur: portalda yapilan ekleme ve
   cikarma YALNIZCA o kisinin kendi tarayicisinda durur. Degisiklik siteye
   ancak "Disa aktar" ciktisi data.js'e yapistirilip commit edilince yansir.
   Yani yetkisiz biri girse bile YAYINDAKI siteyi degistiremez.

   Gercek parola korumasi ancak sunucu tarafiyla gelir (bkz. herkim-backend).
   ============================================================ */
const HK_ADMIN = {
  tuz: "d4235bb9d8424cbbe9ff8544a2ff2ebf",
  tur: 600000,
  ozet: "2632df19fd61445b944be8c39dccc7b60ff3448331798dcedc0305ea450b6a89",

  /* Kaba kuvvet basamaklari: [kacinci hatadan itibaren, kac saniye kilit].
     Yukaridan asagiya okunur, ilk uyan basamak uygulanir. */
  gecikme: [
    [10, 21600],  // 10. hatadan sonra 6 saat
    [7, 3600],    // 7. hatadan sonra 1 saat
    [5, 900],     // 5. hatadan sonra 15 dakika
    [4, 300],     // 4. hatadan sonra 5 dakika
    [3, 60]       // 3. hatadan sonra 1 dakika
  ]
};

/* Şirket künyesi.
   DİKKAT: burası "tek kaynak" DEĞİL. Yalnız ilk bloktaki alanlar koddan
   okunur. İkinci bloktaki değerler sitede elle yazılıdır; burayı değiştirmek
   sitede hiçbir şeyi değiştirmez — gerçek düzenleme yeri her alanın yanında
   yazılıdır. Satır numaraları yaklaşıktır; yanlarındaki metni/anahtarı aratın. */
const HK_COMPANY = {
  /* --- KOD TARAFINDAN OKUNAN ALANLAR --- */
  founded: 1975,
  // Tecrübe süresi (yıl) BİLEREK burada tutulmuyor: main.js render sırasında
  // içinde bulunulan yıldan founded'ı çıkararak hesaplar. Sabit sayı yazmayın —
  // yıl dönünce sessizce yanlışa döner (eski "experience: 54" alanı böyle
  // yanlıştı ve zaten hiçbir yerden okunmuyordu).
  email: "sales@herkimgroup.com",     // main.js — iletişim formu mailto yedeği
  mailQuote: "sales@herkimgroup.com", // main.js — sepetten teklif mailto yedeği
  whatsapp: "905330206628",   // main.js — wa.me bağlantıları ve sepet teklif butonu.
                              // SATIŞ HATTI: +90 533 020 66 28. Sitedeki yüzen
                              // WhatsApp düğmesi, iletişim sayfasındaki hat ve
                              // sepetteki "WhatsApp ile Teklif İste" hep buradan
                              // beslenir; numara TEK bu satırda değişir.
                              // Ülke kodu bitişik yazılır,
                              // başında + ve arada boşluk YOKTUR.
  web3forms: "",              // portal-store.js hgNotify. Anahtar girilince iletişim ve
                              // teklif talepleri şirket e-postasına ANINDA düşer.
                              // NASIL ALINIR: web3forms.com adresine girip aşağıdaki
                              // notifyTo adresini (sales@herkimgroup.com) yazın; o adrese
                              // gelen anahtarı buraya yapıştırın. Anahtar herkese açıktır,
                              // gizli değildir — güvenlik domain kısıtlamasıyla sağlanır
                              // (Web3Forms panelinden "Allowed Domains" alanına yayın
                              //  adresinizi ekleyin, yoksa anahtarı gören başkası da
                              //  sizin kotanızı kullanabilir).
  notifyTo: "sales@herkimgroup.com",  // Web3Forms anahtarının kayıtlı olduğu adres.
                                      // Talepler ÖNCE buraya düşer (ticari kutu).
  notifyCc: "info@herkimgroup.com",   // Kopya. İki kutu da aynı talebi görsün diye.
                                      // Boş bırakılırsa kopya gönderilmez.

  /* --- ŞU AN KOD TARAFINDAN OKUNMUYOR — sitede elle yazılmış ---
     Aşağıdakiler gerçek şirket verisidir ve ileride koda bağlanabilir; bu yüzden
     silinmedi. Ama bugün siteyi değiştirmek için yanlarında yazan yeri düzenleyin. */
  name: "Herkim Kimya",
  // → tüm sayfaların <title>/meta'sı (örn. index.html ≈6) ve i18n.js "foot.rights"
  legal: "Herkim Group Kimyevi Maddeler A.Ş.",
  // → yalnız iletisim.html ≈7 meta description içinde geçiyor
  salesPoints: 12,
  // → i18n.js "home.about.li2", "tl.exp.d", "srv.pazarlama.d", "faq.a5" (üç dilde
  //   ayrı ayrı) ve index.html ≈373 / kurumsal.html ≈120
  address: "Deri OSB Mah. Pres Sok. No: 3, Tuzla — İstanbul / Türkiye",
  // → index.html ≈47 (JSON-LD streetAddress), index.html ≈435, iletisim.html ≈134
  phone: "444 56 58",
  // → her sayfanın üst şeridi (tel:4445658, örn. index.html ≈73) ve
  //   index.html ≈439 / iletisim.html ≈138
  phone2: "+90 216 394 11 25",
  // → index.html ≈439, iletisim.html ≈138 (telefon satırının ikinci yarısı)
  phoneTel: "+902163941133",
  // → hiçbir yerde karşılığı yok: sitedeki tel: bağlantıları 444'lü numarayı
  //   (tel:4445658) kullanıyor. Bu alan tamamen boşta duruyor.
  fax: "+90 216 394 10 04",
  // → index.html ≈447, iletisim.html ≈142
  group: "https://www.herkimgroup.com",
  // → her sayfanın üst şeridindeki "tb-group" bağlantısı (örn. index.html ≈75),
  //   index.html ≈53 (JSON-LD sameAs) ve footer "foot.ent2" bağlantısı
  brands: ["Herkim", "Herkim", "Herkim"]
  // → hiçbir yerden okunmuyor ve üç eleman da aynı: büyük olasılıkla doldurulmamış
  //   bir taslak. hizmetler.html ≈143'teki "Distribütör marka · 3" sayacı elle
  //   yazılmıştır, bu diziden gelmiyor. Doğru içeriği satış ekibine sormadan
  //   doldurmayın; uydurulmuş marka adı siteye giremez.
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
   n: ad (tr/en/ru), brand: marka/menşei, tag: "yeni"|"one"|null
   unit: SATIŞ BİRİMİ. Alan YOKSA ürün KİLO ile satılır — varsayılan ve olağan
   durum, aşağıdaki 42 ürünün tamamı böyledir. Yalnızca varille satılan üründe
   unit: "varil" yazılır. Portalda ürün eklerken "Varille satılır" kutusu bu
   alanı üretir; sepetteki miktar kutusu ve sipariş/teklif metinleri birimi
   buradan okur (assets/js/main.js → isVaril / unitLabel / qtyLabel). */
const HK_PRODUCTS = [
  // ---- Asitler ----
  { id: 1,  sub: "asit",    n: { tr: "Asetik Asit",                          en: "Acetic Acid",                                        ru: "Уксусная кислота" },                          brand: "Herkim", tag: null },
  { id: 2,  sub: "asit",    n: { tr: "Akrilik Asit",                         en: "Acrylic Acid",                                       ru: "Акриловая кислота" },                         brand: "Herkim",      tag: null },
  { id: 3,  sub: "asit",    n: { tr: "Sitrik Asit Monohidrat",               en: "Citric Acid Monohydrate",                            ru: "Лимонная кислота моногидрат" },               brand: "Herkim",       tag: null },
  { id: 4,  sub: "asit",    n: { tr: "HEDP (Hidroksietiliden Difosfonik Asit)", en: "HEDP (Hydroxyethylidene Diphosphonic Acid)",      ru: "HEDP (оксиэтилидендифосфоновая кислота)" },   brand: "Herkim",       tag: null },
  { id: 5,  sub: "asit",    n: { tr: "Formik Asit %85",                      en: "Formic Acid 85%",                                    ru: "Муравьиная кислота 85%" },                    brand: "Luxi", tag: "one" },
  { id: 6,  sub: "asit",    n: { tr: "Oksalik Asit",                         en: "Oxalic Acid",                                        ru: "Щавелевая кислота" },                         brand: "Herkim",       tag: null },
  { id: 7,  sub: "asit",    n: { tr: "Fosforik Asit %85",                    en: "Phosphoric Acid 85%",                                ru: "Ортофосфорная кислота 85%" },                 brand: "Herkim", tag: null },
  { id: 8,  sub: "asit",    n: { tr: "Sülfürik Asit",                        en: "Sulphuric Acid",                                     ru: "Серная кислота" },                            brand: "Herkim",       tag: null },

  // ---- Alkoller & Glikoller ----
  { id: 9,  sub: "alkol",   n: { tr: "Butil Glikol",                         en: "Butyl Glycol",                                       ru: "Бутилгликоль" },                              brand: "Herkim",      tag: null },
  { id: 10, sub: "alkol",   n: { tr: "İzopropil Alkol (IPA)",                en: "IPA (Isopropyl Alcohol)",                            ru: "Изопропиловый спирт (IPA)" },                 brand: "Herkim",      tag: null },
  { id: 11, sub: "alkol",   n: { tr: "Monoetilen Glikol (MEG)",              en: "MEG (Monoethylene Glycol)",                          ru: "Моноэтиленгликоль (MEG)" },                   brand: "Herkim",tag: "one" },
  { id: 12, sub: "alkol",   n: { tr: "Monopropilen Glikol (MPG)",            en: "Mono Propylene Glycol (MPG)",                        ru: "Монопропиленгликоль (MPG)" },                 brand: "Herkim",      tag: null },

  // ---- Amonyum Bazlı Ürünler ----
  { id: 13, sub: "amonyum", n: { tr: "Amonyum Bikarbonat",                   en: "Ammonium Bicarbonate",                               ru: "Бикарбонат аммония" },                        brand: "Herkim",       tag: null },
  { id: 14, sub: "amonyum", n: { tr: "Amonyum Klorür",                       en: "Ammonium Chloride",                                  ru: "Хлорид аммония" },                            brand: "Herkim",       tag: null },
  { id: 15, sub: "amonyum", n: { tr: "Amonyum Sülfat",                       en: "Ammonium Sulphate",                                  ru: "Сульфат аммония" },                           brand: "Herkim",       tag: null },

  // ---- Deri & Tabaklama ----
  { id: 16, sub: "deri",    n: { tr: "Mimoza Tozu",                          en: "Mimosa Powder",                                      ru: "Порошок мимозы" },                            brand: "Tanac",       tag: "one" },
  { id: 17, sub: "deri",    n: { tr: "Kebrako (Quebracho)",                  en: "Quebracho",                                          ru: "Квебрахо" },                                  brand: "Herkim",       tag: null },
  { id: 18, sub: "deri",    n: { tr: "Saviotan A (Astrenjan)",               en: "Saviotan A (Astringent)",                            ru: "Saviotan A (вяжущий)" },                      brand: "Saviotan",       tag: null },
  { id: 19, sub: "deri",    n: { tr: "Saviotan RS (Tatlandırılmış)",         en: "Saviotan RS (Sweetened)",                            ru: "Saviotan RS (подслащённый)" },                brand: "Saviotan",       tag: null },
  { id: 20, sub: "deri",    n: { tr: "Tara Tozu",                            en: "Tara Powder",                                        ru: "Порошок тары" },                              brand: "Herkim",       tag: null },
  { id: 21, sub: "deri",    n: { tr: "Valeks (Palamut Ekstraktı)",           en: "Valex (Valonia Extract)",                            ru: "Валекс (экстракт валлонеи)" },                brand: "Valex",       tag: null },

  // ---- Sodyum Bazlı Kimyasallar ----
  { id: 22, sub: "sodyum",  n: { tr: "Kostik Soda",                          en: "Caustic Soda",                                       ru: "Каустическая сода" },                         brand: "Herkim",       tag: "one" },
  { id: 23, sub: "sodyum",  n: { tr: "Nanocon (Povercon) — Sodyum Naftalin Sülfonat (Açık Renk)", en: "Nanocon (Povercon) — Sodium Naphthalene Sulfonate (Light Colour)", ru: "Nanocon (Povercon) — нафталинсульфонат натрия (светлый)" }, brand: "Povercon", tag: null },
  { id: 24, sub: "sodyum",  n: { tr: "Povercon 100 — Sodyum Naftalin Sülfonat", en: "Povercon 100 — Sodium Naphthalene Sulfonate",     ru: "Povercon 100 — нафталинсульфонат натрия" },   brand: "Povercon",       tag: "yeni" },
  { id: 25, sub: "sodyum",  n: { tr: "Sodyum Bikarbonat",                    en: "Sodium Bicarbonate",                                 ru: "Бикарбонат натрия" },                         brand: "Herkim",       tag: null },
  { id: 26, sub: "sodyum",  n: { tr: "Sodyum Karbonat",                      en: "Sodium Carbonate",                                   ru: "Карбонат натрия" },                           brand: "Herkim",       tag: null },
  { id: 27, sub: "sodyum",  n: { tr: "Sodyum Format",                        en: "Sodium Formate",                                     ru: "Формиат натрия" },                            brand: "Herkim",       tag: null },
  { id: 28, sub: "sodyum",  n: { tr: "Sodyum Sülfhidrat",                    en: "Sodium Sulphhydrate",                                ru: "Гидросульфид натрия" },                       brand: "Herkim",       tag: null },
  { id: 29, sub: "sodyum",  n: { tr: "Sodyum Hidrosülfit",                   en: "Sodium Hydrosulphite",                               ru: "Гидросульфит натрия" },                       brand: "Herkim",       tag: null },
  { id: 30, sub: "sodyum",  n: { tr: "Sodyum Metabisülfit (TLG)",            en: "Sodium Metabisulphite (TLG Grade)",                  ru: "Метабисульфит натрия (TLG)" },                brand: "Herkim",       tag: null },
  { id: 31, sub: "sodyum",  n: { tr: "Sodyum Perkarbonat",                   en: "Sodium Percarbonate",                                ru: "Перкарбонат натрия" },                        brand: "Herkim",       tag: "yeni" },
  { id: 32, sub: "sodyum",  n: { tr: "Sodyum Sülfür",                        en: "Sodium Sulphide",                                    ru: "Сульфид натрия" },                            brand: "Herkim",       tag: null },

  // ---- Solventler & Endüstriyel Kimyasallar ----
  { id: 33, sub: "solvent", n: { tr: "Amonyak",                              en: "Ammonia",                                            ru: "Аммиак" },                                    brand: "Herkim", tag: null },
  { id: 34, sub: "solvent", n: { tr: "Butil Asetat",                         en: "Butyl Acetate",                                      ru: "Бутилацетат" },                               brand: "Herkim",      tag: null },
  { id: 35, sub: "solvent", n: { tr: "Ham Gliserin",                         en: "Crude Glycerine",                                    ru: "Глицерин технический" },                      brand: "Herkim",       tag: null },
  { id: 36, sub: "solvent", n: { tr: "Dietanolamin (DEA)",                   en: "Diethanolamine (DEA)",                               ru: "Диэтаноламин (DEA)" },                        brand: "Herkim",      tag: null },
  { id: 37, sub: "solvent", n: { tr: "Magnezyum Klorür (Pul)",               en: "Magnesium Chloride Flakes",                          ru: "Хлорид магния (чешуйки)" },                   brand: "Herkim",       tag: null },
  { id: 38, sub: "solvent", n: { tr: "Metilen Klorür",                       en: "Methylene Chloride",                                 ru: "Метиленхлорид" },                             brand: "Herkim",      tag: null },
  { id: 39, sub: "solvent", n: { tr: "Polivinil Alkol (PVA)",                en: "Polyvinyl Alcohol (PVA)",                            ru: "Поливиниловый спирт (PVA)" },                 brand: "Herkim",       tag: null },
  { id: 40, sub: "solvent", n: { tr: "Potasyum Klorür",                      en: "Potassium Chloride",                                 ru: "Хлорид калия" },                              brand: "Herkim",       tag: null },
  { id: 41, sub: "solvent", n: { tr: "Soya Lesitini",                        en: "Soya Lecithin",                                      ru: "Соевый лецитин" },                            brand: "Herkim",tag: "yeni" },
  { id: 42, sub: "solvent", n: { tr: "Triizobutil Fosfat",                   en: "Triisobutyl Phosphate",                              ru: "Триизобутилфосфат" },                         brand: "Herkim",      tag: null }
];

/* Dokümanlar (üç dilli) */
const HK_DOCS = [
  { ext: "PDF", cat: "katalog",   file: "assets/docs/herkim-urun-katalogu-2026.pdf", title: { tr: "Ürün Kataloğu 2026", en: "Product Catalog 2026", ru: "Каталог продукции 2026" }, desc: { tr: "42 kalemlik güncel ürün listemiz: asitler, alkoller, amonyum, deri-tabaklama, sodyum, solventler.", en: "Our current 42-item product list: acids, alcohols, ammonium, leather & tanning, sodium, solvents.", ru: "Актуальный список из 42 позиций: кислоты, спирты, аммоний, кожа и дубление, натрий, растворители." }, meta: { tr: "v2026 · PDF", en: "v2026 · PDF", ru: "v2026 · PDF" } },
  { ext: "PDF", cat: "katalog",   title: { tr: "Genel Fiyat Listesi", en: "General Price List", ru: "Общий прайс-лист" }, desc: { tr: "Güncel fiyat listemiz talep üzerine paylaşılır.", en: "Our current price list is shared on request.", ru: "Актуальный прайс-лист предоставляется по запросу." }, meta: { tr: "Aylık", en: "Monthly", ru: "Ежемесячно" } },
  { ext: "PDF", cat: "teknik",    title: { tr: "TDS — Teknik Veri Sayfaları", en: "TDS — Technical Data Sheets", ru: "TDS — Технические паспорта" }, desc: { tr: "Ürün bazlı teknik özellikler ve uygulama önerileri.", en: "Product-based technical specs and application advice.", ru: "Технические данные по продуктам и рекомендации." }, meta: { tr: "Ürün başına", en: "Per product", ru: "На продукт" } },
  { ext: "PDF", cat: "teknik",    title: { tr: "SDS — Güvenlik Bilgi Formları", en: "SDS — Safety Data Sheets", ru: "SDS — Паспорта безопасности" }, desc: { tr: "GHS/CLP uyumlu güvenlik bilgi formları.", en: "GHS/CLP-compliant safety data sheets.", ru: "Паспорта безопасности по GHS/CLP." }, meta: { tr: "TR/EN", en: "TR/EN", ru: "TR/EN" } },
  { ext: "PDF", cat: "sertifika", title: { tr: "ISO 9001 Kalite Belgesi", en: "ISO 9001 Quality Certificate", ru: "Сертификат качества ISO 9001" }, desc: { tr: "Kalite yönetim sistemi sertifikamız.", en: "Our quality management system certificate.", ru: "Сертификат системы менеджмента качества." }, meta: { tr: "Güncel", en: "Current", ru: "Актуальный" } },
  { ext: "ZIP", cat: "marka",     title: { tr: "Kurumsal Kimlik Kiti", en: "Brand Identity Kit", ru: "Комплект фирменного стиля" }, desc: { tr: "Logo, renk paleti, tipografi ve kullanım kuralları.", en: "Logo, color palette, typography and usage rules.", ru: "Логотип, палитра, типографика и правила." }, meta: { tr: "Logo + kılavuz", en: "Logo + guide", ru: "Лого + гайд" } },
  { ext: "PDF", cat: "marka",     title: { tr: "Şirket Tanıtım Sunumu", en: "Company Profile", ru: "Презентация компании" }, desc: { tr: "Herkim Kimya'yı tanıtan kurumsal sunum.", en: "Corporate presentation introducing Herkim Kimya.", ru: "Корпоративная презентация Herkim Kimya." }, meta: { tr: "TR/EN/RU", en: "TR/EN/RU", ru: "TR/EN/RU" } },
  { ext: "PDF", cat: "hukuki",    title: { tr: "KVKK Aydınlatma Metni", en: "Privacy Notice (KVKK)", ru: "Уведомление о конфиденциальности" }, desc: { tr: "Kişisel verilerin korunmasına ilişkin metin.", en: "Notice on the protection of personal data.", ru: "Уведомление о защите персональных данных." }, meta: { tr: "Hukuki", en: "Legal", ru: "Юридический" } }
];

const HK_RATES_FALLBACK = { usd: 41.24, eur: 48.67 };
