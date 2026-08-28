/* ============================================================
   HERKİM KİMYA — Etkileşim Katmanı
   Döviz kuru, dil (TR/EN/RU), teklif sepeti, arama, filtreler.
   Dinamik içerik güvenli DOM API'leri (createElement/textContent) ile üretilir.
   ------------------------------------------------------------
   İÇİNDEKİLER  (satır no'lar yaklaşıktır; bölüm başlıkları "==== n)" ile aranabilir)
     —)  Yardımcılar, kısayollar ve türetilen sabitler ......... satır  36
         Katalog kaynağı (data.js + portal ekleri) ........... satır  65
     1)  Başlık davranışı ve mobil menü ....................... satır  94
     2)  Dil değiştirici ...................................... satır 118
     3)  Döviz kuru ........................................... satır 130
     4)  Görünürlük animasyonları ve sayaçlar ................. satır 160
     5)  Toast ................................................ satır 235
     6)  Sepet: teklif + doğrudan sipariş ..................... satır 248
         6a) Depo (localStorage) ve durum ..................... satır 250
         6b) Sepete özel küçük yardımcılar .................... satır 295
         6c) Görünümler: sepet / onay / misafir teklifi ....... satır 349
         6d) Sipariş gönderimi ve e-posta yedeği .............. satır 497
         6e) Çizim ve çekmece aç/kapa ......................... satır 577
         6f) Teklif gönderimi (WhatsApp / e-posta) ............ satır 625
     7)  Ürün kartı ........................................... satır 661
     8)  Dinamik içerik (dil değişince yeniden çizilir) ....... satır 688
     9)  Site içi arama ....................................... satır 878
    10)  Çerez bildirimi ...................................... satır 928
    11)  Formlar (iletişim + hesap başvurusu) ................. satır 937
    12)  Siparişlerim + e-bülten .............................. satır 1062
    13)  Tanıtım videosu ve WhatsApp bağlantıları ............. satır 1164

   KATALOG: ürün ve doküman listeleri HK_PRODUCTS/HK_DOCS'tan DOĞRUDAN değil,
   allProducts()/allDocs() üzerinden okunur; böylece portalda eklenen kayıtlar
   da (yalnızca ekleyenin kendi tarayıcısında) listelerde görünür.
   ============================================================ */
(function () {
  "use strict";

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const trLower = (s) => (s || "").toLocaleLowerCase("tr");
  const L = () => window.HK_LANG || "tr";
  const pick = (obj) => (obj && (obj[L()] || obj.tr)) || "";
  const T = (k) => (typeof window.hkT === "function" ? window.hkT(k) : k);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // NOT: const ile bildirilen HK_COMPANY window'a yazılmaz; çıplak ada başvur.
  const HK = (typeof HK_COMPANY !== "undefined" && HK_COMPANY) || window.HK_COMPANY || {};
  window.HK_CONFIG = HK;

  /* Tecrübe yılı TEK yerden türetilir. Sayfalara elle yazılan rakam her yılbaşında
     bayatlıyordu; kuruluş yılından hesaplanınca bir daha eskimez. */
  const HK_YEARS = Math.max(0, new Date().getFullYear() - (HK.founded || new Date().getFullYear()));
  window.HK_YEARS = HK_YEARS;

  const CAT_OF = (sub) => (HK_SUBS[sub] ? HK_SUBS[sub].cat : "");
  const CAT_LABEL = (catKey) => (HK_CATS[catKey] ? pick(HK_CATS[catKey]) : catKey);
  const SUB_LABEL = (sub) => (HK_SUBS[sub] ? pick(HK_SUBS[sub]) : sub);
  const SUB_CODE = (sub) => (HK_SUBS[sub] ? HK_SUBS[sub].code : "•");
  const PNAME = (p) => pick(p.n);

  /* KATALOG KAYNAĞI — yayınlı liste (data.js) + portalda eklenenler.
     portal-store.js her sayfada main.js'ten ÖNCE yüklenir, ama yüklenememiş,
     bir eklenti tarafından engellenmiş ya da localStorage kapatılmış olabilir.
     Böyle bir durumda yayınlı katalog EKRANDAN KAYBOLMAMALI: birleştirici yoksa
     ya da beklenmedik bir şey dönerse doğrudan data.js dizisine düşülür.
     Not: portal ekleri yalnızca EKLEYENİN kendi tarayıcısında durur; siteye
     gerçekten yayınlanmaları için portalın dışa aktardığı kod data.js'e
     yapıştırılıp commit'lenmelidir. */
  function safeList(fn, base) {
    if (typeof fn === "function") {
      try {
        const out = fn();
        if (Array.isArray(out) && out.length) return out;
      } catch (_) {}
    }
    return base;
  }
  /* Her çizimde yeniden okunur ki portalda eklenen kayıt, sayfa yenilenince
     (ya da dil değişip yeniden çizilince) yerini alsın. */
  const allProducts = () => safeList(window.hgpAllProducts, HK_PRODUCTS);
  const allDocs = () => safeList(window.hgpAllDocs, HK_DOCS);

  /* Açılır panellerin durumu ekran okuyucuya da bildirilsin: tetikleyicide
     aria-expanded, panelin kendisinde aria-hidden güncellenir. */
  function setExpanded(triggers, panel, open) {
    (triggers || []).forEach(t => t.setAttribute("aria-expanded", open ? "true" : "false"));
    if (panel) panel.setAttribute("aria-hidden", open ? "false" : "true");
  }

  /* ============ 1) Başlık davranışı ============ */
  const header = $(".site-header");
  const toTop = $(".to-top");
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 700);
  }, { passive: true });
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  const mnav = $(".mobile-nav");
  const burger = $(".burger");
  /* Mobil menü tek kapıdan açılıp kapanır ki aria durumu hiçbir yolda ıskalanmasın
     (Escape tuşu ve menü içi bağlantılar da buradan geçer). */
  function openMenu() { if (mnav) { mnav.classList.add("open"); setExpanded([burger], mnav, true); } }
  function closeMenu() { if (mnav) { mnav.classList.remove("open"); setExpanded([burger], mnav, false); } }
  if (burger && mnav) {
    setExpanded([burger], mnav, false);
    burger.addEventListener("click", openMenu);
    const mc = $(".mn-close", mnav);
    if (mc) mc.addEventListener("click", closeMenu);
    $$("a", mnav).forEach(a => a.addEventListener("click", closeMenu));
  }

  /* ============ 2) Dil değiştirici ============ */
  $$("[data-lang]").forEach(btn => btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof window.hkSetLang === "function") window.hkSetLang(btn.getAttribute("data-lang"));
  }));
  /* i18n.js yalnızca "on" sınıfını taşıyor; seçili dil ekran okuyucuya
     aria-pressed ile de bildirilmeli. */
  const syncLangButtons = () => $$("[data-lang]").forEach(b =>
    b.setAttribute("aria-pressed", b.getAttribute("data-lang") === L() ? "true" : "false"));
  syncLangButtons();
  document.addEventListener("hk:langchange", syncLangButtons);

  /* ============ 3) Döviz kuru ============ */
  const RATES_TIMEOUT_MS = 6000;   // kur servisi bu süre içinde yanıt vermezse yedeğe düşülür
  async function loadRates() {
    const usdEl = $("#rate-usd"), eurEl = $("#rate-eur"), noteEl = $("#rate-note");
    if (!usdEl) return;
    const render = (usd, eur, live) => {
      usdEl.textContent = usd.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      eurEl.textContent = eur.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (noteEl) noteEl.textContent = live
        ? "canlı · " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
        : T("top.rateNote");
    };
    /* Şerit ÖNCE yedek değerlerle çizilir: servis yavaşsa/çökmüşse ziyaretçi boş
       kutu görmez, sadece "indikatif" notu kalır. Canlı veri gelirse üzerine yazılır. */
    render(HK_RATES_FALLBACK.usd, HK_RATES_FALLBACK.eur, false);
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(RATES_TIMEOUT_MS) });
      const j = await r.json();
      if (j && j.rates && j.rates.TRY) {
        const usdTry = j.rates.TRY;
        const eurTry = j.rates.EUR ? usdTry / j.rates.EUR : HK_RATES_FALLBACK.eur;
        render(usdTry, eurTry, true);
      }
    } catch (_) {
      /* Ağ hatası, zaman aşımı ya da AbortSignal.timeout desteklemeyen eski tarayıcı:
         yukarıda çizilen HK_RATES_FALLBACK değerleri ekranda kalır, hata yutulur. */
    }
  }
  loadRates();

  /* ============ 4) Görünürlük animasyonları ve sayaçlar ============ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  const observeReveal = (root) => $$(".reveal", root).forEach(n => { if (!n.classList.contains("in")) io.observe(n); });
  observeReveal(document);

  const COUNT_DUR_MS = 1400;   // sayaç animasyonunun toplam süresi
  /* Sayaç animasyonu SÜSTÜR; sayının kendisi içeriktir. Bu yüzden animasyon
     hiç çalışamadığında ekranda "0" değil GERÇEK değer kalmalıdır: sekme arka
     plandayken requestAnimationFrame durur, "hareketi azalt" ayarında da
     animasyon istenmez. Her iki durumda doğrudan hedef değeri yazarız; ayrıca
     animasyon yarıda kalırsa süre dolunca değeri tamamlayan bir emniyet vardır.
     ("0 yıllık tecrübe" yazan bir kurumsal site, animasyonsuz sayıdan kötüdür.) */
  const reduceMotion = window.matchMedia
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const settle = (node, target) => {
    node.textContent = target.toLocaleString("tr-TR");
  };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const node = e.target, target = parseFloat(node.dataset.count || "0");
      if (reduceMotion || document.hidden) { settle(node, target); return; }
      const t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / COUNT_DUR_MS, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(target * eased).toLocaleString("tr-TR");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      // rAF duraklarsa (sekme gizlenirse) sayı yarıda kalmasın
      setTimeout(() => settle(node, target), COUNT_DUR_MS + 400);
    });
  }, { threshold: 0.4 });

  /* "Yıllık tecrübe" sayaçlarının HTML'deki sabit değeri HK_YEARS ile ezilir.
     Hedef ya açıkça data-count-years ile işaretlenmiştir ya da kutusundaki
     etiket ".years" ile biten bir i18n anahtarı taşır. */
  /* HTML'deki sayı, JS çalışmazsa görünecek YEDEK değerdir (ör. 54) — bu yüzden
     hem data-count hem de ekrandaki metin güncellenir. Sayaç animasyonu zaten
     her karede metni yeniden yazar; buradaki yazım yalnızca animasyon hiç
     başlamazsa (gözlemci tetiklenmezse) doğru sayının kalmasını sağlar. */
  function syncYearCounters() {
    const v = String(HK_YEARS);
    const setYears = (node) => { node.dataset.count = v; node.textContent = v; };
    $$("[data-count-years]").forEach(setYears);
    $$("[data-i18n$='.years']").forEach(label => {
      const node = label.parentElement && label.parentElement.querySelector("[data-count]");
      if (node) setYears(node);
    });
    /* Sayaç olmayan düz metin yerler (ör. anasayfadaki hero SVG'sinin
       "… YIL / YRS" etiketi) — animasyonsuz, doğrudan yazılır. */
    $$("[data-hk-years]").forEach(n => { n.textContent = v; });
  }
  syncYearCounters();

  /* Ürün sayısı da tek yerden türetilir. Sayfaya elle yazılan "42" her yeni
     üründe sessizce yanlışa döner; [data-hk-products] taşıyan her düğüme
     birleşik katalogun uzunluğu yazılır. Düğümde data-count varsa sayaç
     animasyonu da bu değeri okusun diye o da güncellenir (yıl sayaçlarındaki
     kalıbın aynısı). HTML'deki sabit sayı, JS çalışmazsa görünecek yedektir. */
  function syncProductCounters() {
    const v = String(allProducts().length);
    $$("[data-hk-products]").forEach(n => {
      if (n.hasAttribute("data-count")) n.dataset.count = v;
      n.textContent = v;
    });
  }
  syncProductCounters();

  $$("[data-count]").forEach(node => cio.observe(node));

  /* ============ 5) Toast ============ */
  const TOAST_MS = 2600;   // bildirim şeridinin ekranda kalma süresi
  let toastTimer;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = el("div", "toast"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), TOAST_MS);
  }
  window.hkToast = toast;

  /* ============ 6) Sepet: teklif + doğrudan sipariş ============ */

  /* ---- 6a) Depo (localStorage) ve durum ---- */
  const BASKET_KEY = "hk_basket_v3"; // [{id, qty}] — eski v2 (yalnız id listesi) otomatik taşınır
  /* Kimyasallar KİLOGRAM ile satılır; bir kısmı ise VARİL ile. Bu yüzden üst
     sınır iki kademelidir: kg tarafında 2.400 kg gibi değerler normaldir,
     varil tarafında 999 varil zaten fazlasıyla yüksektir. */
  const QTY_MAX_KG = 999999;         // kg cinsinden tek kalem üst sınırı
  const QTY_MAX_VARIL = 999;         // varil cinsinden tek kalem üst sınırı
  /* Ürünün satış birimi: data.js / portal kaydındaki unit alanı "varil" ise
     varil, DİĞER HER DURUMDA kg. Varsayılanın kg olması bilinçlidir — mevcut
     42 ürünün hiçbirinde unit alanı yok ve hepsi kilo ile satılıyor. */
  const isVaril = (p) => !!p && p.unit === "varil";
  const unitLabel = (p) => T(isVaril(p) ? "unit.varil" : "unit.kg");
  const qtyMaxFor = (p) => (isVaril(p) ? QTY_MAX_VARIL : QTY_MAX_KG);
  /* Varilde bir varilin kaç kilo olduğu (portalda girilir, data.js'te kgPerUnit). */
  const kgPerUnit = (p) => (isVaril(p) && +p.kgPerUnit > 0) ? +p.kgPerUnit : 0;
  /* Varille satılan üründe müşteri KAÇ KİLO aldığını da görmelidir: varil sayısı
     tek başına miktar duygusu vermiyor. kgPerUnit bilinmiyorsa (eski kayıt)
     yalnız varil sayısı yazılır — uydurma kilo göstermeyiz. */
  const totalKg = (e) => kgPerUnit(e.p) ? e.qty * kgPerUnit(e.p) : 0;
  /* Sipariş/teklif metinlerinde geçen tek biçim:
       kilo ürün  -> "2.400 kg"
       varil ürün -> "3 varil (600 kg)" */
  const qtyLabel = (e) => {
    const base = e.qty.toLocaleString("tr-TR") + " " + unitLabel(e.p);
    const kg = totalKg(e);
    return kg ? base + " (" + kg.toLocaleString("tr-TR") + " " + T("unit.kg") + ")" : base;
  };
  const getBasket = () => {
    try {
      const v3 = JSON.parse(localStorage.getItem(BASKET_KEY));
      if (Array.isArray(v3)) return v3.filter(x => x && x.id);
    } catch (_) {}
    try {
      const v2 = JSON.parse(localStorage.getItem("hk_basket_v2"));
      if (Array.isArray(v2) && v2.length) {
        const m = v2.map(id => ({ id: id, qty: 1 }));
        localStorage.setItem(BASKET_KEY, JSON.stringify(m));
        localStorage.removeItem("hk_basket_v2");
        return m;
      }
    } catch (_) {}
    return [];
  };
  /* SEPET SAHİBİ. Oturum artık sekmeyle birlikte ölüyor (sessionStorage), ama
     sepet localStorage'ta kalıcı — ortak bir bilgisayarda bir sonraki kişi
     öncekinin sepetini görürdü. Kimyasal tedarikte bu ticari bilgidir: hangi
     firmanın neyi araştırdığını gösterir.
     Bu yüzden sepet, giriş yapılmışken SAHİBİYLE etiketlenir. Sayfa açılışında
     etiket varsa ve o kullanıcı artık yoksa (ya da başkası girmişse) sepet
     temizlenir. MİSAFİR sepeti etiketlenmez ve KORUNUR: ziyaretçinin teklif
     sepetini doldurup sonra giriş yapması meşru bir akıştır. */
  /* Kullanıcı kimliği: e-posta > firma > rol. Hem sepet sahipliği hem de
     oturum değişiminde sepet temizliği bunu kullanır — tek tanım. */
  const userKey = () => {
    const u = window.hkAuth && window.hkAuth.user();
    return u ? (u.email || u.company || u.role) : null;
  };
  const BASKET_OWNER_KEY = "hk_basket_owner";
  const setBasket = (b) => {
    localStorage.setItem(BASKET_KEY, JSON.stringify(b));
    const owner = userKey();
    if (owner) localStorage.setItem(BASKET_OWNER_KEY, owner);
    else localStorage.removeItem(BASKET_OWNER_KEY);
    renderBasket();
  };
  /* Açılışta bir kez: sahibi gitmiş sepeti düşür. */
  function dropOrphanBasket() {
    const owner = localStorage.getItem(BASKET_OWNER_KEY);
    if (!owner) return;                       // misafir sepeti — dokunma
    if (owner === userKey()) return;          // aynı kullanıcı — dokunma
    localStorage.setItem(BASKET_KEY, "[]");
    localStorage.removeItem(BASKET_OWNER_KEY);
  }
  /* Yayın aşaması: sipariş kapalıyken sepet DAİMA teklif modunda kalır.
     Bu tek satır, sipariş akışının bütün giriş kapılarını kapatır
     (sepet başlığı, adet kutusu etiketi, onay ekranı, ürün kartı düğmesi). */
  const SIPARIS_ACIK = (typeof HK_FEATURES === "undefined") || HK_FEATURES.siparis !== false;
  const isCust = () => SIPARIS_ACIK && !!(window.hkAuth && window.hkAuth.isCustomer());

  let bdView = "cart"; // cart | confirm | quoteform | success
  let lastOrderId = "";

  function addToBasket(id) {
    // Portalda eklenen ürünler de sepete girebilmeli: birleşik listede aranır.
    const p = allProducts().find(x => x.id === id);
    if (!p) return;
    const b = getBasket();
    const line = b.find(x => x.id === id);
    bdView = "cart";
    if (line) {
      line.qty = Math.min(qtyMaxFor(p), (line.qty || 1) + 1);
      setBasket(b);
      toast("“" + PNAME(p) + "” — " + T("basket.inc") + ": " + line.qty);
      openBasket();
      return;
    }
    b.push({ id: id, qty: 1 });
    setBasket(b);
    toast("“" + PNAME(p) + "” " + T("basket.added"));
  }
  window.hkAdd = addToBasket;

  /* ---- 6b) Sepete özel küçük yardımcılar ---- */

  /* Sepet satırlarını ürün kaydıyla eşler; silinmiş id'ler elenir.
     Teklif metni, sipariş kalemleri ve e-posta yedekleri hep bunu kullanır.
     Eşleme birleşik listeden yapılır; yoksa portalda eklenip sepete konan bir
     ürün diğer sayfada sessizce düşerdi. */
  const basketEntries = () => {
    const all = allProducts();
    return getBasket()
      .map(line => { const p = all.find(x => x.id === line.id); return p ? { p: p, qty: line.qty || 1 } : null; })
      .filter(Boolean);
  };

  /* Çekmece altındaki gri açıklama satırı */
  function smallNote(text) {
    const n = el("p", null, text);
    n.style.cssText = "font-size:12px;color:var(--ink-3);margin-top:8px";
    return n;
  }

  /* Onay ve misafir teklifi adımlarındaki "Sepete Dön" bağlantısı */
  function backToCartButton() {
    const back = el("button", null, "← " + T("order.cancel"));
    back.type = "button";
    back.style.cssText = "font-family:var(--font-mono);font-size:12px;color:var(--crimson);font-weight:600;margin-bottom:12px";
    back.addEventListener("click", () => { bdView = "cart"; renderBasket(); });
    return back;
  }

  /* Çekmece başlığı ve alt butonlar duruma göre */
  function basketChrome() {
    const cust = isCust();
    const h3 = $(".basket-drawer .bd-head h3"), sub = $(".basket-drawer .bd-head .mono");
    if (h3) h3.textContent = cust ? T("basket.titleOrder") : T("basket.title");
    if (sub) sub.textContent = cust ? T("basket.subOrder") : T("basket.sub");
    const foot = $(".basket-drawer .bd-foot");
    if (foot) foot.style.display = bdView === "cart" ? "" : "none";
  }

  /* Miktar denetimi: −/+ düğmeleri VE serbest giriş kutusu. Kilo ile satılan
     ürünlerde 2.400 gibi değerleri düğmeye basarak girmek mümkün değildir, bu
     yüzden kutuya doğrudan yazılabilir. Kutu blur/Enter'da doğrulanır; geçersiz
     ya da boş giriş eski değere döner (sessizce 1'e düşürmek, müşterinin yazdığı
     miktarı kaybetmek demektir). Birim etiketi kutunun yanında görünür. */
  function qtyControl(b, line, p) {
    const max = qtyMaxFor(p);
    const q = el("div", "bd-qty");
    const minus = el("button", null, "−");
    minus.type = "button";
    minus.disabled = (line.qty || 1) <= 1;
    minus.addEventListener("click", () => { line.qty = Math.max(1, (line.qty || 1) - 1); setBasket(b); });

    const inp = el("input", "bd-qty-input");
    inp.type = "text";
    inp.inputMode = "numeric";
    inp.value = String(line.qty || 1);
    inp.size = String(max).length;
    inp.setAttribute("aria-label", T("basket.qtyLabel") + " — " + unitLabel(p));
    inp.title = T(isVaril(p) ? "basket.qtyHintVaril" : "basket.qtyHintKg");
    const commit = () => {
      const n = parseInt(String(inp.value).replace(/[^\d]/g, ""), 10);
      if (!n || n < 1) { inp.value = String(line.qty || 1); return; }   // geçersiz → eski değer
      line.qty = Math.min(max, n);
      inp.value = String(line.qty);
      setBasket(b);
    };
    inp.addEventListener("blur", commit);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
    });

    const plus = el("button", null, "+");
    plus.type = "button";
    plus.addEventListener("click", () => { line.qty = Math.min(max, (line.qty || 1) + 1); setBasket(b); });

    q.appendChild(minus);
    q.appendChild(inp);
    q.appendChild(plus);
    /* Birim etiketi çerçevenin DIŞINDA: .bd-qty overflow:hidden ile kutuyu
       çiziyor, etiket içine alınırsa sayının parçası gibi okunuyor. */
    const wrap = el("div", "bd-qty-wrap");
    wrap.appendChild(q);
    wrap.appendChild(el("span", "bd-qty-unit", unitLabel(p)));
    /* Varilde toplam kilo hemen altta: müşteri kaç kilo aldığını görsün.
       Miktar değiştikçe setBasket -> renderBasket zaten yeniden çiziyor. */
    const kgEach = kgPerUnit(p);
    if (kgEach) {
      const tot = (line.qty || 1) * kgEach;
      wrap.appendChild(el("span", "bd-qty-kg",
        "= " + tot.toLocaleString("tr-TR") + " " + T("unit.kg")));
    }
    return wrap;
  }


  /* ---- 6c) Görünümler: sepet / onay / misafir teklifi / başarı ---- */
  function renderCart(body, b) {
    const cust = isCust();
    if (cust) {
      const u = window.hkAuth.user();
      body.appendChild(el("span", "bd-mode", "● " + T("basket.modePill") + " — " + u.company));
    }
    const all = allProducts();
    b.forEach(line => {
      const p = all.find(x => x.id === line.id);
      if (!p) return;
      const item = el("div", "bd-item");
      const info = el("div");
      info.appendChild(el("b", null, PNAME(p)));
      info.appendChild(el("span", "mono", p.brand));
      const right = el("div", "bd-right");
      right.appendChild(qtyControl(b, line, p));
      const rm = el("button", "bd-remove", "×");
      rm.setAttribute("aria-label", "×");
      rm.addEventListener("click", () => setBasket(getBasket().filter(x => x.id !== line.id)));
      right.appendChild(rm);
      item.appendChild(info); item.appendChild(right);
      body.appendChild(item);
    });
    const cta = el("button", "btn btn--primary");
    cta.style.cssText = "width:100%;justify-content:center;margin-top:14px";
    if (cust) {
      cta.textContent = "✓ " + T("order.place");
      cta.addEventListener("click", () => { bdView = "confirm"; renderBasket(); });
      body.appendChild(cta);
    } else if (SIPARIS_ACIK) {
      cta.textContent = T("basket.loginToOrder");
      cta.addEventListener("click", () => {
        if (!window.hkAuth) return;
        window.hkAuth.openLogin(() => { openBasket(); bdView = "confirm"; renderBasket(); });
      });
      body.appendChild(cta);
      const ap = el("a", "btn btn--ghost btn--sm", T("basket.applyBtn"));
      ap.href = "hesap.html";
      ap.style.cssText = "width:100%;justify-content:center;margin-top:10px";
      body.appendChild(ap);
    }
    /* Sipariş kapalıyken sepetin tek çıkışı alttaki teklif düğmeleridir
       (WhatsApp / e-posta) — üstte ayrıca bir çağrı düğmesi gösterilmez. */
    body.appendChild(smallNote(cust ? T("order.info")
                              : (SIPARIS_ACIK ? T("basket.memberNote") : T("basket.quoteOnlyNote"))));
  }

  function renderConfirm(body, b) {
    const u = window.hkAuth.user();
    if (!u) { bdView = "cart"; renderBasket(); return; }
    body.appendChild(backToCartButton());
    const h = el("h4", null, T("order.confirmTitle"));
    h.style.cssText = "font-family:var(--font-display);font-weight:800;font-size:17px;margin-bottom:6px";
    body.appendChild(h);
    const all = allProducts();
    b.forEach(line => {
      const p = all.find(x => x.id === line.id);
      if (!p) return;
      const row = el("div", "bd-item");
      const info = el("div");
      info.appendChild(el("b", null, PNAME(p)));
      info.appendChild(el("span", "mono", qtyLabel({ p: p, qty: line.qty })));
      row.appendChild(info);
      body.appendChild(row);
    });
    const meta = el("div");
    meta.style.cssText = "margin:14px 0;padding:12px 14px;background:var(--paper-2);border:1px solid var(--line-soft);border-radius:3px;font-size:13px";
    const m1 = el("div");
    m1.appendChild(el("span", null, T("order.company") + ": "));
    m1.appendChild(el("b", null, u.company));
    const m2 = el("div");
    m2.style.marginTop = "4px";
    m2.appendChild(el("span", null, T("order.rep") + ": "));
    m2.appendChild(el("b", null, u.rep || "Herkim Satış"));
    meta.appendChild(m1); meta.appendChild(m2);
    body.appendChild(meta);
    const lb = el("label", null, T("order.note"));
    lb.setAttribute("for", "bd-note");
    lb.style.cssText = "font-family:var(--font-mono);font-size:11px;letter-spacing:0.12em;color:var(--ink-2);display:block;margin-bottom:6px";
    body.appendChild(lb);
    const ta = el("textarea");
    ta.id = "bd-note"; ta.maxLength = ORDER_NOTE_MAX; ta.placeholder = T("order.notePh");
    ta.style.cssText = "width:100%;min-height:70px;padding:10px 12px;border:1.5px solid var(--line);border-radius:3px;background:var(--white);resize:vertical";
    body.appendChild(ta);
    const send = el("button", "btn btn--primary", "✓ " + T("order.confirm"));
    send.style.cssText = "width:100%;justify-content:center;margin-top:14px";
    send.addEventListener("click", () => {
      send.disabled = true;
      placeOrder(ta.value, () => { send.disabled = false; });
    });
    body.appendChild(send);
    body.appendChild(smallNote(T("order.info")));
  }

  /* Misafir teklif adımı: ad + telefon/e-posta (üyelik gerekmez) */
  function renderQuoteForm(body) {
    body.appendChild(backToCartButton());
    const h = el("h4", null, T("quote.formTitle"));
    h.style.cssText = "font-family:var(--font-display);font-weight:700;font-size:17px;margin-bottom:4px";
    body.appendChild(h);
    const sub = el("p", null, T("quote.formSub"));
    sub.style.cssText = "font-size:12.5px;color:var(--ink-3);margin-bottom:14px";
    body.appendChild(sub);
    const mk = (id, key) => {
      const f = el("div", "field");
      f.style.marginBottom = "10px";
      const lb = el("label", null, T(key));
      lb.setAttribute("for", id);
      const inp = el("input");
      inp.type = "text"; inp.id = id; inp.maxLength = 80;
      f.appendChild(lb); f.appendChild(inp);
      body.appendChild(f);
      return inp;
    };
    const iName = mk("qf-name", "quote.name");
    const iFirm = mk("qf-firm", "quote.firm");
    const iCont = mk("qf-contact", "quote.contact");
    const send = el("button", "btn btn--primary", T("quote.send"));
    send.style.cssText = "width:100%;justify-content:center;margin-top:8px";
    send.addEventListener("click", () => {
      const name = iName.value.trim(), firm = iFirm.value.trim(), cont = iCont.value.trim();
      if (!name) { toast(T("toast.formErr")); iName.focus(); return; }
      const digits = (cont.match(/\d/g) || []).length;
      if (!cont || (cont.indexOf("@") < 1 && digits < 7)) { toast(T("quote.errContact")); iCont.focus(); return; }
      send.disabled = true;
      sendQuote(name, firm, cont, () => { send.disabled = false; });
    });
    body.appendChild(send);
    body.appendChild(smallNote(T("basket.note")));
  }

  function renderSuccess(body) {
    const box = el("div", "bd-success");
    box.appendChild(el("div", "ok-ring", "✓"));
    box.appendChild(el("h4", null, T("order.successTitle")));
    box.appendChild(el("div", "mono", lastOrderId));
    const p1 = el("p", null, T("order.successBody"));
    p1.style.marginTop = "8px";
    box.appendChild(p1);
    const track = el("a", "btn btn--primary", T("order.track"));
    track.href = "siparislerim.html";
    track.style.cssText = "width:100%;justify-content:center;margin-top:18px";
    box.appendChild(track);
    const cont = el("button", "btn btn--ghost btn--sm", T("order.continue"));
    cont.style.cssText = "width:100%;justify-content:center;margin-top:10px";
    cont.addEventListener("click", () => { bdView = "cart"; renderBasket(); closeBasket(); });
    box.appendChild(cont);
    body.appendChild(box);
  }

  /* ---- 6d) Sipariş gönderimi ve e-posta yedeği ---- */
  const ORDER_NOTE_MAX = 200;   // sipariş notunda saklanan en fazla karakter



  /* Sipariş ancak GERÇEKTEN iletildikten sonra "alındı" sayılır: portal kaydı da,
     başarı ekranı da, sepetin boşaltılması da hgNotify true dönerse yapılır.
  /* SİPARİŞ BURADA, SİTENİN İÇİNDE tamamlanır. Kayıt hgpAddOrder ile açılır ve
     müşteri siparisleri siparislerim.html'den izler — e-postaya YÖNLENDİRME YOK.
     E-posta ile gönderme ayrı bir düğmedir (#basket-mail, teklif akışı).
     ÖNCEKİ HATA: sipariş yalnızca hgNotify true dönerse kaydediliyordu; web3forms
     anahtarı boş olduğu için bu hiç gerçekleşmiyor, her sipariş mailto'ya düşüyor
     ve siparislerim'de hiç görünmüyordu.
     hgNotify artık YAN KANALDIR: anahtar girildiyse satışa haber verir, girilmediyse
     sessizce false döner. Siparişin kaydı ona BAĞLI DEĞİLDİR. */
  function placeOrder(noteRaw, done) {
    const u = window.hkAuth && window.hkAuth.user();
    const b = getBasket();
    if (!u || u.role !== "musteri") {
      bdView = "cart"; renderBasket();
      if (window.hkAuth) window.hkAuth.openLogin(() => { openBasket(); bdView = "confirm"; renderBasket(); });
      if (done) done();
      return;
    }
    if (!b.length || typeof hgpAddOrder !== "function") { if (done) done(); return; }
    const items = basketEntries().map(e => ({ n: e.p.n.tr, q: qtyLabel(e) }));
    const note = (noteRaw || "").trim().slice(0, ORDER_NOTE_MAX);

    lastOrderId = hgpAddOrder(u.company, items, u.name, note);
    bdView = "success";
    setBasket([]);
    renderBasket();
    toast(T("order.toast") + " " + lastOrderId);
    if (done) done();

    // Yan kanal: anahtar varsa satış ekibine anlık bildirim. Hata yutulur —
    // sipariş zaten kaydedildi, bildirimin başarısı akışı etkilemez.
    hgNotify("Yeni Sipariş " + lastOrderId + " — " + u.company,
      ["Sipariş No: " + lastOrderId, "Müşteri: " + u.company, "Veren: " + u.name, ""]
        .concat(items.map(i => "• " + i.n + " — " + i.q))
        .concat(note ? ["", T("order.noteLabel") + ": " + note] : []),
      u.name);
  }

  /* ---- 6e) Çizim ve çekmece aç/kapa ---- */
  function renderBasket() {
    const b = getBasket();
    $$(".basket-count").forEach(node => {
      node.textContent = b.length;
      node.style.display = b.length ? "grid" : "none";
    });
    const body = $("#basket-body");
    if (!body) return;
    if (bdView === "confirm" && (!b.length || !isCust())) bdView = "cart";
    if (bdView === "quoteform" && isCust()) bdView = "cart";
    if (bdView !== "success" && !b.length) bdView = "cart";
    basketChrome();
    body.replaceChildren();
    if (bdView === "success") { renderSuccess(body); return; }
    if (!b.length) {
      const empty = el("div", "bd-empty");
      const ico = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      ico.setAttribute("viewBox", "0 0 24 24"); ico.setAttribute("fill", "none");
      ico.setAttribute("stroke", "currentColor"); ico.setAttribute("stroke-width", "1.5");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M9 3h6l1 4H8l1-4zM6 7h12l-1.2 12.6a1.5 1.5 0 0 1-1.5 1.4H8.7a1.5 1.5 0 0 1-1.5-1.4L6 7z");
      ico.appendChild(path); empty.appendChild(ico);
      const p1 = el("p", null, T("basket.empty1"));
      p1.appendChild(el("br"));
      p1.appendChild(document.createTextNode(T("basket.empty2a")));
      p1.appendChild(el("b", null, "+"));
      p1.appendChild(document.createTextNode(T("basket.empty2b")));
      empty.appendChild(p1); body.appendChild(empty);
      return;
    }
    if (bdView === "confirm") { renderConfirm(body, b); return; }
    if (bdView === "quoteform") { renderQuoteForm(body); return; }
    renderCart(body, b);
  }

  const drawer = $(".basket-drawer");
  const overlay = $(".drawer-overlay");
  const basketTriggers = $$("[data-open-basket]");
  function openBasket() { if (drawer) { drawer.classList.add("open"); overlay.classList.add("open"); setExpanded(basketTriggers, drawer, true); } }
  function closeBasket() { if (drawer) { drawer.classList.remove("open"); overlay.classList.remove("open"); setExpanded(basketTriggers, drawer, false); } }
  if (drawer) setExpanded(basketTriggers, drawer, false);
  basketTriggers.forEach(node => node.addEventListener("click", (e) => { e.preventDefault(); openBasket(); }));
  if (overlay) overlay.addEventListener("click", closeBasket);
  const bdClose = $(".bd-close");
  if (bdClose) bdClose.addEventListener("click", closeBasket);

  /* ---- 6f) Teklif gönderimi (WhatsApp / e-posta) ---- */
  function basketMessage() {
    const lines = basketEntries().map(e => "• " + PNAME(e.p) + " — " + qtyLabel(e));
    const foot = "\n\n" + T("mail.firm") + ": \n" + T("mail.contact") + ": \n" + T("mail.qty") + ": ";
    return encodeURIComponent(T("quote.mailIntro") + "\n\n" + lines.join("\n") + foot);
  }
  /* Teklif istemek üyelik gerektirmez; sipariş vermek onaylı hesap ister. */
  const waBtn = $("#basket-wa");
  if (waBtn) waBtn.addEventListener("click", () => {
    if (!getBasket().length) { toast(T("basket.addFirst")); return; }
    window.open("https://wa.me/" + HK.whatsapp + "?text=" + basketMessage(), "_blank", "noopener");
  });
  function quoteMailFallback() {
    location.href = "mailto:" + HK.mailQuote + "?subject=" + encodeURIComponent(T("quote.mailSubject")) + "&body=" + basketMessage();
  }
  function sendQuote(name, firm, contact, done) {
    const lines = ["Ad: " + name, "Firma: " + (firm || "—"), "İletişim: " + (contact || "—"), ""]
      .concat(basketEntries().map(e => "• " + e.p.n.tr + " — " + qtyLabel(e)));
    hgNotify("Teklif Talebi — " + (firm || name), lines, name, contact).then(ok => {
      if (done) done();
      if (ok) { bdView = "cart"; renderBasket(); toast(T("quote.sentOk")); }
      else quoteMailFallback();
    });
  }
  const mailBtn = $("#basket-mail");
  if (mailBtn) mailBtn.addEventListener("click", () => {
    if (!getBasket().length) { toast(T("basket.addFirst")); return; }
    if (!HK.web3forms) { quoteMailFallback(); return; }
    const u = window.hkAuth && window.hkAuth.user();
    if (u && u.role === "musteri") { sendQuote(u.name, u.company, u.email || ""); return; }
    bdView = "quoteform"; // misafir: iletişim bilgisi adımı
    renderBasket();
  });
  const clearBtn = $("#basket-clear");
  if (clearBtn) clearBtn.addEventListener("click", () => { setBasket([]); toast(T("basket.cleared")); });

  /* ============ 7) Ürün kartı ============ */
  function productCard(p) {
    const card = el("article", "element-card");
    card.dataset.cat = CAT_OF(p.sub);
    card.dataset.sub = p.sub;

    const top = el("div", "ec-top");
    top.appendChild(el("span", "ec-cas", p.brand));
    if (p.tag === "yeni") top.appendChild(el("span", "ec-tag ec-tag--new", T("tag.new")));
    else if (p.tag === "one") top.appendChild(el("span", "ec-tag", T("tag.featured")));
    card.appendChild(top);

    card.appendChild(el("div", "ec-formula", SUB_CODE(p.sub)));
    card.appendChild(el("div", "ec-name", PNAME(p)));

    const meta = el("div", "ec-meta");
    meta.appendChild(el("span", null, SUB_LABEL(p.sub)));
    card.appendChild(meta);

    const add = el("button", "ec-add", "+");
    add.setAttribute("aria-label", T("basket.addAria"));
    add.setAttribute("title", T("basket.addAria"));
    add.addEventListener("click", () => addToBasket(p.id));
    card.appendChild(add);
    return card;
  }

  /* ============ 8) Dinamik içerik (dil değişince yeniden çizilir) ============ */
  const FEATURED_LIMIT = 8;      // anasayfada gösterilen öne çıkan ürün sayısı
  const DOC_HOME_LIMIT = 3;      // anasayfadaki doküman kartı sayısı
  const catState = { cat: "all", sub: "all", q: "" };
  const tableState = { q: "", cat: "all" };
  let tableSortKey = "id", tableSortDir = 1;

  /* ÜRÜN SIRALAMASI — önce "yeni", sonra "öne çıkan", sonra geri kalanlar.
     Etiketler data.js'te p.tag alanındadır ("yeni" | "one" | null). Rozetleri
     productCard() basar; burada yalnızca SIRA belirlenir, yani rozet ile sıra
     tek kaynaktan (p.tag) türer ve ikisi asla ayrışmaz.
     Aynı öncelikteki ürünler data.js'teki sırayı (id) korur: Array#sort ES2019'dan
     beri kararlıdır, yine de niyet açık olsun diye id karşılaştırması yazıldı.
     Portalda eklenen ürünler de aynı p.tag alanını taşır ve bu sıralamaya
     yayınlı ürünlerle BİRLİKTE girer: "yeni" etiketli bir portal ürünü listenin
     sonuna değil BAŞINA gelir. Portal id'leri 9000'in üstündedir; id yalnızca
     eşitlik bozucudur, bu yüzden büyük id sırayı değil sadece aynı etiket
     grubundaki yeri belirler (portal ekleri kendi grubunun sonunda).
     YENİ ETİKET EKLERSENİZ: sadece HK_TAG_ORDER'a bir satır ekleyin. */
  const HK_TAG_ORDER = { yeni: 0, one: 1 };
  const tagRank = (p) => (p && p.tag in HK_TAG_ORDER) ? HK_TAG_ORDER[p.tag] : 2;
  const byHighlight = (a, b) => tagRank(a) - tagRank(b) || a.id - b.id;

  function renderFeatured() {
    const wrap = $("#featured-products");
    if (!wrap) return;
    const featured = allProducts().slice().sort(byHighlight).slice(0, FEATURED_LIMIT);
    wrap.replaceChildren(...featured.map(productCard));
  }

  function renderGrid() {
    const wrap = $("#product-grid");
    if (!wrap) return;
    const all = allProducts();
    const list = all.filter(p => {
      if (catState.cat !== "all" && CAT_OF(p.sub) !== catState.cat) return false;
      if (catState.sub !== "all" && p.sub !== catState.sub) return false;
      if (catState.q) {
        const hay = trLower([p.n.tr, p.n.en, p.n.ru, p.brand, SUB_LABEL(p.sub), CAT_LABEL(CAT_OF(p.sub))].join(" "));
        if (!hay.includes(trLower(catState.q))) return false;
      }
      return true;
    });
    /* Filtre/arama sonucunda da yeni ve öne çıkan ürünler en üstte kalır. */
    list.sort(byHighlight);
    if (list.length) wrap.replaceChildren(...list.map(productCard));
    else {
      const msg = el("p", "muted");
      msg.style.cssText = "grid-column:1/-1;padding:40px 0;text-align:center";
      msg.appendChild(document.createTextNode(T("search.noResult") + " — "));
      const a = el("a", "accent"); a.href = "iletisim.html"; a.appendChild(el("b", null, T("btn.contactUs")));
      msg.appendChild(a);
      wrap.replaceChildren(msg);
    }
    const rc = $("#grid-count");
    // Payda da birleşik listeden gelir; yoksa "43 / 42" gibi bir sayı çıkardı.
    if (rc) rc.textContent = list.length + " / " + all.length;
  }

  function renderTable() {
    const tbody = $("#ptable-body");
    if (!tbody) return;
    let list = allProducts().slice();
    if (tableState.cat !== "all") list = list.filter(p => CAT_OF(p.sub) === tableState.cat);
    if (tableState.q) {
      const q = trLower(tableState.q);
      list = list.filter(p => trLower([p.n.tr, p.n.en, p.n.ru, p.brand, SUB_LABEL(p.sub), CAT_LABEL(CAT_OF(p.sub))].join(" ")).includes(q));
    }
    list.sort((a, b) => {
      let va, vb;
      if (tableSortKey === "name") { va = PNAME(a); vb = PNAME(b); }
      else if (tableSortKey === "cat") { va = CAT_LABEL(CAT_OF(a.sub)); vb = CAT_LABEL(CAT_OF(b.sub)); }
      else if (tableSortKey === "sub") { va = SUB_LABEL(a.sub); vb = SUB_LABEL(b.sub); }
      else if (tableSortKey === "brand") { va = a.brand; vb = b.brand; }
      else { va = a.id; vb = b.id; }
      if (typeof va === "string") return va.localeCompare(vb, "tr") * tableSortDir;
      return (va - vb) * tableSortDir;
    });
    tbody.replaceChildren(...list.map((p, i) => {
      const tr = el("tr");
      tr.appendChild(el("td", "td-no", String(i + 1).padStart(2, "0")));
      const tdName = el("td", "td-name");
      tdName.appendChild(el("b", null, PNAME(p)));
      tdName.appendChild(el("span", null, SUB_LABEL(p.sub)));
      tr.appendChild(tdName);
      const tdCat = el("td");
      tdCat.appendChild(el("span", "cat-pill", CAT_LABEL(CAT_OF(p.sub))));
      tr.appendChild(tdCat);
      tr.appendChild(el("td", "td-cas", p.brand));
      const tdDocs = el("td");
      const docs = el("div", "doc-btns");
      const tds = el("a", null, "TDS"); tds.href = "dokumanlar.html"; tds.title = "TDS";
      const sds = el("a", null, "SDS"); sds.href = "dokumanlar.html"; sds.title = "SDS";
      docs.appendChild(tds); docs.appendChild(sds);
      tdDocs.appendChild(docs); tr.appendChild(tdDocs);
      const tdAdd = el("td");
      const btn = el("button", "add-quote", "+ " + T(isCust() ? "basket.orderWord" : "basket.quoteWord"));
      btn.addEventListener("click", () => addToBasket(p.id));
      tdAdd.appendChild(btn); tr.appendChild(tdAdd);
      return tr;
    }));
    const rc = $("#table-count");
    if (rc) rc.textContent = list.length + " " + T("table.unit");
  }

  const docState = { cat: "all" };
  function renderDocs() {
    const wrap = $("#doc-grid");
    if (!wrap) return;
    let list = allDocs().filter(d => docState.cat === "all" || d.cat === docState.cat);
    if (wrap.dataset.home) list = list.slice(0, DOC_HOME_LIMIT);
    wrap.replaceChildren(...list.map(d => {
      const card = el("article", "doc-card");
      card.appendChild(el("span", "dc-ext", d.ext));
      card.appendChild(el("h3", null, pick(d.title)));
      card.appendChild(el("p", null, pick(d.desc)));
      const meta = el("div", "dc-meta");
      meta.appendChild(el("span", null, pick(d.meta)));
      /* Yolu ÇİZİM ANINDA bir kez daha denetleriz. hgpAddDoc zaten denetliyor,
         ama o zaman deponun tek kapı olması gerekirdi: hg_store_v1 aynı kaynaktaki
         herhangi bir betikle ya da konsoldan elle yazılabilir ve buradaki değer
         her ziyaretçinin tıkladığı <a href> olur. Denetim başarısızsa bağlantı
         indirme değil "talep et" hâline döner — bozuk kayıt kartı gizlemez. */
      const safeFile = (typeof window.hgpSafeDocPath === "function")
        ? window.hgpSafeDocPath(d.file) : d.file;
      const link = el("a", "dc-link", safeFile ? T("doc.download") : T("doc.request"));
      link.href = safeFile || "iletisim.html";
      if (safeFile) link.setAttribute("download", "");
      meta.appendChild(link); card.appendChild(meta);
      return card;
    }));
  }

  window.hkRenderDynamic = function () {
    renderFeatured(); renderGrid(); renderTable(); renderDocs();
  };

  /* Filtre olayları */
  $$("#cat-chips .chip").forEach(ch => ch.addEventListener("click", () => {
    $$("#cat-chips .chip").forEach(c => c.classList.remove("on"));
    ch.classList.add("on"); catState.cat = ch.dataset.cat; catState.sub = "all";
    const secSel = $("#sec-select"); if (secSel) secSel.value = "all";
    renderGrid();
  }));
  const secSel = $("#sec-select");
  if (secSel) secSel.addEventListener("change", () => { catState.sub = secSel.value; renderGrid(); });
  const gq = $("#grid-search");
  if (gq) gq.addEventListener("input", () => { catState.q = gq.value; renderGrid(); });

  const tq = $("#table-search");
  if (tq) tq.addEventListener("input", () => { tableState.q = tq.value; renderTable(); });
  const tc = $("#table-cat");
  if (tc) tc.addEventListener("change", () => { tableState.cat = tc.value; renderTable(); });
  $$(".ptable thead th[data-sort]").forEach(th => th.addEventListener("click", () => {
    const k = th.dataset.sort;
    if (tableSortKey === k) tableSortDir *= -1; else { tableSortKey = k; tableSortDir = 1; }
    $$(".ptable thead th .sort").forEach(s => s.remove());
    th.appendChild(el("span", "sort", tableSortDir === 1 ? "▲" : "▼"));
    renderTable();
  }));

  /* URL'den kategori seçimi: urunler.html?kat=deri */
  const gridWrap = $("#product-grid");
  if (gridWrap) {
    const urlCat = new URLSearchParams(location.search).get("kat");
    if (urlCat && HK_CATS[urlCat]) {
      catState.cat = urlCat;
      $$("#cat-chips .chip").forEach(c => c.classList.toggle("on", c.dataset.cat === urlCat));
    }
  }
  const docChips = $("#doc-chips");
  if (docChips) $$(".chip", docChips).forEach(ch => ch.addEventListener("click", () => {
    $$(".chip", docChips).forEach(c => c.classList.remove("on"));
    ch.classList.add("on"); docState.cat = ch.dataset.cat; renderDocs();
  }));

  /* İlk çizim + dil/oturum değişiminde tazele */
  window.hkRenderDynamic();
  dropOrphanBasket();   // sahibi gitmiş sepeti ilk çizimden ÖNCE düşür
  renderBasket();
  document.addEventListener("hk:langchange", () => { observeReveal(document); renderBasket(); });
  /* SEPET OTURUMA BAĞLIDIR. Çıkış yapıldığında ya da BAŞKA bir müşteri hesabına
     geçildiğinde sepet boşaltılır: ortak bir bilgisayarda bir sonraki kullanıcı
     öncekinin sepetini görmemeli, sipariş yanlış firmaya bağlanmamalıdır.
     Misafirden girişe geçiş (kimlik yok → kullanıcı) sepeti KORUR; ziyaretçi
     sepetini doldurup sonra giriş yapmış olabilir, bu meşru bir akıştır. */
  let lastUserKey = userKey();
  document.addEventListener("hk:authchange", () => {
    const now = userKey();
    if (lastUserKey && now !== lastUserKey) setBasket([]);   // setBasket etiketi de günceller
    lastUserKey = now;
    bdView = "cart"; renderBasket(); renderTable();
  });

  /* ============ 9) Site içi arama ============ */
  const SEARCH_FOCUS_MS = 60;      // katman açılış animasyonu bitmeden odak vermeyelim
  const SEARCH_PROD_LIMIT = 7;     // sonuç listesindeki en fazla ürün sayısı
  const so = $(".search-overlay");
  if (so) {
    const input = $("#site-search");
    const results = $("#search-results");
    const searchTriggers = $$("[data-open-search]");
    /* Hedefler gerçek dosya + gerçek çapa olmalı: "hakkimizda.html" diye bir sayfa
       yok, kurumsal.html içindeki #biz-kimiz bölümü var. */
    const PAGES = () => [
      { t: T("nav.about"), h: "kurumsal.html#biz-kimiz" },
      { t: T("nav.principles"), h: "kurumsal.html#prensipler" },
      { t: T("nav.catalog"), h: "urunler.html" },
      { t: T("nav.productList"), h: "urun-listesi.html" },
      { t: T("nav.services"), h: "hizmetler.html" },
      { t: T("nav.docs"), h: "dokumanlar.html" },
      { t: T("nav.contact"), h: "iletisim.html" }
    ];
    const row = (title, meta, href) => {
      const a = el("a"); a.href = href;
      a.appendChild(el("span", null, title));
      a.appendChild(el("span", "mono", meta));
      return a;
    };
    function openSearch() { so.classList.add("open"); setExpanded(searchTriggers, so, true); setTimeout(() => input.focus(), SEARCH_FOCUS_MS); }
    function closeSearch() { so.classList.remove("open"); setExpanded(searchTriggers, so, false); input.value = ""; renderResults(""); }
    setExpanded(searchTriggers, so, false);
    searchTriggers.forEach(b => b.addEventListener("click", openSearch));
    so.addEventListener("click", (e) => { if (e.target === so) closeSearch(); });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
      if (e.key === "Escape") { closeSearch(); closeBasket(); closeMenu(); }
    });
    function renderResults(q) {
      const qq = trLower(q.trim());
      if (!qq) { results.replaceChildren(...PAGES().map(p => row(p.t, T("nav.corporate"), p.h))); return; }
      const prods = allProducts()
        .filter(p => trLower([p.n.tr, p.n.en, p.n.ru, p.brand].join(" ")).includes(qq))
        .slice(0, SEARCH_PROD_LIMIT)
        .map(p => row(PNAME(p), p.brand, "urun-listesi.html"));
      const pages = PAGES().filter(p => trLower(p.t).includes(qq)).map(p => row(p.t, T("nav.corporate"), p.h));
      const merged = prods.concat(pages);
      results.replaceChildren(...(merged.length ? merged : [row(T("search.noResult"), T("nav.contact"), "iletisim.html")]));
    }
    input.addEventListener("input", () => renderResults(input.value));
    document.addEventListener("hk:langchange", () => { if (so.classList.contains("open")) renderResults(input.value); else renderResults(""); });
    renderResults("");
  }

  /* ============ 10) Çerez bildirimi ============ */
  const COOKIE_DELAY_MS = 1600;   // sayfa oturduktan sonra göster, açılışta rahatsız etmesin
  const cb = $(".cookie-bar");
  if (cb && !localStorage.getItem("hk_cookie_ok")) {
    setTimeout(() => cb.classList.add("show"), COOKIE_DELAY_MS);
    const ok = $("#cookie-ok");
    if (ok) ok.addEventListener("click", () => { localStorage.setItem("hk_cookie_ok", "1"); cb.classList.remove("show"); });
  }

  /* ============ 11) Formlar ============ */
  /* ============ İletişim / teklif formu ============
     Gönderim Web3Forms üzerinden yapılır (data.js -> HK_COMPANY.web3forms).
     Anahtar boşken veya gönderim başarısızken ziyaretçiyi karanlıkta
     bırakmıyoruz: doğrudan iletişim yollarını (WhatsApp / telefon /
     e-posta) gösteren bir kutu açılıyor. Eski davranış (mailto ile
     ziyaretçinin posta programını açmaya çalışmak) kaldırıldı —
     mobilde çoğu kullanıcıda sessizce hiçbir şey olmuyordu. */
  const cform = $("#contact-form");
  if (cform) {
    /* Bot kalkanı: gizli tuzak alan + en az doldurma süresi + hız sınırı.
       İstemci tarafıdır; kararlı saldırganı durdurmaz, otomatik bot
       trafiğinin ve kazara çift gönderimin maliyetini yükseltir. */
    const tuzak = el("input");
    tuzak.type = "text";
    tuzak.name = "hk_website";
    tuzak.tabIndex = -1;
    tuzak.autocomplete = "off";
    tuzak.setAttribute("aria-hidden", "true");
    tuzak.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0";
    cform.appendChild(tuzak);
    const acilis = Date.now();

    const sbtn = cform.querySelector("[type=submit]");
    const sbtnMetni = sbtn ? sbtn.textContent : "";

    /* Gönderim başarısızsa: ne olduğunu söyle, alternatif kanalları göster */
    function dogrudanIletisim() {
      let kutu = $("#cf-fallback");
      if (kutu) kutu.remove();
      kutu = el("div", "cf-fallback");
      kutu.id = "cf-fallback";
      kutu.appendChild(el("b", null, T("f.failTitle")));
      kutu.appendChild(el("p", null, T("f.failBody")));
      const sira = el("div", "cf-fallback-links");
      const wa = el("a", "btn btn--primary btn--sm", T("f.failWa"));
      wa.href = "https://wa.me/" + HK.whatsapp + "?text=" + encodeURIComponent(T("wa.msg"));
      wa.target = "_blank"; wa.rel = "noopener noreferrer";
      const tel = el("a", "btn btn--sm", HK.phone);
      tel.href = "tel:" + String(HK.phone).replace(/\s/g, "");
      sira.appendChild(wa); sira.appendChild(tel);
      /* Her iki kurumsal kutu da gösterilir: ticari talepler sales@, genel
         konular info@ adresine gider. Ziyaretçi hangisini isterse seçer. */
      [HK.notifyTo || HK.mailQuote, HK.notifyCc || HK.email]
        .filter(function (a, i, d) { return a && d.indexOf(a) === i; })
        .forEach(function (adres) {
          const m = el("a", "btn btn--sm", adres);
          m.href = "mailto:" + adres;
          sira.appendChild(m);
        });
      kutu.appendChild(sira);
      cform.appendChild(kutu);
      kutu.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    cform.addEventListener("submit", (e) => {
      e.preventDefault();
      if (tuzak.value) return;                                   // bot doldurdu
      if (Date.now() - acilis < 2500) { toast(T("guard.tooFast")); return; }

      const data = new FormData(cform);
      const al = (k) => (data.get(k) || "").toString().trim();
      const name = al("name"), firm = al("firm"), msg = al("msg");
      const email = al("email"), phone = al("phone"), topic = al("topic");

      if (!name || !msg) { toast(T("toast.formErr")); return; }
      if (!email || email.indexOf("@") < 1) { toast(T("toast.mailErr")); $("#cf-email").focus(); return; }
      if (typeof hgpRateOk === "function" && !hgpRateOk("form", 3, 10)) { toast(T("guard.tooMany")); return; }

      const eskiKutu = $("#cf-fallback"); if (eskiKutu) eskiKutu.remove();
      if (sbtn) { sbtn.disabled = true; sbtn.textContent = T("f.sending"); }

      hgNotify("Web İletişim Formu — " + (firm || name),
        ["Ad: " + name, "Firma: " + (firm || "—"), "E-posta: " + email,
         "Tel: " + (phone || "—"), "Konu: " + (topic || "—"), "", msg],
        name, email)
        .then(ok => {
          if (sbtn) { sbtn.disabled = false; sbtn.textContent = sbtnMetni; }
          if (ok) { cform.reset(); toast(T("toast.sentOk")); }
          else dogrudanIletisim();
        });
    });
  }

  /* Hesap başvurusu (hesap.html) — NGB modeli: başvur → doğrula → onayla → hesap açılır */
  const aform = $("#acct-form");
  if (aform) {
    const vknInput = $("#ac-vkn"), vknBadge = $("#ac-vkn-badge");
    const checkVkn = () => {
      const v = vknInput.value.replace(/\D/g, "").slice(0, 11);
      vknInput.value = v;
      if (!vknBadge) return;
      if (v.length < 10) { vknBadge.textContent = ""; vknBadge.className = "vkn-badge"; return; }
      const ok = hgpValidTaxId(v);
      vknBadge.textContent = ok ? T("acct.vknOk") : T("acct.vknBad");
      vknBadge.className = "vkn-badge " + (ok ? "ok" : "bad");
    };
    if (vknInput) vknInput.addEventListener("input", checkVkn);
    const demoBtn = $("#ac-demo");
    if (demoBtn) demoBtn.addEventListener("click", () => {
      $("#ac-firm").value = "Örnek Kimya San. ve Tic. Ltd. Şti.";
      $("#ac-taxoffice").value = "Tuzla / İstanbul";
      vknInput.value = "4621003580"; // sağlama basamağı geçerli örnek VKN
      $("#ac-phone").value = "+90 216 000 11 22";
      $("#ac-web").value = "ornekkimya.com.tr";
      $("#ac-address").value = "Sanayi Mah. Deneme Cad. No: 5 Tuzla / İstanbul";
      $("#ac-contact").value = "Deniz Örnek";
      $("#ac-email").value = "satinalma@ornekkimya.com.tr";
      $("#ac-mobile").value = "+90 533 000 11 22";
      $("#ac-kvkk").checked = true;
      checkVkn();
    });

    /* Bildirim gitmediyse başvuruyu ziyaretçinin e-posta istemcisine devret;
       "başvurunuz alındı" ekranı yalnızca gerçekten iletilince açılır. */
    function acctMailFallback(a) {
      const body = [T("acct.mailIntro"), "",
        T("mail.firm") + ": " + a.firm,
        T("mail.taxNo") + ": " + a.taxOffice + " / " + a.vkn,
        T("mail.contact") + ": " + a.contact,
        T("mail.email") + ": " + a.email,
        T("mail.mobile") + ": " + a.mobile,
        T("mail.phone") + ": " + a.phone,
        T("mail.address") + ": " + (a.address || "—"),
        T("mail.web") + ": " + (a.web || "—")]
        .concat(a.msg ? ["", T("mail.message") + ": " + a.msg] : [])
        .join("\n");
      location.href = "mailto:" + HK.email +
        "?subject=" + encodeURIComponent(T("acct.mailSubject") + " — " + a.firm) +
        "&body=" + encodeURIComponent(body);
      toast(T("toast.mailOpening"));
    }

    aform.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (s) => { const n = $(s); return n ? n.value.trim() : ""; };
      const firm = val("#ac-firm"), tax = val("#ac-taxoffice"), vkn = val("#ac-vkn"),
            phone = val("#ac-phone"), web = val("#ac-web"), addr = val("#ac-address"),
            contact = val("#ac-contact"), email = val("#ac-email").toLowerCase(),
            mobile = val("#ac-mobile"), msg = val("#ac-msg");
      if (!firm || !tax || !contact || !phone || !mobile) { toast(T("acct.errReq")); return; }
      if (!hgpValidTaxId(vkn)) { toast(T("acct.errVkn")); vknInput.focus(); return; }
      if (!email || email.indexOf("@") < 1) { toast(T("acct.errMail")); $("#ac-email").focus(); return; }
      if (!$("#ac-kvkk").checked) { toast(T("acct.errKvkk")); return; }
      const app = { firm: firm, taxOffice: tax, vkn: vkn, phone: phone, web: web,
                    address: addr, contact: contact, email: email, mobile: mobile, msg: msg };
      const sbtn = aform.querySelector("[type=submit]");
      if (sbtn) sbtn.disabled = true;
      hgNotify("Hesap Başvurusu — " + firm,
        ["Firma: " + firm, "Vergi D./No: " + tax + " / " + vkn,
         "Yetkili: " + contact, "E-posta: " + email, "Cep: " + mobile,
         "Tel: " + phone, "Adres: " + (addr || "—"), "Web: " + (web || "—")]
          .concat(msg ? ["", "Mesaj: " + msg] : []),
        contact, email)
        .then(ok => {
          if (sbtn) sbtn.disabled = false;
          if (!ok) { acctMailFallback(app); return; }
          // Başvuru kaydı ve başvuru numarası ancak bildirim iletildikten sonra üretilir.
          const id = hgpAddApplication(app);
          const okBox = $("#acct-ok");
          aform.style.display = "none";
          if (okBox) {
            const no = $("#acct-ok-no"); if (no) no.textContent = id;
            okBox.style.display = "";
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        });
    });
  }

  /* ============ 11.5) Kapalı bölüm perdesi ============
     Yayın aşamasında hesap başvurusu ve sipariş takibi kapalı. Sayfalar
     SİLİNMEDİ (sonraki faz için duruyor) ama ziyaretçiye boş/yarım ekran
     göstermek yerine ne olduğunu söyleyip teklif akışına yönlendiriyoruz.
     Bayrak açılınca bu perde kendiliğinden kalkar. */
  (function kapaliBolumPerdesi() {
    const dosya = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const kapali =
      (dosya === "hesap.html" && (typeof HK_FEATURES !== "undefined") && HK_FEATURES.hesapBasvurusu === false) ||
      (dosya === "siparislerim.html" && (typeof HK_FEATURES !== "undefined") && HK_FEATURES.siparis === false);
    if (!kapali) return;

    const ana = $("main");
    if (!ana) return;
    ana.replaceChildren();

    const bolum = el("section", "section");
    const sarmal = el("div", "wrap");
    sarmal.style.maxWidth = "720px";

    const kutu = el("div");
    kutu.style.cssText = "border:1px solid var(--line);border-radius:var(--radius);" +
      "background:var(--white);box-shadow:var(--shadow-offset-sm);padding:52px 34px;text-align:center";

    const h = el("h1", "display");
    h.style.fontSize = "26px";
    h.setAttribute("data-i18n", "soon.title");
    h.textContent = T("soon.title");
    kutu.appendChild(h);

    const p1 = el("p");
    p1.style.cssText = "color:var(--ink-2);max-width:460px;margin:14px auto 0;font-size:var(--fs-body)";
    p1.setAttribute("data-i18n", "soon.body");
    p1.textContent = T("soon.body");
    kutu.appendChild(p1);

    const dugmeler = el("div");
    dugmeler.style.cssText = "display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:26px";
    const b1 = el("a", "btn btn--primary");
    b1.href = "urunler.html";
    b1.setAttribute("data-i18n", "soon.catalog");
    b1.textContent = T("soon.catalog");
    const b2 = el("a", "btn");
    b2.href = "iletisim.html";
    b2.setAttribute("data-i18n", "soon.contact");
    b2.textContent = T("soon.contact");
    dugmeler.appendChild(b1); dugmeler.appendChild(b2);
    kutu.appendChild(dugmeler);

    sarmal.appendChild(kutu);
    bolum.appendChild(sarmal);
    ana.appendChild(bolum);
  })();

  /* ============ 12) Siparişlerim (siparislerim.html) ============ */
  const moWrap = $("#my-orders");
  function renderMyOrders() {
    if (!moWrap) return;
    const loginBox = $("#mo-login");
    const u = window.hkAuth && window.hkAuth.user();
    if (!u || u.role !== "musteri") {
      moWrap.style.display = "none";
      if (loginBox) loginBox.style.display = "";
      return;
    }
    if (loginBox) loginBox.style.display = "none";
    moWrap.style.display = "";
    moWrap.replaceChildren();
    const s = hgpGet();
    const list = s.orders.filter(o => o.customer === u.company);
    const head = el("p", "mo-scope");
    head.appendChild(el("span", "mono", u.company));
    head.appendChild(document.createTextNode(" — " + list.length + " " + T("myord.count")));
    moWrap.appendChild(head);
    if (!list.length) {
      const empty = el("div", "mo-empty");
      empty.appendChild(el("p", null, T("myord.empty")));
      const a = el("a", "btn btn--primary btn--sm", T("myord.browse"));
      a.href = "urunler.html";
      empty.appendChild(a);
      moWrap.appendChild(empty);
      return;
    }
    const STEP_T = [T("myord.s0"), T("myord.s1"), T("myord.s2"), T("myord.s3"), T("myord.s4")];
    const CLS = ["bekliyor", "onay", "uretim", "sevk", "teslim"];
    list.forEach(o => {
      const card = el("article", "mo-card");
      const top = el("div", "mo-head");
      const left = el("div");
      left.appendChild(el("b", "mono", o.id));
      left.appendChild(el("span", null, T("myord.date") + ": " + o.date));
      top.appendChild(left);
      top.appendChild(el("span", "ost ost--" + CLS[o.step], STEP_T[o.step]));
      card.appendChild(top);
      const items = el("div", "mo-items");
      o.items.forEach(i => {
        const r = el("div", "mo-item");
        r.appendChild(el("span", null, i.n));
        r.appendChild(el("span", "mono", i.q));
        items.appendChild(r);
      });
      card.appendChild(items);
      const prog = el("div", "mo-prog");
      const bar = el("i");
      bar.style.width = (o.step / 4 * 100) + "%";
      prog.appendChild(bar);
      card.appendChild(prog);
      const tl = el("div", "mo-tl");
      STEP_T.forEach((st, i) => {
        const d = el("div", "mo-tl-step" + (i < o.step ? " done" : (i === o.step ? " now" : "")));
        d.appendChild(el("b", null, st));
        d.appendChild(el("span", "mono", o.tl[i] || "—"));
        tl.appendChild(d);
      });
      card.appendChild(tl);
      const metaBits = [];
      if (o.eta && o.eta !== "—") metaBits.push(T("myord.eta") + ": " + o.eta);
      if (o.track && o.track !== "—") metaBits.push(T("myord.track") + ": " + o.track);
      if (o.carrier && o.carrier !== "—") metaBits.push(o.carrier);
      if (metaBits.length) card.appendChild(el("p", "mo-meta mono", metaBits.join("  ·  ")));
      // order.noteLabel = "(opsiyonel)" eki olmayan ayrı anahtar; çeviri metnini kesip biçmiyoruz.
      if (o.note) card.appendChild(el("p", "mo-note", T("order.noteLabel") + ": " + o.note));
      moWrap.appendChild(card);
    });
  }
  renderMyOrders();
  const moLoginBtn = $("#mo-login-btn");
  if (moLoginBtn) moLoginBtn.addEventListener("click", () => {
    if (window.hkAuth) window.hkAuth.openLogin(() => renderMyOrders());
  });
  document.addEventListener("hk:authchange", renderMyOrders);
  document.addEventListener("hk:langchange", renderMyOrders);

  /* E-bülten kaydı: kaydın gideceği bir uç yoksa "kaydınız alındı" denmez;
     ziyaretçi kendi e-posta istemcisine yönlendirilir. */
  $$("[id^='newsletter-form']").forEach(nf => nf.addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("input", nf);
    const em = (inp.value || "").trim();
    if (!em || !em.includes("@")) { toast(T("toast.mailErr")); return; }
    const sbtn = nf.querySelector("[type=submit]");
    if (sbtn) sbtn.disabled = true;
    hgNotify("E-bülten Kaydı — " + em, ["E-posta: " + em], em, em).then(ok => {
      if (sbtn) sbtn.disabled = false;
      if (!ok) {
        location.href = "mailto:" + HK.email +
          "?subject=" + encodeURIComponent(T("news.mailSubject")) +
          "&body=" + encodeURIComponent(T("news.mailIntro") + "\n\n" + T("mail.email") + ": " + em);
        toast(T("toast.mailOpening"));
        return;
      }
      inp.value = "";
      toast(T("toast.newsOk"));
    });
  }));

  /* ============ 13) Tanıtım videosu (tıklayınca yükle) ============ */
  $$(".yt-facade").forEach(f => f.addEventListener("click", () => {
    const id = f.dataset.yt;
    if (!id) return;
    const iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0&modestbranding=1";
    iframe.title = "Herkim Kimya";
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen; web-share");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("loading", "lazy");
    f.replaceWith(iframe);
  }));

  /* WhatsApp bağlantıları */
  const setWa = () => $$("[data-wa]").forEach(a => {
    a.href = "https://wa.me/" + HK.whatsapp + "?text=" + encodeURIComponent(T("wa.msg"));
    a.target = "_blank"; a.rel = "noopener";
  });
  setWa();
  document.addEventListener("hk:langchange", setWa);
})();
