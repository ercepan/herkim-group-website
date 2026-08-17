/* ============================================================
   HERKİM PORTAL — Uygulama mantığı (uçtan uca tek akış)
   Müşteri sipariş verir → Satış onaylar → Depo ilerletir → Yönetim izler.
   Güvenli DOM API'leri (innerHTML yok). Demo verisi: portal-store.js.

   İÇİNDEKİLER
     1. Yardımcılar ($, $$, el, need, T)
     2. Sabitler (oturum, adım indeksleri, durum kodları, zaman aşımları)
     3. Bildirim (toast)
     4. Giriş + güvenlik (oturum, kilitlenme, boşta kalma)
     5. Rol yapılandırması (NAV / TITLES / ROLE_LABEL + ROL EKLEME REHBERİ)
     6. Kabuk (buildNav, show)
     7. Durum çipi / ilerleme çubuğu
     8. KPI + huni + aktivite akışı
     9. Sipariş tabloları (orderRow, renderOrders, renderDash)
    10. Yeni sipariş (katalog + sepet + teklif aktarımı)
    11. Talepler (liste, yanıt, yeni talep formu)
    12. Müşteri kartları (satış)
    13. Hesap başvuruları (satış onay kutusu)
    14. Operasyon panosu (depo)
    15. Sipariş çekmecesi
    16. Müşteri kartı çekmecesi
    17. Toplu çizim + başlatma (renderAll, boot)
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
  var QTY_MAX = 999;             // sepette tek kalem için üst sınır

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
    try { return JSON.parse(localStorage.getItem(HGP_SESSION_KEY)); }
    catch (e) { console.warn("Herkim portal: oturum kaydı okunamadı — bozuk JSON.", e); return null; }
  }
  /* localStorage yazımı gizli sekmede ve kota dolduğunda İSTİSNA fırlatır. Sarmalanmazsa
     istisna burada patlar, boot() hiç çağrılmaz ve giriş düğmesi kullanıcıya hiçbir şey
     söylemeden ölür. Hatayı yutmuyoruz: konsola iz bırakıp kullanıcıya sebebini söylüyoruz. */
  function enter(role, acct) {
    var payload = { role: role, at: nowMs() };
    if (acct) payload.acct = acct;
    try {
      localStorage.setItem(HGP_SESSION_KEY, JSON.stringify(payload));
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

  var errBox = $("#lg-err"), lgBtn = $("#lg-btn"), lockTimer = null;
  function getLock() {
    try { return JSON.parse(localStorage.getItem(HGP_LOCK_KEY)) || { n: 0, until: 0 }; }
    catch (e) { console.warn("Herkim portal: kilit kaydı okunamadı — bozuk JSON.", e); return { n: 0, until: 0 }; }
  }
  function showErr(m) {
    if (!errBox) return;
    errBox.textContent = m;
    errBox.classList.remove("show"); void errBox.offsetWidth;
    errBox.classList.add("show");
  }
  function lockUI() {
    if (!lgBtn) return;
    var l = getLock(), left = Math.ceil((l.until - nowMs()) / 1000);
    if (left > 0) {
      lgBtn.disabled = true; lgBtn.style.opacity = "0.55";
      showErr("Çok fazla hatalı deneme. Giriş " + left + " sn kilitlendi.");
      if (!lockTimer) lockTimer = setInterval(lockUI, 1000);
    } else {
      lgBtn.disabled = false; lgBtn.style.opacity = "";
      if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
      if (l.until) {
        if (errBox) errBox.classList.remove("show");
        localStorage.removeItem(HGP_LOCK_KEY);
      }
    }
  }
  lockUI();
  var lgForm = $("#lg-form");
  if (lgForm) lgForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var l = getLock();
    if (l.until > nowMs()) { lockUI(); return; }
    var failTry = function (msg) {
      l.n = (l.n || 0) + 1;
      if (l.n >= HGP_MAX_FAILS) { l.until = nowMs() + HGP_LOCK_MS; l.n = 0; }
      localStorage.setItem(HGP_LOCK_KEY, JSON.stringify(l));
      if (l.until > nowMs()) lockUI();
      else showErr(msg.replace("{n}", l.n).replace("{max}", HGP_MAX_FAILS));
    };
    var passInput = $("#lg-pass");
    if (!passInput) { console.warn("Herkim portal: şifre alanı (#lg-pass) bulunamadı."); return; }
    if (passInput.value !== HGP_DEMO_PASS) { failTry("E-posta veya şifre hatalı. ({n}/{max} deneme)"); return; }
    // E-posta → hesap: varsayılan demo müşteri ya da onaylı web hesabı
    var em = ($("#lg-mail") ? $("#lg-mail").value : "").trim().toLowerCase();
    if (!em || em === "satinalma@derimderi.com.tr") { enter("musteri"); return; }
    var acc = null;
    (hgpGet().accounts || []).forEach(function (a) { if (a.email === em) acc = a; });
    if (!acc) { failTry("Bu e-postayla onaylı hesap bulunamadı. Önce başvuru yapın. ({n}/{max})"); return; }
    enter("musteri", { role: "musteri", name: acc.name, company: acc.company,
                       initials: acc.initials, rep: salesRepName(), email: acc.email });
  });

  function logout() { localStorage.removeItem(HGP_SESSION_KEY); location.reload(); }
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
      localStorage.setItem(HGP_SESSION_KEY, JSON.stringify(s));
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
        PRIMARY_ACTION ....... başlıktaki birincil aksiyon düğmesinin gittiği görünüm
     B) HÂLÂ ELLE DALLANAN YERLER — davranışları rollere göre gerçekten farklı
        olduğu için tabloya indirgenmedi; yeni rolde tek tek gözden geçirin.
        Satır numaraları yaklaşıktır, şaşarsa `USER.role` araması listenin tamamını verir:
        myOrders / myRequests ......... yalnız "musteri" kendi kaydını görür ....... ~sat. 274
        renderKpis .................... her rol için ayrı KPI seti ................. ~sat. 372
        renderOrders (sıralama) ....... "satis" listeyi adıma göre sıralar ......... ~sat. 476
        renderDash (sıralama) ......... "satis"/"depo" farklı önceliklendirir ...... ~sat. 497
        renderRequests (yanıt kutusu) . yalnız "satis" talep yanıtlar .............. ~sat. 648
        renderApplications ............ yalnız "satis" başvuru kutusunu görür ...... ~sat. 738
        openOrder (aksiyonlar) ........ "satis" onaylar, "depo" ilerletir .......... ~sat. 897
        boot (#scope künyesi) ......... "musteri" kendi firma adını görür .......... ~sat. 1041
     Ayrıca portal.html'de yeni görünüm için #view-<ad> kabı ve show() içindeki
     görünüm listesi güncellenmelidir. */
  var NAV = {
    musteri: [
      { v: "dash", t: "Özet" },
      { v: "neworder", t: "Yeni Sipariş" },
      { v: "orders", t: "Siparişlerim" },
      { v: "requests", t: "Taleplerim" }
    ],
    satis: [
      { v: "dash", t: "CRM Özeti" },
      { v: "orders", t: "Siparişler & Onay", cnt: "onay" },
      { v: "requests", t: "Gelen Talepler", cnt: "acik" },
      { v: "customers", t: "Müşteri Kartları", cnt: "basvuru" }
    ],
    depo: [
      { v: "dash", t: "Özet" },
      { v: "ops", t: "Operasyon Panosu", cnt: "ops" }
    ],
    yonetim: [
      { v: "dash", t: "Dashboard" },
      { v: "orders", t: "Tüm Siparişler" },
      { v: "requests", t: "Talepler" }
    ]
  };
  var TITLES = {
    dash: { musteri: "Özet", satis: "CRM Özeti", depo: "Operasyon Özeti", yonetim: "Yönetim Dashboard'u" },
    neworder: { musteri: "Yeni Sipariş" },
    orders: { musteri: "Siparişlerim", satis: "Siparişler & Onay", depo: "Siparişler", yonetim: "Tüm Siparişler" },
    requests: { musteri: "Taleplerim", satis: "Gelen Talepler", yonetim: "Talepler" },
    customers: { satis: "Müşteri Kartları" },
    ops: { depo: "Operasyon Panosu" }
  };
  var ROLE_LABEL = { musteri: "MÜŞTERİ", satis: "SATIŞ · CRM", depo: "DEPO / ÜRETİM", yonetim: "YÖNETİM" };

  /* Rol → ekran davranışı tabloları (yukarıdaki rehberin A maddesi) */
  var SHOWS_CUSTOMER = { musteri: false, satis: true, depo: true, yonetim: true };
  var FEED_LIMIT = { musteri: 7, satis: 7, depo: 7, yonetim: 14 };
  var DASH_LIST_TITLE = {
    musteri: "Son siparişler", satis: "Önce onay bekleyenler",
    depo: "Süreçteki siparişler", yonetim: "Son siparişler"
  };
  var SHOW_FUNNEL = { musteri: false, satis: true, depo: false, yonetim: true };
  var SHOW_FEED = { musteri: false, satis: true, depo: true, yonetim: true };
  var CAN_CREATE_REQUEST = { musteri: true, satis: false, depo: false, yonetim: false };
  var PRIMARY_ACTION = { musteri: "neworder" };

  /* CSS display değeri: "" satırı olduğu gibi bırakır, "none" gizler */
  function vis(on) { return on ? "" : "none"; }

  function myOrders(s) {
    if (USER.role === "musteri") return s.orders.filter(function (o) { return o.customer === USER.company; });
    return s.orders.slice();
  }
  function myRequests(s) {
    if (USER.role === "musteri") return s.requests.filter(function (r) { return r.customer === USER.company; });
    return s.requests.slice();
  }

  /* ---------- 6. Kabuk ---------- */
  /* Depoda tutulan ham adım/durum kodlarını sayan yardımcılar (rozetler + huni ortak kullanır) */
  function countStep(list, from, to) {
    return list.filter(function (o) { return o.step >= from && o.step <= to; }).length;
  }
  function countOpenRequests(list) {
    return list.filter(function (r) { return r.status === REQ_ACIK; }).length;
  }

  var VIEWS = ["dash", "neworder", "orders", "requests", "customers", "ops"];

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

  function show(v) {
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
    if (USER.role === "musteri") {
      row.appendChild(kpi(steps(STEP_ONAY, STEP_SEVK), "Aktif sipariş"));
      row.appendChild(kpi(steps(STEP_ONAY, STEP_ONAY), "Onay bekleyen"));
      row.appendChild(kpi(open, "Açık talep"));
      row.appendChild(kpi(steps(STEP_TESLIM, STEP_TESLIM), "Teslim (2026)"));
    } else if (USER.role === "satis") {
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

  /* ---------- 10. Yeni sipariş (katalog + sepet) ---------- */
  var cart = {}; // productId -> qty
  var catQ = "";
  function prodName(p) { return p.n.tr; }
  /* Alt kategori adı: data.js ile katalog arasında kopukluk olursa satırı düşürmeyiz */
  function subName(p) {
    var sub = HK_SUBS[p.sub];
    if (!sub) { console.warn("Herkim portal: ürünün alt kategorisi bulunamadı — " + p.id); return "—"; }
    return sub.tr;
  }
  /* Ambalaj birimi. HK_PRODUCTS'ta "pack" alanı YOKTUR (data.js) — gerçek ambalaj
     listesi tedarikçiden gelmediği için uydurulmaz (altın kural 4). Alan bir gün
     eklenirse burası kendiliğinden onu kullanır; o güne kadar nötr "adet" yazılır.
     ÖNCEKİ HATA: doğrudan p.pack okunuyordu ve ekrana "undefined" düşüyordu. */
  function packLabel(p) {
    return (p && p.pack) ? p.pack : T("order.unit", "adet");
  }
  function findProduct(id) {
    var p = null;
    HK_PRODUCTS.forEach(function (x) { if (x.id === +id) p = x; });
    return p;
  }
  function renderCatalog() {
    var wrap = $("#cat-list"); if (!wrap) return;
    wrap.textContent = "";
    HK_PRODUCTS.filter(function (p) {
      if (!catQ) return true;
      return prodName(p).toLocaleLowerCase("tr").indexOf(catQ.toLocaleLowerCase("tr")) !== -1;
    }).forEach(function (p) {
      var row = el("div", "cat-item");
      var info = el("div");
      info.appendChild(el("b", null, prodName(p)));
      info.appendChild(el("span", "mono", subName(p) + " · " + packLabel(p)));
      row.appendChild(info);
      var q = el("div", "qty");
      var minus = el("button", null, "−");
      var inp = el("input");
      inp.type = "text"; inp.value = cart[p.id] || 0; inp.setAttribute("inputmode", "numeric");
      var plus = el("button", null, "+");
      function setQty(v) {
        v = Math.max(0, Math.min(QTY_MAX, v | 0));
        if (v === 0) delete cart[p.id]; else cart[p.id] = v;
        inp.value = v;
        renderCart();
      }
      minus.addEventListener("click", function () { setQty((cart[p.id] || 0) - 1); });
      plus.addEventListener("click", function () { setQty((cart[p.id] || 0) + 1); });
      inp.addEventListener("input", function () { setQty(parseInt(inp.value, 10) || 0); });
      q.appendChild(minus); q.appendChild(inp); q.appendChild(plus);
      row.appendChild(q);
      var add = el("button", "advance-btn cat-add", "Ekle +");
      add.addEventListener("click", function () { setQty((cart[p.id] || 0) + 1); });
      row.appendChild(add);
      wrap.appendChild(row);
    });
  }
  var cs = $("#cat-search");
  if (cs) cs.addEventListener("input", function () { catQ = cs.value; renderCatalog(); });

  function renderCart() {
    var wrap = $("#cart-lines"); if (!wrap) return;
    wrap.textContent = "";
    var ids = Object.keys(cart);
    if (!ids.length) { wrap.appendChild(el("div", "empty2", "Soldan ürün ekleyin.")); return; }
    ids.forEach(function (id) {
      var p = findProduct(id);
      if (!p) return;
      var line = el("div", "cart-line");
      line.appendChild(el("b", null, prodName(p)));
      line.appendChild(el("span", "mono", cart[id] + " × " + packLabel(p)));
      wrap.appendChild(line);
    });
  }
  var placeBtn = need("#btn-place-order");
  if (placeBtn) placeBtn.addEventListener("click", function () {
    var ids = Object.keys(cart);
    if (!ids.length) { toast("Önce sepete ürün ekleyin."); return; }
    // Katalogdan düşmüş bir ürün sepette kalmışsa siparişe yazmayız
    var items = [];
    ids.forEach(function (id) {
      var p = findProduct(id);
      if (!p) { console.warn("Herkim portal: sepetteki ürün katalogda yok — " + id); return; }
      items.push({ n: prodName(p), q: cart[id] + " × " + packLabel(p) });
    });
    if (!items.length) { toast("Sepetteki ürünler katalogda bulunamadı."); return; }
    var oid = hgpAddOrder(USER.company, items, USER.name + " (" + USER.company + ")");
    cart = {};
    renderCatalog(); renderCart();
    toast("Sipariş " + oid + " oluşturuldu — satış onayına düştü ✓");
    show("orders");
  });

  /* Teklif sepetinden aktarım (ana site → portal) */
  function consumePrefill() {
    var pf = null;
    try { pf = JSON.parse(localStorage.getItem(HGP_PREFILL)); }
    catch (e) { console.warn("Herkim portal: teklif sepeti aktarımı okunamadı — bozuk JSON.", e); }
    if (!pf || !pf.ids || !pf.ids.length) return;
    localStorage.removeItem(HGP_PREFILL);
    pf.ids.forEach(function (id) { cart[id] = (cart[id] || 0) + 1; });
    show("neworder");
    toast("Teklif sepetiniz siparişe aktarıldı — miktarları belirleyin.");
  }

  /* ---------- 11. Talepler ---------- */
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
      t.style.cssText = "display:block;font-size:15px;color:var(--ink)";
      left.appendChild(t);
      left.appendChild(el("span", "mono", r.id + " · " + r.date + (SHOWS_CUSTOMER[USER.role] ? " · " + r.customer : "")));
      head.appendChild(left);
      var right = el("div");
      right.style.cssText = "display:flex;gap:8px;align-items:center";
      if (r.viaLanding) right.appendChild(el("span", "st st--landing", "Landing"));
      var acik = r.status === REQ_ACIK;
      right.appendChild(el("span", acik ? "st st--" + REQ_ACIK : "st st--" + REQ_YANIT, acik ? "Açık" : "Yanıtlandı"));
      head.appendChild(right);
      card.appendChild(head);
      var body = el("div");
      body.style.cssText = "padding:15px 20px";
      body.appendChild(el("p", null, r.detail));
      if (r.reply) {
        var rep = el("div", "crm-note2");
        rep.style.marginTop = "12px";
        var rb = el("div");
        rb.appendChild(el("b", null, r.reply.by + " · " + r.reply.when));
        var rp = el("p", null, r.reply.text);
        rp.style.marginTop = "3px";
        rb.appendChild(rp);
        rep.appendChild(rb);
        body.appendChild(rep);
      }
      if (USER.role === "satis" && r.status === REQ_ACIK) {
        var box = el("div", "reply-box");
        box.style.marginTop = "12px";
        var ta = el("textarea");
        ta.placeholder = "Yanıtınız… (müşteriye ve CRM kartına işlenir)";
        ta.maxLength = REPLY_MAX;
        var btn = el("button", "btn btn--primary btn--sm", "Yanıtla");
        btn.style.marginTop = "8px";
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

  /* ---------- 12. Müşteri kartları (satış) ---------- */
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

  /* ---------- 13. Hesap başvuruları (satış onay kutusu) ---------- */
  function renderApplications(s) {
    var view = $("#view-customers"); if (!view) return;
    var old = $("#apps-panel", view);
    if (old) old.remove();
    if (USER.role !== "satis") return;
    var pend = (s.applications || []).filter(function (a) { return a.status === APP_BEKLIYOR; });
    if (!pend.length) return;
    var panel = el("div", "panel");
    panel.id = "apps-panel";
    panel.style.marginBottom = "22px";
    var head = el("div", "p-head");
    head.appendChild(el("h3", null, "Bekleyen Hesap Başvuruları (" + pend.length + ")"));
    head.appendChild(el("span", "mono", "Web sitesinden — firma doğrulaması sizde"));
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

  /* ---------- 14. Operasyon (depo) ---------- */
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

  /* ---------- 15. Sipariş çekmecesi ---------- */
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
        note.style.marginTop = "10px";
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

  /* ---------- 16. Müşteri kartı çekmecesi ---------- */
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

  /* ---------- 17. Toplu çizim + başlatma ---------- */
  /* Künye metni: müşteri kendi firma adını, Herkim çalışanları şirketi görür */
  var HOUSE_SCOPE = "Herkim Kimya";
  /* Temsilci adı kadro tablosundan okunur; HGP_USERS güncellenince burası da düzelir */
  function salesRepName() {
    return (typeof HGP_USERS !== "undefined" && HGP_USERS.satis && HGP_USERS.satis.name) || "Ayşe Yılmaz";
  }

  function renderAll() {
    if (!USER) return;
    buildNav();
    renderKpis(); renderFunnel(); renderFeed(); renderDash();
    renderOrders(); renderRequests(); renderCustomers(); renderOps();
    renderCatalog(); renderCart();
  }

  function boot() {
    var s = getSes();
    // Boşta kalma süresi dolmuşsa oturumu düşürürüz (site-auth.js ile aynı kural, aynı anahtar)
    if (s && nowMs() - (s.touched || s.at) > HGP_IDLE_MS) { localStorage.removeItem(HGP_SESSION_KEY); s = null; }
    var loginView = need("#login-view"), appView = need("#app-view");
    if (!s || !HGP_USERS[s.role]) {
      if (loginView) loginView.style.display = "";
      if (appView) appView.style.display = "none";
      return;
    }
    USER = HGP_USERS[s.role];
    // Ana siteden onaylı web hesabıyla giriş: oturumdaki hesap bilgisi baskındır
    if (s.acct && s.role === "musteri") {
      USER = { role: "musteri", name: s.acct.name, title: "Satın Alma",
               company: s.acct.company, initials: s.acct.initials || "MK",
               rep: s.acct.rep || salesRepName() };
    }
    if (loginView) loginView.style.display = "none";
    if (appView) appView.style.display = "";
    setText("#u-initials", USER.initials);
    setText("#u-name", USER.name);
    setText("#u-title", USER.title + " · " + USER.company);
    setText("#role-pill", ROLE_LABEL[USER.role] || "");
    setText("#scope", USER.role === "musteri" ? USER.company : HOUSE_SCOPE);
    var last = localStorage.getItem(HGP_LAST_LOGIN + USER.role);
    setText("#u-last", last ? "Son giriş: " + last : "");
    // Başlıktaki birincil aksiyon: hangi rol nereye gidiyor, PRIMARY_ACTION tablosunda yazar
    var pa = $("#btn-primary-action");
    if (pa) {
      var target = PRIMARY_ACTION[USER.role];
      pa.style.display = vis(!!target);
      pa.onclick = target ? function () { show(target); } : null;
    }
    curView = "dash";
    show("dash");
    // Ana siteden derin bağlantı: portal.html#orders → ilgili görünüm
    var hv = (location.hash || "").replace("#", "");
    if (hv && NAV[USER.role].some(function (n) { return n.v === hv; })) show(hv);
    consumePrefill();
  }
  boot();
})();
