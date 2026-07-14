/* PAN HOLDING — kurumsal sayfa etkileşimleri */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

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
    if (!em.value || em.value.indexOf("@") === -1) { window.panToast("Geçerli bir e-posta adresi girin."); return; }
    localStorage.setItem("pan_newsletter", em.value);
    nf.reset();
    window.panToast("E-bülten kaydınız alındı. Teşekkürler!");
  });
})();
