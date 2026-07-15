/* ============================================================
   HERKİM PORTAL — Paylaşılan Veri Deposu (tek akış)
   Tüm roller (müşteri, satış, depo, yönetim) AYNI depoyu okur/yazar:
   müşteri sipariş verir → satış onaylar → depo ilerletir → yönetim izler.
   Demo: localStorage. Gerçek kurulumda bu katman Logo Tiger + CRM API'sidir.
   ============================================================ */

var HGP_KEY = "hg_store_v1";
var HGP_QUEUE = "hg_landing_queue";   // ana sitedeki formdan düşen talepler
var HGP_PREFILL = "hg_order_prefill"; // teklif sepetinden sipariş aktarımı

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
      { via: "📞", t: "Telefon — sevkiyat planı",        n: "Temmuz sevkiyatları ve yeni sezon ihtiyaçları konuşuldu.", when: "09.07.2026" },
      { via: "💬", t: "WhatsApp — miktar teyidi",        n: "HG-2026-1041 miktar artışı teyit edildi.",                 when: "02.07.2026" },
      { via: "🏭", t: "Saha ziyareti — teknik servis",   n: "Finisaj hattında uygulama optimizasyonu yapıldı.",         when: "24.06.2026" }
    ]
  },
  {
    id: "C-002", name: "Anadolu Tekstil Ltd.", city: "Bursa",
    contact: "Zeynep Arslan", phone: "+90 533 000 33 44", email: "satinalma@anadolutekstil.com",
    rep: "Ayşe Yılmaz", since: 2017,
    history: [
      { via: "✉️", t: "E-posta — fiyat listesi",         n: "Temmuz fiyat listesi iletildi.",                            when: "01.07.2026" },
      { via: "📞", t: "Telefon — numune geri bildirimi", n: "PB-70 numunesi beğenildi; deneme siparişi planlanıyor.",    when: "27.06.2026" }
    ]
  },
  {
    id: "C-003", name: "Mega Boya San. A.Ş.", city: "Gebze / Kocaeli",
    contact: "Ali Vural", phone: "+90 535 000 55 66", email: "satinalma@megaboya.com.tr",
    rep: "Ayşe Yılmaz", since: 2020,
    history: [
      { via: "🏭", t: "Saha ziyareti — yeni hat",        n: "Yeni üretim hattı için binder ihtiyacı görüşüldü.",          when: "18.06.2026" }
    ]
  }
];

/* ---------------- Depo API ---------------- */
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
      { when: "12.07.2026 10:20", who: "Üretim", what: "HG-2026-1042 üretime alındı", type: "uretim" },
      { when: "11.07.2026 09:12", who: "Ayşe Yılmaz", what: "HG-2026-1038 siparişini onayladı", type: "onay" },
      { when: "10.07.2026 14:20", who: "Ayşe Yılmaz", what: "TL-2026-0312 talebini yanıtladı", type: "talep" }
    ]
  };
}

function hgpGet() {
  var s = null;
  try { s = JSON.parse(localStorage.getItem(HGP_KEY)); } catch (e) {}
  if (!s || !s.orders) { s = hgpSeed(); hgpSave(s); }
  // Ana sitedeki iletişim formundan düşen talepleri içeri al (Landing → CRM)
  try {
    var q = JSON.parse(localStorage.getItem(HGP_QUEUE)) || [];
    if (q.length) {
      q.forEach(function (r) {
        s.seq += 1;
        s.requests.unshift({
          id: "TL-2026-0" + s.seq, customer: r.firm || "Web ziyaretçisi",
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

function hgpSave(s) { localStorage.setItem(HGP_KEY, JSON.stringify(s)); }

function hgpNow() {
  var d = new Date();
  function p(x) { return (x < 10 ? "0" : "") + x; }
  return p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear() + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}
function hgpToday() { return hgpNow().split(" ")[0]; }

function hgpAct(s, who, what, type) {
  s.activities.unshift({ when: hgpNow(), who: who, what: what, type: type || "genel" });
  if (s.activities.length > 60) s.activities.length = 60;
}

/* Sipariş oluştur (müşteri) → Onay Bekliyor. note: web sepetinden gelen sipariş notu */
function hgpAddOrder(customer, items, who, note) {
  var s = hgpGet();
  s.seq += 1;
  var id = "HG-2026-" + s.seq;
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
  var id = "TL-2026-0" + s.seq;
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

/* Demoyu sıfırla */
function hgpReset() { localStorage.removeItem(HGP_KEY); }
