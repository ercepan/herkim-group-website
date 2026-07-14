/* ============================================================
   PAN HOLDING — Sipariş/Takip Portalı (demo uygulama mantığı)
   Tüm dinamik içerik güvenli DOM API'leriyle üretilir (innerHTML yok).
   Oturum ve yeni talepler localStorage'da tutulur.
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

  var SES_KEY = "pan_portal_session";
  var REQ_KEY = "pan_portal_requests_v1";

  function getSession() {
    try { return JSON.parse(localStorage.getItem(SES_KEY)); } catch (e) { return null; }
  }
  function getRequests() {
    var extra = [];
    try { extra = JSON.parse(localStorage.getItem(REQ_KEY)) || []; } catch (e) {}
    return extra.concat(PAN_REQUESTS_SEED);
  }

  /* ---------- Giriş ekranı ---------- */
  var loginView = $("#login-view");
  var appView = $("#app-view");

  function enter(roleKey) {
    localStorage.setItem(SES_KEY, JSON.stringify({ role: roleKey, at: "" + new Date().getTime() }));
    boot();
  }
  $$("[data-demo]").forEach(function (b) {
    b.addEventListener("click", function () { enter(b.getAttribute("data-demo")); });
  });
  var lf = $("#login-form");
  if (lf) lf.addEventListener("submit", function (e) {
    e.preventDefault();
    enter("musteri"); // demo: form da müşteri olarak girer
  });

  function logout() {
    localStorage.removeItem(SES_KEY);
    location.reload();
  }
  var lo = $("#logout");
  if (lo) lo.addEventListener("click", logout);

  /* ---------- Uygulama ---------- */
  var USER = null;

  function boot() {
    var s = getSession();
    if (!s || !PAN_USERS[s.role]) {
      loginView.style.display = "";
      appView.style.display = "none";
      return;
    }
    USER = PAN_USERS[s.role];
    loginView.style.display = "none";
    appView.style.display = "";
    // kullanıcı kutusu
    $("#u-initials").textContent = USER.initials;
    $("#u-name").textContent = USER.name;
    $("#u-company").textContent = USER.company;
    // rol farkları
    var isSales = USER.role === "satisci";
    $("#col-customer").style.display = isSales ? "" : "none";
    $("#nav-inbox").style.display = isSales ? "" : "none";
    $("#kpi-scope").textContent = isSales ? "Tüm müşteriler" : USER.company;
    renderAll();
    show("dash");
  }

  function myOrders() {
    if (USER.role === "satisci") return PAN_ORDERS.slice();
    return PAN_ORDERS.filter(function (o) { return o.customer === USER.company; });
  }
  function myRequests() {
    if (USER.role === "satisci") return getRequests();
    return getRequests().filter(function (r) { return r.customer === USER.company; });
  }

  /* ---------- Görünüm geçişi ---------- */
  var views = ["dash", "orders", "requests", "history"];
  function show(key) {
    views.forEach(function (v) {
      var pane = $("#view-" + v);
      if (pane) pane.style.display = (v === key) ? "" : "none";
      var link = $('[data-view="' + v + '"]');
      if (link) link.classList.toggle("on", v === key);
    });
    var titles = { dash: "Özet", orders: "Siparişlerim", requests: "Taleplerim", history: "Görüşme Geçmişi" };
    $("#page-title").textContent = (USER.role === "satisci" && key === "orders") ? "Siparişler (Tüm Müşteriler)" : titles[key];
  }
  $$("[data-view]").forEach(function (b) {
    b.addEventListener("click", function () { show(b.getAttribute("data-view")); });
  });

  /* ---------- Durum çipi ---------- */
  function statusChip(step) {
    var c = el("span", "st st--" + PAN_STEP_CLASS[step], PAN_STEPS[step]);
    return c;
  }

  /* ---------- KPI ---------- */
  function renderKpis() {
    var o = myOrders();
    var active = o.filter(function (x) { return x.step < 4; }).length;
    var ship = o.filter(function (x) { return x.step === 3; }).length;
    var open = myRequests().filter(function (r) { return r.status === "acik" || r.status === "crm"; }).length;
    $("#kpi-active").textContent = active;
    $("#kpi-ship").textContent = ship;
    $("#kpi-open").textContent = open;
    $("#kpi-done").textContent = o.filter(function (x) { return x.step === 4; }).length;
  }

  /* ---------- Sipariş tablosu ---------- */
  var fState = { q: "", st: "all" };
  function renderOrders() {
    var tb = $("#orders-body");
    tb.textContent = "";
    var list = myOrders().filter(function (o) {
      if (fState.st !== "all" && String(o.step) !== fState.st) return false;
      if (fState.q) {
        var hay = (o.id + " " + o.customer + " " + o.items.map(function (i) { return i.n; }).join(" ")).toLocaleLowerCase("tr");
        if (hay.indexOf(fState.q.toLocaleLowerCase("tr")) === -1) return false;
      }
      return true;
    });
    if (!list.length) {
      var tr0 = el("tr"); var td0 = el("td", "empty", "Kayıt bulunamadı.");
      td0.colSpan = 6; tr0.appendChild(td0); tb.appendChild(tr0);
      return;
    }
    list.forEach(function (o) {
      var tr = el("tr");
      var tdId = el("td");
      var idb = el("span", "t-id", o.id);
      tdId.appendChild(idb);
      if (USER.role === "satisci") tdId.appendChild(el("span", "t-cust", o.customer));
      tr.appendChild(tdId);

      var tdItems = el("td", null, o.items.map(function (i) { return i.n; }).join(" · "));
      tr.appendChild(tdItems);
      tr.appendChild(el("td", null, o.date));

      var tdSt = el("td"); tdSt.appendChild(statusChip(o.step)); tr.appendChild(tdSt);

      var tdPr = el("td");
      var prog = el("div", "prog");
      var bar = el("div", "bar"); var fill = el("i");
      fill.style.width = ((o.step) / 4 * 100) + "%";
      bar.appendChild(fill);
      prog.appendChild(bar);
      prog.appendChild(el("span", null, (o.step + 1) + "/5"));
      tdPr.appendChild(prog);
      tr.appendChild(tdPr);

      tr.appendChild(el("td", null, o.eta));
      tr.addEventListener("click", function () { openDrawer(o); });
      tb.appendChild(tr);
    });
  }
  var oq = $("#o-search");
  if (oq) oq.addEventListener("input", function () { fState.q = oq.value; renderOrders(); });
  var osel = $("#o-status");
  if (osel) osel.addEventListener("change", function () { fState.st = osel.value; renderOrders(); });

  /* ---------- Sipariş detay çekmecesi ---------- */
  var ov = $("#ov"), dw = $("#drawer");
  function closeDrawer() { ov.classList.remove("open"); dw.classList.remove("open"); }
  ov.addEventListener("click", closeDrawer);
  $("#dw-close").addEventListener("click", closeDrawer);

  function openDrawer(o) {
    $("#dw-id").textContent = o.id;
    $("#dw-sub").textContent = o.customer + " · Sipariş tarihi " + o.date;
    var stBox = $("#dw-status"); stBox.textContent = "";
    stBox.appendChild(statusChip(o.step));

    // zaman çizelgesi
    var tl = $("#dw-tl"); tl.textContent = "";
    PAN_STEPS.forEach(function (name, i) {
      var cls = i < o.step ? "tl-step done" : (i === o.step ? "tl-step now" : "tl-step");
      var st = el("div", cls);
      st.appendChild(el("b", null, name));
      st.appendChild(el("span", null, o.timeline[i] ? o.timeline[i] : (i === o.step ? "Devam ediyor…" : "—")));
      tl.appendChild(st);
    });

    // kalemler
    var items = $("#dw-items"); items.textContent = "";
    o.items.forEach(function (i) {
      var row = el("div", "dw-item");
      row.appendChild(el("b", null, i.n));
      row.appendChild(el("span", null, i.q));
      items.appendChild(row);
    });

    // sevkiyat
    $("#dw-carrier").textContent = o.carrier;
    $("#dw-track").textContent = o.track;
    $("#dw-eta").textContent = o.eta;
    $("#dw-rep").textContent = USER.role === "musteri" ? (USER.rep || "—") : "Ayşe Yılmaz";

    ov.classList.add("open");
    dw.classList.add("open");
  }
  $$(".doc-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      window.panToast("Demo: " + b.textContent.trim() + " belgesi gerçek sistemde Logo Tiger'dan gelir.");
    });
  });

  /* ---------- Talepler ---------- */
  function renderRequests() {
    var wrap = $("#req-list"); wrap.textContent = "";
    var list = myRequests();
    if (!list.length) { wrap.appendChild(el("div", "empty", "Henüz talep yok.")); return; }
    list.forEach(function (r) {
      var card = el("div", "panel");
      var head = el("div", "panel-head");
      var left = el("div");
      var t = el("b", null, r.subject);
      t.style.cssText = "display:block;font-size:15.5px;color:var(--ink)";
      left.appendChild(t);
      var sub = el("span", null, r.id + " · " + r.date + (USER.role === "satisci" ? " · " + r.customer : ""));
      sub.style.cssText = "font-size:12.5px;color:var(--muted)";
      left.appendChild(sub);
      head.appendChild(left);
      var chip = el("span",
        r.status === "acik" ? "st st--acik" : (r.status === "crm" ? "st st--crm" : "st st--yanit"),
        r.status === "acik" ? "Açık" : (r.status === "crm" ? "CRM'e iletildi" : "Yanıtlandı"));
      head.appendChild(chip);
      card.appendChild(head);

      var body = el("div");
      body.style.cssText = "padding:16px 22px";
      body.appendChild(el("p", null, r.detail));
      if (r.reply) {
        var rep = el("div", "crm-note");
        rep.style.marginTop = "12px";
        var rb = el("div");
        var rbb = el("b", null, r.reply.by + " · " + r.reply.when);
        rb.appendChild(rbb);
        var rp = el("p", null, r.reply.text);
        rp.style.marginTop = "3px";
        rb.appendChild(rp);
        rep.appendChild(rb);
        body.appendChild(rep);
      }
      card.appendChild(body);
      wrap.appendChild(card);
    });
  }

  /* Yeni talep */
  var rf = $("#req-form");
  if (rf) rf.addEventListener("submit", function (e) {
    e.preventDefault();
    var subj = $("#rf-subject").value.trim();
    var det = $("#rf-detail").value.trim();
    if (!subj || !det) { window.panToast("Lütfen konu ve detay girin."); return; }
    var extra = [];
    try { extra = JSON.parse(localStorage.getItem(REQ_KEY)) || []; } catch (err) {}
    var no = 313 + extra.length;
    extra.unshift({
      id: "TL-2026-0" + no,
      customer: USER.role === "musteri" ? USER.company : "Derim Deri San. A.Ş.",
      subject: subj, detail: det,
      date: "14.07.2026", status: "crm",
      reply: { by: "Sistem", when: "şimdi", text: "Talebiniz satış temsilciniz " + (USER.rep || "Ayşe Yılmaz") + "'ın CRM kartına düştü. En kısa sürede dönüş yapılacak." }
    });
    localStorage.setItem(REQ_KEY, JSON.stringify(extra));
    rf.reset();
    renderRequests(); renderKpis();
    window.panToast("Talebiniz alındı ve CRM'e iletildi ✓");
  });

  /* ---------- Görüşme geçmişi ---------- */
  function renderHistory() {
    var wrap = $("#hist-list"); wrap.textContent = "";
    PAN_HISTORY.forEach(function (h) {
      var item = el("div", "hist-item");
      item.appendChild(el("div", "hist-ico", h.via));
      var mid = el("div");
      mid.appendChild(el("b", null, h.title));
      mid.appendChild(el("p", null, h.note));
      item.appendChild(mid);
      item.appendChild(el("span", "when", h.when));
      wrap.appendChild(item);
    });
  }

  /* ---------- Bildirimler ---------- */
  var bell = $("#bell"), pop = $("#notif-pop");
  if (bell) bell.addEventListener("click", function (e) {
    e.stopPropagation();
    pop.classList.toggle("open");
  });
  document.addEventListener("click", function () { if (pop) pop.classList.remove("open"); });
  function renderNotifs() {
    pop.textContent = "";
    PAN_NOTIFS.forEach(function (n) {
      var it = el("div", "notif-item");
      it.appendChild(el("b", null, n.t));
      it.appendChild(el("span", null, n.s + " · " + n.when));
      pop.appendChild(it);
    });
  }

  /* ---------- Özet: son siparişler ---------- */
  function renderDash() {
    var tb = $("#dash-body"); tb.textContent = "";
    myOrders().slice(0, 4).forEach(function (o) {
      var tr = el("tr");
      var tdId = el("td"); tdId.appendChild(el("span", "t-id", o.id));
      if (USER.role === "satisci") tdId.appendChild(el("span", "t-cust", o.customer));
      tr.appendChild(tdId);
      tr.appendChild(el("td", null, o.items[0].n + (o.items.length > 1 ? " +" + (o.items.length - 1) : "")));
      var tdSt = el("td"); tdSt.appendChild(statusChip(o.step)); tr.appendChild(tdSt);
      tr.appendChild(el("td", null, o.eta));
      tr.addEventListener("click", function () { openDrawer(o); });
      tb.appendChild(tr);
    });
  }

  function renderAll() {
    renderKpis(); renderOrders(); renderRequests(); renderHistory(); renderNotifs(); renderDash();
  }

  /* başlat */
  boot();
})();
