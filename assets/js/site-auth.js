/* ============================================================
   HERKİM — Müşteri Oturumu (ana site girişi)
   Portal ile AYNI oturum anahtarını paylaşır (hg_portal_session):
   burada giriş yapan müşteri portalda da açıktır (ve tersi).
   Kilitlenme ve boşta kalma kuralları portalla birebir aynıdır.
   ============================================================ */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const T = (k) => (typeof window.hkT === "function" ? window.hkT(k) : k);

  const SES = "hg_portal_session", LOCK = "hg_login_lock", LAST = "hg_last_login_";
  const PASS = "demo1234", IDLE = 15 * 60 * 1000;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  const emit = () => document.dispatchEvent(new CustomEvent("hk:authchange"));

  /* ---------- Oturum ---------- */
  const rawSes = () => { try { return JSON.parse(localStorage.getItem(SES)); } catch (_) { return null; } };
  function ses() {
    const s = rawSes();
    if (!s || !s.role) return null;
    if (Date.now() - (s.touched || s.at || 0) > IDLE) { localStorage.removeItem(SES); return null; }
    return s;
  }
  function user() {
    const s = ses();
    if (!s) return null;
    if (s.acct) return s.acct; // onaylı web hesabı (başvurudan doğar)
    return (typeof HGP_USERS !== "undefined" && HGP_USERS[s.role]) || null;
  }
  const isCustomer = () => { const u = user(); return !!u && u.role === "musteri"; };

  /* Etkinlik oturumu taze tutar (portalla aynı kural) */
  function touch() {
    const s = rawSes();
    if (!s) return;
    if (Date.now() - (s.touched || s.at || 0) > 30000) {
      s.touched = Date.now();
      localStorage.setItem(SES, JSON.stringify(s));
    }
  }
  ["click", "keydown", "scroll", "touchstart"].forEach(ev =>
    document.addEventListener(ev, touch, { passive: true }));

  /* Başka sekmede giriş/çıkış ya da süre dolumu → başlığı tazele */
  let knownRole = (ses() || {}).role || null;
  setInterval(() => {
    const cur = (ses() || {}).role || null;
    if (cur !== knownRole) { knownRole = cur; renderAccount(); emit(); }
  }, 30000);

  let pendingCb = null;

  function login(role, acct) {
    const payload = { role: role, at: Date.now() };
    if (acct) payload.acct = acct;
    localStorage.setItem(SES, JSON.stringify(payload));
    localStorage.removeItem(LOCK);
    try { if (typeof hgpNow === "function") localStorage.setItem(LAST + role, hgpNow()); } catch (_) {}
    const cb = pendingCb; pendingCb = null;
    hideModal();
    knownRole = role;
    renderAccount();
    emit();
    const u = user();
    if (window.hkToast && u) window.hkToast(T("auth.welcome") + ", " + u.name + " 👋");
    if (cb) setTimeout(cb, 60);
  }

  function logout() {
    localStorage.removeItem(SES);
    knownRole = null;
    renderAccount();
    emit();
    if (window.hkToast) window.hkToast(T("auth.loggedOut"));
  }

  /* ---------- Başlıktaki hesap düğmesi ---------- */
  let wrap = null;

  function svgUser() {
    const NS = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("width", "19"); s.setAttribute("height", "19");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none");
    s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2");
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", "12"); c.setAttribute("cy", "8"); c.setAttribute("r", "4");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", "M4 20c1.6-3.4 4.5-5 8-5s6.4 1.6 8 5");
    s.appendChild(c); s.appendChild(p);
    return s;
  }

  function renderAccount() {
    if (!wrap) return;
    wrap.replaceChildren();
    const u = user();
    const btn = el("button", u ? "icon-btn user-on" : "icon-btn");
    const label = u ? (u.name + " — " + T("auth.account")) : T("auth.login");
    btn.title = label;
    btn.setAttribute("aria-label", label);
    if (u) btn.appendChild(el("span", "user-ini", u.initials));
    else btn.appendChild(svgUser());
    wrap.appendChild(btn);

    if (!u) {
      btn.addEventListener("click", () => openModal());
      return;
    }

    const pop = el("div", "user-pop");
    const head = el("div", "up-head");
    head.appendChild(el("b", null, u.name));
    head.appendChild(el("span", null, u.company));
    pop.appendChild(head);
    if (u.role === "musteri") {
      const a1 = el("a", null, "📦 " + T("auth.myOrders"));
      a1.href = "portal.html#orders";
      pop.appendChild(a1);
    }
    const a2 = el("a", null, "⬛ " + T("auth.goPortal"));
    a2.href = "portal.html";
    pop.appendChild(a2);
    const out = el("button", "up-item", "⏻ " + T("auth.logout"));
    out.type = "button";
    out.addEventListener("click", () => { pop.classList.remove("open"); logout(); });
    pop.appendChild(out);
    wrap.appendChild(pop);

    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = pop.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.addEventListener("click", (e) => {
    if (!wrap) return;
    const pop = $(".user-pop", wrap);
    if (pop && pop.classList.contains("open") && !wrap.contains(e.target)) pop.classList.remove("open");
  });

  /* ---------- Giriş penceresi ---------- */
  let overlay = null, lockTimer = null;

  const getLock = () => {
    try { return JSON.parse(localStorage.getItem(LOCK)) || { n: 0, until: 0 }; }
    catch (_) { return { n: 0, until: 0 }; }
  };

  function hideModal() {
    if (overlay) overlay.classList.remove("open");
    if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
  }
  const cancelModal = () => { pendingCb = null; hideModal(); };

  function buildModal() {
    if (overlay) overlay.remove();
    overlay = el("div", "auth-overlay");
    const panel = el("div", "auth-panel");

    const x = el("button", "auth-close", T("nav.close"));
    x.type = "button";
    x.addEventListener("click", cancelModal);
    panel.appendChild(x);

    panel.appendChild(el("h3", null, T("auth.modalTitle")));
    panel.appendChild(el("p", "a-sub", T("auth.modalSub")));

    const err = el("div", "auth-err");
    panel.appendChild(err);

    const form = el("form");
    form.noValidate = true;
    const f1 = el("div", "field");
    const l1 = el("label", null, T("auth.email")); l1.setAttribute("for", "au-email");
    const i1 = el("input");
    i1.type = "email"; i1.id = "au-email"; i1.autocomplete = "username";
    i1.value = "satinalma@derimderi.com.tr";
    f1.appendChild(l1); f1.appendChild(i1);
    const f2 = el("div", "field");
    f2.style.marginTop = "12px";
    const l2 = el("label", null, T("auth.pass")); l2.setAttribute("for", "au-pass");
    const i2 = el("input");
    i2.type = "password"; i2.id = "au-pass"; i2.autocomplete = "current-password";
    i2.maxLength = 64; i2.placeholder = "••••••••";
    f2.appendChild(l2); f2.appendChild(i2);
    form.appendChild(f1); form.appendChild(f2);
    const submit = el("button", "btn btn--primary", T("auth.submit"));
    submit.type = "submit";
    submit.style.cssText = "width:100%;justify-content:center;margin-top:16px";
    form.appendChild(submit);
    panel.appendChild(form);

    const demo = el("div", "auth-demo");
    const hint = el("p");
    hint.style.cssText = "font-size:12.5px;color:var(--ink-3);margin-bottom:9px";
    hint.appendChild(document.createTextNode(T("auth.demoHint") + " "));
    hint.appendChild(el("b", "mono", PASS));
    demo.appendChild(hint);
    const db = el("button", "btn btn--ghost btn--sm", T("auth.demoBtn"));
    db.type = "button";
    db.style.cssText = "width:100%;justify-content:center";
    db.addEventListener("click", () => login("musteri"));
    demo.appendChild(db);
    const apply = el("p");
    apply.style.cssText = "margin-top:12px;font-size:12.5px;color:var(--ink-3)";
    const aa = el("a", "accent", T("auth.applyLink"));
    aa.href = "hesap.html";
    apply.appendChild(aa);
    demo.appendChild(apply);
    const staff = el("p");
    staff.style.cssText = "margin-top:6px;font-size:12.5px;color:var(--ink-3)";
    staff.appendChild(document.createTextNode(T("auth.staff") + " "));
    const sa = el("a", "accent", T("auth.staffLink"));
    sa.href = "portal.html";
    staff.appendChild(sa);
    demo.appendChild(staff);
    panel.appendChild(demo);

    overlay.appendChild(panel);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) cancelModal(); });
    document.body.appendChild(overlay);

    const showErr = (m) => {
      err.textContent = m;
      err.classList.remove("show"); void err.offsetWidth;
      err.classList.add("show");
    };
    const lockUI = () => {
      const l = getLock(), left = Math.ceil((l.until - Date.now()) / 1000);
      if (left > 0) {
        submit.disabled = true; submit.style.opacity = "0.55";
        showErr(T("auth.locked").replace("{s}", left));
        if (!lockTimer) lockTimer = setInterval(lockUI, 1000);
      } else {
        submit.disabled = false; submit.style.opacity = "";
        if (lockTimer) { clearInterval(lockTimer); lockTimer = null; }
        if (l.until) { err.classList.remove("show"); localStorage.removeItem(LOCK); }
      }
    };
    lockUI();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const l = getLock();
      if (l.until > Date.now()) { lockUI(); return; }
      const fail = (msg) => {
        l.n = (l.n || 0) + 1;
        if (l.n >= 3) { l.until = Date.now() + 60000; l.n = 0; }
        localStorage.setItem(LOCK, JSON.stringify(l));
        if (l.until > Date.now()) lockUI();
        else showErr(msg.replace("{n}", l.n));
      };
      if (i2.value !== PASS) { fail(T("auth.err")); return; }
      // E-posta → hesap eşleme: varsayılan demo müşteri ya da onaylı web hesabı
      const em = i1.value.trim().toLowerCase();
      if (!em || em === "satinalma@derimderi.com.tr") { login("musteri"); return; }
      let acc = null;
      try {
        (hgpGet().accounts || []).forEach(a => { if (a.email === em) acc = a; });
      } catch (_) {}
      if (!acc) { fail(T("auth.noAccount")); return; }
      login("musteri", { role: "musteri", name: acc.name, company: acc.company,
                         initials: acc.initials, rep: "Ayşe Yılmaz", email: acc.email });
    });

    return i2;
  }

  function openModal(cb) {
    pendingCb = cb || null;
    const passInput = buildModal(); // her açılışta güncel dille kurulur
    requestAnimationFrame(() => overlay.classList.add("open"));
    setTimeout(() => passInput.focus(), 140);
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay && overlay.classList.contains("open")) cancelModal();
  });

  /* ---------- Kurulum ---------- */
  const actions = $(".header-actions");
  if (actions) {
    wrap = el("div", "user-wrap");
    actions.insertBefore(wrap, $("[data-open-basket]", actions));
    renderAccount();
  }
  document.addEventListener("hk:langchange", renderAccount);

  window.hkAuth = { user: user, isCustomer: isCustomer, openLogin: openModal, logout: logout };
})();
