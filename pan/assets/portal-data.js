/* ============================================================
   PAN HOLDING — Sipariş/Takip Portalı DEMO verisi
   Gerçek sistemde bu veriler Logo Tiger (sipariş/stok) ve
   Akıllı CRM'den API ile beslenir. Burada örnek veridir.
   ============================================================ */

var PAN_USERS = {
  musteri: {
    role: "musteri",
    name: "Mehmet Kaya",
    company: "Derim Deri San. A.Ş.",
    initials: "MK",
    rep: "Ayşe Yılmaz"           // atanmış satış temsilcisi
  },
  satisci: {
    role: "satisci",
    name: "Ayşe Yılmaz",
    company: "Pan Holding — Satış",
    initials: "AY",
    rep: null
  }
};

/* Sipariş durum akışı (sıralı) */
var PAN_STEPS = ["Sipariş Alındı", "Üretimde", "Kalite Kontrol", "Sevkiyatta", "Teslim Edildi"];
var PAN_STEP_CLASS = ["alindi", "uretim", "kalite", "sevk", "teslim"];

/* step: 0-4 → PAN_STEPS indeksi (kaçıncı adımda) */
var PAN_ORDERS = [
  {
    id: "PH-2026-0147", customer: "Derim Deri San. A.Ş.", step: 3,
    date: "02.07.2026", eta: "16.07.2026",
    items: [
      { n: "Su Bazlı Top Coat TC-210", q: "2.400 kg" },
      { n: "Matlaştırıcı Ajan M-45", q: "400 kg" }
    ],
    carrier: "Pan Lojistik · 34 PAN 512", track: "SVK-88214",
    timeline: ["02.07.2026 09:41", "04.07.2026 08:15", "11.07.2026 14:02", "14.07.2026 07:30", null]
  },
  {
    id: "PH-2026-0146", customer: "Derim Deri San. A.Ş.", step: 1,
    date: "28.06.2026", eta: "21.07.2026",
    items: [{ n: "Altkat Binder AL-40", q: "1.200 kg" }],
    carrier: "—", track: "—",
    timeline: ["28.06.2026 11:20", "01.07.2026 09:00", null, null, null]
  },
  {
    id: "PH-2026-0141", customer: "Derim Deri San. A.Ş.", step: 4,
    date: "12.06.2026", eta: "26.06.2026",
    items: [
      { n: "Anilin Boya Serisi (6 renk)", q: "800 kg" },
      { n: "Penetratör P-12", q: "240 kg" }
    ],
    carrier: "Pan Lojistik · 34 PAN 507", track: "SVK-87952",
    timeline: ["12.06.2026 10:05", "14.06.2026 08:30", "20.06.2026 16:44", "24.06.2026 07:10", "26.06.2026 11:55"]
  },
  {
    id: "PH-2026-0139", customer: "Anadolu Tekstil Ltd.", step: 2,
    date: "25.06.2026", eta: "18.07.2026",
    items: [{ n: "Pigment Baskı Binderi PB-70", q: "3.000 kg" }],
    carrier: "—", track: "—",
    timeline: ["25.06.2026 15:12", "27.06.2026 08:00", "13.07.2026 10:20", null, null]
  },
  {
    id: "PH-2026-0134", customer: "Mega Boya San. A.Ş.", step: 4,
    date: "05.06.2026", eta: "19.06.2026",
    items: [{ n: "Stiren-Akrilik Binder SA-300", q: "5.000 kg" }],
    carrier: "Anlaşmalı nakliye", track: "SVK-87710",
    timeline: ["05.06.2026 09:00", "06.06.2026 07:45", "12.06.2026 13:30", "16.06.2026 06:50", "19.06.2026 10:15"]
  },
  {
    id: "PH-2026-0148", customer: "Anadolu Tekstil Ltd.", step: 0,
    date: "13.07.2026", eta: "05.08.2026",
    items: [{ n: "Silikon Yumuşatıcı SY-20", q: "1.500 kg" }],
    carrier: "—", track: "—",
    timeline: ["13.07.2026 16:40", null, null, null, null]
  }
];

/* Talepler — müşteri tarafından açılır, CRM'e düşer */
var PAN_REQUESTS_SEED = [
  {
    id: "TL-2026-0312", customer: "Derim Deri San. A.Ş.",
    subject: "Numune talebi — mat finisaj lak",
    detail: "Yeni koleksiyon için mat finisaj lak numunesi (5 kg) rica ediyoruz.",
    date: "10.07.2026", status: "yanit",
    reply: { by: "Ayşe Yılmaz", when: "10.07.2026 14:20", text: "Numuneniz hazırlanıyor; perşembe kargoda olacak. CRM kaydı: #CRM-8841" }
  },
  {
    id: "TL-2026-0305", customer: "Derim Deri San. A.Ş.",
    subject: "Vade güncelleme talebi",
    detail: "Temmuz sevkiyatları için vade koşullarını görüşmek istiyoruz.",
    date: "06.07.2026", status: "acik",
    reply: null
  },
  {
    id: "TL-2026-0298", customer: "Anadolu Tekstil Ltd.",
    subject: "Teknik destek — baskı binderi viskozite",
    detail: "PB-70 ile baskı hattında viskozite dalgalanması yaşıyoruz, saha desteği rica ederiz.",
    date: "03.07.2026", status: "yanit",
    reply: { by: "Teknik Servis", when: "04.07.2026 09:10", text: "Salı günü teknik ekibimiz tesisinizde olacak. CRM kaydı: #CRM-8802" }
  }
];

/* Görüşme geçmişi (CRM entegrasyonu vurgusu) */
var PAN_HISTORY = [
  { via: "📞", title: "Telefon görüşmesi — Ayşe Yılmaz", note: "Temmuz sevkiyat planı ve yeni sezon ihtiyaçları konuşuldu.", when: "09.07.2026" },
  { via: "💬", title: "WhatsApp — sipariş teyidi", note: "PH-2026-0147 miktar artışı teyit edildi (2.000 → 2.400 kg).", when: "02.07.2026" },
  { via: "✉️", title: "E-posta — fiyat listesi", note: "Güncel Temmuz fiyat listesi iletildi.", when: "01.07.2026" },
  { via: "🏭", title: "Saha ziyareti — teknik servis", note: "Finisaj hattında uygulama optimizasyonu yapıldı; ziyaret notu CRM'e işlendi.", when: "24.06.2026" }
];

/* Bildirimler */
var PAN_NOTIFS = [
  { t: "Siparişiniz sevkiyata çıktı", s: "PH-2026-0147 · Tahmini teslim 16.07.2026", when: "bugün 07:30" },
  { t: "Talebiniz yanıtlandı", s: "TL-2026-0312 · Numune perşembe kargoda", when: "dün 14:20" },
  { t: "Üretim başladı", s: "PH-2026-0146 · Altkat Binder AL-40", when: "01.07.2026" }
];
