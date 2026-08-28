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
| `portal.html` | **İç PERSONEL portalı — menülerde LİNKİ YOK, bilinçli gizli.** Faz 1'de tek yönetici hesabı, yalnız ürün/doküman yönetimi (bkz. "Yayın modu"). Kapalı duran Faz 2'de 3 rol vardır: satış (CRM + başvuru onayı) / depo / yönetim. Müşteri rolü portaldan çıkarıldı; müşteri kendi siparişini ana sitedeki `siparislerim.html` sayfasından izler. |

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

## Backend (herkim-backend/)

Gerçek veritabanı katmanı — Supabase hesabı açıldığı an devreye girer.
Şema, satır seviyesi güvenlik politikaları, sipariş fonksiyonu, e-posta
şablonları ve 29 sızıntı testi orada. Kurulum: `herkim-backend/README.md`.
Site şu an hâlâ yerel demo modunda (`assets/js/hg-config.js` → `demo: true`).

## Yayın modu: yönetici girişi

Faz 1'de portal **tek bir yönetici hesabıyla** ve yalnız ürün/doküman
yönetimi için açılır (`data.js → HK_FEATURES.urunYonetimi`). Rol düğmeleri,
CRM, siparişler ve müşteri kartları kapalıdır.

- **Kimlik `data.js`'te YAZMAZ.** Yalnız PBKDF2-HMAC-SHA256 özeti durur
  (`HK_ADMIN.tuz / tur / ozet`); kullanıcı adı ve parola birlikte özetlenir.
  Giriş sırasında aynı türetme tarayıcıda WebCrypto ile tekrarlanır.
- **Yeni kimlik üretmek:** `node tools/yonetici-kimligi.mjs` — kullanıcı adı,
  parola ve `data.js`'e yapıştırılacak bloğu ekrana basar. Parolayı hiçbir
  dosyaya yazmaz; parola yöneticinize kaydedin, depoya koymayın.
- **Kaba kuvvet:** hata sayacı `localStorage → hg_adm_lock_v1` içinde
  KALICI tutulur; sayfayı yenilemek kilidi düşürmez. Basamaklar
  `HK_ADMIN.gecikme`: 3. hatada 1 dk, 4.'te 5 dk, 5.'te 15 dk, 7.'de 1 saat,
  10.'da 6 saat. Kilit bitince sayaç sıfırlanmaz — ısrar eden her turda
  daha uzun bekler.
- **Neyi korumaz:** özet herkese açıktır (çevrimdışı deneme mümkün — parolanın
  24 karakter olması bunu anlamsız kılar) ve kilit sayacı devtools ile
  silinebilir. Asıl koruma şudur: portaldaki değişiklik yalnız o tarayıcıda
  kalır, yayına ancak commit ile çıkar.
- Portal `https://` ya da `localhost` gerektirir: WebCrypto güvenli bağlam
  ister. Güvenli bağlam yoksa giriş verilmez, açık uyarı gösterilir.

## Demo akışı (Faz 2 — şu an KAPALI)

- **Müşteri girişi:** ana sitedeki hesap düğmesinden, demo şifresi
  `portal-store.js → HGP_DEMO_PASS`. `HK_FEATURES.hesapBasvurusu` ve
  `siparis` bayrakları `false` olduğu için bu akış şu an kapalıdır.
- ⚠️ Demo şifresi kaynak kodda ve depo public — gerçek müşteri verisi girmeden önce Supabase Auth'a geçilmeli (bkz. `herkim-backend/README.md`).
- Uçtan uca: `hesap.html`'den başvur → portalda **Satış → Müşteri Kartları**'nda onayla → o e-postayla ana siteden gir → sepetten sipariş ver → sipariş satış onayına, depo panosuna, yönetim dashboard'una düşer → müşteri `siparislerim.html`'den izler.
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

## Önbellek kuralı (ÖNEMLİ — ikiniz de okuyun)

CSS/JS bağlantılarının sonundaki `?v=2026-08-25b` bir **sürüm damgasıdır**.
Tarayıcılar (ve GitHub Pages) bu dosyaları günlerce önbellekte tutar; damga
olmadan yeni kodu yayınlasanız bile ziyaretçi **eski CSS/JS ile yeni HTML'i**
karıştırır ve site bozuk görünür (yazı tipleri gitmiş, ham `a11y.skip` gibi
çeviri anahtarları ekranda görünmüş gibi).

**Kural:** `assets/css/` veya `assets/js/` içinde bir dosyayı değiştirdiğinizde
11 HTML dosyasındaki damgayı da güncelleyin:

```bash
# Bugünün tarihiyle damgayı yenile (aynı gün ikinci kez değiştirdiyseniz
# sonuna bir harf ekleyin: ...-25b, ...-25c)
sed -i '' "s/?v=[^\"]*/?v=$(date +%Y-%m-%d)/g" *.html
```

**Kendi tarayıcınızda eski hali görüyorsanız** (damga güncellenmeden önce):
macOS Chrome/Edge'de `Cmd+Shift+R`, Safari'de `Cmd+Option+E` sonra `Cmd+R`.

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
