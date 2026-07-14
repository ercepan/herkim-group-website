/* PAN HOLDING — kurumsal sayfa etkileşimleri */

/* AYAR: WhatsApp hattı — wa.me formatı (ülke kodu + numara, boşluksuz).
   Gerçek WhatsApp Business numaranızla değiştirin: */
var PAN_WA_NUMBER = "902163941125";
var PAN_WA_MSG = "Merhaba, Pan Holding web sitesinden ulaşıyorum. Bilgi almak istiyorum.";

(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* WhatsApp bağlantıları: [data-wa] olan her öğe tıklanınca sohbet açar */
  function waMsg() { return (window.pT ? window.pT("wa.msg") : PAN_WA_MSG); }
  function wireWa() {
    $$("[data-wa]").forEach(function (a) {
      a.href = "https://wa.me/" + PAN_WA_NUMBER + "?text=" + encodeURIComponent(waMsg());
      a.target = "_blank";
      a.rel = "noopener";
    });
  }
  wireWa();
  document.addEventListener("pan:lang", wireWa);

  /* Görünürlük animasyonu */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".rv").forEach(function (el) { io.observe(el); });

  /* Mobil menü */
  var mnav = $(".m-nav"), burger = $(".burger");
  if (burger && mnav) {
    burger.addEventListener("click", function () { mnav.classList.add("open"); });
    var mc = $(".m-close", mnav);
    if (mc) mc.addEventListener("click", function () { mnav.classList.remove("open"); });
    $$("a", mnav).forEach(function (a) {
      a.addEventListener("click", function () { mnav.classList.remove("open"); });
    });
  }

  /* İstatistik sayaçları (görününce say) */
  function animateCount(elm) {
    var target = parseFloat(elm.getAttribute("data-cnt"));
    var suffix = elm.getAttribute("data-suffix") || "";
    var plain = elm.getAttribute("data-fmt") === "plain";
    var dur = 1300, t0 = performance.now();
    function step(t) {
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      elm.textContent = (plain ? String(val) : val.toLocaleString("tr-TR")) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { cio.unobserve(e.target); animateCount(e.target); }
    });
  }, { threshold: 0.5 });
  $$("[data-cnt]").forEach(function (el) { cio.observe(el); });

  /* Scrollspy — görünen bölümün menü linkini vurgula */
  var spyMap = {};
  $$(".nav a[href^='#']").forEach(function (a) { spyMap[a.getAttribute("href").slice(1)] = a; });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var link = spyMap[e.target.id];
      if (!link) return;
      if (e.isIntersecting) {
        $$(".nav a.act").forEach(function (x) { x.classList.remove("act"); });
        link.classList.add("act");
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  Object.keys(spyMap).forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) spy.observe(sec);
  });

  /* Toast */
  var toastTimer;
  window.panToast = function (msg) {
    var t = $(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  };

  /* E-bülten */
  var nf = $("#news-form");
  if (nf) nf.addEventListener("submit", function (e) {
    e.preventDefault();
    var em = $('input[type="email"]', nf);
    if (!em.value || em.value.indexOf("@") === -1) { window.panToast(window.pT ? window.pT("nb.err") : "Geçerli bir e-posta adresi girin."); return; }
    localStorage.setItem("pan_newsletter", em.value);
    nf.reset();
    window.panToast(window.pT ? window.pT("nb.ok") : "E-bülten kaydınız alındı. Teşekkürler!");
  });
})();
