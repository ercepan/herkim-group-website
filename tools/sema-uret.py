#!/usr/bin/env python3
"""
============================================================
YAPILANDIRILMIŞ VERİ ÜRETİCİ  (JSON-LD)

Arama motorlarına verilen şemaları sitenin KENDİ verisinden üretir:

  urun-listesi.html  ItemList + Product/Offer   <- data.js  HK_FIYAT
  kurumsal.html      FAQPage                    <- i18n.js  faq.q1..q6

NEDEN BETİK: şema ile sayfadaki metin ayrışırsa Google zengin sonucu
geri çeker — arama sonucunda 0,86 USD yazarken sitede 0,95 USD olması
hem cezalandırılır hem müşteriyi yanıltır. Elle yazılan şema er geç
sapar; bu yüzden tek kaynaktan üretilir.

NE ZAMAN ÇALIŞTIRILIR:
  · data.js -> HK_FIYAT değişince (fiyat/ambalaj güncellemesi)
  · i18n.js -> faq.* metinleri değişince

KULLANIM:
  python3 tools/sema-uret.py

data.js ve i18n.js tarayıcı için yazılmış JavaScript dosyalarıdır; içindeki
veriyi düzgün okumanın tek güvenilir yolu onları çalıştırmaktır (regex ile
ayrıştırmak ilk virgülde ya da yorum satırında kırılır). Bunun için Node'un
`vm` modülü kullanılır: dosyalar BOŞ bir bağlamda çalışır — require, process
ve dosya sistemi erişimi yoktur, yani betik yalnızca veriyi okur.

Betik sadece <script type="application/ld+json"> bloklarını değiştirir;
sayfanın geri kalanına dokunmaz. Sonrasında HTML'lerdeki önbellek damgasını
(?v=) yükseltmeyi unutmayın.
============================================================
"""

import io
import json
import re
import subprocess
import sys
from pathlib import Path

KOK_DIZIN = Path(__file__).resolve().parent.parent
SITE_KOK = "https://herkim.com.tr/"

# Dosyayı yalıtılmış bir bağlamda çalıştırıp istenen değişkeni JSON olarak alır.
OKUYUCU = """
const fs = require("fs");
const vm = require("vm");
const [dosya, ifade] = process.argv.slice(1);
const kaynak = fs.readFileSync(dosya, "utf8");
/* Sandbox: require, process ve fs YOK. Yalnız i18n.js'in açılışta
   dokunduğu tarayıcı nesnelerinin en sade taklidi var — bunlar olmadan
   dosya "localStorage is not defined" ile düşüyor. Taklitler hiçbir şey
   yapmaz; amaç dosyanın sonuna kadar çalışıp veriyi tanımlaması. */
const bos = function () {};
const kutu = vm.createContext({
  localStorage: { getItem: function () { return null; }, setItem: bos, removeItem: bos },
  navigator: { language: "tr" },
  location: { search: "", hash: "", pathname: "/", origin: "" },
  addEventListener: bos,
  console: { log: bos, warn: bos, error: bos },
  document: {
    documentElement: { lang: "tr", setAttribute: bos, classList: { add: bos, remove: bos } },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    addEventListener: bos,
    dispatchEvent: bos,
    createElement: function () {
      return { style: {}, classList: { add: bos, remove: bos },
               setAttribute: bos, appendChild: bos };
    },
  },
});
kutu.window = kutu;
kutu.self = kutu;
vm.runInContext(kaynak, kutu, { filename: dosya, timeout: 5000 });
const sonuc = vm.runInContext(ifade, kutu, { timeout: 5000 });
process.stdout.write(JSON.stringify(sonuc));
"""


def js_oku(dosya: str, ifade: str):
    r = subprocess.run(
        ["node", "-e", OKUYUCU, dosya, ifade],
        capture_output=True, text=True, cwd=KOK_DIZIN)
    if r.returncode:
        sys.exit("Node hatası (%s):\n%s" % (dosya, r.stderr[:800]))
    return json.loads(r.stdout)


def blogu_yaz(dosya: str, isaret: str, yorum: str, sema: dict):
    """Şemayı sayfaya yazar. Aynı işaret varsa değiştirir, yoksa </head>
    öncesine ekler — betiğin tekrar tekrar çalıştırılması sorun olmaz."""
    yol = KOK_DIZIN / dosya
    s = io.open(yol, encoding="utf-8").read()
    blok = (yorum + '  <script type="application/ld+json">\n'
            + json.dumps(sema, ensure_ascii=False, indent=2) + "\n  </script>\n")
    desen = re.compile(r"  <!-- " + re.escape(isaret) + r".*?</script>\n", re.S)
    s2 = desen.sub(blok, s) if desen.search(s) else s.replace("</head>", blok + "</head>", 1)
    io.open(yol, "w", encoding="utf-8").write(s2)


def urun_semasi() -> int:
    veri = js_oku("assets/js/data.js", """
      Object.keys(HK_FIYAT.liste).map(function (id) {
        var p = HK_PRODUCTS.filter(function (x) { return x.id == id; })[0];
        return p ? { tr: p.n.tr, en: p.n.en, brand: p.brand, fiyat: HK_FIYAT.liste[id] } : null;
      }).filter(Boolean)
    """)

    urunler = []
    for u in veri:
        teklifler = []
        for f in u["fiyat"]:
            t = {
                "@type": "Offer",
                "price": "%.2f" % f["usd"],
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
                "priceValidUntil": "2026-12-31",
                "url": SITE_KOK + "urun-listesi.html",
                "seller": {"@type": "Organization", "name": "Herkim Kimya"},
            }
            if f.get("ambalaj"):
                t["name"] = f["ambalaj"]["tr"]
            teklifler.append(t)

        urunler.append({
            "@type": "Product",
            "name": u["tr"],
            "alternateName": u["en"],
            "brand": {"@type": "Brand", "name": u["brand"]},
            "category": "Endüstriyel Kimyasal",
            "url": SITE_KOK + "urun-listesi.html",
            "offers": teklifler[0] if len(teklifler) == 1 else {
                "@type": "AggregateOffer",
                "priceCurrency": "USD",
                "lowPrice": "%.2f" % min(f["usd"] for f in u["fiyat"]),
                "highPrice": "%.2f" % max(f["usd"] for f in u["fiyat"]),
                "offerCount": len(teklifler),
                "offers": teklifler,
            },
        })

    blogu_yaz(
        "urun-listesi.html", "Fiyatlı ürünler",
        ("  <!-- Fiyatlı ürünler için yapılandırılmış veri. Fiyatlar data.js ->\n"
         "       HK_FIYAT bloğundan ÜRETİLİR (tools/sema-uret.py); elle\n"
         "       düzenlenmez, fiyat güncellenince betik yeniden çalıştırılır.\n"
         "       Aksi hâlde arama sonucundaki fiyat sitedekinden sapar. -->\n"),
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Herkim Kimya — fiyatlı ürünler",
            "description": "Liste fiyatları depodan teslim, KDV hariç, kilogram başınadır.",
            "numberOfItems": len(urunler),
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "item": u}
                for i, u in enumerate(urunler)
            ],
        })
    return len(urunler)


def sss_semasi() -> int:
    sorular = js_oku("assets/js/i18n.js", """
      (function () {
        var tr = HK_I18N.tr, out = [];
        for (var i = 1; i <= 20; i++) {
          if (tr["faq.q" + i] && tr["faq.a" + i]) {
            out.push({ q: tr["faq.q" + i], a: tr["faq.a" + i] });
          }
        }
        return out;
      })()
    """)

    blogu_yaz(
        "kurumsal.html", "SSS yapılandırılmış",
        ("  <!-- SSS yapılandırılmış verisi. Sorular ve cevaplar i18n.js'teki\n"
         "       faq.q1..q6 / faq.a1..a6 anahtarlarından ÜRETİLİR. Metin\n"
         "       değişirse tools/sema-uret.py yeniden çalıştırılmalı; şema ile\n"
         "       sayfadaki metin ayrışırsa Google zengin sonucu geri çeker. -->\n"),
        {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": s["q"],
                 "acceptedAnswer": {"@type": "Answer", "text": s["a"]}}
                for s in sorular
            ],
        })
    return len(sorular)


if __name__ == "__main__":
    u = urun_semasi()
    q = sss_semasi()
    print("urun-listesi.html  → %d ürün (Product/Offer)" % u)
    print("kurumsal.html      → %d soru (FAQPage)" % q)
    print("\nHTML'lerdeki ?v= önbellek damgasını yükseltmeyi unutmayın.")
