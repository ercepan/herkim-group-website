/* ============================================================
   HERKİM PORTAL — Paylaşılan Veri Deposu (tek akış)
   Tüm roller (müşteri, satış, depo, yönetim) AYNI depoyu okur/yazar:
   müşteri sipariş verir → satış onaylar → depo ilerletir → yönetim izler.
   Demo: localStorage. Gerçek kurulumda bu katman Logo Tiger + CRM API'sidir.

   Dosya tamamı IIFE içindedir; dışarıya açılan isimler EN ALTTAKİ tek blokta
   window'a yazılır. Sebep: sayfadaki başka bir script'in hgpGet/hgNotify gibi
   isimleri sessizce ezmesini engellemek ve bu katmanın genel API'sini tek
   bakışta okunur kılmak. Yeni bir şey dışarıya açılacaksa o bloğa eklenir.

   İÇİNDEKİLER
     Oturum sabitleri · demo kullanıcıları · müşteri kartları
     Depo API'si (hgpGet / hgpSave / hgpAct) ve sipariş–talep akışı
     Hesap başvurusu (VKN/TCKN doğrulama, onay–red)
     KATALOG EKLERİ — portalda eklenen ürün ve dokümanlar + data.js'e
       yapıştırılacak kodu üreten dışa aktarım (hgpAddProduct … hgpExportDocs).
       Bu bölüm ANA SİTEDE de çalışır: hgpAllProducts / hgpAllDocs her render'da
       çağrılır, bu yüzden ucuz ve istisna fırlatmaz olmak zorundadır.
     Gerçek bildirim (hgNotify)
   ============================================================ */
(function () {
  "use strict";

  var HGP_KEY = "hg_store_v1";
  var HGP_QUEUE = "hg_landing_queue";   // ana sitedeki formdan düşen talepler
  var HGP_PREFILL = "hg_order_prefill"; // teklif sepetinden sipariş aktarımı

  /* ---------------- Oturum sabitleri ----------------
     DİKKAT — BURADAKİ KİMLİK DOĞRULAMA TAMAMEN DEMODUR VE HİÇBİR GÜVENLİK
     DEĞERİ YOKTUR. Şifre bu dosyayla birlikte tarayıcıya iniyor; siteyi açan
     herkes kaynağı okuyup şifreyi görebilir, konsoldan localStorage'a istediği
     oturumu yazıp istediği rolle "giriş yapmış" olabilir. Kilitlenme ve boşta
     kalma süreleri de tarayıcıda tutulduğu için istemci tarafından silinebilir.
     Bunlar yalnızca demo akışını canlandırmak içindir.
     GERÇEK erişim denetimi ancak sunucu tarafında olur: kimlik doğrulama,
     oturum jetonu ve her istekte yetki kontrolü sunucuda yapılmalıdır.
     İstemci tarafında karma/şifreleme/gizleme denemeyin — hiçbir şey kazandırmaz,
     yalnızca ekibe "güvenli" izlenimi vererek yanıltır.
     Bu sabitler portal-app.js ve site-auth.js'te KOPYALANMIŞTI ve aynı anahtar
     üzerinde davranışları ayrışmıştı; tek kaynak burasıdır. */
  var HGP_SESSION_KEY = "hg_portal_session";
  var HGP_LOCK_KEY = "hg_login_lock";
  var HGP_LAST_LOGIN = "hg_last_login_";
  /* DEMO PAROLASI SİLİNDİ. Burada "demo1234" yazıyordu ve depo herkese açık.
     Faz 1'de müşteri girişi kapalı olduğu için geçerli parola yoktur; Faz 2'de
     yerine sunucu tarafı kimlik doğrulama gelecek (bkz. herkim-backend). */
  var HGP_DEMO_PASS = null;
  var HGP_IDLE_MS = 15 * 60 * 1000;
  var HGP_LOCK_MS = 60 * 1000;
  var HGP_MAX_FAILS = 3;

  /* Etkinlik akışında saklanan en fazla kayıt sayısı; eski kayıtlar düşer.
     localStorage kotasını korumak için üst sınır (eskiden gömülü 60 sayısıydı). */
  var HGP_ACT_LIMIT = 60;

  /* Sipariş durum akışı */
  var HGP_STEPS = ["Onay Bekliyor", "Onaylandı", "Üretimde", "Sevkiyatta", "Teslim Edildi"];
  var HGP_STEP_CLASS = ["bekliyor", "onay", "uretim", "sevk", "teslim"];

  /* Demo kullanıcıları (roller) */
  var HGP_USERS = {
    musteri: { role: "musteri", name: "Mehmet Kaya",  title: "Satın Alma",       company: "Derim Deri San. A.Ş.", initials: "MK", rep: "Ayşe Yılmaz" },
    satis:   { role: "satis",   name: "Ayşe Yılmaz",  title: "Satış Temsilcisi", company: "Herkim Kimya",         initials: "AY", rep: null },
    depo:    { role: "depo",    name: "Hasan Demir",  title: "Depo & Sevkiyat",  company: "Herkim Kimya",         initials: "HD", rep: null },
    yonetim: { role: "yonetim", name: "Genel Müdür",  title: "Yönetim",          company: "Herkim Kimya",         initials: "GM", rep: null }
  };

  /* Müşteri kartları (CRM) */
  var HGP_CUSTOMERS = [
    {
      id: "C-001", name: "Derim Deri San. A.Ş.", city: "Tuzla / İstanbul",
      contact: "Mehmet Kaya", phone: "+90 532 000 11 22", email: "satinalma@derimderi.com.tr",
      rep: "Ayşe Yılmaz", since: 2011,
      history: [
        { via: "TEL", t: "Telefon — sevkiyat planı",        n: "Temmuz sevkiyatları ve yeni sezon ihtiyaçları konuşuldu.", when: "09.07.2026" },
        { via: "WA", t: "WhatsApp — miktar teyidi",        n: "HG-2026-1041 miktar artışı teyit edildi.",                 when: "02.07.2026" },
        { via: "SAHA", t: "Saha ziyareti — teknik servis",   n: "Finisaj hattında uygulama optimizasyonu yapıldı.",         when: "24.06.2026" }
      ]
    },
    {
      id: "C-002", name: "Anadolu Tekstil Ltd.", city: "Bursa",
      contact: "Zeynep Arslan", phone: "+90 533 000 33 44", email: "satinalma@anadolutekstil.com",
      rep: "Ayşe Yılmaz", since: 2017,
      history: [
        { via: "E-POSTA", t: "E-posta — fiyat listesi",         n: "Temmuz fiyat listesi iletildi.",                            when: "01.07.2026" },
        { via: "TEL", t: "Telefon — numune geri bildirimi", n: "PB-70 numunesi beğenildi; deneme siparişi planlanıyor.",    when: "27.06.2026" }
      ]
    },
    {
      id: "C-003", name: "Mega Boya San. A.Ş.", city: "Gebze / Kocaeli",
      contact: "Ali Vural", phone: "+90 535 000 55 66", email: "satinalma@megaboya.com.tr",
      rep: "Ayşe Yılmaz", since: 2020,
      history: [
        { via: "SAHA", t: "Saha ziyareti — yeni hat",        n: "Yeni üretim hattı için binder ihtiyacı görüşüldü.",          when: "18.06.2026" }
      ]
    }
  ];

  /* ---------------- Depo API ---------------- */
  /* NOT: Aşağıdaki tohum (seed) verisindeki 2026 tarihleri ve HG-2026-… /
     TL-2026-… / BV-2026-… kimlikleri BİLEREK sabittir — bu sabit bir demo
     fikstürüdür, ekran görüntüleri ve anlatım buna dayanır. Yıl yalnızca
     ÇALIŞMA ANINDA üretilen kimliklerde hgpYear() ile hesaplanır. */
  function hgpSeed() {
    return {
      seq: 1050,
      orders: [
        { id: "HG-2026-1041", customer: "Derim Deri San. A.Ş.", step: 3, date: "02.07.2026", eta: "17.07.2026",
          items: [{ n: "Su Bazlı Top Coat", q: "2.400 kg" }, { n: "Matlaştırıcı Ajan", q: "400 kg" }],
          carrier: "Herkim Lojistik · 34 HK 512", track: "SVK-2214",
          tl: ["02.07.2026 09:41", "02.07.2026 11:05", "04.07.2026 08:15", "14.07.2026 07:30", null] },
        { id: "HG-2026-1038", customer: "Derim Deri San. A.Ş.", step: 1, date: "10.07.2026", eta: "24.07.2026",
          items: [{ n: "Altkat Penetratörü", q: "1.200 kg" }],
          carrier: "—", track: "—",
          tl: ["10.07.2026 14:20", "11.07.2026 09:12", null, null, null] },
        { id: "HG-2026-1035", customer: "Derim Deri San. A.Ş.", step: 4, date: "12.06.2026", eta: "26.06.2026",
          items: [{ n: "Anilin Deri Boyası (6 renk)", q: "800 kg" }],
          carrier: "Herkim Lojistik · 34 HK 507", track: "SVK-2148",
          tl: ["12.06.2026 10:05", "12.06.2026 13:40", "14.06.2026 08:30", "24.06.2026 07:10", "26.06.2026 11:55"] },
        { id: "HG-2026-1044", customer: "Anadolu Tekstil Ltd.", step: 0, date: "14.07.2026", eta: "—",
          items: [{ n: "Pigment Baskı Binderi", q: "3.000 kg" }],
          carrier: "—", track: "—",
          tl: ["14.07.2026 16:40", null, null, null, null] },
        { id: "HG-2026-1042", customer: "Anadolu Tekstil Ltd.", step: 2, date: "08.07.2026", eta: "22.07.2026",
          items: [{ n: "Silikon Yumuşatıcı", q: "1.500 kg" }],
          carrier: "—", track: "—",
          tl: ["08.07.2026 15:12", "09.07.2026 08:00", "12.07.2026 10:20", null, null] },
        { id: "HG-2026-1033", customer: "Mega Boya San. A.Ş.", step: 4, date: "05.06.2026", eta: "19.06.2026",
          items: [{ n: "Stiren-Akrilik Binder", q: "5.000 kg" }],
          carrier: "Anlaşmalı nakliye", track: "SVK-2107",
          tl: ["05.06.2026 09:00", "05.06.2026 10:15", "06.06.2026 07:45", "16.06.2026 06:50", "19.06.2026 10:15"] }
      ],
      requests: [
        { id: "TL-2026-0312", customer: "Derim Deri San. A.Ş.", subject: "Numune talebi — mat finisaj lak",
          detail: "Yeni koleksiyon için mat finisaj lak numunesi (5 kg) rica ediyoruz.", date: "10.07.2026",
          status: "yanit", reply: { by: "Ayşe Yılmaz", when: "10.07.2026 14:20", text: "Numuneniz hazırlanıyor; perşembe kargoda olacak." } },
        { id: "TL-2026-0309", customer: "Anadolu Tekstil Ltd.", subject: "Teknik destek — viskozite",
          detail: "Baskı hattında viskozite dalgalanması yaşıyoruz, saha desteği rica ederiz.", date: "08.07.2026",
          status: "acik", reply: null },
        { id: "TL-2026-0305", customer: "Derim Deri San. A.Ş.", subject: "Vade güncelleme talebi",
          detail: "Temmuz sevkiyatları için vade koşullarını görüşmek istiyoruz.", date: "06.07.2026",
          status: "acik", reply: null }
      ],
      activities: [
        { when: "14.07.2026 16:40", who: "Anadolu Tekstil", what: "Yeni sipariş oluşturdu: HG-2026-1044", type: "siparis" },
        { when: "14.07.2026 07:30", who: "Depo", what: "HG-2026-1041 sevkiyata çıktı (SVK-2214)", type: "sevk" },
        { when: "13.07.2026 11:05", who: "Web", what: "Yeni hesap başvurusu: Yıldız Tekstil San. ve Tic. Ltd. Şti.", type: "talep" },
        { when: "12.07.2026 10:20", who: "Üretim", what: "HG-2026-1042 üretime alındı", type: "uretim" },
        { when: "11.07.2026 09:12", who: "Ayşe Yılmaz", what: "HG-2026-1038 siparişini onayladı", type: "onay" },
        { when: "10.07.2026 14:20", who: "Ayşe Yılmaz", what: "TL-2026-0312 talebini yanıtladı", type: "talep" }
      ],
      applications: hgpSeedApps(),
      accounts: [],   // onaylı web hesapları: {email, name, company, initials}
      customers: [],  // onaylı başvurulardan doğan CRM kartları
      customProducts: [], // portalda eklenen ürünler (bkz. KATALOG EKLERİ bölümü)
      customDocs: [],     // portalda eklenen dokümanlar
      customSeq: {},      // katalog eklerinde dağıtılmış en yüksek kimlik (geri sayılmaz)
      hiddenProducts: []  // listeden çıkarılan data.js ürünlerinin kimlikleri
    };
  }

  /* Bekleyen örnek hesap başvurusu (VKN sağlama basamağı geçerli) */
  function hgpSeedApps() {
    return [{
      id: "BV-2026-1049", firm: "Yıldız Tekstil San. ve Tic. Ltd. Şti.",
      taxOffice: "Nilüfer / Bursa", vkn: "8123456786",
      phone: "+90 224 000 44 55", web: "yildiztekstil.com.tr",
      address: "NOSAB 216. Sok. No: 12 Nilüfer / Bursa",
      contact: "Selin Yıldız", email: "satinalma@yildiztekstil.com.tr", mobile: "+90 532 444 55 66",
      msg: "Sodyum bazlı ürünler ve MEG için düzenli tedarik arıyoruz.",
      date: "13.07.2026", status: "bekliyor"
    }];
  }

  /* Çalışma anında üretilen kimliklerin (HG-…, TL-…, BV-…) yıl parçası.
     Eskiden "2026" gömülüydü; 1 Ocak'tan itibaren sessizce yanlış yıl üretiyordu. */
  function hgpYear() { return new Date().getFullYear(); }

  /* UYARI — hgpGet() saf bir OKUMA DEĞİLDİR, çağrıldığında depoya YAZAR:
       1) depo boş/bozuksa tohum veriyi yazar (hgpSeed + hgpSave),
       2) eski sürüm depoya applications/accounts/customers ve
          customProducts/customDocs/customSeq alanlarını ekler (taşıma),
       3) ana sitedeki formdan biriken talep kuyruğunu (HGP_QUEUE) içeri alıp
          kuyruğu SİLER ve depoyu kaydeder.
     Yani salt görüntüleme amacıyla çağrıldığında bile localStorage değişebilir.
     Yapı riskli olduğu için bilinçli olarak bölünmemiştir; değiştirmeden önce
     tüm çağrı yerlerini (portal-app.js, site-auth.js, main.js) gözden geçirin. */
  /* SALT-OKUNUR erişim — hgpGet() ile karıştırmayın.
     hgpGet() saf bir okuma DEĞİLDİR: depo boşsa demo tohumunu YAZAR, taşıma
     yapar ve landing kuyruğunu boşaltır. Bu, portalda doğru davranıştır.
     Ama hgpAllProducts/hgpAllDocs artık HERKESE AÇIK sayfalarda her çizimde
     çağrılıyor; orada hgpGet() kullanmak, siteyi ziyaret eden HERKESİN
     tarayıcısına 6 sahte sipariş, 6 etkinlik ve kişisel veri biçiminde bir
     hesap başvurusu yazıyordu (ölçüldü: 3688 bayt). Ziyaretçinin deposuna
     uydurma iş kaydı yazmak KVKK açısından da savunulamaz.
     hgpPeek() hiçbir şey yazmaz; depo yoksa null döner. */
  /* ============ OTURUM DEPOSU — sessionStorage, localStorage DEĞİL ============
     HATA: oturum localStorage'ta tutuluyordu ve localStorage sekme/tarayıcı
     kapansa da yaşar. Ortak bir bilgisayarda çıkış yapmayı UNUTAN kullanıcının
     hesabı, siteyi sonra açan kişiye açık kalıyordu.
     sessionStorage sekme kapandığında tarayıcı tarafından silinir. Aynı sekmede
     sayfalar arası gezinme (index -> urunler -> siparislerim) oturumu KORUR;
     yeni sekme ya da yeniden açılan tarayıcı temiz başlar.
     15 dakikalık boşta kalma denetimi KALDIRILMADI: sekmeyi açık unutan
     kullanıcı için ikinci katman olarak gerekli.
     Üç dosya da (site-auth.js, portal-app.js, buradaki depo) YALNIZCA bu üç
     yardımcıyı kullanır; doğrudan storage'a dokunmayın, iki taraf sessizce
     ayrışır (bu kod tabanında sabitler bir kez tam olarak böyle ayrışmıştı). */
  /* "BENİ HATIRLA" — kullanıcı GÜVENLİK ile KOLAYLIK arasında kendisi seçer.
       işaretsiz (VARSAYILAN) -> sessionStorage: sekme kapanınca oturum biter.
                                 Ortak/ofis bilgisayarı için doğru olan budur.
       işaretli               -> localStorage: tarayıcı kapansa da oturum ve
                                 sepet durur; kullanıcı geri geldiğinde sepetini
                                 yeniden kurmak zorunda kalmaz.
     Tercih hg_session_persist ile SAKLANIR; okuma her iki depoya da bakar,
     böylece hangi modda giriş yapıldığından bağımsız olarak oturum bulunur.
     Silme HER İKİ depoyu birden temizler: yarım kalan bir kayıt, kullanıcının
     "çıkış yaptım" sanmasına yol açar. */
  var HGP_PERSIST_KEY = "hg_session_persist";
  function hgpSesPersistent() {
    try { return localStorage.getItem(HGP_PERSIST_KEY) === "1"; } catch (e) { return false; }
  }
  function hgpSesRead() {
    try {
      var v = sessionStorage.getItem(HGP_SESSION_KEY);
      if (v === null) v = localStorage.getItem(HGP_SESSION_KEY);
      return JSON.parse(v);
    } catch (e) { return null; }
  }
  /* persist argümanı verilmezse mevcut tercih korunur — oturum tazelenirken
     (touch) kullanıcının seçimi sessizce değişmesin. */
  function hgpSesWrite(o, persist) {
    var keep = (persist === undefined) ? hgpSesPersistent() : !!persist;
    try {
      if (persist !== undefined) localStorage.setItem(HGP_PERSIST_KEY, keep ? "1" : "0");
      if (keep) {
        localStorage.setItem(HGP_SESSION_KEY, JSON.stringify(o));
        sessionStorage.removeItem(HGP_SESSION_KEY);
      } else {
        sessionStorage.setItem(HGP_SESSION_KEY, JSON.stringify(o));
        localStorage.removeItem(HGP_SESSION_KEY);
      }
      return true;
    } catch (e) { return false; }   // gizli sekme / dolu kota
  }
  function hgpSesClear() {
    try { sessionStorage.removeItem(HGP_SESSION_KEY); } catch (e) {}
    try { localStorage.removeItem(HGP_SESSION_KEY); localStorage.removeItem(HGP_PERSIST_KEY); } catch (e) {}
  }

  function hgpPeek() {
    try { return JSON.parse(localStorage.getItem(HGP_KEY)) || null; }
    catch (e) { return null; }
  }

  function hgpGet() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(HGP_KEY)); } catch (e) {}
    if (!s || !s.orders) { s = hgpSeed(); hgpSave(s); }
    // Eski depo sürümlerine hesap alanlarını ekle (taşıma)
    if (!s.applications) { s.applications = hgpSeedApps(); s.accounts = []; s.customers = []; hgpSave(s); }
    /* Katalog eklerini eski depolara ekle (taşıma). Alanlar AYRI AYRI
       denetlenir: yalnızca birini taşıyan bir ara sürümden gelen depo da
       eksiksiz tamamlansın, mevcut kayıtlar ezilmesin. customSeq boş bir nesne
       olarak başlar; ilk ekleme sırasında listedeki en büyük kimlikten devam
       eder, yani taşınan depoda kimlik çakışmaz. */
    if (!s.customProducts || !s.customDocs || !s.customSeq || !s.hiddenProducts) {
      if (!s.customProducts) s.customProducts = [];
      if (!s.customDocs) s.customDocs = [];
      if (!s.customSeq) s.customSeq = {};
      if (!s.hiddenProducts) s.hiddenProducts = [];
      hgpSave(s);
    }
    // Ana sitedeki iletişim formundan düşen talepleri içeri al (Landing → CRM)
    try {
      var q = JSON.parse(localStorage.getItem(HGP_QUEUE)) || [];
      if (q.length) {
        q.forEach(function (r) {
          s.seq += 1;
          s.requests.unshift({
            id: "TL-" + hgpYear() + "-0" + s.seq, customer: r.firm || "Web ziyaretçisi",
            subject: r.topic || "Web sitesi talebi", detail: r.msg || "",
            date: r.date || "14.07.2026", status: "acik", reply: null, viaLanding: true
          });
          s.activities.unshift({ when: r.date || "14.07.2026", who: r.name || "Web", what: "Landing formundan talep düştü: " + (r.topic || ""), type: "talep" });
        });
        localStorage.removeItem(HGP_QUEUE);
        hgpSave(s);
      }
    } catch (e) {}
    return s;
  }

  /* localStorage.setItem, Safari gizli modunda ve kota dolduğunda İSTİSNA fırlatır.
     Sarmalanmadığı için bir hesap başvurusu tamamen kaybolabiliyordu. Artık hata
     yutulmuyor, konsola düşüyor ve başarı bilgisi boolean olarak dönüyor.
     Dönüş değerini yok sayan mevcut çağrılar aynen çalışmaya devam eder. */
  function hgpSave(s) {
    try {
      localStorage.setItem(HGP_KEY, JSON.stringify(s));
      return true;
    } catch (e) {
      console.warn("Herkim portal: veri deposu KAYDEDİLEMEDİ (localStorage yazılamıyor — gizli sekme veya dolu kota). Bu işlem kalıcı olmadı.", e);
      return false;
    }
  }

  function hgpNow() {
    var d = new Date();
    function p(x) { return (x < 10 ? "0" : "") + x; }
    return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function hgpToday() { return hgpNow().split(" ")[0]; }

  function hgpAct(s, who, what, type) {
    s.activities.unshift({ when: hgpNow(), who: who, what: what, type: type || "genel" });
    if (s.activities.length > HGP_ACT_LIMIT) s.activities.length = HGP_ACT_LIMIT;
  }

  /* Sipariş oluştur (müşteri) → Onay Bekliyor. note: web sepetinden gelen sipariş notu */
  function hgpAddOrder(customer, items, who, note) {
    var s = hgpGet();
    s.seq += 1;
    var id = "HG-" + hgpYear() + "-" + s.seq;
    s.orders.unshift({
      id: id, customer: customer, step: 0, date: hgpToday(), eta: "—",
      items: items, carrier: "—", track: "—", note: note || "",
      tl: [hgpNow(), null, null, null, null]
    });
    hgpAct(s, who, "Yeni sipariş oluşturdu: " + id, "siparis");
    hgpSave(s);
    return id;
  }

  /* Siparişi ilerlet (satış onaylar, depo üretim/sevk/teslim işaretler) */
  function hgpAdvance(orderId, who) {
    var s = hgpGet();
    var o = null;
    for (var i = 0; i < s.orders.length; i++) if (s.orders[i].id === orderId) o = s.orders[i];
    if (!o || o.step >= 4) return null;
    o.step += 1;
    o.tl[o.step] = hgpNow();
    var labels = ["", " siparişini onayladı", " üretime alındı", " sevkiyata çıktı", " teslim edildi"];
    if (o.step === 1) { var d = new Date(); d.setDate(d.getDate() + 14); o.eta = ("0"+d.getDate()).slice(-2)+"."+("0"+(d.getMonth()+1)).slice(-2)+"."+d.getFullYear(); }
    if (o.step === 3 && o.track === "—") { o.track = "SVK-" + (2200 + (s.seq % 100)); o.carrier = "Herkim Lojistik"; }
    hgpAct(s, who, o.id + labels[o.step], ["", "onay", "uretim", "sevk", "teslim"][o.step]);
    hgpSave(s);
    return o.step;
  }

  /* Talep oluştur (müşteri) */
  function hgpAddRequest(customer, subject, detail, who) {
    var s = hgpGet();
    s.seq += 1;
    var id = "TL-" + hgpYear() + "-0" + s.seq;
    s.requests.unshift({ id: id, customer: customer, subject: subject, detail: detail, date: hgpToday(), status: "acik", reply: null });
    hgpAct(s, who, "Yeni talep açtı: " + subject, "talep");
    hgpSave(s);
    return id;
  }

  /* Talebi yanıtla (satış) */
  function hgpReply(reqId, text, who) {
    var s = hgpGet();
    for (var i = 0; i < s.requests.length; i++) {
      if (s.requests[i].id === reqId) {
        s.requests[i].status = "yanit";
        s.requests[i].reply = { by: who, when: hgpNow(), text: text };
        hgpAct(s, who, reqId + " talebini yanıtladı", "talep");
      }
    }
    hgpSave(s);
  }

  /* Müşteri kartına not ekle (satış) */
  function hgpAddNote(custName, note, who) {
    var s = hgpGet();
    hgpAct(s, who, custName + " — görüşme notu: " + note, "not");
    hgpSave(s);
  }

  /* ---------------- Hesap başvurusu (NGB modeli) ----------------
     Akış: web formu → başvuru CRM'e düşer → satış VKN/GİB doğrular →
     onay → müşteri kartı + giriş hesabı oluşur → teklif/sipariş açılır. */

  /* Vergi Kimlik No (10 hane) — Gelir İdaresi Başkanlığı sağlama basamağı algoritması.
     İlk 9 hane için: p = (hane + 10 - sıra) mod 10, q = (p * 2^(10-sıra)) mod 9;
     p sıfır değilken q sıfır çıkarsa q = 9 alınır. 10. hane = (10 - toplam mod 10) mod 10.
     Algoritma doğrulanmıştır — DEĞİŞTİRMEYİN. */
  function hgpValidVKN(v) {
    if (!/^\d{10}$/.test(v)) return false;
    var sum = 0;
    for (var i = 0; i < 9; i++) {
      var d = +v[i];
      var p = (d + 10 - (i + 1)) % 10;
      var q = (p * Math.pow(2, 10 - (i + 1))) % 9;
      if (p !== 0 && q === 0) q = 9;
      sum += q;
    }
    return ((10 - (sum % 10)) % 10) === +v[9];
  }

  /* TC Kimlik No (11 hane) — NVİ sağlama algoritması; şahıs firmaları için.
     İlk hane 0 olamaz. 10. hane = ((d1+d3+d5+d7+d9) * 7 - (d2+d4+d6+d8)) mod 10,
     11. hane = (d1..d10 toplamı) mod 10. Algoritma doğrulanmıştır — DEĞİŞTİRMEYİN. */
  function hgpValidTCKN(t) {
    if (!/^[1-9]\d{10}$/.test(t)) return false;
    var d = t.split("").map(Number);
    var odd = d[0] + d[2] + d[4] + d[6] + d[8], even = d[1] + d[3] + d[5] + d[7];
    if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
    var sum10 = 0;
    for (var i = 0; i < 10; i++) sum10 += d[i];
    return sum10 % 10 === d[10];
  }

  /* Vergi No alanı: 10 hane → VKN, 11 hane → TCKN */
  function hgpValidTaxId(x) {
    var v = (x || "").replace(/\s/g, "");
    return v.length === 10 ? hgpValidVKN(v) : (v.length === 11 ? hgpValidTCKN(v) : false);
  }

  function hgpAddApplication(app) {
    var s = hgpGet();
    s.seq += 1;
    var id = "BV-" + hgpYear() + "-" + s.seq;
    s.applications.unshift({
      id: id, firm: app.firm, taxOffice: app.taxOffice, vkn: app.vkn,
      phone: app.phone || "—", web: app.web || "", address: app.address || "",
      contact: app.contact, email: (app.email || "").toLowerCase(), mobile: app.mobile || "",
      msg: app.msg || "", date: hgpToday(), status: "bekliyor"
    });
    hgpAct(s, app.contact || "Web", "Yeni hesap başvurusu: " + app.firm, "talep");
    hgpSave(s);
    return id;
  }

  /* Firma adlarını karşılaştırmak için sadeleştirme: tekrarlayan boşluklar
     tekleştirilir, i harfi ailesi (i/İ/I/ı) tek harfe indirgenir, ardından ad
     Türkçe yerel ayarıyla küçültülür.
     Noktalı/noktasız i ayrımının bilerek yok sayılmasının sebebi: yalnızca
     toLocaleLowerCase("tr") kullanılsaydı "YEPYENİ KIMYA" ile "Yepyeni Kimya"
     farklı görünür ve çakışma denetimi atlatılabilirdi. Karşılaştırmayı gevşek
     tutmak güvenli taraftır — çakışma kimseyi engellemez, yalnızca satışın
     vergi numarası ile elle doğrulamasını zorunlu kılar. */
  function hgpNormFirm(x) {
    return String(x == null ? "" : x)
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[İIıi]/g, "i")
      .toLocaleLowerCase("tr");
  }

  /* Başvurudaki unvan, kayıtlı bir müşterinin unvanıyla çakışıyor mu? */
  function hgpFirmCollision(s, firm) {
    var key = hgpNormFirm(firm);
    if (!key) return false;
    var i;
    for (i = 0; i < HGP_CUSTOMERS.length; i++) {
      if (hgpNormFirm(HGP_CUSTOMERS[i].name) === key) return true;
    }
    var list = (s && s.customers) || [];
    for (i = 0; i < list.length; i++) {
      if (hgpNormFirm(list[i].name) === key) return true;
    }
    return false;
  }

  /* KALICI KURAL — KİMLİK, FİRMA ADI DEĞİL VERGİ NUMARASIDIR.
     Firma unvanı herkese açık bilgidir: faturada, ticaret sicilinde, internette
     yazar. Sipariş/talep kayıtları bu ada göre eşleştiği için, mevcut bir
     müşterinin unvanıyla başvuran biri onaylandığı anda o müşterinin TÜM sipariş
     geçmişini, kalemlerini, miktarlarını, sevkiyat ve takip bilgilerini görürdü.
     Bu yüzden: unvan çakışması varsa OTOMATİK onay YAPILMAZ, başvuru "bekliyor"
     kalır ve çağırana "cakisma" döner; satış temsilcisi vergi numarası üzerinden
     elle doğrulamalıdır. Zaten toplanan ve sağlama basamağı denetlenen vergi
     numarası kimliktir; unvan yalnızca gösterim amaçlıdır.
     Gerçek sunucu geldiğinde: siparişler sunucunun ürettiği firma kimliğini (id)
     taşımalı, ada göre eşleştirme tamamen kaldırılmalıdır. */
  function hgpDecideApplication(appId, approve, who) {
    var s = hgpGet(), a = null;
    for (var i = 0; i < s.applications.length; i++) if (s.applications[i].id === appId) a = s.applications[i];
    if (!a || a.status !== "bekliyor") return null;
    if (approve && hgpFirmCollision(s, a.firm)) {
      hgpAct(s, who, a.firm + " başvurusu kayıtlı bir müşteri unvanıyla çakışıyor — onay durduruldu, vergi numarası ile doğrulama gerekiyor", "genel");
      hgpSave(s);
      return "cakisma";
    }
    a.status = approve ? "onay" : "red";
    if (approve) {
      var initials = (a.contact || "??").split(/\s+/).map(function (w) { return (w[0] || "").toLocaleUpperCase("tr"); }).join("").slice(0, 2);
      s.accounts.push({ email: a.email, name: a.contact, company: a.firm, initials: initials });
      s.customers.push({
        id: "C-1" + String(s.seq).slice(-2), name: a.firm, city: a.taxOffice || "—",
        contact: a.contact, phone: a.mobile || a.phone, email: a.email,
        rep: "Ayşe Yılmaz", since: hgpYear(),
        history: [{ via: "WEB", t: "Web başvurusu onaylandı", n: a.msg || "Hesap aktifleştirildi.", when: hgpToday() }]
      });
      hgpAct(s, who, a.firm + " hesap başvurusunu onayladı — hesap aktif", "onay");
    } else {
      hgpAct(s, who, a.firm + " hesap başvurusunu reddetti", "genel");
    }
    hgpSave(s);
    return a.status;
  }

  /* ============================================================
     KATALOG EKLERİ — portalda eklenen ürünler ve dokümanlar
     ------------------------------------------------------------
     DÜRÜST SINIR — ARAYÜZDE DE AYNEN YAZILMALIDIR:
     buradaki her kayıt localStorage'dadır, yani YALNIZCA eklendiği tarayıcıda
     ve o cihazda durur. Satışın dizüstünde eklenen bir ürün, başka bir
     bilgisayardan siteye giren müşteride GÖRÜNMEZ. Bu katman iki şey verir:
       1) operatörün kendi tarayıcısında canlı ÖNİZLEME
          (hgpAllProducts / hgpAllDocs — ana sitede de çağrılır),
       2) hgpExportProducts / hgpExportDocs ile data.js'e yapıştırılacak kodun
          kendisi.
     Yayına çıkmanın TEK yolu (2)'deki kodu assets/js/data.js'e yapıştırıp
     commit + push etmektir. Hiçbir yerde "yayınlandı" izlenimi verilmemelidir.
     ============================================================ */

  /* Portalda eklenen kayıtların kimlikleri 9001'den başlar: data.js'teki
     1..42 aralığıyla ASLA çakışmaz ve kimliğe bakan kişi kaydın portaldan
     geldiğini anında anlar. Aynı taban dokümanlar için de kullanılır. */
  var HGP_CUSTOM_ID_BASE = 9000;

  /* Doküman kategorileri — data.js'teki HK_DOCS cat değerleriyle birebir.
     Buraya yeni bir kategori eklemek tek başına yetmez; dokumanlar.html'deki
     süzgeç ve i18n anahtarları da aynı anda güncellenmelidir. */
  var HGP_DOC_CATS = ["katalog", "teknik", "sertifika", "marka", "hukuki"];

  function hgpStr(x) { return String(x == null ? "" : x).trim(); }

  /* data.js'teki const'lar window'a YAZILMAZ; ayrıca const oldukları için,
     bu dosya bir gün data.js'ten ÖNCE yüklenirse çıplak isme dokunmak
     "geçici ölü bölge" (TDZ) yüzünden typeof ile bile istisna fırlatır.
     Bu yüzden her erişim try/catch içindedir ve her zaman bir dizi döner. */
  function hgpBaseProducts() {
    try { return (typeof HK_PRODUCTS !== "undefined" && HK_PRODUCTS) ? HK_PRODUCTS : []; }
    catch (e) { return []; }
  }
  function hgpBaseDocs() {
    try { return (typeof HK_DOCS !== "undefined" && HK_DOCS) ? HK_DOCS : []; }
    catch (e) { return []; }
  }

  /* sub, data.js'teki HK_SUBS anahtarlarından biri olmak zorundadır.
     HK_SUBS yoksa doğrulayacak listemiz de yoktur: uydurmak yerine REDDEDERİZ.
     Doğrulanmamış bir kategori katalogda sessizce kırık kart üretir. */
  function hgpKnownSub(sub) {
    if (!sub) return false;
    var subs = null;
    try { subs = (typeof HK_SUBS !== "undefined" && HK_SUBS) ? HK_SUBS : null; }
    catch (e) { subs = null; }
    if (!subs) {
      console.warn("Herkim portal: HK_SUBS okunamadı (data.js yüklenmemiş) — ürün kategorisi doğrulanamadı, kayıt YAPILMADI.");
      return false;
    }
    return Object.prototype.hasOwnProperty.call(subs, sub);
  }

  /* Üç dilli zorunlu alan: üçü de doluysa kırpılmış nesne, değilse null.
     Kural — kullanıcıya görünen her metin tr/en/ru üçünde de var olmalıdır. */
  function hgpTriple(o) {
    var v = o || {};
    var t = { tr: hgpStr(v.tr), en: hgpStr(v.en), ru: hgpStr(v.ru) };
    return (t.tr && t.en && t.ru) ? t : null;
  }

  /* Üç dilli isteğe bağlı alan (doküman açıklaması/meta): boş kalabilir ama
     alanın kendisi HK_DOCS şeklindeki gibi her zaman üç anahtarlı durur. */
  function hgpTripleOpt(o) {
    var v = o || {};
    return { tr: hgpStr(v.tr), en: hgpStr(v.en), ru: hgpStr(v.ru) };
  }

  /* tag yalnızca "yeni" (yeni ürün) ya da "one" (öne çıkan) olabilir;
     boş dize dâhil başka her değer null'a düşer — data.js'teki karşılığı budur. */
  function hgpTag(t) {
    var v = hgpStr(t);
    return (v === "yeni" || v === "one") ? v : null;
  }

  /* Sıradaki kimlik — KİMLİK ASLA GERİ KULLANILMAZ.
     Dizi uzunluğu kimlik üretmek için kullanılamaz; ama yalnızca listedeki en
     büyük kimliğe bakmak da YETMEZ: en son eklenen kayıt silinince liste
     küçülür ve bir sonraki ekleme aynı kimliği ikinci kez üretirdi. O kimlik
     çoktan dışa aktarılmış, ekranda gösterilmiş, konuşulmuş olabilir.
     Bu yüzden en yüksek kimlik depoda ayrıca saklanır (customSeq) ve sayaç
     yalnızca ileri gider. Listedeki en büyük kimlik yine de hesaba katılır:
     depo elle kurcalanmış ya da eski bir yedekten gelmiş olabilir.
     Sayacın kaydedilmesi çağıranın hgpSave(s) çağrısıyla olur. */
  function hgpNextCustomId(s, field) {
    var arr = (s && s[field]) || [], i, id;
    var max = Number(s.customSeq && s.customSeq[field]);
    if (!isFinite(max) || max < HGP_CUSTOM_ID_BASE) max = HGP_CUSTOM_ID_BASE;
    for (i = 0; i < arr.length; i++) {
      id = Number(arr[i] && arr[i].id);
      if (isFinite(id) && id > max) max = id;
    }
    max += 1;
    if (!s.customSeq) s.customSeq = {};
    s.customSeq[field] = max;
    return max;
  }

  /* GÜVENLİK — doküman yolu denetimi. Süs değil, gerçek bir denetimdir.
     Buradaki değer ANA SİTEDEKİ doküman merkezinde <a href> içine yazılır:
       · "javascript:" yazan bir operatör (ya da konsoldan depoyu kurcalayan
         biri) siteyi açan herkeste kod çalıştırabilirdi,
       · "data:" ile sahte bir belge gömülebilirdi,
       · "//baska.adres" veya "http://…" kullanıcıyı sessizce dışarı götürürdü.
     Bu yüzden yalnızca GÖRELİ dosya yolu kabul edilir. İki nokta üst üste
     içeren her değer reddedilir; bu tek kural bilinen/bilinmeyen bütün şemaları
     (javascript:, data:, vbscript:, http:, https:, …) birden kapatır — şema adı
     listesi tutmak, listede olmayan bir şema çıktığında sessizce açık kalır.
     Görünmez denetim karakterleri şemayı gizlemek için kullanılabildiğinden
     denetimden ÖNCE temizlenir.
     Boş yol GEÇERLİDİR: dosyası olmayan kart, data.js'te file alanı bulunmayan
     kayıtlar gibi "talep et" bağlantısı üretir.
     Dönüş: temizlenmiş yol, boş dize (dosyasız) ya da null (güvensiz). */
  function hgpSafeDocPath(x) {
    /* SIRA ÖNEMLİDİR — önce denetim karakterleri silinir, SONRA kırpılır.
       Ters sırada (hgpStr önce trim ediyordu) şu atlatma çalışıyordu:
       "\u0001 //evil.example.com/x.pdf". trim() denetim karakterini boşluk
       saymadığı için baştan hiçbir şey atmaz; ardından \u0001 silinince dize
       " //evil..." olur ve BAŞTA bir boşluk kalır. Konuma bakan
       indexOf("//")===0 ve charAt(0)==="/" testleri bir karakter kaydığı için
       ıskalar; tarayıcı ise href başındaki boşluğu yok sayıp adresi
       http://evil.example.com/x.pdf olarak çözer (tarayıcıda ölçüldü).
       Bu yüzden İÇERİDE kalan her boşluk da reddedilir: geçerli bir göreli
       dosya yolunda boşluk aranmaz, böylece konuma bakan hiçbir test
       kaydırılamaz. Değer PUBLIC doküman merkezinde <a href> içine girer. */
    var v = String(x == null ? "" : x).replace(/[\u0000-\u001F\u007F]/g, "").trim();
    if (!v) return "";                        // dosyasız kart — geçerli
    if (/\s/.test(v)) return null;            // yol içinde boşluk: kaydırma denemesi
    if (v.indexOf(":") !== -1) return null;   // her türlü şema denemesi
    if (v.indexOf("//") === 0) return null;   // protokolden bağımsız adres
    if (v.indexOf("\\") !== -1) return null;  // ters bölü: bazı tarayıcılar "/" sayar
    if (v.charAt(0) === "/") return null;     // kök yol — göreli değil
    if (/(^|\/)\.\.(\/|$)/.test(v)) return null; // ".." ile depo dışına tırmanma
    return v;
  }

  /* ---------------- Ürünler ----------------
     who parametresi isteğe bağlıdır ve yalnızca etkinlik akışında görünen adı
     belirler (portal-app.js USER.name geçer); sözleşmedeki çağrı hgpAddProduct(p)
     olduğu gibi çalışmaya devam eder. */

  /* Ürün ekle. p = { sub, n:{tr,en,ru}, brand, tag }
     Geçersiz girdide depoya HİÇBİR ŞEY yazılmaz ve null döner. */
  /* Satış birimi. Kimyasallar KİLO ile satılır; bir kısmı VARİL ile. Depoda
     yalnızca istisna saklanır: unit === "varil". Kilo varsayılan olduğu için
     alan hiç yazılmaz — böylece data.js'teki mevcut 42 ürün (unit alanı yok)
     kendiliğinden kilo olur ve dışa aktarımda gereksiz alan taşınmaz. */
  function hgpUnit(x) {
    return String(x == null ? "" : x).trim().toLowerCase() === "varil" ? "varil" : null;
  }
  /* Bir varilin KAÇ KİLO olduğu. Yalnızca varille satılan üründe anlamlıdır ve
     orada ZORUNLUDUR: müşteri sepette "3 varil (600 kg)" görebilsin diye tek
     kaynak budur. Pozitif tam sayı değilse null döner ve kayıt reddedilir —
     kilosu bilinmeyen bir varil, sepette yanlış kilo göstermekten iyidir. */
  var HGP_KG_PER_UNIT_MAX = 100000;
  function hgpKgPerUnit(x) {
    var n = parseInt(String(x == null ? "" : x).replace(/[^\d]/g, ""), 10);
    if (!n || n < 1 || n > HGP_KG_PER_UNIT_MAX) return null;
    return n;
  }

  function hgpAddProduct(p, who) {
    var d = p || {};
    var sub = hgpStr(d.sub);
    if (!hgpKnownSub(sub)) return null;
    var n = hgpTriple(d.n);
    if (!n) return null;
    var s = hgpGet();
    var id = hgpNextCustomId(s, "customProducts");
    var rec = {
      id: id, sub: sub, n: n,
      brand: hgpStr(d.brand),
      tag: hgpTag(d.tag),
      createdAt: hgpNow()
    };
    var unit = hgpUnit(d.unit);
    if (unit) {
      /* Varil seçildiyse kilo karşılığı ŞART: yoksa hiçbir şey yazmayız. */
      var kg = hgpKgPerUnit(d.kgPerUnit);
      if (!kg) return null;
      rec.unit = unit;
      rec.kgPerUnit = kg;
    }
    s.customProducts.unshift(rec);
    hgpAct(s, who || "Portal", "Kataloğa ürün eklendi: " + n.tr + " (#" + id + ")", "genel");
    hgpSave(s);
    return id;
  }

  /* Ürün güncelle — kısmi yama: yalnızca gönderilen alanlar değişir.
     Yamanın herhangi bir alanı geçersizse HİÇBİR alan yazılmaz (ya hep ya hiç);
     yarısı güncellenmiş bir kayıt, hiç güncellenmemişten daha tehlikelidir. */
  function hgpUpdateProduct(id, patch, who) {
    var d = patch || {}, s = hgpGet(), key = Number(id), it = null, i;
    for (i = 0; i < s.customProducts.length; i++) {
      if (Number(s.customProducts[i].id) === key) { it = s.customProducts[i]; break; }
    }
    if (!it) return false;
    var sub = it.sub, n = it.n, brand = it.brand, tag = it.tag;
    if (d.sub !== undefined) { sub = hgpStr(d.sub); if (!hgpKnownSub(sub)) return false; }
    if (d.n !== undefined) { n = hgpTriple(d.n); if (!n) return false; }
    if (d.brand !== undefined) brand = hgpStr(d.brand);
    if (d.tag !== undefined) tag = hgpTag(d.tag);
    var unit = it.unit || null, kgPer = it.kgPerUnit || null;
    if (d.unit !== undefined) unit = hgpUnit(d.unit);
    if (d.kgPerUnit !== undefined) kgPer = hgpKgPerUnit(d.kgPerUnit);
    if (unit && !kgPer) return null;   // varil ama kilosu yok → yama tümden reddedilir
    it.sub = sub; it.n = n; it.brand = brand; it.tag = tag;
    if (unit) { it.unit = unit; it.kgPerUnit = kgPer; }
    else { delete it.unit; delete it.kgPerUnit; }            // kilo = alan yok
    hgpAct(s, who || "Portal", "Katalog ürünü güncellendi: " + n.tr + " (#" + it.id + ")", "genel");
    hgpSave(s);
    return true;
  }

  function hgpDeleteProduct(id, who) {
    var s = hgpGet(), key = Number(id), i, gone;
    for (i = 0; i < s.customProducts.length; i++) {
      if (Number(s.customProducts[i].id) === key) {
        gone = s.customProducts.splice(i, 1)[0];
        hgpAct(s, who || "Portal", "Katalogdan ürün silindi: " + ((gone.n && gone.n.tr) || "—") + " (#" + gone.id + ")", "genel");
        hgpSave(s);
        return true;
      }
    }
    return false;
  }

  /* Yalnızca portalda eklenen ürünler, yeniden eskiye (kayıtlar zaten unshift
     ile eklendiği için depodaki sıra budur). Dönen dizi kopyadır: çağıran
     tarafın sıralaması/filtresi depoyu bozmaz. */
  function hgpListProducts() {
    try { return (hgpGet().customProducts || []).slice(); }
    catch (e) { return []; }
  }

  /* ---------------- data.js ürünlerini listeden çıkarma ----------------
     Portal data.js dosyasını DEĞİŞTİREMEZ (arka uç yok). Bu yüzden "çıkarma"
     şöyle çalışır: kimlik bir gizleme listesine yazılır, hgpAllProducts o
     kimlikleri eler, böylece ürün katalogda görünmez. Kalıcı olması için
     dışa aktarım panelindeki satırın data.js'ten silinmesi ve commit'lenmesi
     gerekir — tıpkı ekleme gibi.

     Yalnız data.js ürünleri için: portalda eklenen kayıt zaten hgpDeleteProduct
     ile gerçekten silinir, gizlenmesine gerek yok. */
  function hgpHiddenIds() {
    try {
      var h = (hgpPeek() || {}).hiddenProducts;
      return Object.prototype.toString.call(h) === "[object Array]" ? h.slice() : [];
    } catch (e) { return []; }
  }

  function hgpHideProduct(id, who) {
    var s = hgpGet(), key = Number(id);
    if (!isFinite(key)) return false;
    // Portal eklerinde gizleme anlamsız: onlar için gerçek silme vardır
    var i;
    for (i = 0; i < s.customProducts.length; i++) {
      if (Number(s.customProducts[i].id) === key) return false;
    }
    var base = hgpBaseProducts(), varMi = false, ad = "";
    for (i = 0; i < base.length; i++) {
      if (Number(base[i].id) === key) { varMi = true; ad = (base[i].n && base[i].n.tr) || "—"; break; }
    }
    if (!varMi) return false;
    if (!s.hiddenProducts) s.hiddenProducts = [];
    if (s.hiddenProducts.indexOf(key) !== -1) return false;
    s.hiddenProducts.push(key);
    hgpAct(s, who || "Portal", "Ürün listeden çıkarıldı: " + ad + " (#" + key + ")", "genel");
    hgpSave(s);
    return true;
  }

  function hgpUnhideProduct(id, who) {
    var s = hgpGet(), key = Number(id);
    if (!s.hiddenProducts) return false;
    var i = s.hiddenProducts.indexOf(key);
    if (i === -1) return false;
    s.hiddenProducts.splice(i, 1);
    hgpAct(s, who || "Portal", "Ürün listeye geri alındı: #" + key, "genel");
    hgpSave(s);
    return true;
  }

  /* Çıkarılan data.js ürünlerini data.js'te kalıcı yapmak için yönerge üretir.
     Kod üretmiyoruz — silinecek satırları göstermek daha güvenli: operatör
     yanlış satırı silmesin diye her ürünün kimliği ve tam adı yazılır. */
  function hgpExportHidden() {
    var ids = hgpHiddenIds();
    if (!ids.length) return "";
    var base = hgpBaseProducts(), harita = {}, i;
    for (i = 0; i < base.length; i++) harita[Number(base[i].id)] = base[i];
    var out = [
      "/* ============================================================",
      "   LİSTEDEN ÇIKARILAN ÜRÜNLER — " + hgpToday(),
      "   NEREYE: assets/js/data.js → HK_PRODUCTS dizisi.",
      "   NASIL: aşağıda kimliği yazan satırları diziden SİLİN. Silmek yerine",
      "   başına // koymayın: dizide bozuk satır kalır.",
      "   SONRA: commit edip push edin. Bunu yapmadan ürün yalnızca bu",
      "   tarayıcıda gizli kalır; başka cihazdan giren müşteri onu HÂLÂ GÖRÜR.",
      "   ============================================================ */"
    ];
    for (i = 0; i < ids.length; i++) {
      var u = harita[Number(ids[i])];
      out.push("// SİL → id: " + ids[i] + "  →  " + (u ? ((u.n && u.n.tr) || "—") + "  ·  " + (u.brand || "—") : "(data.js'te artık yok)"));
    }
    return out.join("\n");
  }

  /* data.js listesi + portal ekleri, BU sırayla.
     Ana site her render'da çağırır: asla istisna fırlatmaz, her zaman dizi
     döner, HK_PRODUCTS'ı değiştirmez (concat yeni dizi üretir). */
  function hgpAllProducts() {
    var custom = [], gizli = [];
    try { custom = (hgpPeek() || {}).customProducts || []; } catch (e) { custom = []; }
    try { gizli = hgpHiddenIds(); } catch (e) { gizli = []; }
    var taban = hgpBaseProducts();
    if (gizli.length) {
      taban = taban.filter(function (p) { return gizli.indexOf(Number(p.id)) === -1; });
    }
    return taban.concat(custom);
  }

  /* ---------------- Dokümanlar ---------------- */

  /* Doküman ekle. d = { ext, cat, file, title:{tr,en,ru}, desc:{…}, meta:{…} }
     file isteğe bağlıdır; verilirse hgpSafeDocPath denetiminden geçmek
     zorundadır. Geçersiz girdide hiçbir şey yazılmaz ve null döner. */
  function hgpAddDoc(d, who) {
    var v = d || {};
    var cat = hgpStr(v.cat);
    if (HGP_DOC_CATS.indexOf(cat) === -1) return null;
    var title = hgpTriple(v.title);
    if (!title) return null;
    var file = hgpSafeDocPath(v.file);
    if (file === null) {
      console.warn("Herkim portal: doküman yolu güvenli görülmedi (yalnızca göreli dosya yolu kabul edilir) — kayıt YAPILMADI.");
      return null;
    }
    /* Uzantı Türkçe metin değil dosya uzantısıdır; bu yüzden yerel ayara bağlı
       olmayan büyütme kullanılır ("tif" → "TIF", "TİF" değil). */
    var ext = hgpStr(v.ext).toUpperCase() || "PDF";
    var s = hgpGet();
    var id = hgpNextCustomId(s, "customDocs");
    s.customDocs.unshift({
      id: id, ext: ext, cat: cat, file: file,
      title: title, desc: hgpTripleOpt(v.desc), meta: hgpTripleOpt(v.meta),
      createdAt: hgpNow()
    });
    hgpAct(s, who || "Portal", "Doküman merkezine kayıt eklendi: " + title.tr + " (#" + id + ")", "genel");
    hgpSave(s);
    return id;
  }

  function hgpDeleteDoc(id, who) {
    var s = hgpGet(), key = Number(id), i, gone;
    for (i = 0; i < s.customDocs.length; i++) {
      if (Number(s.customDocs[i].id) === key) {
        gone = s.customDocs.splice(i, 1)[0];
        hgpAct(s, who || "Portal", "Doküman merkezinden kayıt silindi: " + ((gone.title && gone.title.tr) || "—") + " (#" + gone.id + ")", "genel");
        hgpSave(s);
        return true;
      }
    }
    return false;
  }

  function hgpListDocs() {
    try { return (hgpGet().customDocs || []).slice(); }
    catch (e) { return []; }
  }

  function hgpAllDocs() {
    var custom = [];
    try { custom = (hgpPeek() || {}).customDocs || []; } catch (e) { custom = []; }
    return hgpBaseDocs().concat(custom);
  }

  /* ---------------- data.js'e yapıştırılacak kod ----------------
     Üretilen metin OLDUĞU GİBİ yapıştırılabilir olmak zorundadır.
     Dize kaçışlarını elle yapmıyoruz: JSON.stringify tırnağı, ters bölüyü ve
     satır sonlarını kaçırır ve ürettiği JSON dize sözdizimi, JavaScript dize
     sözdiziminin alt kümesidir — yani çıktı geçerli JS'tir. */
  function hgpQ(x) { return JSON.stringify(String(x == null ? "" : x)); }

  /* Sütun hizası için doldurma; en az bir boşluk hep kalır ki uzun değerlerde
     alanlar birbirine yapışmasın. */
  function hgpPad(s, n) {
    var v = String(s);
    while (v.length < n - 1) v += " ";
    return v + " ";
  }

  /* data.js'teki en büyük kimlik — dışa aktarımda numaralandırma buradan devam
     eder, böylece yapıştırılan satırlar mevcut listeyle çakışmaz. */
  function hgpMaxBaseId(list) {
    var max = 0, i, id;
    for (i = 0; i < list.length; i++) {
      id = Number(list[i] && list[i].id);
      if (isFinite(id) && id > max) max = id;
    }
    return max;
  }

  /* Portal ürünlerini HK_PRODUCTS satırı biçiminde dışa aktar.
     Sıra eskiden yeniye çevrilir ki kimlikler eklenme sırasıyla artsın —
     data.js'teki dizilim de artan kimliktir. Hiç portal ürünü yoksa "" döner. */
  function hgpExportProducts() {
    var list = hgpListProducts().reverse();
    if (!list.length) return "";
    var start = hgpMaxBaseId(hgpBaseProducts());
    var out = [
      "/* ============================================================",
      "   PORTALDA EKLENEN ÜRÜNLER — " + hgpToday(),
      "   NEREYE: assets/js/data.js → HK_PRODUCTS dizisi.",
      "   NASIL: dizinin şu anki SON satırının sonuna bir virgül ekleyin, sonra",
      "   aşağıdaki satırları kapanış \"];\" işaretinden hemen önce yapıştırın.",
      "   Kimlikler mevcut en büyük id (" + start + ") üzerinden yeniden numaralandırıldı;",
      "   portaldaki 9000'li kimlikler yalnızca portale özeldir, buraya taşınmaz.",
      "   SONRA: değişikliği commit edip push ETMEDEN bu ürünler yayındaki siteye",
      "   ULAŞMAZ. Portaldaki kayıt yalnızca eklendiği tarayıcıda görünür.",
      "   YAPIŞTIRDIKTAN SONRA: bu kayıtları portaldaki listeden SİLİN. Silmezseniz",
      "   bir sonraki dışa aktarım aynı ürünleri YENİDEN üretir ve data.js'e ikinci",
      "   kez yapıştırılırsa katalogda çift kayıt oluşur (id'ler farklı olur, ad aynı).",
      "   AYRICA: ürün kataloğu PDF'i data.js ile aynı listeyi taşır; ikisi",
      "   birlikte güncellenmelidir.",
      "   ============================================================ */"
    ];
    var i, p, line;
    for (i = 0; i < list.length; i++) {
      p = list[i];
      line = "  { " + hgpPad("id: " + (start + i + 1) + ",", 8) +
             hgpPad("sub: " + hgpQ(p.sub) + ",", 16) +
             "n: { tr: " + hgpQ(p.n && p.n.tr) + ", en: " + hgpQ(p.n && p.n.en) + ", ru: " + hgpQ(p.n && p.n.ru) + " }, " +
             "brand: " + hgpQ(p.brand) + ", " +
             "tag: " + (p.tag ? hgpQ(p.tag) : "null") +
             /* Kilo varsayılan olduğu için unit YALNIZCA varil ürünlerde yazılır;
                data.js'teki mevcut satırlarla aynı biçimi korur. */
             (p.unit === "varil" ? ", unit: " + hgpQ("varil") + ", kgPerUnit: " + p.kgPerUnit : "") + " }";
      out.push(line + (i < list.length - 1 ? "," : ""));
    }
    return out.join("\n") + "\n";
  }

  /* Portal dokümanlarını HK_DOCS satırı biçiminde dışa aktar.
     HK_DOCS kayıtlarında id alanı YOKTUR; portaldeki kimlik bilerek yazılmaz.
     file alanı, data.js'teki dosyasız kartlarda olduğu gibi boşsa hiç yazılmaz. */
  function hgpExportDocs() {
    var list = hgpListDocs().reverse();
    if (!list.length) return "";
    var out = [
      "/* ============================================================",
      "   PORTALDA EKLENEN DOKÜMANLAR — " + hgpToday(),
      "   NEREYE: assets/js/data.js → HK_DOCS dizisi.",
      "   NASIL: dizinin şu anki SON satırının sonuna bir virgül ekleyin, sonra",
      "   aşağıdaki satırları kapanış \"];\" işaretinden hemen önce yapıştırın.",
      "   HK_DOCS kayıtlarında id alanı yoktur; portal kimlikleri aktarılmaz.",
      "   file alanı olan kart indirme bağlantısı, olmayan kart \"talep et\"",
      "   bağlantısı üretir — dosyanın gerçekten assets/docs/ altında ve depoda",
      "   olduğundan emin olun, yoksa bağlantı 404 verir.",
      "   SONRA: değişikliği commit edip push ETMEDEN bu dokümanlar yayındaki",
      "   YAPIŞTIRDIKTAN SONRA: bu kayıtları portaldaki listeden SİLİN. Silmezseniz",
      "   bir sonraki dışa aktarım aynı dokümanları YENİDEN üretir ve ikinci kez",
      "   yapıştırılırsa doküman merkezinde çift kart oluşur.",
      "   siteye ULAŞMAZ. Portaldaki kayıt yalnızca eklendiği tarayıcıda görünür.",
      "   ============================================================ */"
    ];
    var i, d, line;
    for (i = 0; i < list.length; i++) {
      d = list[i];
      line = "  { " + hgpPad("ext: " + hgpQ(d.ext) + ",", 12) +
             hgpPad("cat: " + hgpQ(d.cat) + ",", 18) +
             (d.file ? "file: " + hgpQ(d.file) + ", " : "") +
             "title: { tr: " + hgpQ(d.title && d.title.tr) + ", en: " + hgpQ(d.title && d.title.en) + ", ru: " + hgpQ(d.title && d.title.ru) + " }, " +
             "desc: { tr: " + hgpQ(d.desc && d.desc.tr) + ", en: " + hgpQ(d.desc && d.desc.en) + ", ru: " + hgpQ(d.desc && d.desc.ru) + " }, " +
             "meta: { tr: " + hgpQ(d.meta && d.meta.tr) + ", en: " + hgpQ(d.meta && d.meta.en) + ", ru: " + hgpQ(d.meta && d.meta.ru) + " } }";
      out.push(line + (i < list.length - 1 ? "," : ""));
    }
    return out.join("\n") + "\n";
  }

  /* Demoyu sıfırla.
     DİKKAT: bu, portalda eklenen ürün ve dokümanları da siler — henüz data.js'e
     yapıştırılmamış kayıtlar geri getirilemez. Sıfırlamadan önce dışa aktarın. */
  function hgpReset() { localStorage.removeItem(HGP_KEY); }

  /* ---------------- Gerçek bildirim (Web3Forms) ----------------
     HK_COMPANY.web3forms anahtarı girilince site olayları (iletişim
     formu, teklif, sipariş, talep) şirket e-postasına ANINDA düşer.
     Anahtar boşken false döner; site eski akışıyla çalışmaya devam
     eder — hiçbir akış bildirime bağımlı DEĞİLDİR (yedekli tasarım).

     UYARI — DÖNÜŞ DEĞERİNİ YOK SAYMAYIN: false, tarayıcıdan HİÇBİR ŞEY
     çıkmadığı anlamına gelir. Çağıran taraf false gelirse kullanıcıya
     "iletildi" demek yerine telefon/e-posta gibi alternatif kanalı
     göstermelidir; aksi halde talep kimseye ulaşmadan kaybolur. */
  /* ------------------------------------------------------------
     Bildirim yardımcıları

     hgpClean: kullanıcı metnini e-posta gövdesine koymadan önce
     kontrol karakterlerinden arındırır. Satır sonu ile sahte başlık
     eklemeyi (Bcc:, X-...) etkisiz kılar ve aşırı uzunluğu keser.

     hgpRateOk: aynı tarayıcıdan kısa sürede tekrar gönderimi keser.
     DÜRÜST SINIR — bu bir güvenlik kontrolü DEĞİLDİR: localStorage
     temizlenerek ya da doğrudan api.web3forms.com'a POST atılarak
     aşılır (anahtar zaten herkese açık). Amacı yalnızca kazara çift
     gönderimi ve naif bot trafiğini engellemektir. Kotanın ASIL
     koruması Web3Forms panelindeki captcha + "Allowed Domains"
     kısıtlamasıdır; anahtar girilmeden önce ikisi de açılmalıdır.
     ------------------------------------------------------------ */
  function hgpClean(v, max) {
    var out = String(v == null ? "" : v);
    out = out.replace(/[\u0000-\u001F\u007F]+/g, " ");
    out = out.replace(/\s{2,}/g, " ");
    return out.trim().slice(0, max || 400);
  }

  var HGP_RL_KEY = "hg_rl_v1";
  function hgpRateOk(kova, limit, pencereDk) {
    try {
      var now = Date.now(), span = (pencereDk || 10) * 60000, hepsi = {};
      try { hepsi = JSON.parse(localStorage.getItem(HGP_RL_KEY) || "{}") || {}; } catch (e) { hepsi = {}; }
      var vurus = (Array.isArray(hepsi[kova]) ? hepsi[kova] : [])
        .filter(function (t) { return typeof t === "number" && now - t < span; });
      hepsi[kova] = vurus;
      if (vurus.length >= (limit || 3)) {
        localStorage.setItem(HGP_RL_KEY, JSON.stringify(hepsi));
        return false;
      }
      vurus.push(now);
      localStorage.setItem(HGP_RL_KEY, JSON.stringify(hepsi));
      return true;
    } catch (e) { return true; }   // depo kapalıysa akışı engelleme
  }

  /* ============================================================
     hCAPTCHA — görünmez doğrulama
     Web3Forms panelinde captcha açıkken, o erişim anahtarıyla yapılan HER
     gönderim bir captcha jetonu ister. Sitede gönderim yapan tek bir form
     yok (iletişim formu, teklif sepeti, hesap başvurusu, e-bülten hepsi
     hgNotify'dan geçiyor), bu yüzden her birine ayrı kutu koymak yerine
     TEK bir görünmez bileşen kuruluyor ve jetonu hgNotify kendisi alıyor.

     Betik ancak ilk gönderimde indirilir: sayfayı açan herkese hCaptcha
     yüklemek hem gereksiz hem de gizlilik açısından yanlış olurdu.

     Başarısız olursa jeton döndürmez; hgNotify de false döner ve sitedeki
     mevcut yedek kutu (WhatsApp / telefon / e-posta) açılır. Sessizce
     "gönderildi" demek en kötü sonuç olurdu.
     ============================================================ */
  var HGP_CAPTCHA_ID = null;
  var hgpCaptchaSozu = null;

  function hgpCaptchaAnahtari() {
    try { return (HK_COMPANY && HK_COMPANY.hcaptchaSitekey) || ""; }
    catch (e) { return ""; }
  }

  /* Betiği bir kez yükler ve görünmez bileşeni bir kez çizer. */
  function hgpCaptchaHazirla() {
    if (hgpCaptchaSozu) return hgpCaptchaSozu;
    var anahtar = hgpCaptchaAnahtari();
    if (!anahtar) return (hgpCaptchaSozu = Promise.resolve(false));

    hgpCaptchaSozu = new Promise(function (coz) {
      var bitti = false;
      var kapat = function (sonuc) { if (!bitti) { bitti = true; coz(sonuc); } };

      /* Ağ takılırsa gönderim sonsuza kadar beklemesin. */
      var sure = setTimeout(function () { kapat(false); }, 12000);

      window.hgpCaptchaYuklendi = function () {
        try {
          var kutu = document.createElement("div");
          kutu.id = "hg-captcha";
          kutu.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden";
          document.body.appendChild(kutu);
          HGP_CAPTCHA_ID = window.hcaptcha.render(kutu, {
            sitekey: anahtar,
            size: "invisible"
          });
          clearTimeout(sure); kapat(true);
        } catch (e) { clearTimeout(sure); kapat(false); }
      };

      var b = document.createElement("script");
      b.src = "https://js.hcaptcha.com/1/api.js?render=explicit&onload=hgpCaptchaYuklendi";
      b.async = true; b.defer = true;
      b.onerror = function () { clearTimeout(sure); kapat(false); };
      document.head.appendChild(b);
    });
    return hgpCaptchaSozu;
  }

  /* Jeton üretir. Captcha yapılandırılmamışsa null döner (gönderim
     captcha'sız denenir; panel kapalıysa zaten sorun olmaz). */
  /* Son denemede captcha neden başarısız oldu:
       ""            sorun yok
       "kapatildi"   kullanıcı doğrulama penceresini kapattı / bitiremedi
       "yuklenemedi" betik inmedi ya da bileşen çizilemedi
     Arayüz buna göre farklı mesaj gösterir — "bağlantı sorunu" demek,
     bulmacayı kapatan kullanıcıyı yanlış yönlendirirdi. */
  var HGP_CAPTCHA_HATA = "";

  function hgpCaptchaJetonu() {
    HGP_CAPTCHA_HATA = "";
    if (!hgpCaptchaAnahtari()) return Promise.resolve(null);
    return hgpCaptchaHazirla().then(function (hazir) {
      if (!hazir || !window.hcaptcha || HGP_CAPTCHA_ID === null) {
        HGP_CAPTCHA_HATA = "yuklenemedi";
        return null;
      }
      return window.hcaptcha.execute(HGP_CAPTCHA_ID, { async: true })
        .then(function (c) {
          var j = (c && c.response) || null;
          if (!j) HGP_CAPTCHA_HATA = "kapatildi";
          return j;
        })
        .catch(function () {
          /* hCaptcha pencereyi kapatınca da, süre dolunca da buraya düşer.
             İkisi de kullanıcının doğrulamayı tamamlamadığı anlamına gelir. */
          HGP_CAPTCHA_HATA = "kapatildi";
          /* Bir sonraki denemede taze bir istek yapılabilsin diye sıfırla. */
          try { window.hcaptcha.reset(HGP_CAPTCHA_ID); } catch (e) { /* önemsiz */ }
          return null;
        });
    }).catch(function () { HGP_CAPTCHA_HATA = "yuklenemedi"; return null; });
  }

  function hgNotify(subject, lines, senderName, senderEmail) {
    try {
      var key = (typeof HK_COMPANY !== "undefined" && HK_COMPANY.web3forms) || "";
      if (!key) {
        console.warn("Herkim: bildirim GÖNDERİLMEDİ — HK_COMPANY.web3forms anahtarı boş (assets/js/data.js). Bu talep şirket e-postasına DÜŞMEDİ; site akışı etkilenmez.");
        return Promise.resolve(false);
      }
      var body = {
        access_key: key,
        subject: hgpClean(subject, 120),
        from_name: "Herkim Web Sitesi",
        name: hgpClean(senderName || "Web ziyaretçisi", 80),
        message: (lines || []).map(function (l) { return hgpClean(l, 400); }).join("\n")
      };
      var gonderen = hgpClean(senderEmail, 80);
      if (gonderen && gonderen.indexOf("@") > 0 && !/[\s,;<>]/.test(gonderen)) body.email = gonderen;
      /* İkinci kutuya kopya: talep hem ticari (sales@) hem genel (info@)
         kutuya düşsün. Adres data.js -> HK_COMPANY.notifyCc alanından gelir;
         boş bırakılırsa kopya gönderilmez. */
      var kopya = (typeof HK_COMPANY !== "undefined" && HK_COMPANY.notifyCc) || "";
      if (kopya && kopya.indexOf("@") > 0) body.cc = [kopya];

      /* Captcha jetonu (varsa) gövdeye eklenir. Panelde captcha açıksa
         bu alan olmadan Web3Forms gönderimi REDDEDER. */
      return hgpCaptchaJetonu().then(function (jeton) {
        if (jeton) body["h-captcha-response"] = jeton;
        return fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(body)
        }).then(function (r) { return r.json(); })
          .then(function (j) {
            if (!(j && j.success)) {
              console.warn("Herkim: bildirim gönderilemedi —", (j && j.message) || "bilinmeyen hata");
            }
            return !!(j && j.success);
          })
          .catch(function () { return false; });
      });
    } catch (e) { return Promise.resolve(false); }
  }

  /* ============================================================
     GENEL API — bu dosyanın dışarıya açtığı TEK yüzey.
     site-auth.js, portal-app.js ve main.js yalnızca buradaki isimleri kullanır.
     Yeni bir sabit/fonksiyon paylaşılacaksa buraya eklenmelidir; listede
     olmayan her şey dosyaya özeldir ve serbestçe değiştirilebilir.
     ============================================================ */
  window.HGP_KEY = HGP_KEY;
  window.HGP_QUEUE = HGP_QUEUE;
  window.HGP_PREFILL = HGP_PREFILL;

  /* Oturum sabitleri — yukarıdaki uyarıyı okuyun: bunlar DEMO içindir. */
  window.HGP_SESSION_KEY = HGP_SESSION_KEY;
  window.hgpSesRead = hgpSesRead;
  window.hgpSesWrite = hgpSesWrite;
  window.hgpSesClear = hgpSesClear;
  window.hgpSesPersistent = hgpSesPersistent;
  window.HGP_LOCK_KEY = HGP_LOCK_KEY;
  window.HGP_LAST_LOGIN = HGP_LAST_LOGIN;
  window.HGP_DEMO_PASS = HGP_DEMO_PASS;
  window.HGP_IDLE_MS = HGP_IDLE_MS;
  window.HGP_LOCK_MS = HGP_LOCK_MS;
  window.HGP_MAX_FAILS = HGP_MAX_FAILS;

  window.HGP_STEPS = HGP_STEPS;
  window.HGP_STEP_CLASS = HGP_STEP_CLASS;
  window.HGP_USERS = HGP_USERS;
  window.HGP_CUSTOMERS = HGP_CUSTOMERS;

  window.hgpSeed = hgpSeed;
  window.hgpSeedApps = hgpSeedApps;
  window.hgpGet = hgpGet;
  window.hgpSave = hgpSave;
  window.hgpNow = hgpNow;
  window.hgpToday = hgpToday;
  window.hgpAct = hgpAct;
  window.hgpAddOrder = hgpAddOrder;
  window.hgpAdvance = hgpAdvance;
  window.hgpAddRequest = hgpAddRequest;
  window.hgpReply = hgpReply;
  window.hgpAddNote = hgpAddNote;
  window.hgpValidVKN = hgpValidVKN;
  window.hgpValidTCKN = hgpValidTCKN;
  window.hgpValidTaxId = hgpValidTaxId;
  window.hgpAddApplication = hgpAddApplication;
  window.hgpDecideApplication = hgpDecideApplication;

  /* Katalog ekleri. hgpAllProducts / hgpAllDocs ANA SİTEDE de çağrılır;
     diğerleri yalnızca portalde kullanılır. hgpExport* çıktısı data.js'e
     yapıştırılacak koddur — yayına çıkmanın tek yolu odur. */
  window.HGP_CUSTOM_ID_BASE = HGP_CUSTOM_ID_BASE;
  window.HGP_DOC_CATS = HGP_DOC_CATS;
  window.hgpAddProduct = hgpAddProduct;
  window.hgpUpdateProduct = hgpUpdateProduct;
  window.hgpDeleteProduct = hgpDeleteProduct;
  window.hgpListProducts = hgpListProducts;
  window.hgpHiddenIds = hgpHiddenIds;
  window.hgpHideProduct = hgpHideProduct;
  window.hgpUnhideProduct = hgpUnhideProduct;
  window.hgpExportHidden = hgpExportHidden;
  window.hgpAllProducts = hgpAllProducts;
  window.hgpAddDoc = hgpAddDoc;
  window.hgpDeleteDoc = hgpDeleteDoc;
  window.hgpListDocs = hgpListDocs;
  window.hgpAllDocs = hgpAllDocs;
  window.hgpSafeDocPath = hgpSafeDocPath;
  window.hgpExportProducts = hgpExportProducts;
  window.hgpExportDocs = hgpExportDocs;

  window.hgpReset = hgpReset;
  /* Arayüz, captcha'nın neden başarısız olduğunu buradan öğrenir. */
  window.hgpCaptchaHata = function () { return HGP_CAPTCHA_HATA; };
  window.hgpClean = hgpClean;
  window.hgpRateOk = hgpRateOk;
  window.hgNotify = hgNotify;
})();
