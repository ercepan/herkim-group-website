# Herkim Group — Kurumsal Web Sitesi

Kimyasal hammadde tedarikçisi **Herkim Group** için hazırlanmış, tamamen statik (sunucu gerektirmeyen) kurumsal web sitesi. Referans alınan site yapısındaki tüm modüller kapsanır ve üzerine yeni modüller eklenmiştir.

## Sayfalar

| Dosya | İçerik |
|---|---|
| `index.html` | Ana sayfa: hero, sektörler, öne çıkan ürünler, çalışma prensipleri, istatistikler, kurumsal özet, doküman merkezi, duyurular, iletişim |
| `kurumsal.html` | Biz kimiz, misyon & vizyon, çalışma prensipleri, tarihçe, kalite & sertifikalar, SSS |
| `urunler.html` | Filtrelenebilir ürün kataloğu (kategori + sektör + arama), `?kat=asit` gibi URL parametresi destekler |
| `urun-listesi.html` | Teknik tablo: CAS no, kategori, ambalaj, menşei; sıralanabilir ve aranabilir |
| `dokumanlar.html` | Doküman Merkezi (katalog, TDS/SDS, sertifika, hukuki) + **Dijital Marka Kiti** (logo, renk, tipografi, ses tonu) |
| `duyurular.html` | Tüm duyurular + e-bülten kaydı |
| `iletisim.html` | Teklif/iletişim formu, adresler, harita kartı |
| `kvkk.html` | KVKK aydınlatma + çerez politikası (şablon) |

## Modüller (NGB karşılıkları + üzerine eklenenler)

**Referans sitedeki karşılıklar:** döviz kuru bandı, ürün kartları & tam ürün listesi (CAS/ambalaj/menşei), duyurular, kurumsal sayfalar, WhatsApp hattı, ürün arama, sepet (burada *teklif sepeti*), çerez bildirimi, çok şirketli footer.

**Üzerine eklenenler:**
- ⭐ **Çalışma Prensipleri** modülü (İLKE—01…06)
- ⭐ **Teklif Sepeti**: ürünleri sepete ekle → WhatsApp/e-posta ile tek tıkla toplu teklif iste (üye girişi gerektirmez, localStorage)
- ⭐ **Doküman Merkezi**: bütün dijital belgelerin tek yapı altında sınıflandırılması
- ⭐ **Dijital Marka Kiti** sayfası: logo kullanım kuralları, renk kodları, tipografi, ses tonu
- ⭐ Site içi arama (Ctrl+K), sektör kartları, animasyonlu istatistikler, tarihçe, SSS, sertifika kartları, e-bülten, KVKK sayfası

## Çalıştırma

Her şey statiktir; `index.html`'i tarayıcıda açmanız yeterli. Yerel sunucuyla açmak isterseniz:

```bash
cd "NGBvHRK"
python3 -m http.server 4173
# http://localhost:4173
```

## Yayına almadan önce düzenlenecekler (yer tutucular)

1. **İletişim bilgileri** — telefon `+90 (212) 000 00 00`, WhatsApp numarası ve e-postalar:
   tek yerden değiştirmek için `assets/js/main.js` içindeki `HK` ayar nesnesi (satır ~25) + sayfalardaki `topbar`/iletişim satırları.
2. **Adresler** — "Herkim Plaza, Tuzla" ve "Yalova" satırları örnektir.
3. **Tarihçe yılları ve istatistikler** (25+ yıl, 400+ ürün, 500+ müşteri…) — gerçek değerlerinizle güncelleyin (`index.html`, `kurumsal.html`).
4. **Ürün listesi** — `assets/js/data.js` → `HK_PRODUCTS`. Buraya eklediğiniz her ürün; katalog, tablo, arama ve ana sayfada otomatik görünür.
5. **Duyurular & dokümanlar** — yine `data.js` → `HK_NEWS`, `HK_DOCS`.
6. **Grup şirketleri** (footer) ve **sertifikalar** (ISO/KKDİK/ADR) — kendi belgelerinizle doğrulayın.
7. **KVKK metni** — hukuk danışmanınızla teyit edin.
8. **Döviz kuru** — canlı veri `open.er-api.com`'dan çekilir; erişilemezse `data.js` içindeki yedek değerler gösterilir.
9. Formlar sunucusuz çalışır (mailto/WhatsApp). Gerçek form altyapısı isterseniz bir form servisi veya backend eklenmelidir.

## Marka

- **Renkler:** Crimson `#A31C3C` · Koyu `#7C102E` · Sıcak `#C42449` · Mürekkep `#1B1216` · Kâğıt `#FAF6F1`
- **Yazı tipleri:** Archivo (başlık) · IBM Plex Sans (metin) · IBM Plex Mono (teknik) — Google Fonts
- **Logo:** `assets/img/logo.svg` (tam), `assets/img/favicon.svg` (simge). Sayfalarda inline SVG olarak da mevcut.
