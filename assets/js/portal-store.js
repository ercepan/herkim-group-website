/* ============================================================
   HERKİM PORTAL — Paylaşılan Veri Deposu (tek akış)
   Tüm roller (müşteri, satış, depo, yönetim) AYNI depoyu okur/yazar:
   müşteri sipariş verir → satış onaylar → depo ilerletir → yönetim izler.
   Demo: localStorage. Gerçek kurulumda bu katman Logo Tiger + CRM API'sidir.

   Dosya tamamı IIFE içindedir; dışarıya açılan isimler EN ALTTAKİ tek blokta
   window'a yazılır. Sebep: sayfadaki başka bir script'in hgpGet/hgNotify gibi
   isimleri sessizce ezmesini engellemek ve bu katmanın genel API'sini tek
   bakışta okunur kılmak. Yeni bir şey dışarıya açılacaksa o bloğa eklenir.
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
  var HGP_DEMO_PASS = "demo1234";
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
      customers: []   // onaylı başvurulardan doğan CRM kartları
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
       2) eski sürüm depoya applications/accounts/customers alanlarını ekler (taşıma),
       3) ana sitedeki formdan biriken talep kuyruğunu (HGP_QUEUE) içeri alıp
          kuyruğu SİLER ve depoyu kaydeder.
     Yani salt görüntüleme amacıyla çağrıldığında bile localStorage değişebilir.
     Yapı riskli olduğu için bilinçli olarak bölünmemiştir; değiştirmeden önce
     tüm çağrı yerlerini (portal-app.js, site-auth.js, main.js) gözden geçirin. */
  function hgpGet() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(HGP_KEY)); } catch (e) {}
    if (!s || !s.orders) { s = hgpSeed(); hgpSave(s); }
    // Eski depo sürümlerine hesap alanlarını ekle (taşıma)
    if (!s.applications) { s.applications = hgpSeedApps(); s.accounts = []; s.customers = []; hgpSave(s); }
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

  /* Demoyu sıfırla */
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
  function hgNotify(subject, lines, senderName, senderEmail) {
    try {
      var key = (typeof HK_COMPANY !== "undefined" && HK_COMPANY.web3forms) || "";
      if (!key) {
        console.warn("Herkim: bildirim GÖNDERİLMEDİ — HK_COMPANY.web3forms anahtarı boş (assets/js/data.js). Bu talep şirket e-postasına DÜŞMEDİ; site akışı etkilenmez.");
        return Promise.resolve(false);
      }
      var body = {
        access_key: key,
        subject: subject,
        from_name: "Herkim Web Sitesi",
        name: senderName || "Web ziyaretçisi",
        message: (lines || []).join("\n")
      };
      if (senderEmail && senderEmail.indexOf("@") > 0) body.email = senderEmail;
      return fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); })
        .then(function (j) { return !!(j && j.success); })
        .catch(function () { return false; });
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
  window.hgpReset = hgpReset;
  window.hgNotify = hgNotify;
})();
