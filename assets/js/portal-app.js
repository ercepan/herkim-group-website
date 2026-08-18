/* ============================================================
   HERKİM PORTAL — Uygulama mantığı (uçtan uca tek akış)
   YALNIZ PERSONEL: satış · depo · yönetim. Üç rol vardır, dördüncüsü yoktur.
   Sipariş ve talep ANA SİTEDEN düşer (müşteri kendi siparişini
   siparislerim.html'den izler) → Satış onaylar → Depo ilerletir → Yönetim izler.
   Müşteri rolü portalda BULUNMAZ; ana sitenin oturumu (site-auth.js) aynı
   anahtarı "musteri" rolüyle yazdığı için boot() o oturumu tanıyıp portalı
   açmaz — oturumu da silmez, çünkü kullanıcı ana sitede hâlâ açıktır.
   Güvenli DOM API'leri (innerHTML yok). Demo verisi: portal-store.js.

   İÇİNDEKİLER
     1. Yardımcılar ($, $$, el, need, T)
     2. Sabitler (oturum, adım indeksleri, durum kodları, zaman aşımları)
     3. Bildirim (toast)
     4. Giriş + güvenlik (oturum, kilitlenme, boşta kalma)
     5. Rol yapılandırması (NAV / TITLES / ROLE_LABEL + ROL EKLEME REHBERİ)
     6. Kabuk (buildNav, show, logo → özet)
     7. Durum çipi / ilerleme çubuğu
     8. KPI + huni + aktivite akışı
     9. Sipariş tabloları (orderRow, renderOrders, renderDash)
    10. Talepler (liste, yanıt, yeni talep formu)
    11. Müşteri kartları (satış)
    12. Hesap başvuruları (satış onay kutusu)
    13. Operasyon panosu (depo)
    14. Katalog yönetimi — ortak parçalar (form alanları, dışa aktarım paneli)
    15. Ürün yönetimi (satış / yönetim)
    16. Doküman yönetimi (satış / yönetim)
    17. Sipariş çekmecesi
    18. Müşteri kartı çekmecesi
    19. Toplu çizim + başlatma (renderAll, boot)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. Yardımcılar ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  /* Beklenen kap bulunamazsa sessizce kaybolmak yerine konsola iz bırakırız;
     eksik bir kap her zaman portal.html ile bu dosyanın uyuşmadığı anlamına gelir. */
  function need(sel) {
    var n = $(sel);
    if (!n) console.warn("Herkim portal: beklenen öğe bulunamadı — " + sel);
    return n;
  }
  /* Çeviri: i18n.js yüklüyse sözlükten, değilse ikinci argümandaki Türkçe metinden.
     portal.html şu an i18n.js yüklemediği için yedek metin zorunludur. */
  function T(key, tr) {
    if (typeof window.hkT === "function") {
      var v = window.hkT(key);
      if (v && v !== key) return v;
    }
    return tr;
  }

  /* ---------- 2. Sabitler ---------- */
  /* Oturum/kilit sabitleri portal-store.js'te TEK noktada tanımlıdır ve site-auth.js
     ile aynı anahtarları paylaşır. Burada kopyalamak iki tarafın sessizce ayrışmasına
     yol açtığı için kopya tutmuyoruz; store yüklenmediyse portal zaten çalışamaz. */
  if (typeof HGP_SESSION_KEY === "undefined") {
    console.warn("Herkim portal: portal-store.js oturum sabitleri yüklenmedi — portal başlatılamadı.");
    return;
  }

  /* Sipariş adımları: HGP_STEPS / HGP_STEP_CLASS dizilerindeki indeksler (portal-store.js) */
  var STEP_ONAY = 0, STEP_ONAYLANDI = 1, STEP_URETIM = 2, STEP_SEVK = 3, STEP_TESLIM = 4;
  /* Talep ve başvuru durum kodları (depoda bu birebir string olarak saklanır) */
  var REQ_ACIK = "acik", REQ_YANIT = "yanit";
  var APP_BEKLIYOR = "bekliyor", APP_CAKISMA = "cakisma";

  var TOAST_MS = 2800;          // bildirimin ekranda kalma süresi
  var TOUCH_THROTTLE_MS = 30000; // oturum "son etkinlik" damgasını en fazla bu sıklıkta yazarız
  var IDLE_POLL_MS = 60000;      // boşta kalma denetiminin tekrar aralığı
  var COUNT_ANIM_MS = 600;       // KPI sayaç animasyonu
  var DASH_ROWS = 5;             // özet ekranındaki sipariş satırı sayısı

  var USER = null, curView = "dash";

  /* ---------- 3. Bildirim ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = el("div", "toast"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, TOAST_MS);
  }

  /* ---------- 4. Giriş + güvenlik ---------- */
  function nowMs() { return Date.now(); }
  function getSes() {
    /* Oturum sessionStorage'tadır (bkz. portal-store.js): sekme kapanınca
       tarayıcı siler, unutulan hesap bir sonraki kişiye açık kalmaz. */
    return hgpSesRead();
  }
  /* localStorage yazımı gizli sekmede ve kota dolduğunda İSTİSNA fırlatır. Sarmalanmazsa
     istisna burada patlar, boot() hiç çağrılmaz ve giriş düğmesi kullanıcıya hiçbir şey
     söylemeden ölür. Hatayı yutmuyoruz: konsola iz bırakıp kullanıcıya sebebini söylüyoruz. */
  function enter(role, acct) {
    var payload = { role: role, at: nowMs() };
    if (acct) payload.acct = acct;
    try {
      if (!hgpSesWrite(payload)) throw new Error("sessionStorage yazılamadı");
      localStorage.removeItem(HGP_LOCK_KEY);
      localStorage.setItem(HGP_LAST_LOGIN + role, hgpNow());
    } catch (e) {
      console.warn("Herkim portal: oturum KAYDEDİLEMEDİ (localStorage yazılamıyor — gizli sekme veya dolu kota). Giriş yapılamadı.", e);
      toast(T("portal.login.storageFail",
        "Giriş kaydedilemedi: tarayıcı depolamaya izin vermiyor (gizli sekme olabilir)."));
      return;
    }
    boot();
  }
  $$("[data-role]").forEach(function (b) {
    b.addEventListener("click", function () { enter(b.getAttribute("data-role")); });
  });

  /* GİRİŞ: yalnız rol düğmeleriyle. E-posta/şifre formu KALDIRILDI.
     Gerekçe: rol düğmeleri enter(role) ile doğrudan giriyor ve ŞİFREYİ HİÇ
     SORMUYORDU (yukarıdaki [data-role] bağlaması) — form personel için zaten
     bir kapı değildi. Tek gerçek işlevi müşteri e-postasıyla giriş yolu açmaktı;
     müşteri rolü portaldan çıkınca bu yol da kapandı ve geriye "doğru şifreyi
     yaz, sonra çalışmadığını öğren" diyen bir form kalıyordu.
     Kilit sayaçları (HGP_LOCK_*) portal-store.js'te DURUYOR: ana sitedeki
     gerçek müşteri girişi (site-auth.js) onları kullanmaya devam ediyor.
     NOT: bu portalın gerçek bir kimlik denetimi YOKTUR ve olamaz — statik site,
     sunucu yok. Rol düğmesi = giriş. Gerçek denetim ancak bir sunucu ile gelir. */
  var errBox = $("#lg-err");
  /* Portal yalnız personelindir; buraya düşen müşteriye nereye gideceğini
     söylemek zorundayız. Uyarı kutusuna açıklama + "Siparişlerim" bağlantısı
     basar. innerHTML YOK: metin düğümü ve <a> ayrı ayrı kurulur. Kutu
     role="alert" olduğu için değişikliği ekran okuyucu kendiliğinden duyurur. */
  function showCustomerNotice(lead) {
    if (!errBox) return;
    errBox.textContent = "";
    errBox.appendChild(document.createTextNode(lead + " "));
    var a = el("a", "accent", T("portal.login.myOrdersLink", "Siparişlerim →"));
    a.href = "siparislerim.html";
    errBox.appendChild(a);
    errBox.classList.remove("show"); void errBox.offsetWidth;
    errBox.classList.add("show");
  }

  function logout() { hgpSesClear(); location.reload(); }
  var btnLogout = need("#btn-logout");
  if (btnLogout) btnLogout.addEventListener("click", logout);
  var btnSwitch = need("#btn-switch");
  if (btnSwitch) btnSwitch.addEventListener("click", logout);
  var btnReset = need("#btn-reset");
  if (btnReset) btnReset.addEventListener("click", function () {
    hgpReset();
    toast("Demo verisi başa sarıldı.");
    renderAll();
  });

  function touch() {
    var s = getSes();
    if (!s) return;
    if (nowMs() - (s.touched || s.at) > TOUCH_THROTTLE_MS) {
      s.touched = nowMs();
      hgpSesWrite(s);
    }
  }
  ["click", "keydown", "scroll", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, touch, { passive: true });
  });
  setInterval(function () {
    var s = getSes();
    if (s && nowMs() - (s.touched || s.at) > HGP_IDLE_MS) logout();
  }, IDLE_POLL_MS);

  /* ---------- 5. Rol yapılandırması ----------
     ROL EKLEME REHBERİ
     Portalda ÜÇ rol vardır ve hepsi Herkim personelidir: satis · depo · yonetim.
     Müşteri rolü yoktur — müşteri ana sitede kalır (siparislerim.html). Aşağıdaki
     tablolara "musteri" satırı EKLEMEYİN; portalı müşteriye açmak istiyorsanız
     karar önce ürün tarafında verilir, bu dosya ondan sonra değişir.
     Yeni bir rol (ya da yeni bir ekran) eklerken sırasıyla şu noktalara uğrayın.
     A) TABLOLAR — yeni rol için satır eklemek yeterli, kod değişmez:
        NAV .................. sol menü öğeleri + rozet sayaçları
        TITLES ............... ekran başlıkları (görünüm → rol → başlık)
        ROLE_LABEL ........... başlıktaki rol künyesi
        SHOWS_CUSTOMER ....... sipariş tablolarında "müşteri" sütunu görünsün mü
        FEED_LIMIT ........... aktivite akışında kaç satır gösterilecek
        DASH_LIST_TITLE ...... özet ekranındaki liste başlığı
        SHOW_FUNNEL .......... özet ekranında huni paneli görünsün mü
        SHOW_FEED ............ özet ekranında aktivite paneli görünsün mü
        CAN_CREATE_REQUEST ... "yeni talep" formu görünsün mü
        CAN_EDIT_CATALOG ..... katalog yönetimi ekranları (Ürünler / Dokümanlar) açılsın mı
     B) HÂLÂ ELLE DALLANAN YERLER — davranışları rollere göre gerçekten farklı
        olduğu için tabloya indirgenmedi; yeni rolde tek tek gözden geçirin.
        Satır numaraları yaklaşıktır, şaşarsa `USER.role` araması listenin tamamını verir:
        renderKpis .................... her rol için ayrı KPI seti ................. ~sat. 422
        renderOrders (sıralama) ....... "satis" listeyi adıma göre sıralar ......... ~sat. 515
        renderDash (sıralama) ......... "satis"/"depo" farklı önceliklendirir ...... ~sat. 541
        renderRequests (yanıt kutusu) . yalnız "satis" talep yanıtlar .............. ~sat. 565
        renderApplications ............ yalnız "satis" başvuru kutusunu görür ...... ~sat. 691
        allowed (görünüm kilidi) ...... katalog ekranları CAN_EDIT_CATALOG'a bakar . ~sat. 349
        openOrder (aksiyonlar) ........ "satis" onaylar, "depo" ilerletir .......... ~sat. 1356
        boot (müşteri oturumu) ........ "musteri" oturumu portalı AÇMAZ ............ ~sat. 1533
     Ayrıca portal.html'de yeni görünüm için #view-<ad> kabı ve show() içindeki
     görünüm listesi (VIEWS) güncellenmelidir.
     ÖRNEK — "Ürünler"/"Dokümanlar" ekranları böyle bağlandı: NAV'a satis ve
     yonetim satırı, TITLES'a iki görünüm, CAN_EDIT_CATALOG tablosu, VIEWS'a iki
     ad, allowed() içinde ikinci denetim, renderAll'da renderProducts/renderDocs.
     Depo bilerek DIŞARIDA bırakıldı: katalogu düzenlemek satışın ve yönetimin
     işidir. */
  var NAV = {
    satis: [
      { v: "dash", t: "CRM Özeti" },
      { v: "orders", t: "Siparişler & Onay", cnt: "onay" },
      { v: "requests", t: "Gelen Talepler", cnt: "acik" },
      { v: "customers", t: "Müşteri Kartları", cnt: "basvuru" },
      { v: "products", t: "Ürünler" },
      { v: "docs", t: "Dokümanlar" }
    ],
    depo: [
      { v: "dash", t: "Özet" },
      { v: "ops", t: "Operasyon Panosu", cnt: "ops" }
    ],
    yonetim: [
      { v: "dash", t: "Dashboard" },
      { v: "orders", t: "Tüm Siparişler" },
      { v: "requests", t: "Talepler" },
      { v: "products", t: "Ürünler" },
      { v: "docs", t: "Dokümanlar" }
    ]
  };
  var TITLES = {
    dash: { satis: "CRM Özeti", depo: "Operasyon Özeti", yonetim: "Yönetim Dashboard'u" },
    orders: { satis: "Siparişler & Onay", depo: "Siparişler", yonetim: "Tüm Siparişler" },
    requests: { satis: "Gelen Talepler", yonetim: "Talepler" },
    customers: { satis: "Müşteri Kartları" },
    ops: { depo: "Operasyon Panosu" },
    products: { satis: "Ürün Yönetimi", yonetim: "Ürün Yönetimi" },
    docs: { satis: "Doküman Yönetimi", yonetim: "Doküman Yönetimi" }
  };
  var ROLE_LABEL = { satis: "SATIŞ · CRM", depo: "DEPO / ÜRETİM", yonetim: "YÖNETİM" };

  /* Rol → ekran davranışı tabloları (yukarıdaki rehberin A maddesi) */
  var SHOWS_CUSTOMER = { satis: true, depo: true, yonetim: true };
  var FEED_LIMIT = { satis: 7, depo: 7, yonetim: 14 };
  var DASH_LIST_TITLE = {
    satis: "Önce onay bekleyenler",
    depo: "Süreçteki siparişler", yonetim: "Son siparişler"
  };
  var SHOW_FUNNEL = { satis: true, depo: false, yonetim: true };
  var SHOW_FEED = { satis: true, depo: true, yonetim: true };
  /* Talep ANA SİTEDEN düşer; portalda talep AÇAN rol yoktur — bu yüzden üçü de
     false ve #new-req-panel hiçbir rolde görünmez. Tablo yine de duruyor: talebi
     içeriden açabilen bir rol gerekirse tek satır true yapmak yetsin. */
  var CAN_CREATE_REQUEST = { satis: false, depo: false, yonetim: false };
  /* Katalog yönetimi (Ürünler / Dokümanlar) satış ve yönetimindir.
     "depo" DIŞARIDA: deponun işi akan siparişi ilerletmek, ürün tanımlamak değil. */
  var CAN_EDIT_CATALOG = { satis: true, depo: false, yonetim: true };

  /* CSS display değeri: "" satırı olduğu gibi bırakır, "none" gizler */
  function vis(on) { return on ? "" : "none"; }

  /* Personelin hepsi tüm kayıtları görür; süzme yalnız ekran içindeki
     sıralama/filtre denetimleriyle yapılır. (Kendi kaydını gören müşteri rolü
     portaldan kaldırıldı; kopyayı bozmamak için liste yine kopyalanır.) */
  function myOrders(s) { return s.orders.slice(); }
  function myRequests(s) { return s.requests.slice(); }

  /* ---------- 6. Kabuk ---------- */
  /* Depoda tutulan ham adım/durum kodlarını sayan yardımcılar (rozetler + huni ortak kullanır) */
  function countStep(list, from, to) {
    return list.filter(function (o) { return o.step >= from && o.step <= to; }).length;
  }
  function countOpenRequests(list) {
    return list.filter(function (r) { return r.status === REQ_ACIK; }).length;
  }

  var VIEWS = ["dash", "orders", "requests", "customers", "ops", "products", "docs"];

  function buildNav() {
    var s = hgpGet();
    var wrap = need("#sb-nav");
    if (!wrap) return;
    wrap.textContent = "";
    NAV[USER.role].forEach(function (item) {
      var b = el("button", "sb-link" + (item.v === curView ? " on" : ""), item.t + " ");
      if (item.cnt) {
        var n = 0;
        if (item.cnt === "onay") n = countStep(s.orders, STEP_ONAY, STEP_ONAY);
        if (item.cnt === "acik") n = countOpenRequests(s.requests);
        if (item.cnt === "ops") n = countStep(s.orders, STEP_ONAYLANDI, STEP_SEVK);
        if (item.cnt === "basvuru") n = (s.applications || []).filter(function (a) { return a.status === APP_BEKLIYOR; }).length;
        if (n) b.appendChild(el("span", "cnt", String(n)));
      }
      b.addEventListener("click", function () { show(item.v); });
      wrap.appendChild(b);
    });
  }

  /* Görünüm rol için açık mı? Menü zaten yalnızca rolün NAV satırlarını basar;
     buradaki ikinci denetim show()'un menü dışından da çağrılabilmesi içindir
     (adres çubuğuna yazılan portal.html#products gibi).
     GÜVENLİK DEĞİLDİR: istemcideki her denetim gibi konsoldan atlatılabilir —
     4. bölümdeki uyarı burası için de geçerlidir, gerçek yetki denetimi
     sunucuda yapılır. Amacı yanlış ekrana düşmeyi önlemek. */
  function allowed(v) {
    if (v === "products" || v === "docs") return !!CAN_EDIT_CATALOG[USER.role];
    return true;
  }

  function show(v) {
    if (!allowed(v)) v = "dash";
    curView = v;
    VIEWS.forEach(function (x) {
      var p = $("#view-" + x);
      if (p) p.style.display = (x === v) ? "" : "none";
    });
    var title = $("#page-title");
    if (title) title.textContent = (TITLES[v] && TITLES[v][USER.role]) || "";
    buildNav();
    renderAll();
  }

  /* Sol menüdeki logo portalın KENDİ özetine gider, ana siteye değil.
     href="portal.html" bilerek duruyor: JS çalışmazsa da, orta tıkla/yeni
     sekmede de gerçek bir bağlantıdır. Burada yalnızca aynı sayfadaki tam
     yenilemeyi engelleyip görünümü anında değiştiriyoruz. Değiştirici tuşlarla
     tıklamaya karışmayız — kullanıcı yeni sekmede açmak istiyor olabilir.
     (Giriş ekranındaki logo ayrıdır ve ana siteye gitmeye devam eder: orada
     henüz oturum yoktur, gidilecek bir özet ekranı da yoktur.) */
  var sbBrand = need("#sb-brand");
  if (sbBrand) sbBrand.addEventListener("click", function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (!USER) return;
    show("dash");
  });

  /* ---------- 7. Durum çipi / ilerleme ---------- */
  /* Adım indeksini dizilerin sınırına kıstırırız: bozuk bir kayıt "st st--undefined" üretmesin */
  function safeStep(step) {
    var i = step | 0;
    if (i < STEP_ONAY || i > STEP_TESLIM) {
      console.warn("Herkim portal: geçersiz sipariş adımı — " + step);
      i = Math.max(STEP_ONAY, Math.min(STEP_TESLIM, i));
    }
    return i;
  }
  function chip(step) {
    var i = safeStep(step);
    return el("span", "st st--" + HGP_STEP_CLASS[i], HGP_STEPS[i]);
  }
  function prog(step) {
    var i = safeStep(step);
    var w = el("div", "prog");
    var bar = el("div", "bar"); var f = el("i");
    f.style.width = (i / STEP_TESLIM * 100) + "%";
    bar.appendChild(f); w.appendChild(bar);
    w.appendChild(el("span", null, (i + 1) + "/" + HGP_STEPS.length));
    return w;
  }

  /* ---------- 8. KPI + huni + akış ---------- */
  function countTo(elm, n) {
    var t0 = performance.now();
    (function step(t) {
      var p = Math.min((t - t0) / COUNT_ANIM_MS, 1);
      elm.textContent = Math.round(n * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function kpi(val, label) {
    var k = el("div", "kpi");
    var b = el("b", null, "0");
    k.appendChild(b); k.appendChild(el("span", null, label));
    countTo(b, val);
    return k;
  }
  function renderKpis() {
    var s = hgpGet(), o = myOrders(s), r = myRequests(s);
    var row = need("#kpi-row");
    if (!row) return;
    row.textContent = "";
    var steps = function (from, to) { return countStep(o, from, to); };
    var open = countOpenRequests(r);
    if (USER.role === "satis") {
      row.appendChild(kpi(steps(STEP_ONAY, STEP_ONAY), "Onay bekleyen sipariş"));
      row.appendChild(kpi(open, "Açık talep"));
      row.appendChild(kpi(steps(STEP_ONAYLANDI, STEP_SEVK), "Süreçteki sipariş"));
      row.appendChild(kpi(HGP_CUSTOMERS.length + (s.customers || []).length, "Aktif müşteri"));
    } else if (USER.role === "depo") {
      row.appendChild(kpi(steps(STEP_ONAYLANDI, STEP_ONAYLANDI), "Üretim bekleyen"));
      row.appendChild(kpi(steps(STEP_URETIM, STEP_URETIM), "Üretimde"));
      row.appendChild(kpi(steps(STEP_SEVK, STEP_SEVK), "Sevkiyatta"));
      row.appendChild(kpi(steps(STEP_TESLIM, STEP_TESLIM), "Teslim (2026)"));
    } else {
      row.appendChild(kpi(o.length, "Toplam sipariş (2026)"));
      row.appendChild(kpi(steps(STEP_ONAY, STEP_ONAY), "Onay bekleyen"));
      row.appendChild(kpi(steps(STEP_URETIM, STEP_SEVK), "Üretim + sevkiyat"));
      row.appendChild(kpi(open, "Açık talep"));
    }
  }
  function renderFunnel() {
    var s = hgpGet();
    var wrap = need("#funnel");
    if (!wrap) return;
    wrap.textContent = "";
    var rows = [
      ["Açık talep", countOpenRequests(s.requests)],
      ["Onay bekleyen", countStep(s.orders, STEP_ONAY, STEP_ONAY)],
      ["Üretim + sevkiyat", countStep(s.orders, STEP_ONAYLANDI, STEP_SEVK)],
      ["Teslim edilen", countStep(s.orders, STEP_TESLIM, STEP_TESLIM)]
    ];
    var max = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    rows.forEach(function (r) {
      var row = el("div", "fun-row");
      row.appendChild(el("span", "mono", r[0]));
      var bar = el("div", "fun-bar"); var f = el("i");
      // Sıfır değerde bile çubuk görünsün diye taban genişlik %4
      f.style.width = Math.max(4, r[1] / max * 100) + "%";
      bar.appendChild(f); row.appendChild(bar);
      row.appendChild(el("b", null, String(r[1])));
      wrap.appendChild(row);
    });
  }
  function renderFeed() {
    var s = hgpGet();
    var wrap = need("#feed");
    if (!wrap) return;
    wrap.textContent = "";
    var list = s.activities.slice(0, FEED_LIMIT[USER.role] || 7);
    if (!list.length) { wrap.appendChild(el("div", "empty2", "Henüz aktivite yok.")); return; }
    list.forEach(function (a) {
      var it = el("div", "feed-item");
      it.appendChild(el("span", "feed-dot " + (a.type || "")));
      var mid = el("div");
      mid.appendChild(el("b", null, a.what));
      mid.appendChild(el("span", null, a.who));
      it.appendChild(mid);
      it.appendChild(el("span", "when mono", a.when));
      wrap.appendChild(it);
    });
  }

  /* ---------- 9. Sipariş tabloları ---------- */
  /* İlk sütunun başlığı ile gövdesi aynı tablodan (SHOWS_CUSTOMER) beslenir ki ayrışmasınlar */
  function idColTitle() { return SHOWS_CUSTOMER[USER.role] ? "SİPARİŞ / MÜŞTERİ" : "SİPARİŞ"; }
  function orderRow(o, opts) {
    var tr = el("tr");
    var td1 = el("td");
    td1.appendChild(el("span", "t-id", o.id));
    if (SHOWS_CUSTOMER[USER.role]) td1.appendChild(el("span", "t-cust", o.customer));
    tr.appendChild(td1);
    tr.appendChild(el("td", null, o.items.map(function (i) { return i.n; }).join(" · ")));
    if (!opts || !opts.compact) tr.appendChild(el("td", "mono", o.date));
    var tds = el("td"); tds.appendChild(chip(o.step)); tr.appendChild(tds);
    if (!opts || !opts.compact) {
      var tdp = el("td"); tdp.appendChild(prog(o.step)); tr.appendChild(tdp);
      tr.appendChild(el("td", "mono", o.eta));
    }
    tr.addEventListener("click", function () { openOrder(o.id); });
    return tr;
  }
  function thRow(tr, cols) {
    if (!tr) return;
    tr.textContent = "";
    cols.forEach(function (c) { tr.appendChild(el("th", null, c)); });
  }
  var ORDER_COLS = 6;          // tam sipariş tablosundaki sütun sayısı (boş satır colSpan'i)
  var OSTATUS_ALL = "all";     // durum süzgecinde "tümü" seçeneğinin değeri
  var oq = "", ost = OSTATUS_ALL;
  function renderOrders() {
    var s = hgpGet();
    var body = $("#orders-body"); if (!body) return;
    thRow($("#orders-thead"), [idColTitle(), "KALEMLER", "TARİH", "DURUM", "İLERLEME", "TAHMİNİ TESLİM"]);
    body.textContent = "";
    var list = myOrders(s).filter(function (o) {
      if (ost !== OSTATUS_ALL && String(o.step) !== ost) return false;
      if (oq) {
        var hay = (o.id + " " + o.customer + " " + o.items.map(function (i) { return i.n; }).join(" ")).toLocaleLowerCase("tr");
        if (hay.indexOf(oq.toLocaleLowerCase("tr")) === -1) return false;
      }
      return true;
    });
    if (USER.role === "satis") list.sort(function (a, b) { return a.step - b.step; });
    if (!list.length) {
      var tr = el("tr"), td = el("td", "empty2", "Kayıt bulunamadı.");
      td.colSpan = ORDER_COLS; tr.appendChild(td); body.appendChild(tr);
      return;
    }
    list.forEach(function (o) { body.appendChild(orderRow(o)); });
  }
  var os = $("#o-search");
  if (os) os.addEventListener("input", function () { oq = os.value; renderOrders(); });
  var osel = $("#o-status");
  if (osel) osel.addEventListener("change", function () { ost = osel.value; renderOrders(); });

  function renderDash() {
    var s = hgpGet();
    var body = need("#dash-body");
    if (!body) return;
    thRow($("#dash-thead"), [idColTitle(), "KALEMLER", "DURUM"]);
    body.textContent = "";
    var list = myOrders(s);
    // Satış önce onay bekleyeni, depo önce süreçte olanı görmek ister
    if (USER.role === "satis") list = list.filter(function (o) { return o.step === STEP_ONAY; }).concat(list.filter(function (o) { return o.step > STEP_ONAY; }));
    if (USER.role === "depo") list = list.filter(function (o) { return o.step >= STEP_ONAYLANDI && o.step <= STEP_SEVK; }).concat(list.filter(function (o) { return o.step === STEP_ONAY || o.step === STEP_TESLIM; }));
    list.slice(0, DASH_ROWS).forEach(function (o) { body.appendChild(orderRow(o, { compact: true })); });
    var lt = $("#dash-list-title");
    if (lt) lt.textContent = DASH_LIST_TITLE[USER.role] || "Son siparişler";
    var fp = $("#dash-funnel-panel");
    if (fp) fp.style.display = vis(SHOW_FUNNEL[USER.role]);
    var ap = $("#feed-panel");
    if (ap) ap.style.display = vis(SHOW_FEED[USER.role]);
  }
  var dashMore = $("#dash-more");
  if (dashMore) dashMore.addEventListener("click", function () { show("orders"); });

  /* ---------- 10. Talepler ---------- */
  var REQ_DETAIL_MAX = 500; // portal.html'deki #rf-detail maxlength değeriyle aynı olmalı
  var REPLY_MAX = 300;      // satış yanıtı için üst sınır
  function renderRequests() {
    var s = hgpGet();
    var wrap = $("#req-list"); if (!wrap) return;
    var newPanel = $("#new-req-panel");
    if (newPanel) newPanel.style.display = vis(CAN_CREATE_REQUEST[USER.role]);
    wrap.textContent = "";
    var list = myRequests(s);
    if (!list.length) { wrap.appendChild(el("div", "empty2", "Henüz talep yok.")); return; }
    list.forEach(function (r) {
      var card = el("div", "panel");
      var head = el("div", "panel-head");
      var left = el("div");
      var t = el("b", null, r.subject);
      // Biçim tamamen CSS'te: .panel-head b kuralı diğer panel başlıklarıyla aynı
      // yazı tipini, puntoyu ve rengi verir. Buraya satır içi stil YAZMAYIN —
      // eskiden yalnız punto ayarlanıyordu, yazı tipi gövdeden mirasla geliyordu.
      left.appendChild(t);
      left.appendChild(el("span", "mono", r.id + " · " + r.date + (SHOWS_CUSTOMER[USER.role] ? " · " + r.customer : "")));
      head.appendChild(left);
      var right = el("div");
      right.style.cssText = "display:flex;gap:var(--space-xs);align-items:center";
      if (r.viaLanding) right.appendChild(el("span", "st st--landing", "Landing"));
      var acik = r.status === REQ_ACIK;
      right.appendChild(el("span", acik ? "st st--" + REQ_ACIK : "st st--" + REQ_YANIT, acik ? "Açık" : "Yanıtlandı"));
      head.appendChild(right);
      card.appendChild(head);
      var body = el("div");
      body.style.cssText = "padding:var(--space-md)";
      body.appendChild(el("p", null, r.detail));
      if (r.reply) {
        var rep = el("div", "crm-note2");
        rep.style.marginTop = "var(--space-sm)";
        var rb = el("div");
        rb.appendChild(el("b", null, r.reply.by + " · " + r.reply.when));
        var rp = el("p", null, r.reply.text);
        rp.style.marginTop = "var(--space-2xs)";
        rb.appendChild(rp);
        rep.appendChild(rb);
        body.appendChild(rep);
      }
      if (USER.role === "satis" && r.status === REQ_ACIK) {
        var box = el("div", "reply-box");
        box.style.marginTop = "var(--space-sm)";
        var ta = el("textarea");
        ta.placeholder = "Yanıtınız… (müşteriye ve CRM kartına işlenir)";
        ta.maxLength = REPLY_MAX;
        var btn = el("button", "btn btn--primary btn--sm", "Yanıtla");
        btn.style.marginTop = "var(--space-xs)";
        btn.addEventListener("click", function () {
          var txt = ta.value.trim();
          if (!txt) { toast("Yanıt boş olamaz."); return; }
          hgpReply(r.id, txt, USER.name);
          toast("Yanıt gönderildi — müşteri portalında görünür ✓");
          renderAll();
        });
        box.appendChild(ta); box.appendChild(btn);
        body.appendChild(box);
      }
      card.appendChild(body);
      wrap.appendChild(card);
    });
  }
  var rfd = $("#rf-detail"), rfc = $("#rf-count"), rfs = $("#rf-subject");
  function setReqCount(n) { if (rfc) rfc.textContent = n + "/" + REQ_DETAIL_MAX; }
  if (rfd) rfd.addEventListener("input", function () { setReqCount(rfd.value.length); });
  var rf = $("#req-form");
  if (rf) rf.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!rfs || !rfd) { console.warn("Herkim portal: talep formu alanları eksik."); return; }
    var subj = rfs.value.trim(), det = rfd.value.trim();
    if (!subj || !det) { toast("Lütfen konu ve detay girin."); return; }
    hgpAddRequest(USER.company, subj, det, USER.name + " (" + USER.company + ")");
    if (typeof hgNotify === "function")
      hgNotify("Yeni Talep — " + USER.company,
        ["Konu: " + subj, "", det, "", "Talep eden: " + USER.name + " (" + USER.company + ")"], USER.name);
    rf.reset(); setReqCount(0);
    toast("Talebiniz satış temsilcinizin CRM kutusuna düştü ✓");
    renderAll();
  });

  /* ---------- 11. Müşteri kartları (satış) ---------- */
  /* CRM'deki tüm müşteriler: sabit demo kartları + onaylı başvurulardan doğanlar */
  function allCustomers(s) { return HGP_CUSTOMERS.concat(s.customers || []); }
  /* Unvan karşılaştırması: portal-store.js'teki hgpNormFirm ile BİREBİR AYNI olmalıdır.
     Sebep: buradaki uyarı rozeti, onayı gerçekten reddeden kural (hgpDecideApplication)
     ile aynı şeyi göstermezse temsilci uyarısız kalır ya da boş yere uyarılır. Bu yüzden
     boşluk sadeleştirmesinin yanında i harfi ailesi (i/İ/I/ı) de tek harfe indirgenir.
     Kural değişecekse önce portal-store.js'te değişir, sonra burası ona uydurulur. */
  function normFirm(x) {
    return String(x == null ? "" : x)
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[İIıi]/g, "i")
      .toLocaleLowerCase("tr");
  }
  function firmClash(s, firm) {
    var key = normFirm(firm);
    if (!key) return false;
    return allCustomers(s).some(function (c) { return normFirm(c.name) === key; });
  }

  function renderCustomers() {
    var s = hgpGet();
    var wrap = $("#cust-grid"); if (!wrap) return;
    wrap.textContent = "";
    renderApplications(s);
    allCustomers(s).forEach(function (c) {
      var oc = s.orders.filter(function (o) { return o.customer === c.name; }).length;
      var rc = s.requests.filter(function (r) { return r.customer === c.name && r.status === REQ_ACIK; }).length;
      var card = el("div", "cust-card");
      card.appendChild(el("h3", null, c.name));
      card.appendChild(el("span", "mono", c.city + " · Temsilci: " + c.rep + " · " + c.since + "'den beri"));
      var mini = el("div", "cust-mini");
      [[oc, "SİPARİŞ"], [rc, "AÇIK TALEP"], [(c.history || []).length, "TEMAS"]].forEach(function (m) {
        var d = el("div");
        d.appendChild(el("b", null, String(m[0])));
        d.appendChild(el("span", null, m[1]));
        mini.appendChild(d);
      });
      card.appendChild(mini);
      card.addEventListener("click", function () { openCust(c); });
      wrap.appendChild(card);
    });
  }

  /* ---------- 12. Hesap başvuruları (satış onay kutusu) ---------- */
  function renderApplications(s) {
    var view = $("#view-customers"); if (!view) return;
    var old = $("#apps-panel", view);
    if (old) old.remove();
    if (USER.role !== "satis") return;
    var pend = (s.applications || []).filter(function (a) { return a.status === APP_BEKLIYOR; });
    if (!pend.length) return;
    var panel = el("div", "panel");
    panel.id = "apps-panel";
    panel.style.marginBottom = "var(--space-md)";
    /* Başlık bandı: sınıf "panel-head" olmalı — "p-head" hiçbir stil dosyasında
       tanımlı değildi, bu yüzden başlık ve notu panel kenarına yapışık, alt
       çizgisiz ve tarayıcı varsayılan puntosuyla çıkıyordu. Not satırı da
       diğer panellerdeki gibi .ops-note basamağını alır. */
    var head = el("div", "panel-head");
    head.appendChild(el("h3", null, "Bekleyen Hesap Başvuruları (" + pend.length + ")"));
    head.appendChild(el("span", "ops-note mono", "Web sitesinden — firma doğrulaması sizde"));
    panel.appendChild(head);
    pend.forEach(function (a) {
      var row = el("div", "app-row");
      var info = el("div", "app-info");
      info.appendChild(el("b", null, a.firm));
      var vknOk = hgpValidTaxId(a.vkn);
      var l1 = el("span", "mono");
      l1.appendChild(document.createTextNode("VKN: " + a.vkn + " · " + a.taxOffice + " "));
      l1.appendChild(el("i", "vkn-badge " + (vknOk ? "ok" : "bad"), vknOk ? "✓ biçim geçerli" : "✗ biçim geçersiz"));
      info.appendChild(l1);
      // Kiracı çakışması: aynı unvanla kayıtlı müşteri varsa temsilci ONAYLAMADAN ÖNCE görmeli,
      // çünkü onay o unvana yeni bir giriş hesabı açar ve mevcut firmanın verisine erişim doğurur.
      if (firmClash(s, a.firm)) {
        var l2 = el("span", "mono");
        l2.appendChild(el("i", "vkn-badge bad",
          T("portal.app.clashBadge", "✗ bu unvanla kayıtlı müşteri var")));
        info.appendChild(l2);
      }
      info.appendChild(el("span", "mono", "Yetkili: " + a.contact + " · " + a.email + " · " + a.mobile));
      if (a.msg) info.appendChild(el("span", "app-msg", "“" + a.msg + "”"));
      var links = el("span", "mono app-links");
      var g1 = el("a", "accent", "GİB doğrula ↗");
      g1.href = "https://ivd.gib.gov.tr/"; g1.target = "_blank"; g1.rel = "noopener";
      var g2 = el("a", "accent", "Ticaret Sicil ↗");
      g2.href = "https://www.ticaretsicil.gov.tr/"; g2.target = "_blank"; g2.rel = "noopener";
      links.appendChild(g1); links.appendChild(document.createTextNode("  ")); links.appendChild(g2);
      info.appendChild(links);
      row.appendChild(info);
      var act = el("div", "app-actions");
      var ok = el("button", "btn btn--primary btn--sm", "✓ Onayla & Hesap Aç");
      ok.addEventListener("click", function () {
        var res = hgpDecideApplication(a.id, true, USER.name + " (Satış)");
        // Depo unvan çakışmasında onayı reddeder; temsilciye sessiz kalmak yerine sebebini söyleriz
        if (res === APP_CAKISMA) {
          toast(T("portal.app.clashRefused",
            "Onaylanmadı: bu unvanla kayıtlı bir müşteri kartı zaten var. Önce mevcut kartla birleştirin."));
          renderAll();
          return;
        }
        toast(a.firm + " onaylandı — müşteri kartı ve giriş hesabı oluşturuldu ✓");
        renderAll();
      });
      var no = el("button", "btn btn--ghost btn--sm", "✗ Reddet");
      no.addEventListener("click", function () {
        hgpDecideApplication(a.id, false, USER.name + " (Satış)");
        toast(a.firm + " başvurusu reddedildi.");
        renderAll();
      });
      act.appendChild(ok); act.appendChild(no);
      row.appendChild(act);
      panel.appendChild(row);
    });
    view.insertBefore(panel, view.firstChild);
  }

  /* ---------- 13. Operasyon (depo) ---------- */
  /* KURAL: ADV_LABEL, siparişin İÇİNDE BULUNDUĞU adımla (o.step) indekslenir ve etiket, o
     siparişi BİR SONRAKİ adıma taşıyan eylemi anlatır. Yani ADV_LABEL[0] = "Onayla" çünkü
     0 = "Onay Bekliyor" adımındaki eylem onaylamaktır. Son indeks bir eylem değil, akışın
     bittiğini söyleyen durum metnidir (o adımda hgpAdvance zaten null döner). */
  var ADV_LABEL = ["Onayla", "Üretime Al →", "Sevkiyata Çıkar →", "Teslim İşaretle ✓", "Tamamlandı"];
  var OPS_COLS = 4; // operasyon tablosundaki sütun sayısı (boş satır colSpan'i)
  function renderOps() {
    var s = hgpGet();
    var body = $("#ops-body"); if (!body) return;
    body.textContent = "";
    var list = s.orders.filter(function (o) { return o.step >= STEP_ONAYLANDI && o.step <= STEP_SEVK; });
    if (!list.length) { var tr0 = el("tr"), td0 = el("td", "empty2", "Süreçte sipariş yok — satış onayı bekleniyor."); td0.colSpan = OPS_COLS; tr0.appendChild(td0); body.appendChild(tr0); return; }
    list.sort(function (a, b) { return a.step - b.step; });
    list.forEach(function (o) {
      var tr = el("tr");
      var td1 = el("td");
      td1.appendChild(el("span", "t-id", o.id));
      td1.appendChild(el("span", "t-cust", o.customer));
      tr.appendChild(td1);
      tr.appendChild(el("td", null, o.items.map(function (i) { return i.n + " (" + i.q + ")"; }).join(" · ")));
      var tds = el("td"); tds.appendChild(chip(o.step)); tr.appendChild(tds);
      var tda = el("td");
      var btn = el("button", "advance-btn", ADV_LABEL[o.step] || "—");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var ns = hgpAdvance(o.id, USER.name + " (Depo)");
        if (ns != null) toast(o.id + " → " + HGP_STEPS[ns] + " ✓ (müşteri ve yönetim anında görür)");
        renderAll();
      });
      tda.appendChild(btn);
      tr.appendChild(tda);
      tr.addEventListener("click", function () { openOrder(o.id); });
      body.appendChild(tr);
    });
  }

  /* ---------- 14. Katalog yönetimi — ortak parçalar ----------
     15. ve 16. bölümdeki iki ekran (Ürünler / Dokümanlar) kataloğu yönetir:
     operatörün yazdığı metin önce localStorage'a, oradan da ANA SİTEDEKİ ürün
     ve doküman listelerine (hgpAllProducts / hgpAllDocs) düşer. İki sonucu var:

     1) BURADA innerHTML KULLANMAK DEPOLANMIŞ XSS DEMEKTİR. Operatörün (ya da
        konsoldan depoyu kurcalayan birinin) yazdığı metin siteyi açan herkeste
        çalışırdı. Bütün düğümler createElement + textContent ile kurulur;
        istisnası yoktur. Aynı kural doküman dosya yolu için de geçerlidir —
        yol <a href> içine girdiği için portal-store.js'teki hgpSafeDocPath
        denetiminden geçmek zorundadır (bkz. 16. bölümdeki ön denetim).

     2) KAYIT YALNIZCA BU TARAYICIDADIR. Satışın dizüstünde eklenen ürün, başka
        bir bilgisayardan siteye giren müşteride GÖRÜNMEZ. Yayına çıkmanın tek
        yolu dışa aktarılan kodu assets/js/data.js'e yapıştırıp commit etmektir.
        Arayüz bunu saklamaz; dışa aktarım panelindeki uyarı bunu açıkça yazar.
        O metinleri yumuşatmayın: "yayınladım" sanan operatör, müşterinin asla
        göremeyeceği bir ürünü beklemeye başlar.

     Ekranlar bir KEZ kurulur (prodBuilt / docsBuilt), sonra yalnızca listeler
     yeniden çizilir. Sebep: renderAll her toast'tan sonra çağrılıyor; formu her
     seferinde yeniden kursaydık operatörün yazmakta olduğu metin silinirdi. */

  var CAT_NAME_MAX = 120;   // ürün adı / doküman başlığı (tek satır)
  var CAT_DESC_MAX = 300;   // doküman açıklaması
  var CAT_META_MAX = 60;    // doküman künyesi (örn. "v2026 · PDF")
  var CAT_PATH_MAX = 160;   // assets/docs/… göreli dosya yolu
  var CAT_EXT_MAX = 8;      // dosya uzantısı (PDF, ZIP…)
  var CAT_BRAND_MAX = 60;   // marka / menşei

  /* data.js'teki const'lar window'a yazılmaz; portal-store.js'teki
     hgpBaseProducts ile aynı gerekçeyle korumalı okunur (dosya bir gün
     data.js'ten önce yüklenirse çıplak isim TDZ yüzünden istisna fırlatır). */
  function baseProducts() {
    try { return (typeof HK_PRODUCTS !== "undefined" && HK_PRODUCTS) ? HK_PRODUCTS : []; }
    catch (e) { return []; }
  }
  function baseDocs() {
    try { return (typeof HK_DOCS !== "undefined" && HK_DOCS) ? HK_DOCS : []; }
    catch (e) { return []; }
  }
  /* Ürün kategorisi seçeneği: anahtar + data.js'teki Türkçe etiket. Liste
     okunamazsa BOŞ döner ve form kategori uydurmak yerine kendini kilitler. */
  function subPairs() {
    var out = [];
    try {
      if (typeof HK_SUBS !== "undefined" && HK_SUBS) {
        Object.keys(HK_SUBS).forEach(function (k) { out.push([k, HK_SUBS[k].tr]); });
      }
    } catch (e) {}
    return out;
  }
  function subLabel(k) {
    try {
      if (typeof HK_SUBS !== "undefined" && HK_SUBS && HK_SUBS[k]) return HK_SUBS[k].tr;
    } catch (e) {}
    return k || "—";
  }

  /* Doküman kategorisi etiketleri. Anahtarlar portal-store.js'teki
     HGP_DOC_CATS ile birebir aynıdır; oraya yeni kategori eklenirse buraya da
     etiket yazılmalıdır. Etiketi olmayan kategori uydurulmaz, anahtarın
     kendisi gösterilir. */
  var DOC_CAT_TR = {
    katalog: "Katalog & fiyat listesi",
    teknik: "Teknik doküman (TDS / SDS)",
    sertifika: "Sertifika",
    marka: "Marka & kurumsal",
    hukuki: "Hukuki metin"
  };
  function docCatLabel(k) { return T("portal.doc.cat." + k, DOC_CAT_TR[k] || k); }
  function docCatPairs() {
    var cats = (typeof HGP_DOC_CATS !== "undefined" && HGP_DOC_CATS) ? HGP_DOC_CATS : Object.keys(DOC_CAT_TR);
    return cats.map(function (k) { return [k, docCatLabel(k)]; });
  }

  /* Ürün etiketi: data.js'te tag "yeni" | "one" | null'dır; boş seçenek null'a düşer */
  function tagPairs() {
    return [
      ["", T("portal.prod.tagNone", "Etiket yok")],
      ["yeni", T("portal.prod.tagYeni", "Yeni ürün")],
      ["one", T("portal.prod.tagOne", "Öne çıkan")]
    ];
  }
  function tagLabel(t) {
    if (t === "yeni") return T("portal.prod.tagYeni", "Yeni ürün");
    if (t === "one") return T("portal.prod.tagOne", "Öne çıkan");
    return "—";
  }

  /* Etiketli form alanı. Alanların metni portal.html'de değil burada durur:
     görünen her dize T("anahtar", "Türkçe yedek") üzerinden geçmek zorundadır. */
  function fld(id, label, node, full) {
    var f = el("div", "field" + (full ? " field--full" : ""));
    var l = el("label", null, label);
    node.id = id; l.htmlFor = id;
    f.appendChild(l); f.appendChild(node);
    return f;
  }
  function txt(max, ph) {
    var i = el("input");
    i.type = "text"; i.maxLength = max;
    if (ph) i.placeholder = ph;
    return i;
  }
  function area(max, ph) {
    var t = el("textarea");
    t.maxLength = max; t.rows = 3;
    // .field textarea 130px varsayar; üç dilli blokta üç kutu yan yana çok uzuyor
    t.style.minHeight = "78px";
    if (ph) t.placeholder = ph;
    return t;
  }
  /* pairs: [[değer, etiket], …] */
  function pick(pairs) {
    var s = el("select");
    pairs.forEach(function (p) {
      var o = el("option", null, p[1]);
      o.value = p[0];
      s.appendChild(o);
    });
    return s;
  }
  /* note: dize ya da hazır düğüm (sayaç satırı gibi sonradan güncellenenler için) */
  function panelHead(title, note) {
    var h = el("div", "panel-head");
    h.appendChild(el("h2", null, title));
    if (note) h.appendChild(typeof note === "string" ? el("span", "ops-note", note) : note);
    return h;
  }
  /* Üç dilli alan grubu başlığı. h1 (sayfa) → h2 (panel) → h3 (grup) sırası
     korunur; .dw-t yalnızca görünüm sınıfıdır (mono, küçük, aralıklı). */
  function groupHead(text) { return el("h3", "dw-t field--full", text); }

  /* Sabit (data.js) ve portal kayıtları AYRI sayılır: operatör yayındaki
     listeyle kendi eklediklerini karıştırmasın. */
  function countsLine(baseN, customN) {
    return T("portal.cat.baseCount", "data.js'te sabit: ") + baseN +
           T("portal.cat.customCount", "  ·  bu tarayıcıda eklenen: ") + customN;
  }

  /* Panoya kopyalama. navigator.clipboard yalnızca güvenli kaynakta (https ya
     da localhost) vardır; orada bile izin verilmezse REDDEDER. Her iki durumda
     metni seçili bırakıp kullanıcıya Ctrl/Cmd + C diyoruz — sessizce
     başarısız olmak en kötü seçenektir. */
  function copyBox(ta) {
    if (!ta.value) { toast(T("portal.exp.nothing", "Önce “Kodu üret” düğmesine basın.")); return; }
    ta.focus(); ta.select();
    var done = function () { toast(T("portal.exp.copied", "Kod panoya kopyalandı.")); };
    var manual = function () {
      toast(T("portal.exp.copyManual", "Tarayıcı panoya yazamadı — metin seçildi, Ctrl/Cmd + C ile kopyalayın."));
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(done, manual);
        return;
      }
    } catch (e) { /* güvensiz kaynakta erişim denemesi bile atabilir */ }
    manual();
  }

  /* Dışa aktarım paneli — iki ekranda da aynı. opts:
       title / note  panel başlığı ve künyesi
       warn          DÜRÜST SINIR metni (yumuşatmayın)
       label         textarea'nın erişilebilir adı
       empty         aktarılacak kayıt yokken gösterilen bildirim
       build         hgpExportProducts / hgpExportDocs */
  function buildExportPanel(panel, opts) {
    panel.textContent = "";
    panel.appendChild(panelHead(opts.title, opts.note));
    var body = el("div");
    body.style.cssText = "padding:var(--space-md);display:grid;gap:var(--space-sm)";

    var warn = el("div", "crm-note2");
    var wt = el("div");
    wt.appendChild(el("b", null, T("portal.exp.warnHead", "Bu kayıtlar yayında değil.")));
    var wp = el("p", null, opts.warn);
    wp.style.marginTop = "var(--space-2xs)";
    wt.appendChild(wp);
    warn.appendChild(wt);
    body.appendChild(warn);

    var row = el("div");
    row.style.cssText = "display:flex;gap:var(--space-xs);flex-wrap:wrap";
    var gen = el("button", "btn btn--primary btn--sm", T("portal.exp.gen", "Kodu üret"));
    gen.type = "button";
    var cp = el("button", "btn btn--ghost btn--sm", T("portal.exp.copy", "Kopyala"));
    cp.type = "button";
    row.appendChild(gen); row.appendChild(cp);
    body.appendChild(row);

    var box = el("div", "reply-box");
    var ta = el("textarea");
    ta.readOnly = true;
    ta.rows = 12;
    ta.setAttribute("aria-label", opts.label);
    ta.placeholder = T("portal.exp.placeholder", "“Kodu üret” düğmesine basın; oluşan satırlar burada görünür.");
    ta.style.cssText = "min-height:200px;font-family:var(--font-mono);font-size:var(--fs-micro);background:var(--paper)";
    box.appendChild(ta);
    body.appendChild(box);

    gen.addEventListener("click", function () {
      var code = opts.build();
      if (!code) { ta.value = ""; toast(opts.empty); return; }
      ta.value = code;
      toast(T("portal.exp.ready", "Kod üretildi — kopyalayıp assets/js/data.js'e yapıştırın, sonra commit edin."));
    });
    cp.addEventListener("click", function () { copyBox(ta); });

    panel.appendChild(body);
  }

  /* ---------- 15. Ürün yönetimi (satış / yönetim) ---------- */
  var PROD_COLS = 7;                 // ürün tablosundaki sütun sayısı (boş satır colSpan'i)
  var prodBuilt = false;             // ekran bir kez kurulur (bkz. 14. bölüm)
  var prodF = null;                  // form alanlarının düğümleri
  var prodBodyEl = null, prodCountEl = null;

  function buildProductScreen() {
    if (prodBuilt) return;
    var fp = need("#prod-form-panel"), lp = need("#prod-list-panel"), xp = need("#prod-export-panel");
    if (!fp || !lp || !xp) return;
    prodBuilt = true;

    /* --- Ekleme formu --- */
    fp.textContent = "";
    fp.appendChild(panelHead(
      T("portal.prod.formTitle", "Yeni ürün ekle"),
      T("portal.prod.formNote", "Kayıt bu tarayıcıda tutulur; yayına çıkarma adımı en alttaki panelde")));
    var form = el("form", "form-grid");
    form.style.cssText = "padding:var(--space-md)";

    var subs = subPairs();
    prodF = {
      sub: pick(subs.length ? subs : [["", T("portal.prod.subMissing", "Kategori listesi okunamadı")]]),
      brand: txt(CAT_BRAND_MAX, T("portal.prod.phBrand", "örn. Herkim")),
      tr: txt(CAT_NAME_MAX, T("portal.prod.phTr", "örn. Sodyum Format")),
      en: txt(CAT_NAME_MAX, T("portal.prod.phEn", "örn. Sodium Formate")),
      ru: txt(CAT_NAME_MAX, T("portal.prod.phRu", "örn. Формиат натрия")),
      tag: pick(tagPairs()),
      /* Satış birimi kutusu. İŞARETSİZ = kilo (varsayılan, ürünlerin çoğu).
         İşaretliyse kayda unit:"varil" yazılır ve sepetteki miktar kutusu ile
         sipariş metinleri birimi ona göre gösterir. */
      varil: (function () { var c = document.createElement("input"); c.type = "checkbox"; c.id = "pf-varil"; return c; })(),
      /* Varil başına kilo. Yalnız varil işaretliyken etkin; kapalıyken devre
         dışı bırakılır ki kilo ile satılan üründe yanlışlıkla doldurulmasın. */
      kgPer: (function () {
        var i = document.createElement("input");
        i.type = "text"; i.inputMode = "numeric"; i.id = "pf-kgper"; i.maxLength = 6;
        return i;
      })()
    };
    // Kategori listesi yoksa hgpAddProduct zaten reddeder; formu da kilitleriz
    if (!subs.length) {
      prodF.sub.disabled = true;
      console.warn("Herkim portal: HK_SUBS okunamadı — ürün ekleme formu kilitlendi.");
    }

    form.appendChild(fld("pf-sub", T("portal.prod.lblSub", "KATEGORİ"), prodF.sub));
    form.appendChild(fld("pf-brand", T("portal.prod.lblBrand", "MARKA / MENŞEİ"), prodF.brand));
    form.appendChild(groupHead(T("portal.prod.namesHead", "ÜRÜN ADI — ÜÇ DİL DE ZORUNLU")));
    form.appendChild(fld("pf-tr", T("portal.prod.lblTr", "AD (TÜRKÇE)"), prodF.tr, true));
    form.appendChild(fld("pf-en", T("portal.prod.lblEn", "AD (İNGİLİZCE)"), prodF.en));
    form.appendChild(fld("pf-ru", T("portal.prod.lblRu", "AD (RUSÇA)"), prodF.ru));
    form.appendChild(fld("pf-tag", T("portal.prod.lblTag", "ETİKET"), prodF.tag));

    /* Onay kutusu tek satır: <label> içinde kutu + metin. fld() etiketi alanın
       ÜSTÜNE koyduğu için burada kullanılmaz — onay kutusunda etiket yanda olur. */
    /* SATIŞ BİRİMİ alanı. Diğer alanlarla aynı iskelet: üstte mono etiket,
       altında denetim. Onay kutusunun kendi metni etiketin İÇİNDE değil, kutunun
       yanındadır — <label for> ile bağlıdır, yani metne tıklamak da kutuyu değiştirir.
       Biçim portal.css'teki .unit-check kuralındadır; satır içi stil YOK. */
    var unitRow = el("div", "field field--full");
    var unitCap = el("label", null, T("portal.prod.lblUnitField", "SATIŞ BİRİMİ"));
    unitCap.htmlFor = "pf-varil";
    var unitBox = el("label", "unit-check");
    unitBox.htmlFor = "pf-varil";
    unitBox.appendChild(prodF.varil);
    var unitTxt = el("span", "unit-check-txt");
    unitTxt.appendChild(el("b", null, T("portal.prod.lblVaril", "Varille satılır")));
    unitTxt.appendChild(el("span", null, T("portal.prod.lblVarilHint",
      "İşaretlenmezse ürün kilogram ile satılır. Sepetteki miktar kutusu ve sipariş metinleri bu birimi kullanır.")));
    unitBox.appendChild(unitTxt);
    /* Seçili vurgusunu sınıfla sürüyoruz (bkz. portal.css .unit-check.is-on).
       Başlangıç durumu da yazılır: form yeniden çizilirse kutu ile görünüm ayrışmasın. */
    /* Varil başına kilo satırı — kutunun İÇİNDE durur: kavramsal olarak
       "varille satılır" kararının bir parçasıdır, ayrı bir alan değil. */
    var kgRow = el("div", "unit-kg");
    var kgLab = el("label", null, T("portal.prod.lblKgPer", "Bir varil kaç kg?"));
    kgLab.htmlFor = "pf-kgper";
    prodF.kgPer.placeholder = T("portal.prod.phKgPer", "örn. 200");
    kgRow.appendChild(kgLab);
    kgRow.appendChild(prodF.kgPer);
    kgRow.appendChild(el("span", "unit-kg-suffix", T("unit.kg", "kg")));
    unitBox.appendChild(kgRow);

    var syncUnitBox = function () {
      var on = prodF.varil.checked;
      unitBox.classList.toggle("is-on", on);
      kgRow.classList.toggle("is-on", on);
      prodF.kgPer.disabled = !on;
      if (!on) prodF.kgPer.value = "";
    };
    prodF.varil.addEventListener("change", syncUnitBox);
    syncUnitBox();
    unitRow.appendChild(unitCap);
    unitRow.appendChild(unitBox);
    form.appendChild(unitRow);

    var act = el("div", "field--full");
    act.style.cssText = "display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap";
    var sub = el("button", "btn btn--primary btn--sm", T("portal.prod.submit", "Ürünü ekle"));
    sub.type = "submit";
    act.appendChild(sub);
    act.appendChild(el("span", "cart-note",
      T("portal.prod.submitNote", "Üç dildeki ad boş bırakılamaz — eksikse kayıt yapılmaz.")));
    form.appendChild(act);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = { tr: prodF.tr.value.trim(), en: prodF.en.value.trim(), ru: prodF.ru.value.trim() };
      if (!prodF.sub.value) { toast(T("portal.prod.needSub", "Önce bir ürün kategorisi seçin.")); return; }
      if (!n.tr || !n.en || !n.ru) {
        toast(T("portal.prod.needNames", "Ürün adı üç dilde de zorunludur: Türkçe, İngilizce ve Rusça."));
        return;
      }
      if (prodF.varil.checked && !parseInt(prodF.kgPer.value.replace(/[^\d]/g, ""), 10)) {
        toast(T("portal.prod.needKgPer", "Varille satılan üründe bir varilin kaç kg olduğunu yazın."));
        return;
      }
      var id = hgpAddProduct({
        sub: prodF.sub.value, n: n, brand: prodF.brand.value, tag: prodF.tag.value,
        unit: prodF.varil.checked ? "varil" : "",     // boş = kilo (varsayılan)
        kgPerUnit: prodF.kgPer.value
      }, USER.name);
      if (!id) {
        toast(T("portal.prod.addFail", "Ürün eklenemedi — kategoriyi ve üç dildeki adı kontrol edin."));
        return;
      }
      prodF.tr.value = ""; prodF.en.value = ""; prodF.ru.value = ""; prodF.brand.value = "";
      prodF.varil.checked = false;
      prodF.varil.dispatchEvent(new Event("change"));   // vurguyu ve kg alanını sıfırla
      toast(T("portal.prod.added", "Ürün bu tarayıcıya eklendi — yayına çıkması için dışa aktarın.") + " #" + id);
      renderAll();
    });
    fp.appendChild(form);

    /* --- Portalda eklenenlerin listesi --- */
    lp.textContent = "";
    prodCountEl = el("span", "ops-note", "");
    lp.appendChild(panelHead(T("portal.prod.listTitle", "Portalda eklenen ürünler"), prodCountEl));
    var wrap = el("div", "tbl-wrap");
    var tbl = el("table", "ptbl");
    var thead = el("thead"), htr = el("tr");
    [
      T("portal.prod.colId", "KİMLİK"),
      T("portal.prod.colName", "AD (TR / EN / RU)"),
      T("portal.prod.colCat", "KATEGORİ"),
      T("portal.prod.colBrand", "MARKA"),
      T("portal.prod.colTag", "ETİKET"),
      T("portal.prod.colUnit", "BİRİM"),
      T("portal.cat.colAction", "İŞLEM")
    ].forEach(function (c) { htr.appendChild(el("th", null, c)); });
    thead.appendChild(htr);
    prodBodyEl = el("tbody");
    tbl.appendChild(thead); tbl.appendChild(prodBodyEl);
    wrap.appendChild(tbl);
    lp.appendChild(wrap);

    /* --- data.js'e aktarım --- */
    buildExportPanel(xp, {
      title: T("portal.prod.expTitle", "data.js'e aktar"),
      note: T("portal.prod.expNote", "HK_PRODUCTS dizisine yapıştırılacak satırlar"),
      warn: T("portal.prod.expWarn",
        "Portalda eklenen ürünler yalnızca bu tarayıcıda, bu cihazda durur. Başka bir bilgisayardan siteye giren müşteri onları görmez. Yayındaki siteye ulaşmalarının tek yolu: aşağıdaki kodu üretip assets/js/data.js dosyasındaki HK_PRODUCTS dizisine yapıştırmak, sonra değişikliği commit edip push etmek."),
      label: T("portal.prod.expLabel", "Üretilen ürün kodu"),
      empty: T("portal.prod.expEmpty", "Aktarılacak ürün yok — önce yukarıdan ürün ekleyin."),
      build: function () { return hgpExportProducts(); }
    });
  }

  function prodRow(p) {
    var tr = el("tr");
    // .ptbl tbody tr işaretçiyi "el" yapar; bu satırların tamamı tıklanabilir değil
    tr.style.cursor = "default";
    tr.appendChild(el("td", "mono", "#" + p.id));
    var td2 = el("td");
    td2.appendChild(el("b", null, (p.n && p.n.tr) || "—"));
    td2.appendChild(el("span", "t-cust", ((p.n && p.n.en) || "—") + " · " + ((p.n && p.n.ru) || "—")));
    tr.appendChild(td2);
    tr.appendChild(el("td", null, subLabel(p.sub)));
    tr.appendChild(el("td", null, p.brand || "—"));
    tr.appendChild(el("td", null, tagLabel(p.tag)));
    /* Birim: kayıtta unit alanı yoksa kilo (varsayılan). */
    /* portal.html i18n.js YÜKLEMEZ: T() ikinci argümandaki Türkçe yedeğe düşer.
       Yedek verilmezse hücre BOŞ çıkar — bu sütun ilk yazımda öyle çıkmıştı. */
    tr.appendChild(el("td", "mono", p.unit === "varil"
      ? T("unit.varil", "varil") + " · " + p.kgPerUnit + " " + T("unit.kg", "kg")
      : T("unit.kg", "kg")));
    var tda = el("td");
    var del = el("button", "advance-btn", T("portal.cat.del", "Sil"));
    del.type = "button";
    del.addEventListener("click", function () {
      // Dışa aktarılmamış kayıt geri getirilemez; silmeden önce sorarız
      if (!window.confirm(T("portal.prod.delConfirm",
        "Bu ürün bu tarayıcıdan silinecek. Dışa aktarılmadıysa geri getirilemez. Silinsin mi?"))) return;
      if (hgpDeleteProduct(p.id, USER.name)) toast(T("portal.prod.deleted", "Ürün silindi."));
      renderAll();
    });
    tda.appendChild(del);
    tr.appendChild(tda);
    return tr;
  }

  function renderProducts() {
    if (!USER || !CAN_EDIT_CATALOG[USER.role]) return;
    buildProductScreen();
    if (!prodBodyEl) return;
    var list = hgpListProducts();
    if (prodCountEl) prodCountEl.textContent = countsLine(baseProducts().length, list.length);
    prodBodyEl.textContent = "";
    if (!list.length) {
      var tr = el("tr"), td = el("td", "empty2",
        T("portal.prod.empty", "Bu tarayıcıda eklenmiş ürün yok. Yukarıdaki formla ekleyin."));
      td.colSpan = PROD_COLS; tr.appendChild(td); prodBodyEl.appendChild(tr);
      return;
    }
    list.forEach(function (p) { prodBodyEl.appendChild(prodRow(p)); });
  }

  /* ---------- 16. Doküman yönetimi (satış / yönetim) ---------- */
  var DOC_COLS = 6;
  var docsBuilt = false;
  var docF = null;
  var docBodyEl = null, docCountEl = null;

  function buildDocScreen() {
    if (docsBuilt) return;
    var fp = need("#doc-form-panel"), lp = need("#doc-list-panel"), xp = need("#doc-export-panel");
    if (!fp || !lp || !xp) return;
    docsBuilt = true;

    /* --- Ekleme formu --- */
    fp.textContent = "";
    fp.appendChild(panelHead(
      T("portal.doc.formTitle", "Yeni doküman kaydı"),
      T("portal.doc.formNote", "Kayıt bu tarayıcıda tutulur; yayına çıkarma adımı en alttaki panelde")));
    var form = el("form", "form-grid");
    form.style.cssText = "padding:var(--space-md)";

    docF = {
      cat: pick(docCatPairs()),
      ext: txt(CAT_EXT_MAX, T("portal.doc.phExt", "PDF")),
      tr: txt(CAT_NAME_MAX, T("portal.doc.phTitleTr", "örn. Ürün Kataloğu")),
      en: txt(CAT_NAME_MAX, T("portal.doc.phTitleEn", "örn. Product Catalog")),
      ru: txt(CAT_NAME_MAX, T("portal.doc.phTitleRu", "örn. Каталог продукции")),
      dtr: area(CAT_DESC_MAX, ""),
      den: area(CAT_DESC_MAX, ""),
      dru: area(CAT_DESC_MAX, ""),
      mtr: txt(CAT_META_MAX, T("portal.doc.phMeta", "örn. TR/EN/RU")),
      men: txt(CAT_META_MAX, ""),
      mru: txt(CAT_META_MAX, ""),
      file: txt(CAT_PATH_MAX, T("portal.doc.phFile", "assets/docs/ornek-belge.pdf"))
    };
    docF.ext.value = "PDF"; // data.js'teki kayıtların çoğunluğu; operatör değiştirebilir

    form.appendChild(fld("df-cat", T("portal.doc.lblCat", "KATEGORİ"), docF.cat));
    form.appendChild(fld("df-ext", T("portal.doc.lblExt", "DOSYA TÜRÜ"), docF.ext));

    form.appendChild(groupHead(T("portal.doc.titleHead", "BAŞLIK — ÜÇ DİL DE ZORUNLU")));
    form.appendChild(fld("df-tr", T("portal.doc.lblTitleTr", "BAŞLIK (TÜRKÇE)"), docF.tr, true));
    form.appendChild(fld("df-en", T("portal.doc.lblTitleEn", "BAŞLIK (İNGİLİZCE)"), docF.en));
    form.appendChild(fld("df-ru", T("portal.doc.lblTitleRu", "BAŞLIK (RUSÇA)"), docF.ru));

    form.appendChild(groupHead(T("portal.doc.descHead", "AÇIKLAMA — KART METNİ")));
    form.appendChild(fld("df-dtr", T("portal.doc.lblDescTr", "AÇIKLAMA (TÜRKÇE)"), docF.dtr, true));
    form.appendChild(fld("df-den", T("portal.doc.lblDescEn", "AÇIKLAMA (İNGİLİZCE)"), docF.den));
    form.appendChild(fld("df-dru", T("portal.doc.lblDescRu", "AÇIKLAMA (RUSÇA)"), docF.dru));

    form.appendChild(groupHead(T("portal.doc.metaHead", "KÜNYE — KARTIN ALT SATIRI")));
    form.appendChild(fld("df-mtr", T("portal.doc.lblMetaTr", "KÜNYE (TÜRKÇE)"), docF.mtr, true));
    form.appendChild(fld("df-men", T("portal.doc.lblMetaEn", "KÜNYE (İNGİLİZCE)"), docF.men));
    form.appendChild(fld("df-mru", T("portal.doc.lblMetaRu", "KÜNYE (RUSÇA)"), docF.mru));

    form.appendChild(groupHead(T("portal.doc.fileHead", "DOSYA YOLU — İSTEĞE BAĞLI")));
    form.appendChild(fld("df-file", T("portal.doc.lblFile", "DEPODAKİ GÖRELİ YOL"), docF.file, true));
    var fnote = el("div", "field--full");
    var fp1 = el("p", "cart-note", T("portal.doc.fileNote",
      "Dosyanın kendisi portaldan yüklenemez — arka uç yoktur. Dosyayı depoda assets/docs/ altına koyup commit edin, buraya da yalnızca o göreli yolu yazın (örn. assets/docs/ornek-belge.pdf)."));
    var fp2 = el("p", "cart-note", T("portal.doc.fileEmptyNote",
      "Boş bırakırsanız kart, dosyası olmayan diğer kayıtlar gibi “talep et” bağlantısıyla görünür — mevcut davranış budur."));
    fp2.style.marginTop = "var(--space-xs)";
    fnote.appendChild(fp1); fnote.appendChild(fp2);
    form.appendChild(fnote);

    var act = el("div", "field--full");
    act.style.cssText = "display:flex;gap:var(--space-sm);align-items:center;flex-wrap:wrap";
    var sub = el("button", "btn btn--primary btn--sm", T("portal.doc.submit", "Dokümanı ekle"));
    sub.type = "submit";
    act.appendChild(sub);
    act.appendChild(el("span", "cart-note",
      T("portal.doc.submitNote", "Başlık üç dilde de zorunludur — eksikse kayıt yapılmaz.")));
    form.appendChild(act);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = { tr: docF.tr.value.trim(), en: docF.en.value.trim(), ru: docF.ru.value.trim() };
      if (!docF.cat.value) { toast(T("portal.doc.needCat", "Önce bir doküman kategorisi seçin.")); return; }
      if (!title.tr || !title.en || !title.ru) {
        toast(T("portal.doc.needTitle", "Doküman başlığı üç dilde de zorunludur: Türkçe, İngilizce ve Rusça."));
        return;
      }
      /* Yol denetimi depoda da yapılır (hgpSafeDocPath); burada ÖNCEDEN
         çağırmamızın tek sebebi operatöre "neden olmadı" diyebilmek — depo
         geçersiz yolda sessizce null döner. Asıl denetim orasıdır. */
      var path = docF.file.value.trim();
      if (typeof hgpSafeDocPath === "function" && hgpSafeDocPath(path) === null) {
        toast(T("portal.doc.badPath",
          "Dosya yolu kabul edilmedi: yalnızca depo içindeki göreli yol yazılabilir (örn. assets/docs/belge.pdf)."));
        return;
      }
      var id = hgpAddDoc({
        ext: docF.ext.value, cat: docF.cat.value, file: path,
        title: title,
        desc: { tr: docF.dtr.value, en: docF.den.value, ru: docF.dru.value },
        meta: { tr: docF.mtr.value, en: docF.men.value, ru: docF.mru.value }
      }, USER.name);
      if (!id) {
        toast(T("portal.doc.addFail", "Doküman eklenemedi — kategoriyi, üç dildeki başlığı ve dosya yolunu kontrol edin."));
        return;
      }
      ["tr", "en", "ru", "dtr", "den", "dru", "mtr", "men", "mru", "file"].forEach(function (k) { docF[k].value = ""; });
      toast(T("portal.doc.added", "Doküman bu tarayıcıya eklendi — yayına çıkması için dışa aktarın.") + " #" + id);
      renderAll();
    });
    fp.appendChild(form);

    /* --- Portalda eklenenlerin listesi --- */
    lp.textContent = "";
    docCountEl = el("span", "ops-note", "");
    lp.appendChild(panelHead(T("portal.doc.listTitle", "Portalda eklenen dokümanlar"), docCountEl));
    var wrap = el("div", "tbl-wrap");
    var tbl = el("table", "ptbl");
    var thead = el("thead"), htr = el("tr");
    [
      T("portal.doc.colId", "KİMLİK"),
      T("portal.doc.colTitle", "BAŞLIK (TR / EN / RU)"),
      T("portal.doc.colCat", "KATEGORİ"),
      T("portal.doc.colExt", "TÜR"),
      T("portal.doc.colFile", "DOSYA"),
      T("portal.cat.colAction", "İŞLEM")
    ].forEach(function (c) { htr.appendChild(el("th", null, c)); });
    thead.appendChild(htr);
    docBodyEl = el("tbody");
    tbl.appendChild(thead); tbl.appendChild(docBodyEl);
    wrap.appendChild(tbl);
    lp.appendChild(wrap);

    /* --- data.js'e aktarım --- */
    buildExportPanel(xp, {
      title: T("portal.doc.expTitle", "data.js'e aktar"),
      note: T("portal.doc.expNote", "HK_DOCS dizisine yapıştırılacak satırlar"),
      warn: T("portal.doc.expWarn",
        "Portalda eklenen doküman kayıtları yalnızca bu tarayıcıda, bu cihazda durur. Başka bir bilgisayardan siteye giren ziyaretçi onları görmez. Yayındaki siteye ulaşmalarının tek yolu: aşağıdaki kodu üretip assets/js/data.js dosyasındaki HK_DOCS dizisine yapıştırmak, dosya yolu yazdıysanız dosyanın kendisini de assets/docs/ altına koymak, sonra değişikliği commit edip push etmek."),
      label: T("portal.doc.expLabel", "Üretilen doküman kodu"),
      empty: T("portal.doc.expEmpty", "Aktarılacak doküman yok — önce yukarıdan kayıt ekleyin."),
      build: function () { return hgpExportDocs(); }
    });
  }

  function docRow(d) {
    var tr = el("tr");
    tr.style.cursor = "default";
    tr.appendChild(el("td", "mono", "#" + d.id));
    var td2 = el("td");
    td2.appendChild(el("b", null, (d.title && d.title.tr) || "—"));
    td2.appendChild(el("span", "t-cust", ((d.title && d.title.en) || "—") + " · " + ((d.title && d.title.ru) || "—")));
    tr.appendChild(td2);
    tr.appendChild(el("td", null, docCatLabel(d.cat)));
    tr.appendChild(el("td", "mono", d.ext || "—"));
    tr.appendChild(el("td", "mono", d.file || T("portal.doc.noFile", "dosyasız — “talep et” kartı")));
    var tda = el("td");
    var del = el("button", "advance-btn", T("portal.cat.del", "Sil"));
    del.type = "button";
    del.addEventListener("click", function () {
      if (!window.confirm(T("portal.doc.delConfirm",
        "Bu doküman kaydı bu tarayıcıdan silinecek. Dışa aktarılmadıysa geri getirilemez. Silinsin mi?"))) return;
      if (hgpDeleteDoc(d.id, USER.name)) toast(T("portal.doc.deleted", "Doküman kaydı silindi."));
      renderAll();
    });
    tda.appendChild(del);
    tr.appendChild(tda);
    return tr;
  }

  function renderDocs() {
    if (!USER || !CAN_EDIT_CATALOG[USER.role]) return;
    buildDocScreen();
    if (!docBodyEl) return;
    var list = hgpListDocs();
    if (docCountEl) docCountEl.textContent = countsLine(baseDocs().length, list.length);
    docBodyEl.textContent = "";
    if (!list.length) {
      var tr = el("tr"), td = el("td", "empty2",
        T("portal.doc.empty", "Bu tarayıcıda eklenmiş doküman kaydı yok. Yukarıdaki formla ekleyin."));
      td.colSpan = DOC_COLS; tr.appendChild(td); docBodyEl.appendChild(tr);
      return;
    }
    list.forEach(function (d) { docBodyEl.appendChild(docRow(d)); });
  }

  /* ---------- 17. Sipariş çekmecesi ---------- */
  var ov = $("#ov2"), dwo = $("#dw-order"), dwc = $("#dw-cust");
  function closeDws() {
    if (ov) ov.classList.remove("open");
    if (dwo) dwo.classList.remove("open");
    if (dwc) dwc.classList.remove("open");
  }
  if (ov) ov.addEventListener("click", closeDws);
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", closeDws); });

  /* Çekmece alanına metin yazar; alan yoksa portal.html ile bu dosya uyuşmuyor demektir */
  function setText(sel, text) {
    var n = need(sel);
    if (n) n.textContent = text;
  }

  function openOrder(id) {
    var s = hgpGet(), o = null;
    s.orders.forEach(function (x) { if (x.id === id) o = x; });
    if (!o) return;
    setText("#do-id", o.id);
    setText("#do-sub", o.customer + " · Sipariş tarihi " + o.date);
    var c = $("#do-chip");
    if (c) { c.textContent = ""; c.appendChild(chip(o.step)); }
    var tl = $("#do-tl");
    if (tl) {
      tl.textContent = "";
      var stamps = o.tl || [];
      HGP_STEPS.forEach(function (name, i) {
        var st = el("div", i < o.step ? "tl2-step done" : (i === o.step ? "tl2-step now" : "tl2-step"));
        st.appendChild(el("b", null, name));
        st.appendChild(el("span", null, stamps[i] || (i === o.step ? "Devam ediyor…" : "—")));
        tl.appendChild(st);
      });
    }
    var items = $("#do-items");
    if (items) {
      items.textContent = "";
      o.items.forEach(function (i) {
        var r = el("div", "dw-item");
        r.appendChild(el("b", null, i.n));
        r.appendChild(el("span", null, i.q));
        items.appendChild(r);
      });
      if (o.note) {
        var nr = el("div", "dw-item");
        nr.appendChild(el("b", null, "Sipariş notu"));
        nr.appendChild(el("span", null, o.note));
        items.appendChild(nr);
      }
    }
    setText("#do-carrier", o.carrier);
    setText("#do-track", o.track);
    setText("#do-eta", o.eta);
    // Rol aksiyonları: satış onayı / depo ilerletme
    var act = need("#do-actions");
    if (act) {
      act.textContent = "";
      if (USER.role === "satis" && o.step === STEP_ONAY) {
        var b1 = el("button", "btn btn--primary", "✓ Siparişi Onayla");
        b1.addEventListener("click", function () {
          hgpAdvance(o.id, USER.name + " (Satış)");
          toast(o.id + " onaylandı — depo panosuna düştü ✓");
          closeDws(); renderAll();
        });
        act.appendChild(b1);
        var note = el("p", "cart-note", "Onaylanan sipariş anında depo/üretim panosunda görünür.");
        note.style.marginTop = "var(--space-sm)";
        act.appendChild(note);
      }
      if (USER.role === "depo" && o.step >= STEP_ONAYLANDI && o.step <= STEP_SEVK) {
        var b2 = el("button", "btn btn--primary", ADV_LABEL[o.step]);
        b2.addEventListener("click", function () {
          var ns = hgpAdvance(o.id, USER.name + " (Depo)");
          if (ns != null) toast(o.id + " → " + HGP_STEPS[ns] + " ✓");
          closeDws(); renderAll();
        });
        act.appendChild(b2);
      }
    }
    if (ov) ov.classList.add("open");
    if (dwo) dwo.classList.add("open");
  }

  /* ---------- 18. Müşteri kartı çekmecesi ---------- */
  var curCust = null;
  /* DİKKAT (borç): görüşme notları aktivite akışında serbest metin olarak saklanıp
     ("<firma> — görüşme notu: <metin>") burada tekrar ayrıştırılıyor. Firma adında bu
     kalıp geçerse ya da metin biçimi değişirse kart geçmişi bozulur; kalıcı çözüm notu
     depoda ayrı bir alan olarak tutmaktır (portal-store.js işi, burada düzeltilmedi). */
  var NOTE_SEP = " — görüşme notu: ";
  function openCust(c) {
    curCust = c;
    var s = hgpGet();
    setText("#dc-name", c.name);
    setText("#dc-sub", c.city + " · " + c.since + "'den beri müşteri");
    setText("#dc-contact", c.contact);
    setText("#dc-phone", c.phone);
    setText("#dc-mail", c.email);
    setText("#dc-rep", c.rep);
    var h = $("#dc-history");
    if (h) {
      h.textContent = "";
      var notes = s.activities.filter(function (a) { return a.type === "not" && a.what.indexOf(c.name) === 0; });
      notes.forEach(function (n) {
        var parts = n.what.split(NOTE_SEP);
        var r = el("div", "dw-item");
        r.appendChild(el("b", null, parts.length > 1 ? parts.slice(1).join(NOTE_SEP) : n.what));
        r.appendChild(el("span", null, n.when));
        h.appendChild(r);
      });
      (c.history || []).forEach(function (x) {
        var r = el("div", "dw-item");
        r.appendChild(el("b", null, "[" + x.via + "] " + x.t));
        r.appendChild(el("span", null, x.when));
        h.appendChild(r);
      });
    }
    var oo = $("#dc-orders");
    if (oo) {
      oo.textContent = "";
      var ords = s.orders.filter(function (o) { return o.customer === c.name; });
      if (!ords.length) oo.appendChild(el("div", "dw-item", "Sipariş yok."));
      ords.forEach(function (o) {
        var r = el("div", "dw-item");
        r.appendChild(el("b", null, o.id + " — " + (o.items[0] ? o.items[0].n : "—")));
        var sp = el("span"); sp.appendChild(chip(o.step));
        r.appendChild(sp);
        r.style.cursor = "pointer";
        r.addEventListener("click", function () {
          if (dwc) dwc.classList.remove("open");
          openOrder(o.id);
        });
        oo.appendChild(r);
      });
    }
    var rr = $("#dc-requests");
    if (rr) {
      rr.textContent = "";
      var reqs = s.requests.filter(function (x) { return x.customer === c.name; });
      if (!reqs.length) rr.appendChild(el("div", "dw-item", "Talep yok."));
      reqs.forEach(function (x) {
        var r = el("div", "dw-item");
        r.appendChild(el("b", null, x.subject));
        r.appendChild(el("span", null, x.status === REQ_ACIK ? "Açık" : "Yanıtlandı"));
        rr.appendChild(r);
      });
    }
    if (ov) ov.classList.add("open");
    if (dwc) dwc.classList.add("open");
  }
  var noteBtn = need("#dc-note-btn");
  if (noteBtn) noteBtn.addEventListener("click", function () {
    var ta = $("#dc-note");
    if (!ta) { console.warn("Herkim portal: not alanı (#dc-note) bulunamadı."); return; }
    var txt = ta.value.trim();
    if (!txt || !curCust) { toast("Not boş olamaz."); return; }
    hgpAddNote(curCust.name, txt, USER.name);
    ta.value = "";
    toast("Not müşteri kartına işlendi ✓");
    openCust(curCust); renderAll();
  });

  /* ---------- 19. Toplu çizim + başlatma ---------- */
  /* Künye metni: portalda yalnız Herkim personeli vardır, künye sabittir */
  var HOUSE_SCOPE = "Herkim Kimya";

  function renderAll() {
    if (!USER) return;
    buildNav();
    renderKpis(); renderFunnel(); renderFeed(); renderDash();
    renderOrders(); renderRequests(); renderCustomers(); renderOps();
    // Katalog yönetimi: yalnız yetkili rollerde çalışır, diğerlerinde anında döner
    renderProducts(); renderDocs();
  }

  /* Giriş ekranını göster, uygulamayı gizle (oturuma DOKUNMAZ) */
  function showLogin(loginView, appView) {
    if (loginView) loginView.style.display = "";
    if (appView) appView.style.display = "none";
  }

  function boot() {
    var s = getSes();
    // Boşta kalma süresi dolmuşsa oturumu düşürürüz (site-auth.js ile aynı kural, aynı anahtar)
    if (s && nowMs() - (s.touched || s.at) > HGP_IDLE_MS) { hgpSesClear(); s = null; }
    var loginView = need("#login-view"), appView = need("#app-view");
    /* MÜŞTERİ OTURUMU — portal açılmaz.
       Ana sitede giriş yapan müşteri (site-auth.js) AYNI oturum anahtarını
       "musteri" rolüyle yazar; adres çubuğuna portal.html yazarsa buraya düşer.
       Rol portalda artık tanımlı olmadığı için NAV/TITLES boş kalır ve kabuk
       bomboş çizilirdi. Onun yerine giriş ekranını açıklamayla gösteriyoruz.
       OTURUMU SİLMİYORUZ: kullanıcı ana sitede hâlâ açık, oradan atmak olurdu. */
    if (s && s.role === "musteri") {
      showLogin(loginView, appView);
      showCustomerNotice(T("portal.login.staffOnlyBoot",
        "Bu portal Herkim personeline özeldir. Ana site hesabınız açık; siparişlerinizi ve durumlarını buradan izleyebilirsiniz:"));
      return;
    }
    // Tanınmayan / kaldırılmış rol de giriş ekranına düşer (NAV yoksa çizilecek menü de yok)
    if (!s || !HGP_USERS[s.role] || !NAV[s.role]) {
      showLogin(loginView, appView);
      return;
    }
    USER = HGP_USERS[s.role];
    if (loginView) loginView.style.display = "none";
    if (appView) appView.style.display = "";
    setText("#u-initials", USER.initials);
    setText("#u-name", USER.name);
    setText("#u-title", USER.title + " · " + USER.company);
    setText("#role-pill", ROLE_LABEL[USER.role] || "");
    setText("#scope", HOUSE_SCOPE);
    var last = localStorage.getItem(HGP_LAST_LOGIN + USER.role);
    setText("#u-last", last ? "Son giriş: " + last : "");
    curView = "dash";
    show("dash");
    // Ana siteden derin bağlantı: portal.html#orders → ilgili görünüm
    var hv = (location.hash || "").replace("#", "");
    if (hv && NAV[USER.role].some(function (n) { return n.v === hv; })) show(hv);
  }
  boot();
})();
