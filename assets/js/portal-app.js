/* ============================================================
   HERKİM PORTAL — Uygulama mantığı (uçtan uca tek akış)
   Müşteri sipariş verir → Satış onaylar → Depo ilerletir → Yönetim izler.
   Güvenli DOM API'leri (innerHTML yok). Demo verisi: portal-store.js.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var SES = "hg_portal_session", LOCK = "hg_login_lock", LAST = "hg_last_login_";
  var PASS = "demo1234", IDLE = 15 * 60 * 1000;
  var USER = null, curView = "dash";

  /* ---------- Bildirim ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = el("div", "toast"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2800);
  }

  /* ---------- Giriş + güvenlik ---------- */
  function nowMs() { return Date.now(); }
  function getSes() { try { return JSON.parse(localStorage.getItem(SES)); } catch (e) { return null; } }
  function enter(role, acct) {
    var payload = { role: role, at: nowMs() };
    if (acct) payload.acct = acct;
    localStorage.setItem(SES, JSON.stringify(payload));
    localStorage.removeItem(LOCK);
    localStorage.setItem(LAST + role, hgpNow());
    boot();
  }
  $$("[data-role]").forEach(function (b) {
    b.addEventListener("click", function () { enter(b.getAttribute("data-role")); });
  });

  var errBox = $("#lg-err"), lgBtn = $("#lg-btn"), lockTimer = null;
  function getLock() { try { return JSON.parse(localStorage.getItem(LOCK)) || { n: 0, until: 0 }; } catch (e) { return { n: 0, until: 0 }; } }
  function showErr(m) {
    if (!errBox) return;
    errBox.textContent = m;
    errBox.classList.remove("show"); void errBox.offsetWidth;
    errBox.classList.add("show");
  }
  function lockUI() {
    var l = getLock(), left = Math.ceil((l.until - nowMs()) / 1000);
    if (left > 0) {
      lgBtn.disabled = true; lgBtn.style.opacity = "0.55";
      showErr("Çok fazla hatalı deneme. Giriş " + left + " sn kilitlendi.");
      if (!lockTimer) lockTimer = setInterval(lockUI, 1000);
    } else {
      lgBtn.disabled = false; lgBtn.style.opacity = "";
      if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
      if (l.until) { errBox.classList.remove("show"); localStorage.removeItem(LOCK); }
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
      if (l.n >= 3) { l.until = nowMs() + 60000; l.n = 0; }
      localStorage.setItem(LOCK, JSON.stringify(l));
      if (l.until > nowMs()) lockUI();
      else showErr(msg.replace("{n}", l.n));
    };
    if ($("#lg-pass").value !== PASS) { failTry("E-posta veya şifre hatalı. ({n}/3 deneme)"); return; }
    // E-posta → hesap: varsayılan demo müşteri ya da onaylı web hesabı
    var em = ($("#lg-mail") ? $("#lg-mail").value : "").trim().toLowerCase();
    if (!em || em === "satinalma@derimderi.com.tr") { enter("musteri"); return; }
    var acc = null;
    (hgpGet().accounts || []).forEach(function (a) { if (a.email === em) acc = a; });
    if (!acc) { failTry("Bu e-postayla onaylı hesap bulunamadı. Önce başvuru yapın. ({n}/3)"); return; }
    enter("musteri", { role: "musteri", name: acc.name, company: acc.company,
                       initials: acc.initials, rep: "Ayşe Yılmaz", email: acc.email });
  });

  function logout() { localStorage.removeItem(SES); location.reload(); }
  $("#btn-logout").addEventListener("click", logout);
  $("#btn-switch").addEventListener("click", logout);
  $("#btn-reset").addEventListener("click", function () {
    hgpReset();
    toast("Demo verisi başa sarıldı.");
    renderAll();
  });

  function touch() {
    var s = getSes();
    if (!s) return;
    if (nowMs() - (s.touched || s.at) > 30000) { s.touched = nowMs(); localStorage.setItem(SES, JSON.stringify(s)); }
  }
  ["click", "keydown", "scroll", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, touch, { passive: true });
  });
  setInterval(function () {
    var s = getSes();
    if (s && nowMs() - (s.touched || s.at) > IDLE) logout();
  }, 60000);

  /* ---------- Rol yapılandırması ---------- */
  var NAV = {
    musteri: [
      { v: "dash", t: "⬛ Özet" },
      { v: "neworder", t: "🛒 Yeni Sipariş" },
      { v: "orders", t: "📦 Siparişlerim" },
      { v: "requests", t: "📝 Taleplerim" }
    ],
    satis: [
      { v: "dash", t: "⬛ CRM Özeti" },
      { v: "orders", t: "✅ Siparişler & Onay", cnt: "onay" },
      { v: "requests", t: "📥 Gelen Talepler", cnt: "acik" },
      { v: "customers", t: "🪪 Müşteri Kartları", cnt: "basvuru" }
    ],
    depo: [
      { v: "dash", t: "⬛ Özet" },
      { v: "ops", t: "🏭 Operasyon Panosu", cnt: "ops" }
    ],
    yonetim: [
      { v: "dash", t: "📊 Dashboard" },
      { v: "orders", t: "📦 Tüm Siparişler" },
      { v: "requests", t: "📝 Talepler" }
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

  function myOrders(s) {
    if (USER.role === "musteri") return s.orders.filter(function (o) { return o.customer === USER.company; });
    return s.orders.slice();
  }
  function myRequests(s) {
    if (USER.role === "musteri") return s.requests.filter(function (r) { return r.customer === USER.company; });
    return s.requests.slice();
  }

  /* ---------- Kabuk ---------- */
  function buildNav() {
    var s = hgpGet();
    var wrap = $("#sb-nav");
    wrap.textContent = "";
    NAV[USER.role].forEach(function (item) {
      var b = el("button", "sb-link" + (item.v === curView ? " on" : ""), item.t + " ");
      if (item.cnt) {
        var n = 0;
        if (item.cnt === "onay") n = s.orders.filter(function (o) { return o.step === 0; }).length;
        if (item.cnt === "acik") n = s.requests.filter(function (r) { return r.status === "acik"; }).length;
        if (item.cnt === "ops") n = s.orders.filter(function (o) { return o.step >= 1 && o.step <= 3; }).length;
        if (item.cnt === "basvuru") n = (s.applications || []).filter(function (a) { return a.status === "bekliyor"; }).length;
        if (n) b.appendChild(el("span", "cnt", String(n)));
      }
      b.addEventListener("click", function () { show(item.v); });
      wrap.appendChild(b);
    });
  }

  function show(v) {
    curView = v;
    ["dash", "neworder", "orders", "requests", "customers", "ops"].forEach(function (x) {
      var p = $("#view-" + x);
      if (p) p.style.display = (x === v) ? "" : "none";
    });
    $("#page-title").textContent = (TITLES[v] && TITLES[v][USER.role]) || "";
    buildNav();
    renderAll();
  }

  /* ---------- Durum çipi / ilerleme ---------- */
  function chip(step) { return el("span", "st st--" + HGP_STEP_CLASS[step], HGP_STEPS[step]); }
  function prog(step) {
    var w = el("div", "prog");
    var bar = el("div", "bar"); var f = el("i");
    f.style.width = (step / 4 * 100) + "%";
    bar.appendChild(f); w.appendChild(bar);
    w.appendChild(el("span", null, (step + 1) + "/5"));
    return w;
  }

  /* ---------- KPI + huni + akış ---------- */
  function countTo(elm, n) {
    var t0 = performance.now();
    (function step(t) {
      var p = Math.min((t - t0) / 600, 1);
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
    var row = $("#kpi-row"); row.textContent = "";
    var cnt = function (fn) { return o.filter(fn).length; };
    if (USER.role === "musteri") {
      row.appendChild(kpi(cnt(function (x) { return x.step < 4; }), "Aktif sipariş"));
      row.appendChild(kpi(cnt(function (x) { return x.step === 0; }), "Onay bekleyen"));
      row.appendChild(kpi(r.filter(function (x) { return x.status === "acik"; }).length, "Açık talep"));
      row.appendChild(kpi(cnt(function (x) { return x.step === 4; }), "Teslim (2026)"));
    } else if (USER.role === "satis") {
      row.appendChild(kpi(cnt(function (x) { return x.step === 0; }), "Onay bekleyen sipariş"));
      row.appendChild(kpi(r.filter(function (x) { return x.status === "acik"; }).length, "Açık talep"));
      row.appendChild(kpi(cnt(function (x) { return x.step >= 1 && x.step < 4; }), "Süreçteki sipariş"));
      row.appendChild(kpi(HGP_CUSTOMERS.length + (s.customers || []).length, "Aktif müşteri"));
    } else if (USER.role === "depo") {
      row.appendChild(kpi(cnt(function (x) { return x.step === 1; }), "Üretim bekleyen"));
      row.appendChild(kpi(cnt(function (x) { return x.step === 2; }), "Üretimde"));
      row.appendChild(kpi(cnt(function (x) { return x.step === 3; }), "Sevkiyatta"));
      row.appendChild(kpi(cnt(function (x) { return x.step === 4; }), "Teslim (2026)"));
    } else {
      row.appendChild(kpi(o.length, "Toplam sipariş (2026)"));
      row.appendChild(kpi(cnt(function (x) { return x.step === 0; }), "Onay bekleyen"));
      row.appendChild(kpi(cnt(function (x) { return x.step >= 2 && x.step <= 3; }), "Üretim + sevkiyat"));
      row.appendChild(kpi(r.filter(function (x) { return x.status === "acik"; }).length, "Açık talep"));
    }
  }
  function renderFunnel() {
    var s = hgpGet();
    var wrap = $("#funnel"); wrap.textContent = "";
    var rows = [
      ["Açık talep", s.requests.filter(function (r) { return r.status === "acik"; }).length],
      ["Onay bekleyen", s.orders.filter(function (o) { return o.step === 0; }).length],
      ["Üretim + sevkiyat", s.orders.filter(function (o) { return o.step >= 1 && o.step <= 3; }).length],
      ["Teslim edilen", s.orders.filter(function (o) { return o.step === 4; }).length]
    ];
    var max = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    rows.forEach(function (r) {
      var row = el("div", "fun-row");
      row.appendChild(el("span", "mono", r[1] === 1 ? r[0] : r[0]));
      var bar = el("div", "fun-bar"); var f = el("i");
      f.style.width = Math.max(4, r[1] / max * 100) + "%";
      bar.appendChild(f); row.appendChild(bar);
      row.appendChild(el("b", null, String(r[1])));
      wrap.appendChild(row);
    });
  }
  function renderFeed() {
    var s = hgpGet();
    var wrap = $("#feed"); wrap.textContent = "";
    var list = s.activities.slice(0, USER.role === "yonetim" ? 14 : 7);
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

  /* ---------- Sipariş tabloları ---------- */
  function orderRow(o, opts) {
    var tr = el("tr");
    var td1 = el("td");
    td1.appendChild(el("span", "t-id", o.id));
    if (USER.role !== "musteri") td1.appendChild(el("span", "t-cust", o.customer));
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
    tr.textContent = "";
    cols.forEach(function (c) { tr.appendChild(el("th", null, c)); });
  }
  var oq = "", ost = "all";
  function renderOrders() {
    var s = hgpGet();
    var body = $("#orders-body"); if (!body) return;
    thRow($("#orders-thead"), USER.role === "musteri"
      ? ["SİPARİŞ", "KALEMLER", "TARİH", "DURUM", "İLERLEME", "TAHMİNİ TESLİM"]
      : ["SİPARİŞ / MÜŞTERİ", "KALEMLER", "TARİH", "DURUM", "İLERLEME", "TAHMİNİ TESLİM"]);
    body.textContent = "";
    var list = myOrders(s).filter(function (o) {
      if (ost !== "all" && String(o.step) !== ost) return false;
      if (oq) {
        var hay = (o.id + " " + o.customer + " " + o.items.map(function (i) { return i.n; }).join(" ")).toLocaleLowerCase("tr");
        if (hay.indexOf(oq.toLocaleLowerCase("tr")) === -1) return false;
      }
      return true;
    });
    if (USER.role === "satis") list.sort(function (a, b) { return a.step - b.step; });
    if (!list.length) {
      var tr = el("tr"), td = el("td", "empty2", "Kayıt bulunamadı.");
      td.colSpan = 6; tr.appendChild(td); body.appendChild(tr);
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
    var body = $("#dash-body"), head = $("#dash-thead");
    thRow(head, USER.role === "musteri" ? ["SİPARİŞ", "KALEMLER", "DURUM"] : ["SİPARİŞ / MÜŞTERİ", "KALEMLER", "DURUM"]);
    body.textContent = "";
    var list = myOrders(s);
    if (USER.role === "satis") list = list.filter(function (o) { return o.step === 0; }).concat(list.filter(function (o) { return o.step > 0; }));
    if (USER.role === "depo") list = list.filter(function (o) { return o.step >= 1 && o.step <= 3; }).concat(list.filter(function (o) { return o.step === 0 || o.step === 4; }));
    list.slice(0, 5).forEach(function (o) { body.appendChild(orderRow(o, { compact: true })); });
    $("#dash-list-title").textContent = USER.role === "satis" ? "Önce onay bekleyenler" : (USER.role === "depo" ? "Süreçteki siparişler" : "Son siparişler");
    $("#dash-funnel-panel").style.display = (USER.role === "yonetim" || USER.role === "satis") ? "" : "none";
    $("#feed-panel").style.display = (USER.role === "musteri") ? "none" : "";
  }
  $("#dash-more").addEventListener("click", function () { show("orders"); });

  /* ---------- Yeni sipariş (katalog + sepet) ---------- */
  var cart = {}; // productId -> qty
  var catQ = "";
  function prodName(p) { return p.n.tr; }
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
      info.appendChild(el("span", "mono", HK_SUBS[p.sub].tr + " · " + p.pack));
      row.appendChild(info);
      var q = el("div", "qty");
      var minus = el("button", null, "−");
      var inp = el("input");
      inp.type = "text"; inp.value = cart[p.id] || 0; inp.setAttribute("inputmode", "numeric");
      var plus = el("button", null, "+");
      function setQty(v) {
        v = Math.max(0, Math.min(999, v | 0));
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
      var p = null;
      HK_PRODUCTS.forEach(function (x) { if (x.id === +id) p = x; });
      if (!p) return;
      var line = el("div", "cart-line");
      line.appendChild(el("b", null, prodName(p)));
      line.appendChild(el("span", "mono", cart[id] + " × " + p.pack));
      wrap.appendChild(line);
    });
  }
  $("#btn-place-order").addEventListener("click", function () {
    var ids = Object.keys(cart);
    if (!ids.length) { toast("Önce sepete ürün ekleyin."); return; }
    var items = ids.map(function (id) {
      var p = null;
      HK_PRODUCTS.forEach(function (x) { if (x.id === +id) p = x; });
      return { n: prodName(p), q: cart[id] + " × " + p.pack };
    });
    var oid = hgpAddOrder(USER.company, items, USER.name + " (" + USER.company + ")");
    cart = {};
    renderCatalog(); renderCart();
    toast("Sipariş " + oid + " oluşturuldu — satış onayına düştü ✓");
    show("orders");
  });

  /* Teklif sepetinden aktarım (ana site → portal) */
  function consumePrefill() {
    var pf = null;
    try { pf = JSON.parse(localStorage.getItem(HGP_PREFILL)); } catch (e) {}
    if (!pf || !pf.ids || !pf.ids.length) return;
    localStorage.removeItem(HGP_PREFILL);
    pf.ids.forEach(function (id) { cart[id] = (cart[id] || 0) + 1; });
    show("neworder");
    toast("Teklif sepetiniz siparişe aktarıldı — miktarları belirleyin.");
  }

  /* ---------- Talepler ---------- */
  function renderRequests() {
    var s = hgpGet();
    var wrap = $("#req-list"); if (!wrap) return;
    $("#new-req-panel").style.display = USER.role === "musteri" ? "" : "none";
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
      left.appendChild(el("span", "mono", r.id + " · " + r.date + (USER.role !== "musteri" ? " · " + r.customer : "")));
      head.appendChild(left);
      var right = el("div");
      right.style.cssText = "display:flex;gap:8px;align-items:center";
      if (r.viaLanding) right.appendChild(el("span", "st st--landing", "Landing"));
      right.appendChild(el("span", r.status === "acik" ? "st st--acik" : "st st--yanit", r.status === "acik" ? "Açık" : "Yanıtlandı"));
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
      if (USER.role === "satis" && r.status === "acik") {
        var box = el("div", "reply-box");
        box.style.marginTop = "12px";
        var ta = el("textarea");
        ta.placeholder = "Yanıtınız… (müşteriye ve CRM kartına işlenir)";
        ta.maxLength = 300;
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
  var rfd = $("#rf-detail"), rfc = $("#rf-count");
  if (rfd) rfd.addEventListener("input", function () { rfc.textContent = rfd.value.length + "/500"; });
  var rf = $("#req-form");
  if (rf) rf.addEventListener("submit", function (e) {
    e.preventDefault();
    var subj = $("#rf-subject").value.trim(), det = $("#rf-detail").value.trim();
    if (!subj || !det) { toast("Lütfen konu ve detay girin."); return; }
    hgpAddRequest(USER.company, subj, det, USER.name + " (" + USER.company + ")");
    if (typeof hgNotify === "function")
      hgNotify("📝 Yeni Talep — " + USER.company,
        ["Konu: " + subj, "", det, "", "Talep eden: " + USER.name + " (" + USER.company + ")"], USER.name);
    rf.reset(); rfc.textContent = "0/500";
    toast("Talebiniz satış temsilcinizin CRM kutusuna düştü ✓");
    renderAll();
  });

  /* ---------- Müşteri kartları (satış) ---------- */
  function renderCustomers() {
    var s = hgpGet();
    var wrap = $("#cust-grid"); if (!wrap) return;
    wrap.textContent = "";
    renderApplications(s);
    HGP_CUSTOMERS.concat(s.customers || []).forEach(function (c) {
      var oc = s.orders.filter(function (o) { return o.customer === c.name; }).length;
      var rc = s.requests.filter(function (r) { return r.customer === c.name && r.status === "acik"; }).length;
      var card = el("div", "cust-card");
      card.appendChild(el("h3", null, c.name));
      card.appendChild(el("span", "mono", c.city + " · Temsilci: " + c.rep + " · " + c.since + "'den beri"));
      var mini = el("div", "cust-mini");
      [[oc, "SİPARİŞ"], [rc, "AÇIK TALEP"], [c.history.length, "TEMAS"]].forEach(function (m) {
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

  /* ---------- Hesap başvuruları (satış onay kutusu) ---------- */
  function renderApplications(s) {
    var view = $("#view-customers"); if (!view) return;
    var old = $("#apps-panel", view);
    if (old) old.remove();
    if (USER.role !== "satis") return;
    var pend = (s.applications || []).filter(function (a) { return a.status === "bekliyor"; });
    if (!pend.length) return;
    var panel = el("div", "panel");
    panel.id = "apps-panel";
    panel.style.marginBottom = "22px";
    var head = el("div", "p-head");
    head.appendChild(el("h3", null, "🆕 Bekleyen Hesap Başvuruları (" + pend.length + ")"));
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
        hgpDecideApplication(a.id, true, USER.name + " (Satış)");
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

  /* ---------- Operasyon (depo) ---------- */
  var ADV_LABEL = ["Onayla", "Üretime Al →", "Sevkiyata Çıkar →", "Teslim İşaretle ✓", "Tamamlandı"];
  function renderOps() {
    var s = hgpGet();
    var body = $("#ops-body"); if (!body) return;
    body.textContent = "";
    var list = s.orders.filter(function (o) { return o.step >= 1 && o.step <= 3; });
    if (!list.length) { var tr0 = el("tr"), td0 = el("td", "empty2", "Süreçte sipariş yok — satış onayı bekleniyor."); td0.colSpan = 4; tr0.appendChild(td0); body.appendChild(tr0); return; }
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
      var btn = el("button", "advance-btn", ADV_LABEL[o.step + 1] || "—");
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

  /* ---------- Sipariş çekmecesi ---------- */
  var ov = $("#ov2"), dwo = $("#dw-order"), dwc = $("#dw-cust");
  function closeDws() { ov.classList.remove("open"); dwo.classList.remove("open"); dwc.classList.remove("open"); }
  ov.addEventListener("click", closeDws);
  $$("[data-close]").forEach(function (b) { b.addEventListener("click", closeDws); });

  function openOrder(id) {
    var s = hgpGet(), o = null;
    s.orders.forEach(function (x) { if (x.id === id) o = x; });
    if (!o) return;
    $("#do-id").textContent = o.id;
    $("#do-sub").textContent = o.customer + " · Sipariş tarihi " + o.date;
    var c = $("#do-chip"); c.textContent = ""; c.appendChild(chip(o.step));
    var tl = $("#do-tl"); tl.textContent = "";
    HGP_STEPS.forEach(function (name, i) {
      var st = el("div", i < o.step ? "tl2-step done" : (i === o.step ? "tl2-step now" : "tl2-step"));
      st.appendChild(el("b", null, name));
      st.appendChild(el("span", null, o.tl[i] || (i === o.step ? "Devam ediyor…" : "—")));
      tl.appendChild(st);
    });
    var items = $("#do-items"); items.textContent = "";
    o.items.forEach(function (i) {
      var r = el("div", "dw-item");
      r.appendChild(el("b", null, i.n));
      r.appendChild(el("span", null, i.q));
      items.appendChild(r);
    });
    if (o.note) {
      var nr = el("div", "dw-item");
      nr.appendChild(el("b", null, "🗒 Sipariş notu"));
      nr.appendChild(el("span", null, o.note));
      items.appendChild(nr);
    }
    $("#do-carrier").textContent = o.carrier;
    $("#do-track").textContent = o.track;
    $("#do-eta").textContent = o.eta;
    // Rol aksiyonları: satış onayı / depo ilerletme
    var act = $("#do-actions"); act.textContent = "";
    if (USER.role === "satis" && o.step === 0) {
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
    if (USER.role === "depo" && o.step >= 1 && o.step <= 3) {
      var b2 = el("button", "btn btn--primary", ADV_LABEL[o.step + 1]);
      b2.addEventListener("click", function () {
        var ns = hgpAdvance(o.id, USER.name + " (Depo)");
        if (ns != null) toast(o.id + " → " + HGP_STEPS[ns] + " ✓");
        closeDws(); renderAll();
      });
      act.appendChild(b2);
    }
    ov.classList.add("open"); dwo.classList.add("open");
  }

  /* ---------- Müşteri kartı ---------- */
  var curCust = null;
  function openCust(c) {
    curCust = c;
    var s = hgpGet();
    $("#dc-name").textContent = c.name;
    $("#dc-sub").textContent = c.city + " · " + c.since + "'den beri müşteri";
    $("#dc-contact").textContent = c.contact;
    $("#dc-phone").textContent = c.phone;
    $("#dc-mail").textContent = c.email;
    $("#dc-rep").textContent = c.rep;
    var h = $("#dc-history"); h.textContent = "";
    var notes = s.activities.filter(function (a) { return a.type === "not" && a.what.indexOf(c.name) === 0; });
    notes.forEach(function (n) {
      var r = el("div", "dw-item");
      r.appendChild(el("b", null, "🗒 " + n.what.split("görüşme notu: ")[1]));
      r.appendChild(el("span", null, n.when));
      h.appendChild(r);
    });
    c.history.forEach(function (x) {
      var r = el("div", "dw-item");
      r.appendChild(el("b", null, x.via + " " + x.t));
      r.appendChild(el("span", null, x.when));
      h.appendChild(r);
    });
    var oo = $("#dc-orders"); oo.textContent = "";
    var ords = s.orders.filter(function (o) { return o.customer === c.name; });
    if (!ords.length) oo.appendChild(el("div", "dw-item", "Sipariş yok."));
    ords.forEach(function (o) {
      var r = el("div", "dw-item");
      var b = el("b", null, o.id + " — " + o.items[0].n);
      r.appendChild(b);
      var sp = el("span"); sp.appendChild(chip(o.step));
      r.appendChild(sp);
      r.style.cursor = "pointer";
      r.addEventListener("click", function () { dwc.classList.remove("open"); openOrder(o.id); });
      oo.appendChild(r);
    });
    var rr = $("#dc-requests"); rr.textContent = "";
    var reqs = s.requests.filter(function (x) { return x.customer === c.name; });
    if (!reqs.length) rr.appendChild(el("div", "dw-item", "Talep yok."));
    reqs.forEach(function (x) {
      var r = el("div", "dw-item");
      r.appendChild(el("b", null, x.subject));
      r.appendChild(el("span", null, x.status === "acik" ? "Açık" : "Yanıtlandı"));
      rr.appendChild(r);
    });
    ov.classList.add("open"); dwc.classList.add("open");
  }
  $("#dc-note-btn").addEventListener("click", function () {
    var ta = $("#dc-note"), txt = ta.value.trim();
    if (!txt || !curCust) { toast("Not boş olamaz."); return; }
    hgpAddNote(curCust.name, txt, USER.name);
    ta.value = "";
    toast("Not müşteri kartına işlendi ✓");
    openCust(curCust); renderAll();
  });

  /* ---------- Toplu çizim + başlatma ---------- */
  function renderAll() {
    if (!USER) return;
    buildNav();
    renderKpis(); renderFunnel(); renderFeed(); renderDash();
    renderOrders(); renderRequests(); renderCustomers(); renderOps();
    renderCatalog(); renderCart();
  }

  function boot() {
    var s = getSes();
    if (s && nowMs() - (s.touched || s.at) > IDLE) { localStorage.removeItem(SES); s = null; }
    if (!s || !HGP_USERS[s.role]) {
      $("#login-view").style.display = "";
      $("#app-view").style.display = "none";
      return;
    }
    USER = HGP_USERS[s.role];
    // Ana siteden onaylı web hesabıyla giriş: oturumdaki hesap bilgisi baskındır
    if (s.acct && s.role === "musteri") {
      USER = { role: "musteri", name: s.acct.name, title: "Satın Alma",
               company: s.acct.company, initials: s.acct.initials || "MK",
               rep: s.acct.rep || "Ayşe Yılmaz" };
    }
    $("#login-view").style.display = "none";
    $("#app-view").style.display = "";
    $("#u-initials").textContent = USER.initials;
    $("#u-name").textContent = USER.name;
    $("#u-title").textContent = USER.title + " · " + USER.company;
    $("#role-pill").textContent = ROLE_LABEL[USER.role];
    $("#scope").textContent = USER.role === "musteri" ? USER.company : "Herkim Kimya";
    var last = localStorage.getItem(LAST + USER.role);
    $("#u-last").textContent = last ? "Son giriş: " + last : "";
    var pa = $("#btn-primary-action");
    if (USER.role === "musteri") {
      pa.style.display = "";
      pa.onclick = function () { show("neworder"); };
    } else pa.style.display = "none";
    curView = "dash";
    show("dash");
    // Ana siteden derin bağlantı: portal.html#orders → ilgili görünüm
    var hv = (location.hash || "").replace("#", "");
    if (hv && NAV[USER.role].some(function (n) { return n.v === hv; })) show(hv);
    consumePrefill();
  }
  boot();
})();
