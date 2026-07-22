# Herkim Group — Kurumsal Site + Sipariş Altyapısı

**Herkim Group Kimyevi Maddeler A.Ş.** (1975, Tuzla/İstanbul) için üç dilli (TR/EN/RU), sunucu gerektirmeyen statik kurumsal site ve uçtan uca sipariş/CRM demosu.

- **Canlı site:** https://ercepan.github.io/herkim-group-website/
- **Yayın:** `main` dalına push → GitHub Pages ~1 dakikada otomatik günceller.

## Sayfalar

| Dosya | İçerik |
|---|---|
| `index.html` | Ana sayfa: hero, kayan kategori bandı, öne çıkan ürünler, rakamlar, video, iletişim |
| `kurumsal.html` | Hakkımızda, misyon & vizyon, ilkeler, tarihçe, kalite |
| `urunler.html` | Filtreli ürün kataloğu (6 kategori, arama, `?kat=asit` URL parametresi) + PDF katalog indirme |
| `urun-listesi.html` | Sıralanabilir teknik tablo + PDF katalog indirme |
| `hizmetler.html` | Hizmetler: tedarik & lojistik, AR-GE, teknik servis |
| `dokumanlar.html` | Doküman Merkezi — Ürün Kataloğu 2026 PDF'i gerçek indirme, diğerleri talep |
| `iletisim.html` | İletişim/teklif formu + gerçek Google Haritalar gömme |
| `hesap.html` | Müşteri hesap başvurusu (NGB modeli): VKN/TCKN sağlama basamağı denetimi |
| `siparislerim.html` | Girişli müşterinin sipariş takibi (durum, zaman çizelgesi, takip no) |
| `kvkk.html` | KVKK + çerez politikası (şablon — hukukçuya danışılacak) |
| `portal.html` | **İç operasyon portalı — menülerde LİNKİ YOK, bilinçli gizli.** 4 rol: müşteri / satış (CRM + başvuru onayı) / depo / yönetim |

`pan/` klasörü: Pan Holding örnek sitesi (ayrı iş, Herkim'den bağımsız).

## Mimari (assets/js)

| Dosya | Görev |
|---|---|
| `data.js` | Tek veri kaynağı: `HK_COMPANY` (künye), `HK_CATS`/`HK_SUBS` (6 kategori), `HK_PRODUCTS` (42 gerçek ürün, üç dilli), `HK_DOCS` |
| `i18n.js` | TR/EN/RU sözlük + motor. HTML'de `data-i18n`, `data-i18n-br`, `data-i18n-ph`, `data-i18n-title/aria` |
| `portal-store.js` | Paylaşılan demo deposu (`localStorage: hg_store_v1`): siparişler, talepler, hesap başvuruları, aktivite akışı + `hgNotify` (Web3Forms e-posta köprüsü) + VKN/TCKN doğrulayıcılar |
| `site-auth.js` | Ana site müşteri oturumu (portalla ortak `hg_portal_session`), giriş penceresi, başlıktaki hesap menüsü. 3 hatalı giriş → 60 sn kilit, 15 dk boşta → çıkış |
| `main.js` | Site etkileşimi: sepet (teklif + doğrudan sipariş), filtreler, arama, formlar, Siparişlerim, hesap başvurusu |
| `portal-app.js` | Portal uygulaması (yalnız `portal.html`) |

## Demo akışı

- **Demo şifresi:** `demo1234` (tüm roller). Varsayılan müşteri: `satinalma@derimderi.com.tr`.
- Uçtan uca: `hesap.html`'den başvur → portalda **Satış → Müşteri Kartları**'nda onayla → o e-postayla siteden gir → sepetten sipariş ver → sipariş satış onayına, depo panosuna, yönetim dashboard'una düşer → müşteri `siparislerim.html`'den izler.
- Veriler tarayıcıda (`localStorage`) yaşar; portalda "Demoyu sıfırla" ile başa döner. Gerçek kuruluma geçişte bu katman küçük bir API + Logo Tiger/ATLAS entegrasyonuyla değişecek; ekranlar aynı kalır.

## Altın kurallar (bozmayın)

1. **`innerHTML` kullanmak yasak.** Dinamik içerik yalnız `createElement` / `textContent` ile (XSS güvenliği).
2. **Her yeni metin üç dile eklenir:** HTML'e `data-i18n="anahtar"`, `i18n.js`'te TR + EN + RU bloklarına aynı anahtar. Dinamik metinlerde `hkT("anahtar")`.
3. **Büyük İ sorunu:** `text-transform: uppercase` Türkçe "i→İ" dönüşümünü bozar; büyük harf gereken yerde metni doğrudan büyük yazın.
4. **Ambalaj/fiyat gibi bilinmeyen veriler uydurulmaz** — "sipariş onayında netleşir" kalıbı kullanılır.
5. **Portal linki ana siteye eklenmez** (yalnız yönetim bilir); `portal.html` `noindex` kalır.
6. Konumlandırma "1975'ten beri tecrübe" üzerinedir; üçüncü taraf firma/marka adları siteye yazılmaz.
7. UI'da emoji kullanılmaz (kurumsal ton).

## Yerelde çalıştırma

```bash
git clone git@github.com:ercepan/herkim-group-website.git
cd herkim-group-website
python3 -m http.server 4173   # → http://localhost:4173
```

## Birlikte geliştirme düzeni

1. Çalışmaya başlamadan **önce** daima: `git pull`
2. Küçük ve sık commit; mesaj Türkçe, ilk satır özet (örn. `Ürün kartlarına stok rozeti eklendi`).
3. Push etmeden önce siteyi yerelde açıp değiştirdiğin akışı elle dene; tarayıcı konsolunda hata olmadığını kontrol et.
4. `git push origin main` → 1 dk sonra canlıda. Aynı dosyada çakışmamak için kim neyi alacaksa kısaca haberleşin; büyük işlerde dal açın: `git checkout -b ozellik-adi` → push → GitHub'da Pull Request.

## Araçlar

- `tools/katalog-uret.py` — Ürün Kataloğu PDF'ini (assets/docs/) flyer tasarımıyla yeniden üretir. Ürün listesi değişince script içindeki listeleri güncelleyip çalıştırın: `pip install cairosvg && python3 tools/katalog-uret.py`

## Yol haritası / bekleyenler

- [ ] Web3Forms erişim anahtarı (`data.js → HK_COMPANY.web3forms`) → form/teklif/sipariş bildirimleri gerçek e-postaya düşer
- [ ] WhatsApp Business API fazı (Cloudflare Worker + Meta Cloud API): yetkiliye anlık bildirim + eskalasyon
- [ ] Gerçek tesis/depo fotoğrafları (`assets/img/photos/`)
- [ ] Domain bağlanması (Pages → özel alan adı) ve Google Analytics
- [ ] KVKK metninin hukukçu onayı; gerçek ambalaj listesi gelirse ürünlere işlenmesi

## Marka

Crimson `#A31C3C` · Mürekkep `#1B1216` · Kâğıt `#FAF6F1` — Archivo (başlık) / IBM Plex Sans (metin) / IBM Plex Mono (teknik). Tasarım dili: beyaz-nötr zemin, ince çizgiler, tek vurgu renginin az kullanımı (BASF/Brenntag sınıfı kurumsal emsallere göre ayarlandı).
