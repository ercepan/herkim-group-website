# Herkim Kimya — Kurumsal Web Sitesi

**Herkim Kimya** (1975 kuruluşlu deri & tekstil kimyasalları tedarikçisi) için hazırlanmış, sunucu gerektirmeyen statik kurumsal web sitesi. İçerik gerçek [herkim.com.tr](http://herkim.com.tr) bilgilerine göre düzenlenmiştir ve **üç dillidir (TR / EN / RU)**.

## Şirket bilgileri (gerçek)

- **Ünvan:** Herkim Kimya San. ve Tic. · **Kuruluş:** 1975 (54 yıl tecrübe)
- **İş:** Deri kimyasalları dağıtım ve üretimi. Türkiye'de **Türk Henkel, Camsar ve BASF Türk** distribütörü; **12 satış noktası**.
- **Adres:** Organize Deri San. Böl. 19. Yol 12/6 Parsel, Tuzla — İstanbul / Türkiye
- **Tel:** +90 216 394 11 25 · **Faks:** +90 216 394 10 04 · **E-posta:** info@herkimgroup.com
- **Grup:** [herkimgroup.com](https://www.herkimgroup.com)

## Sayfalar

| Dosya | İçerik |
|---|---|
| `index.html` | Ana sayfa: hero, distribütör markalar, sektörler, öne çıkan ürünler, ilke ve değerler, rakamlar, kurumsal, doküman, duyurular, iletişim |
| `kurumsal.html` | Hakkımızda (1975), misyon & vizyon, ilke ve değerler, tarihçe, kalite & sertifikalar, SSS |
| `urunler.html` | Filtreli ürün kataloğu (kategori + alt kategori + arama), `?kat=deri` gibi URL parametresi |
| `urun-listesi.html` | Teknik tablo: kategori, marka, ambalaj; sıralanabilir ve aranabilir |
| `hizmetler.html` | Hizmetlerimiz: Pazarlama & Lojistik, AR-GE, Teknik Servis |
| `dokumanlar.html` | Doküman Merkezi (katalog, TDS/SDS, sertifika) + Dijital Marka Kiti |
| `duyurular.html` | Tüm duyurular + e-bülten |
| `iletisim.html` | Teklif/iletişim formu, gerçek adres/telefon/faks, harita kartı |
| `kvkk.html` | KVKK aydınlatma + çerez politikası (şablon) |

## Ürün yapısı (gerçek kategoriler)

- **Deri Kimyasalları:** Altkat · Finisaj · Dolap Boyaları
- **Tekstil Kimyasalları:** Proses Kimyasalları · Tekstil Boyaları
- **Binderler:** İnşaat Boya · Matbaa · Tekstil Binderleri

Bireysel ürünler temsilîdir (gerçek SKU listesi talep/giriş ile paylaşılır). Tümü `assets/js/data.js` → `HK_PRODUCTS` içinde, üç dilli adlarla.

## Çok dillilik (TR / EN / RU)

- Sözlük ve motor: `assets/js/i18n.js` — TR/EN/RU, her dilde ~278 anahtar.
- HTML'de `data-i18n="anahtar"` (metin), `data-i18n-br` (çok satırlı), `data-i18n-ph` (placeholder), `data-i18n-title` / `data-i18n-aria` (nitelik).
- Üstteki **TR / EN / RU** düğmeleriyle değişir; tercih `localStorage` içinde saklanır; ürün/haber/doküman içeriği anında yeniden çizilir.
- Yeni metin eklerken: HTML'e `data-i18n="yeni.anahtar"` yazın ve üç dile de karşılığını `i18n.js`'e ekleyin.

## Çalıştırma

`index.html`'i tarayıcıda açın veya yerel sunucu:

```bash
cd "NGBvHRK"
python3 -m http.server 4173   # http://localhost:4173
```

## Yayına almadan önce düzenlenecekler

1. **WhatsApp numarası** — `assets/js/data.js` → `HK_COMPANY.whatsapp` (şu an landline `902163941125`; WhatsApp Business hattınızla değiştirin).
2. **Ürün listesi** — `data.js` → `HK_PRODUCTS` (temsilî; gerçek portföyünüzle güncelleyin).
3. **Duyurular / dokümanlar** — `data.js` → `HK_NEWS`, `HK_DOCS`.
4. **Sertifikalar** (ISO 9001 vb.) — kendi belgelerinizle doğrulayın.
5. **KVKK metni** — hukuk danışmanınızla teyit edin.
6. **Rakamlar** (54 yıl, 12 satış noktası) — güncel değerlerle kontrol edin.
7. Döviz kuru `open.er-api.com`'dan çekilir; erişilemezse `data.js` yedek değerleri gösterilir.
8. Formlar sunucusuz çalışır (mailto/WhatsApp).

## Marka

- **Renkler:** Crimson `#A31C3C` · Koyu `#7C102E` · Sıcak `#C42449` · Mürekkep `#1B1216` · Kâğıt `#FAF6F1`
- **Yazı tipleri:** Archivo (başlık) · IBM Plex Sans (metin) · IBM Plex Mono (teknik)
- **Logo:** `assets/img/logo.svg`, `assets/img/favicon.svg`
