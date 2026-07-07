/* ============================================================
   HERKİM GROUP — Etkileşim Katmanı
   Döviz kuru, teklif sepeti, arama, filtreler, animasyonlar.
   Not: Tüm dinamik içerik XSS'e karşı güvenli DOM API'leri ile
   (createElement / textContent) üretilir.
   ============================================================ */
(function () {
  "use strict";

  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const trLower = (s) => (s || "").toLocaleLowerCase("tr");

  /* Küçük DOM yardımcıları — innerHTML kullanılmaz */
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  /* Kimyasal formül: rakam dizileri <sub> olarak eklenir (örn. Na2S → Na₂S) */
  function formulaNode(str, cls) {
    const wrap = el("div", cls);
    (str || "").split(/(\d+)/).forEach(part => {
      if (!part) return;
      if (/^\d+$/.test(part)) wrap.appendChild(el("sub", null, part));
      else wrap.appendChild(document.createTextNode(part));
    });
    return wrap;
  }

  /* -------- Ayarlar (kolayca düzenlenebilir) -------- */
  const HK = {
    phone: "+90 (212) 000 00 00",
    whatsapp: "905320000000",           // wa.me numarası — kendi numaranızla değiştirin
    mail: "satis@herkimgroup.com"
  };
  window.HK_CONFIG = HK;

  /* ============ 1) Başlık davranışı ============ */
  const header = $(".site-header");
  const toTop = $(".to-top");
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 8);
    if (toTop) toTop.classList.toggle("show", y > 700);
  }, { passive: true });
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* Mobil menü */
  const mnav = $(".mobile-nav");
  const burger = $(".burger");
  if (burger && mnav) {
    burger.addEventListener("click", () => mnav.classList.add("open"));
    $(".mn-close", mnav).addEventListener("click", () => mnav.classList.remove("open"));
    $$("a", mnav).forEach(a => a.addEventListener("click", () => mnav.classList.remove("open")));
  }

  /* ============ 2) Döviz kuru bandı ============ */
  async function loadRates() {
    const usdEl = $("#rate-usd"), eurEl = $("#rate-eur"), noteEl = $("#rate-note");
    if (!usdEl) return;
    const render = (usd, eur, live) => {
      usdEl.textContent = usd.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      eurEl.textContent = eur.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (noteEl) noteEl.textContent = live
        ? "canlı · " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
        : "indikatif";
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
    } catch (_) { /* çevrimdışı: yedek değerler kalır */ }
  }
  loadRates();

  /* ============ 3) Görünürlük animasyonları ============ */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(node => io.observe(node));

  /* Sayaçlar */
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

  /* ============ 4) Bildirim (toast) ============ */
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

  /* ============ 5) Teklif sepeti ============ */
  const BASKET_KEY = "hk_basket_v1";
  const getBasket = () => { try { return JSON.parse(localStorage.getItem(BASKET_KEY)) || []; } catch (_) { return []; } };
  const setBasket = (b) => { localStorage.setItem(BASKET_KEY, JSON.stringify(b)); renderBasket(); };

  function addToBasket(id) {
    const p = HK_PRODUCTS.find(x => x.id === id);
    if (!p) return;
    const b = getBasket();
    if (b.includes(id)) { toast("“" + p.name + "” zaten teklif sepetinizde."); openBasket(); return; }
    b.push(id);
    setBasket(b);
    toast("“" + p.name + "” teklif sepetine eklendi.");
  }
  window.hkAdd = addToBasket;

  function renderBasket() {
    const b = getBasket();
    $$(".basket-count").forEach(node => {
      node.textContent = b.length;
      node.style.display = b.length ? "grid" : "none";
    });
    const body = $("#basket-body");
    if (!body) return;
    body.replaceChildren();
    if (!b.length) {
      const empty = el("div", "bd-empty");
      const ico = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      ico.setAttribute("viewBox", "0 0 24 24");
      ico.setAttribute("fill", "none");
      ico.setAttribute("stroke", "currentColor");
      ico.setAttribute("stroke-width", "1.5");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M9 3h6l1 4H8l1-4zM6 7h12l-1.2 12.6a1.5 1.5 0 0 1-1.5 1.4H8.7a1.5 1.5 0 0 1-1.5-1.4L6 7z");
      ico.appendChild(path);
      empty.appendChild(ico);
      const p1 = el("p", null, "Teklif sepetiniz boş.");
      p1.appendChild(el("br"));
      p1.appendChild(document.createTextNode("Ürünlerin yanındaki "));
      p1.appendChild(el("b", null, "+"));
      p1.appendChild(document.createTextNode(" ile ekleyin."));
      empty.appendChild(p1);
      body.appendChild(empty);
      return;
    }
    b.forEach(id => {
      const p = HK_PRODUCTS.find(x => x.id === id);
      if (!p) return;
      const item = el("div", "bd-item");
      const info = el("div");
      info.appendChild(el("b", null, p.name));
      info.appendChild(el("span", "mono", "CAS " + p.cas + " · " + p.pack));
      const rm = el("button", "bd-remove", "×");
      rm.setAttribute("aria-label", "Kaldır");
      rm.addEventListener("click", () => setBasket(getBasket().filter(x => x !== id)));
      item.appendChild(info);
      item.appendChild(rm);
      body.appendChild(item);
    });
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
    const lines = b.map(id => {
      const p = HK_PRODUCTS.find(x => x.id === id);
      return p ? "• " + p.name + " (CAS " + p.cas + ", " + p.pack + ")" : "";
    }).filter(Boolean);
    return encodeURIComponent(
      "Merhaba, aşağıdaki ürünler için fiyat teklifi rica ederim:\n\n" +
      lines.join("\n") +
      "\n\nFirma: \nİlgili kişi: \nTahmini miktar: "
    );
  }
  const waBtn = $("#basket-wa");
  if (waBtn) waBtn.addEventListener("click", () => {
    if (!getBasket().length) { toast("Önce sepete ürün ekleyin."); return; }
    window.open("https://wa.me/" + HK.whatsapp + "?text=" + basketMessage(), "_blank", "noopener");
  });
  const mailBtn = $("#basket-mail");
  if (mailBtn) mailBtn.addEventListener("click", () => {
    if (!getBasket().length) { toast("Önce sepete ürün ekleyin."); return; }
    location.href = "mailto:" + HK.mail + "?subject=" + encodeURIComponent("Fiyat Teklifi Talebi — Herkim Group") + "&body=" + basketMessage();
  });
  const clearBtn = $("#basket-clear");
  if (clearBtn) clearBtn.addEventListener("click", () => { setBasket([]); toast("Teklif sepeti temizlendi."); });

  renderBasket();

  /* ============ 6) Ürün kartı üretimi ============ */
  const CAT_LABEL = (k) => HK_CATS[k] || k;
  function productCard(p) {
    const card = el("article", "element-card");
    card.dataset.cat = p.cat;
    card.dataset.sec = p.sec.join(" ");

    const top = el("div", "ec-top");
    top.appendChild(el("span", "ec-cas", "CAS " + p.cas));
    if (p.tag === "yeni") top.appendChild(el("span", "ec-tag ec-tag--new", "Yeni"));
    else if (p.tag === "haftanin") top.appendChild(el("span", "ec-tag", "Haftanın Ürünü"));
    card.appendChild(top);

    card.appendChild(formulaNode(p.f, "ec-formula"));
    card.appendChild(el("div", "ec-name", p.name));

    const meta = el("div", "ec-meta");
    meta.appendChild(el("span", null, CAT_LABEL(p.cat)));
    meta.appendChild(el("span", null, p.pack + " · " + p.org));
    card.appendChild(meta);

    const add = el("button", "ec-add", "+");
    add.title = "Teklif sepetine ekle";
    add.setAttribute("aria-label", "Teklif sepetine ekle");
    add.addEventListener("click", () => addToBasket(p.id));
    card.appendChild(add);
    return card;
  }

  /* Ana sayfa: öne çıkanlar */
  const featWrap = $("#featured-products");
  if (featWrap) {
    const featured = HK_PRODUCTS.filter(p => p.tag).concat(HK_PRODUCTS.filter(p => !p.tag)).slice(0, 8);
    featWrap.replaceChildren(...featured.map(productCard));
  }

  /* Katalog sayfası: filtreli ızgara */
  const gridWrap = $("#product-grid");
  if (gridWrap) {
    const state = { cat: "all", sec: "all", q: "" };
    /* URL'den kategori seçimi: urunler.html?kat=asit */
    const urlCat = new URLSearchParams(location.search).get("kat");
    if (urlCat && HK_CATS[urlCat]) {
      state.cat = urlCat;
      $$("#cat-chips .chip").forEach(c => c.classList.toggle("on", c.dataset.cat === urlCat));
    }
    function renderGrid() {
      const list = HK_PRODUCTS.filter(p => {
        if (state.cat !== "all" && p.cat !== state.cat) return false;
        if (state.sec !== "all" && !p.sec.includes(state.sec)) return false;
        if (state.q) {
          const hay = trLower(p.name + " " + p.cas + " " + CAT_LABEL(p.cat) + " " + p.org);
          if (!hay.includes(trLower(state.q))) return false;
        }
        return true;
      });
      if (list.length) {
        gridWrap.replaceChildren(...list.map(productCard));
      } else {
        const msg = el("p", "muted");
        msg.style.cssText = "grid-column:1/-1;padding:40px 0;text-align:center";
        msg.appendChild(document.createTextNode("Aramanızla eşleşen ürün bulunamadı. Portföyümüzde olmayan ürünler için de "));
        const a = el("a", "accent");
        a.href = "iletisim.html";
        a.appendChild(el("b", null, "bize ulaşın"));
        msg.appendChild(a);
        msg.appendChild(document.createTextNode(" — tedarik edebiliriz."));
        gridWrap.replaceChildren(msg);
      }
      const rc = $("#grid-count");
      if (rc) rc.textContent = list.length + " / " + HK_PRODUCTS.length + " ürün";
    }
    $$("#cat-chips .chip").forEach(ch => ch.addEventListener("click", () => {
      $$("#cat-chips .chip").forEach(c => c.classList.remove("on"));
      ch.classList.add("on");
      state.cat = ch.dataset.cat;
      renderGrid();
    }));
    const secSel = $("#sec-select");
    if (secSel) secSel.addEventListener("change", () => { state.sec = secSel.value; renderGrid(); });
    const gq = $("#grid-search");
    if (gq) gq.addEventListener("input", () => { state.q = gq.value; renderGrid(); });
    renderGrid();
  }

  /* ============ 7) Ürün listesi tablosu ============ */
  const tbody = $("#ptable-body");
  if (tbody) {
    let sortKey = "id", sortDir = 1;
    const state = { q: "", cat: "all" };
    function rows() {
      let list = HK_PRODUCTS.slice();
      if (state.cat !== "all") list = list.filter(p => p.cat === state.cat);
      if (state.q) {
        const q = trLower(state.q);
        list = list.filter(p => trLower(p.name + " " + p.cas + " " + CAT_LABEL(p.cat) + " " + p.org + " " + p.pack).includes(q));
      }
      list.sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (sortKey === "cat") { va = CAT_LABEL(a.cat); vb = CAT_LABEL(b.cat); }
        if (typeof va === "string") return va.localeCompare(vb, "tr") * sortDir;
        return (va - vb) * sortDir;
      });
      return list;
    }
    function renderTable() {
      const list = rows();
      tbody.replaceChildren(...list.map((p, i) => {
        const tr = el("tr");

        tr.appendChild(Object.assign(el("td", "td-no", String(i + 1).padStart(2, "0"))));

        const tdName = el("td", "td-name");
        tdName.appendChild(el("b", null, p.name));
        const fSpan = formulaNode(p.f);
        const spanWrap = el("span");
        while (fSpan.firstChild) spanWrap.appendChild(fSpan.firstChild);
        tdName.appendChild(spanWrap);
        tr.appendChild(tdName);

        tr.appendChild(el("td", "td-cas", p.cas));

        const tdCat = el("td");
        tdCat.appendChild(el("span", "cat-pill", CAT_LABEL(p.cat)));
        tr.appendChild(tdCat);

        tr.appendChild(el("td", "td-pack", p.pack));
        tr.appendChild(el("td", "td-origin", p.org));

        const tdDocs = el("td");
        const docs = el("div", "doc-btns");
        const tds = el("a", null, "TDS"); tds.href = "dokumanlar.html"; tds.title = "Teknik veri sayfası";
        const sds = el("a", null, "SDS"); sds.href = "dokumanlar.html"; sds.title = "Güvenlik bilgi formu";
        docs.appendChild(tds); docs.appendChild(sds);
        tdDocs.appendChild(docs);
        tr.appendChild(tdDocs);

        const tdAdd = el("td");
        const btn = el("button", "add-quote", "+ Teklif");
        btn.addEventListener("click", () => addToBasket(p.id));
        tdAdd.appendChild(btn);
        tr.appendChild(tdAdd);

        return tr;
      }));
      const rc = $("#table-count");
      if (rc) rc.textContent = list.length + " ürün listeleniyor";
    }
    const tq = $("#table-search");
    if (tq) tq.addEventListener("input", () => { state.q = tq.value; renderTable(); });
    const tc = $("#table-cat");
    if (tc) tc.addEventListener("change", () => { state.cat = tc.value; renderTable(); });
    $$(".ptable thead th[data-sort]").forEach(th => th.addEventListener("click", () => {
      const k = th.dataset.sort;
      if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
      $$(".ptable thead th .sort").forEach(s => s.remove());
      const ind = el("span", "sort", sortDir === 1 ? "▲" : "▼");
      th.appendChild(ind);
      renderTable();
    }));
    renderTable();
  }

  /* ============ 8) Duyurular ============ */
  const newsWrap = $("#news-grid");
  if (newsWrap) {
    const limit = +newsWrap.dataset.limit || HK_NEWS.length;
    const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
    newsWrap.replaceChildren(...HK_NEWS.slice(0, limit).map(n => {
      const a = el("a", "news-card reveal");
      a.href = n.href;
      a.appendChild(el("span", "nc-tag", n.tag));
      const t = el("time", null, fmt(n.date));
      t.setAttribute("datetime", n.date);
      a.appendChild(t);
      a.appendChild(el("h3", null, n.title));
      a.appendChild(el("p", null, n.body));
      return a;
    }));
    $$(".reveal", newsWrap).forEach(node => io.observe(node));
  }

  /* ============ 9) Doküman merkezi ============ */
  const docWrap = $("#doc-grid");
  if (docWrap) {
    const state = { cat: "all" };
    function renderDocs() {
      const list = HK_DOCS.filter(d => state.cat === "all" || d.cat === state.cat);
      docWrap.replaceChildren(...list.map(d => {
        const card = el("article", "doc-card");
        card.appendChild(el("span", "dc-ext", d.ext));
        card.appendChild(el("h3", null, d.title));
        card.appendChild(el("p", null, d.desc));
        const meta = el("div", "dc-meta");
        meta.appendChild(el("span", null, d.meta));
        const link = el("a", "dc-link", "Talep et →");
        link.href = "iletisim.html";
        meta.appendChild(link);
        card.appendChild(meta);
        return card;
      }));
    }
    $$("#doc-chips .chip").forEach(ch => ch.addEventListener("click", () => {
      $$("#doc-chips .chip").forEach(c => c.classList.remove("on"));
      ch.classList.add("on");
      state.cat = ch.dataset.cat;
      renderDocs();
    }));
    renderDocs();
  }

  /* ============ 10) Site içi arama ============ */
  const so = $(".search-overlay");
  if (so) {
    const input = $("#site-search");
    const results = $("#search-results");
    const PAGES = [
      { t: "Kurumsal — Biz Kimiz?", m: "sayfa", h: "kurumsal.html" },
      { t: "Çalışma Prensiplerimiz", m: "sayfa", h: "kurumsal.html#prensipler" },
      { t: "Ürün Kataloğu", m: "sayfa", h: "urunler.html" },
      { t: "Ürün Listesi (Tablo)", m: "sayfa", h: "urun-listesi.html" },
      { t: "Doküman Merkezi", m: "sayfa", h: "dokumanlar.html" },
      { t: "Duyurular", m: "sayfa", h: "duyurular.html" },
      { t: "İletişim & Teklif", m: "sayfa", h: "iletisim.html" }
    ];
    const resultRow = (title, metaText, href) => {
      const a = el("a");
      a.href = href;
      a.appendChild(el("span", null, title));
      a.appendChild(el("span", "mono", metaText));
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
      if (!qq) {
        results.replaceChildren(...PAGES.map(p => resultRow(p.t, p.m, p.h)));
        return;
      }
      const prods = HK_PRODUCTS
        .filter(p => trLower(p.name + " " + p.cas + " " + CAT_LABEL(p.cat)).includes(qq))
        .slice(0, 7)
        .map(p => resultRow(p.name, "CAS " + p.cas, "urun-listesi.html"));
      const pages = PAGES.filter(p => trLower(p.t).includes(qq)).map(p => resultRow(p.t, p.m, p.h));
      const merged = prods.concat(pages);
      results.replaceChildren(...(merged.length ? merged
        : [resultRow("Sonuç yok — bu ürünü sizin için tedarik edelim", "iletişim", "iletisim.html")]));
    }
    input.addEventListener("input", () => renderResults(input.value));
    renderResults("");
  }

  /* ============ 11) Çerez bildirimi ============ */
  const cb = $(".cookie-bar");
  if (cb && !localStorage.getItem("hk_cookie_ok")) {
    setTimeout(() => cb.classList.add("show"), 1600);
    const ok = $("#cookie-ok");
    if (ok) ok.addEventListener("click", () => { localStorage.setItem("hk_cookie_ok", "1"); cb.classList.remove("show"); });
  }

  /* ============ 12) Formlar (ön yüz doğrulama) ============ */
  const cform = $("#contact-form");
  if (cform) cform.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(cform);
    const name = (data.get("name") || "").toString().trim();
    const firm = (data.get("firm") || "").toString().trim();
    const msg = (data.get("msg") || "").toString().trim();
    if (!name || !msg) { toast("Lütfen ad ve mesaj alanlarını doldurun."); return; }
    const body = "Ad Soyad: " + name + "\nFirma: " + firm +
      "\nTelefon: " + (data.get("phone") || "") + "\nKonu: " + (data.get("topic") || "") +
      "\n\n" + msg;
    location.href = "mailto:" + HK.mail + "?subject=" + encodeURIComponent("Web Sitesi İletişim — " + (firm || name)) + "&body=" + encodeURIComponent(body);
    toast("E-posta uygulamanız açılıyor…");
  });

  const nform = $("#newsletter-form");
  if (nform) nform.addEventListener("submit", (e) => {
    e.preventDefault();
    const em = $("input", nform).value.trim();
    if (!em || !em.includes("@")) { toast("Geçerli bir e-posta adresi girin."); return; }
    localStorage.setItem("hk_newsletter", em);
    $("input", nform).value = "";
    toast("E-bülten kaydınız alındı. Teşekkürler!");
  });

  /* WhatsApp bağlantılarını ayarla */
  $$("[data-wa]").forEach(a => {
    a.href = "https://wa.me/" + HK.whatsapp + "?text=" + encodeURIComponent("Merhaba, ürünleriniz hakkında bilgi almak istiyorum.");
    a.target = "_blank"; a.rel = "noopener";
  });
})();
