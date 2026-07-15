/* ============================================================
   HERKİM KİMYA — Etkileşim Katmanı
   Döviz kuru, dil (TR/EN/RU), teklif sepeti, arama, filtreler.
   Dinamik içerik güvenli DOM API'leri (createElement/textContent) ile üretilir.
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

  const HK = window.HK_COMPANY || {};
  window.HK_CONFIG = HK;

  const CAT_OF = (sub) => (HK_SUBS[sub] ? HK_SUBS[sub].cat : "");
  const CAT_LABEL = (catKey) => (HK_CATS[catKey] ? pick(HK_CATS[catKey]) : catKey);
  const SUB_LABEL = (sub) => (HK_SUBS[sub] ? pick(HK_SUBS[sub]) : sub);
  const SUB_CODE = (sub) => (HK_SUBS[sub] ? HK_SUBS[sub].code : "•");
  const PNAME = (p) => pick(p.n);

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
  if (burger && mnav) {
    burger.addEventListener("click", () => mnav.classList.add("open"));
    const mc = $(".mn-close", mnav);
    if (mc) mc.addEventListener("click", () => mnav.classList.remove("open"));
    $$("a", mnav).forEach(a => a.addEventListener("click", () => mnav.classList.remove("open")));
  }

  /* ============ 2) Dil değiştirici ============ */
  $$("[data-lang]").forEach(btn => btn.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof window.hkSetLang === "function") window.hkSetLang(btn.getAttribute("data-lang"));
  }));

  /* ============ 3) Döviz kuru ============ */
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
    render(HK_RATES_FALLBACK.usd, HK_RATES_FALLBACK.eur, false);
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(6000) });
      const j = await r.json();
      if (j && j.rates && j.rates.TRY) {
        const usdTry = j.rates.TRY;
        const eurTry = j.rates.EUR ? usdTry / j.rates.EUR : HK_RATES_FALLBACK.eur;
        render(usdTry, eurTry, true);
      }
    } catch (_) { /* çevrimdışı: yedek değerler */ }
  }
  loadRates();

  /* ============ 4) Görünürlük animasyonları ============ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  const observeReveal = (root) => $$(".reveal", root).forEach(n => { if (!n.classList.contains("in")) io.observe(n); });
  observeReveal(document);

  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const node = e.target, target = parseFloat(node.dataset.count || "0");
      const dur = 1400, t0 = performance.now();
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        node.textContent = Math.round(target * eased).toLocaleString("tr-TR");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  $$("[data-count]").forEach(node => cio.observe(node));

  /* ============ 5) Toast ============ */
  let toastTimer;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = el("div", "toast"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }
  window.hkToast = toast;

  /* ============ 6) Sepet: teklif + doğrudan sipariş ============ */
  const BASKET_KEY = "hk_basket_v3"; // [{id, qty}] — eski v2 (yalnız id listesi) otomatik taşınır
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
  const setBasket = (b) => { localStorage.setItem(BASKET_KEY, JSON.stringify(b)); renderBasket(); };
  const isCust = () => !!(window.hkAuth && window.hkAuth.isCustomer());

  let bdView = "cart"; // cart | confirm | success
  let lastOrderId = "";

  function addToBasket(id) {
    const p = HK_PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const b = getBasket();
    const line = b.find(x => x.id === id);
    bdView = "cart";
    if (line) {
      line.qty = Math.min(999, (line.qty || 1) + 1);
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

  /* Çekmece başlığı ve alt butonlar duruma göre */
  function basketChrome() {
    const cust = isCust();
    const h3 = $(".basket-drawer .bd-head h3"), sub = $(".basket-drawer .bd-head .mono");
    if (h3) h3.textContent = cust ? T("basket.titleOrder") : T("basket.title");
    if (sub) sub.textContent = cust ? T("basket.subOrder") : T("basket.sub");
    const foot = $(".basket-drawer .bd-foot");
    if (foot) foot.style.display = bdView === "cart" ? "" : "none";
  }

  function qtyControl(b, line) {
    const q = el("div", "bd-qty");
    const minus = el("button", null, "−");
    minus.type = "button";
    minus.disabled = (line.qty || 1) <= 1;
    minus.addEventListener("click", () => { line.qty = Math.max(1, (line.qty || 1) - 1); setBasket(b); });
    const plus = el("button", null, "+");
    plus.type = "button";
    plus.addEventListener("click", () => { line.qty = Math.min(999, (line.qty || 1) + 1); setBasket(b); });
    q.appendChild(minus);
    q.appendChild(el("i", null, String(line.qty || 1)));
    q.appendChild(plus);
    return q;
  }

  function renderCart(body, b) {
    const cust = isCust();
    if (cust) {
      const u = window.hkAuth.user();
      body.appendChild(el("span", "bd-mode", "● " + T("basket.modePill") + " — " + u.company));
    }
    b.forEach(line => {
      const p = HK_PRODUCTS.find(x => x.id === line.id);
      if (!p) return;
      const item = el("div", "bd-item");
      const info = el("div");
      info.appendChild(el("b", null, PNAME(p)));
      info.appendChild(el("span", "mono", p.pack));
      const right = el("div", "bd-right");
      right.appendChild(qtyControl(b, line));
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
    } else {
      cta.textContent = "🔐 " + T("basket.loginToOrder");
      cta.addEventListener("click", () => {
        if (!window.hkAuth) return;
        window.hkAuth.openLogin(() => { openBasket(); bdView = "confirm"; renderBasket(); });
      });
    }
    body.appendChild(cta);
    const note = el("p", null, cust ? T("order.info") : T("order.loginNote"));
    note.style.cssText = "font-size:12px;color:var(--ink-3);margin-top:8px";
    body.appendChild(note);
  }

  function renderConfirm(body, b) {
    const u = window.hkAuth.user();
    if (!u) { bdView = "cart"; renderBasket(); return; }
    const back = el("button", null, "← " + T("order.cancel"));
    back.type = "button";
    back.style.cssText = "font-family:var(--font-mono);font-size:12px;color:var(--crimson);font-weight:600;margin-bottom:12px";
    back.addEventListener("click", () => { bdView = "cart"; renderBasket(); });
    body.appendChild(back);
    const h = el("h4", null, T("order.confirmTitle"));
    h.style.cssText = "font-family:var(--font-display);font-weight:800;font-size:17px;margin-bottom:6px";
    body.appendChild(h);
    b.forEach(line => {
      const p = HK_PRODUCTS.find(x => x.id === line.id);
      if (!p) return;
      const row = el("div", "bd-item");
      const info = el("div");
      info.appendChild(el("b", null, PNAME(p)));
      info.appendChild(el("span", "mono", line.qty + " × " + p.pack));
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
    ta.id = "bd-note"; ta.maxLength = 200; ta.placeholder = T("order.notePh");
    ta.style.cssText = "width:100%;min-height:70px;padding:10px 12px;border:1.5px solid var(--line);border-radius:3px;background:var(--white);resize:vertical";
    body.appendChild(ta);
    const send = el("button", "btn btn--primary", "✓ " + T("order.confirm"));
    send.style.cssText = "width:100%;justify-content:center;margin-top:14px";
    send.addEventListener("click", () => placeOrder(ta.value));
    body.appendChild(send);
    const info2 = el("p", null, T("order.info"));
    info2.style.cssText = "font-size:12px;color:var(--ink-3);margin-top:8px";
    body.appendChild(info2);
  }

  function placeOrder(noteRaw) {
    const u = window.hkAuth && window.hkAuth.user();
    const b = getBasket();
    if (!u || u.role !== "musteri") {
      bdView = "cart"; renderBasket();
      if (window.hkAuth) window.hkAuth.openLogin(() => { openBasket(); bdView = "confirm"; renderBasket(); });
      return;
    }
    if (!b.length || typeof hgpAddOrder !== "function") return;
    const items = b.map(line => {
      const p = HK_PRODUCTS.find(x => x.id === line.id);
      return p ? { n: p.n.tr, q: line.qty + " × " + p.pack } : null;
    }).filter(Boolean);
    const note = (noteRaw || "").trim().slice(0, 200);
    lastOrderId = hgpAddOrder(u.company, items, u.name, note);
    bdView = "success";
    localStorage.setItem(BASKET_KEY, "[]");
    renderBasket();
    toast(T("order.toast") + " " + lastOrderId);
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
    track.href = "portal.html#orders";
    track.style.cssText = "width:100%;justify-content:center;margin-top:18px";
    box.appendChild(track);
    const cont = el("button", "btn btn--ghost btn--sm", T("order.continue"));
    cont.style.cssText = "width:100%;justify-content:center;margin-top:10px";
    cont.addEventListener("click", () => { bdView = "cart"; renderBasket(); closeBasket(); });
    box.appendChild(cont);
    body.appendChild(box);
  }

  function renderBasket() {
    const b = getBasket();
    $$(".basket-count").forEach(node => {
      node.textContent = b.length;
      node.style.display = b.length ? "grid" : "none";
    });
    const body = $("#basket-body");
    if (!body) return;
    if (bdView === "confirm" && (!b.length || !isCust())) bdView = "cart";
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
    renderCart(body, b);
  }

  const drawer = $(".basket-drawer");
  const overlay = $(".drawer-overlay");
  function openBasket() { if (drawer) { drawer.classList.add("open"); overlay.classList.add("open"); } }
  function closeBasket() { if (drawer) { drawer.classList.remove("open"); overlay.classList.remove("open"); } }
  $$("[data-open-basket]").forEach(node => node.addEventListener("click", (e) => { e.preventDefault(); openBasket(); }));
  if (overlay) overlay.addEventListener("click", closeBasket);
  const bdClose = $(".bd-close");
  if (bdClose) bdClose.addEventListener("click", closeBasket);

  function basketMessage() {
    const b = getBasket();
    const lines = b.map(line => {
      const p = HK_PRODUCTS.find(x => x.id === line.id);
      return p ? "• " + PNAME(p) + " (" + line.qty + " × " + p.pack + ")" : "";
    }).filter(Boolean);
    const intro = { tr: "Merhaba, aşağıdaki ürünler için fiyat teklifi rica ederim:", en: "Hello, I would like a quote for the following products:", ru: "Здравствуйте, прошу цену на следующие продукты:" }[L()];
    const foot = { tr: "\n\nFirma: \nİlgili kişi: \nTahmini miktar: ", en: "\n\nCompany: \nContact: \nEstimated quantity: ", ru: "\n\nКомпания: \nКонтакт: \nОриент. объём: " }[L()];
    return encodeURIComponent(intro + "\n\n" + lines.join("\n") + foot);
  }
  const waBtn = $("#basket-wa");
  if (waBtn) waBtn.addEventListener("click", () => {
    if (!getBasket().length) { toast(T("basket.addFirst")); return; }
    window.open("https://wa.me/" + HK.whatsapp + "?text=" + basketMessage(), "_blank", "noopener");
  });
  const mailBtn = $("#basket-mail");
  if (mailBtn) mailBtn.addEventListener("click", () => {
    if (!getBasket().length) { toast(T("basket.addFirst")); return; }
    const subj = { tr: "Fiyat Teklifi Talebi — Herkim Kimya", en: "Quote Request — Herkim Kimya", ru: "Запрос цены — Herkim Kimya" }[L()];
    location.href = "mailto:" + HK.mailQuote + "?subject=" + encodeURIComponent(subj) + "&body=" + basketMessage();
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
    if (p.tag === "yeni") top.appendChild(el("span", "ec-tag ec-tag--new", { tr: "Yeni", en: "New", ru: "Новинка" }[L()]));
    else if (p.tag === "one") top.appendChild(el("span", "ec-tag", { tr: "Öne Çıkan", en: "Featured", ru: "Хит" }[L()]));
    card.appendChild(top);

    card.appendChild(el("div", "ec-formula", SUB_CODE(p.sub)));
    card.appendChild(el("div", "ec-name", PNAME(p)));

    const meta = el("div", "ec-meta");
    meta.appendChild(el("span", null, SUB_LABEL(p.sub)));
    meta.appendChild(el("span", null, CAT_LABEL(CAT_OF(p.sub)) + " · " + p.pack));
    card.appendChild(meta);

    const add = el("button", "ec-add", "+");
    add.setAttribute("aria-label", T("basket.addAria"));
    add.setAttribute("title", T("basket.addAria"));
    add.addEventListener("click", () => addToBasket(p.id));
    card.appendChild(add);
    return card;
  }

  /* ============ 8) Dinamik içerik (dil değişince yeniden çizilir) ============ */
  const catState = { cat: "all", sub: "all", q: "" };
  const tableState = { q: "", cat: "all" };
  let tableSortKey = "id", tableSortDir = 1;

  function renderFeatured() {
    const wrap = $("#featured-products");
    if (!wrap) return;
    const featured = HK_PRODUCTS.filter(p => p.tag).concat(HK_PRODUCTS.filter(p => !p.tag)).slice(0, 8);
    wrap.replaceChildren(...featured.map(productCard));
  }

  function renderGrid() {
    const wrap = $("#product-grid");
    if (!wrap) return;
    const list = HK_PRODUCTS.filter(p => {
      if (catState.cat !== "all" && CAT_OF(p.sub) !== catState.cat) return false;
      if (catState.sub !== "all" && p.sub !== catState.sub) return false;
      if (catState.q) {
        const hay = trLower([p.n.tr, p.n.en, p.n.ru, p.brand, SUB_LABEL(p.sub), CAT_LABEL(CAT_OF(p.sub))].join(" "));
        if (!hay.includes(trLower(catState.q))) return false;
      }
      return true;
    });
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
    if (rc) rc.textContent = list.length + " / " + HK_PRODUCTS.length;
  }

  function renderTable() {
    const tbody = $("#ptable-body");
    if (!tbody) return;
    let list = HK_PRODUCTS.slice();
    if (tableState.cat !== "all") list = list.filter(p => CAT_OF(p.sub) === tableState.cat);
    if (tableState.q) {
      const q = trLower(tableState.q);
      list = list.filter(p => trLower([p.n.tr, p.n.en, p.n.ru, p.brand, SUB_LABEL(p.sub), CAT_LABEL(CAT_OF(p.sub)), p.pack].join(" ")).includes(q));
    }
    list.sort((a, b) => {
      let va, vb;
      if (tableSortKey === "name") { va = PNAME(a); vb = PNAME(b); }
      else if (tableSortKey === "cat") { va = CAT_LABEL(CAT_OF(a.sub)); vb = CAT_LABEL(CAT_OF(b.sub)); }
      else if (tableSortKey === "sub") { va = SUB_LABEL(a.sub); vb = SUB_LABEL(b.sub); }
      else if (tableSortKey === "brand") { va = a.brand; vb = b.brand; }
      else if (tableSortKey === "pack") { va = a.pack; vb = b.pack; }
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
      tr.appendChild(el("td", "td-pack", p.pack));
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
    if (rc) rc.textContent = list.length + " ürün / product / продукт";
  }

  function renderNews() {
    const wrap = $("#news-grid");
    if (!wrap) return;
    const limit = +wrap.dataset.limit || HK_NEWS.length;
    const loc = { tr: "tr-TR", en: "en-GB", ru: "ru-RU" }[L()];
    const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString(loc, { day: "2-digit", month: "long", year: "numeric" });
    wrap.replaceChildren(...HK_NEWS.slice(0, limit).map(n => {
      const a = el("a", "news-card reveal in"); a.href = n.href;
      a.appendChild(el("span", "nc-tag", pick(n.tag)));
      const t = el("time", null, fmt(n.date)); t.setAttribute("datetime", n.date);
      a.appendChild(t);
      a.appendChild(el("h3", null, pick(n.title)));
      a.appendChild(el("p", null, pick(n.body)));
      return a;
    }));
  }

  const docState = { cat: "all" };
  function renderDocs() {
    const wrap = $("#doc-grid");
    if (!wrap) return;
    let list = HK_DOCS.filter(d => docState.cat === "all" || d.cat === docState.cat);
    if (wrap.dataset.home) list = list.slice(0, 3);
    wrap.replaceChildren(...list.map(d => {
      const card = el("article", "doc-card");
      card.appendChild(el("span", "dc-ext", d.ext));
      card.appendChild(el("h3", null, pick(d.title)));
      card.appendChild(el("p", null, pick(d.desc)));
      const meta = el("div", "dc-meta");
      meta.appendChild(el("span", null, pick(d.meta)));
      const link = el("a", "dc-link", { tr: "Talep et →", en: "Request →", ru: "Запросить →" }[L()]);
      link.href = "iletisim.html";
      meta.appendChild(link); card.appendChild(meta);
      return card;
    }));
  }

  window.hkRenderDynamic = function () {
    renderFeatured(); renderGrid(); renderTable(); renderNews(); renderDocs();
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
  renderBasket();
  document.addEventListener("hk:langchange", () => { observeReveal(document); renderBasket(); });
  document.addEventListener("hk:authchange", () => { bdView = "cart"; renderBasket(); renderTable(); });

  /* ============ 9) Site içi arama ============ */
  const so = $(".search-overlay");
  if (so) {
    const input = $("#site-search");
    const results = $("#search-results");
    const PAGES = () => [
      { t: T("nav.about"), h: "hakkimizda.html" },
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
    function openSearch() { so.classList.add("open"); setTimeout(() => input.focus(), 60); }
    function closeSearch() { so.classList.remove("open"); input.value = ""; renderResults(""); }
    $$("[data-open-search]").forEach(b => b.addEventListener("click", openSearch));
    so.addEventListener("click", (e) => { if (e.target === so) closeSearch(); });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSearch(); }
      if (e.key === "Escape") { closeSearch(); closeBasket(); if (mnav) mnav.classList.remove("open"); }
    });
    function renderResults(q) {
      const qq = trLower(q.trim());
      if (!qq) { results.replaceChildren(...PAGES().map(p => row(p.t, T("nav.corporate"), p.h))); return; }
      const prods = HK_PRODUCTS
        .filter(p => trLower([p.n.tr, p.n.en, p.n.ru, p.brand].join(" ")).includes(qq))
        .slice(0, 7)
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
  const cb = $(".cookie-bar");
  if (cb && !localStorage.getItem("hk_cookie_ok")) {
    setTimeout(() => cb.classList.add("show"), 1600);
    const ok = $("#cookie-ok");
    if (ok) ok.addEventListener("click", () => { localStorage.setItem("hk_cookie_ok", "1"); cb.classList.remove("show"); });
  }

  /* ============ 11) Formlar ============ */
  const cform = $("#contact-form");
  if (cform) cform.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(cform);
    const name = (data.get("name") || "").toString().trim();
    const firm = (data.get("firm") || "").toString().trim();
    const msg = (data.get("msg") || "").toString().trim();
    if (!name || !msg) { toast(T("toast.formErr")); return; }
    const body = "Ad/Name: " + name + "\nFirma/Company: " + firm +
      "\nTel: " + (data.get("phone") || "") + "\nKonu/Subject: " + (data.get("topic") || "") + "\n\n" + msg;
    // Landing → CRM: talep portaldaki satış kutusuna da düşer (demo)
    try {
      const q = JSON.parse(localStorage.getItem("hg_landing_queue") || "[]");
      const d = new Date();
      const pad = (x) => (x < 10 ? "0" : "") + x;
      q.push({ name, firm, topic: (data.get("topic") || "").toString(), msg,
               date: pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() });
      localStorage.setItem("hg_landing_queue", JSON.stringify(q));
    } catch (err) {}
    location.href = "mailto:" + HK.email + "?subject=" + encodeURIComponent("Web — " + (firm || name)) + "&body=" + encodeURIComponent(body);
    toast(T("toast.mailOpening"));
  });

  $$("[id^='newsletter-form']").forEach(nf => nf.addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("input", nf);
    const em = (inp.value || "").trim();
    if (!em || !em.includes("@")) { toast(T("toast.mailErr")); return; }
    localStorage.setItem("hk_newsletter", em);
    inp.value = "";
    toast(T("toast.newsOk"));
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
