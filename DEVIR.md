# DEVİR NOTU — Herkim Group web sitesi

Bu dosya siteyi devralan kişi içindir. Sohbet geçmişi kaybolur, bu dosya kalır.

---

## 0. İLK İŞ — bunu yapmadan hiçbir şeye dokunmayın

Deponun geçmişi yeniden yazıldı (videoların eski sürümleri temizlendi, depo
103 MB'tan 44 MB'a indi). Elinizdeki kopya bu yüzden uyumsuz.

```bash
git fetch origin
git reset --hard origin/main
```

Push etmediğiniz bir işiniz varsa **önce** `git stash` yapın, sonra bu komutları
çalıştırın, en son `git stash pop`. Karışırsa depoyu yeniden klonlamak en temizi.

Kontrol: `git log --oneline -1` çıktısı `be9b3e9` ile başlamalı.

---

## 1. Hangi anahtar neyi açıyor

Bunlar birbirinin yerine geçmez. En sık yapılan hata, portal şifresini "her şeyi
açan anahtar" sanmaktır — değildir.

| Anahtar | Kimde | Neyi açar | Neyi AÇMAZ |
|---|---|---|---|
| **Portal şifresi** | parola yöneticisinde | Ürün ve doküman ekleme/çıkarma | Domain, kod, mail ayarı |
| **GitHub** (`ercepan`) | hesap sahibi | Kod gönderme, Pages ayarı, özel alan adı | DNS |
| **Natro paneli** | şirket | DNS kayıtları — alan adının nereyi gösterdiği | — |
| **Web3Forms** (`ercepantr@gmail.com`) | hesap sahibi | Form maillerinin nereye düşeceği, captcha | — |

**Portal şifresi depoda YAZMAZ.** `data.js` içinde yalnız PBKDF2 özeti durur;
kaynağı okuyan şifreyi öğrenemez. Şifre kaybolursa geri getirilemez, yenisi
üretilir:

```bash
node tools/yonetici-kimligi.mjs
```

Çıktıdaki bloğu `data.js` içindeki `HK_ADMIN` ile değiştirip commit edin.
Kullanıcı adı ve şifre hiçbir dosyaya yazılmaz, ekranda bir kez görünür.

---

## 2. Sitenin şu anki durumu

Adres: **https://herkim.com.tr**
Site **Natro hosting'de** duruyor (2 Eylül 2026'dan beri), GitHub Pages'te DEĞİL.
Depo (`ercepan/herkim-group-website`) yine ana kaynaktır; sunucuya oradan
kopyalanır. Nedeni ve yayın adımları §4'te.

**Faz 1 — teklif modeli.** Sitede sipariş verme ve müşteri hesabı KAPALI.
Alıcı ürünleri görür, teklif sepetine atar, WhatsApp veya e-posta ile satış
ekibine ulaşır. Kapalı özelliklerin kodu silinmedi, `data.js` içindeki tek bir
blokla kapatıldı:

```js
const HK_FEATURES = {
  hesapBasvurusu: false,  // müşteri hesabı ve giriş penceresi
  siparis: false,         // sepetten doğrudan sipariş
  portal: false,          // CRM, sipariş takibi, müşteri kartları
  urunYonetimi: true      // portal.html yalnız ürün/doküman yönetimi için açık
};
```

Faz 2'ye geçmek isterseniz bunlar `true` yapılır — ama önce arka uç kurulmalı
(`herkim-backend/` klasöründe hazır: şema, satır seviyesi güvenlik, 29 sızıntı
testi). Şu anki portal şifresi gerçek bir güvenlik sınırı değildir; statik
sitede parola tarayıcıya inen kodun içindedir.

---

## 3. Sık yapılan işler

### Fiyat güncellemesi

Fiyatlar `assets/js/data.js` içinde **ayrı bir blokta** (`HK_FIYAT`). 42 ürünlük
listeye dokunmadan yalnız orası değişir.

```js
liste: {
  5: [ { ambalaj: {...}, usd: 0.95 },      // IBC 1200 L
       { ambalaj: {...}, usd: 1.10 } ],    // 35 L bidon
  ...
}
```

Değiştirdikten sonra **üç adım**, atlanırsa arama sonucundaki fiyat siteden
sapar ve Google zengin sonucu geri çeker:

```bash
python3 tools/sema-uret.py          # 1. JSON-LD şemalarını yeniden üret
# 2. HTML'lerdeki ?v= damgasını yükseltin (aşağıya bakın)
git add -A && git commit && git push # 3.
```

### Ürün ekleme / çıkarma

İki yol var:

**Portaldan** (`portal.html`, yönetici girişi): kolay ama değişiklik **yalnız o
tarayıcıda** kalır. Yayına çıkması için paneldeki "Kodu üret" çıktısını
`data.js`'e yapıştırıp commit etmek gerekir. Panel bunu ekranda da yazar.

**Doğrudan `data.js`**: `HK_PRODUCTS` dizisine satır ekleyin. Ad üç dilde de
zorunlu. Ürün sayacı otomatik güncellenir.

Katalog PDF'i ayrı bir dosyadır, ürün listesiyle birlikte güncellenmeli:

```bash
python3 tools/katalog-uret.py
```

### Önbellek damgası — HER değişiklikten sonra

Tarayıcılar CSS/JS dosyalarını önbelleğe alır. Damga yükseltilmezse ziyaretçi
eski sürümü görmeye devam eder. "Değişiklik yaptım ama sitede görünmüyor"
şikâyetinin sebebi neredeyse her zaman budur.

```bash
python3 -c "
import io,glob,re
for f in glob.glob('*.html'):
    s=io.open(f,encoding='utf-8').read()
    io.open(f,'w',encoding='utf-8').write(re.sub(r'\?v=[^\"]*\"','?v=2026-09-02\"',s))
"
```

Tarihi o günün tarihiyle değiştirin. Aynı gün ikinci kez değişiklik yaparsanız
sonuna harf ekleyin: `2026-09-02b`.

---

## 4. Site nerede duruyor, nasıl güncellenir

**Site Natro hosting'de.** GitHub Pages'te değil. Sebep aşağıda.

| Ne | Nerede |
|---|---|
| Web sitesi | Natro, `94.73.145.212`, `/home/u5922390/public_html` |
| HTTPS sertifikası | Natro'daki Sectigo — `herkim.com.tr` + `www`, 8 Aralık 2026'ya kadar |
| Kaynak kod | GitHub `ercepan/herkim-group-website` (ana kaynak) |
| Sunucudaki git klonu | `/home/u5922390/site-repo` (web kökünün DIŞINDA) |
| E-posta | Natro, ayrı sunucu `85.97.197.8` |
| DNS bölgesi | Natro paneli → Hosting Yönetimi → Yönet → herkim.com.tr → DNS Yönetimi |

### Neden GitHub Pages'te değil

1 Eylül 2026'da site GitHub Pages'e taşındı ve DNS oraya çevrildi. **GitHub 19
saat boyunca alan adı için HTTPS sertifikası üretemedi.** Sertifika siparişi
API'de hiç oluşmadı; ayarlar ekranı `DNS Check in Progress` durumunda takılı
kaldı. Denenenler:

- `www`'yi A kaydından CNAME'e çevirmek → sağlık kontrolü tamamen yeşile döndü,
  sertifika yine gelmedi
- Pages'e yeniden derleme isteği → tetiklemedi
- Özel alan adını API ile kaldırıp yeniden eklemek → tetiklemedi
- Aynısını **web arayüzünden** yapmak → sipariş ilk kez oluştu (`dns_changed`,
  "Requesting a new certificate") ama 12 saatte tamamlanmadı

Sertifika şeffaflık kayıtları (crt.sh) doğruladı: GitHub bu alan adı için tek
bir sertifika bile almadı. Ziyaretçiler https ile girdiğinde uyarı görüyordu.
Natro'da zaten geçerli bir Sectigo sertifikası bulunduğu için site oraya alındı.

**GitHub tarafı bozulmadı.** Depodaki `CNAME` dosyası ve Pages ayarı duruyor;
sertifikası bir gün gelirse DNS'i geri çevirmek yeterlidir (§"Geri dönüş").

### Siteyi güncelleme — DEĞİŞTİ

Artık `git push` yayına çıkmaz. İki adım:

**1. Sunucudaki klonu güncelle.** cPanel → Git™ Version Control → `herkim-site`
→ Yönet → **Update from Remote**. (Depoya push ettikten sonra.)

**2. Yayın dosyalarını kopyala.** cPanel → Dosya Yöneticisi →
`/home/u5922390/site-repo` → şunları seç ve `/public_html` içine **Kopyala**:

```
assets/          robots.txt       sitemap.xml
dokumanlar.html  hesap.html       hizmetler.html   iletisim.html
index.html       kurumsal.html    kvkk.html        portal.html
siparislerim.html  urun-listesi.html  urunler.html
```

**KOPYALANMAZ** (yayınlanmamalı): `tools/`, `yedek/`, `herkim-backend/`,
`pan/`, `.git/`, `.github/`, `DEVIR.md`, `README.md`, `_config.yml`, `CNAME`,
`package.json`, `.gitignore`. Depo bilerek web kökünün DIŞINA klonlandı;
`public_html`'e yalnız yukarıdaki 14 öğe konur.

Çoklu seçim: Mac'te **cmd+tık** (ctrl+tık sağ tık açar).

`.htaccess`'e dokunmayın — `public_html/.htaccess` http→https ve www→apex
yönlendirmelerini yapar, kendi açıklaması içindedir. Kopyalama onu ezmez.

### Eski PHP sitesi

`/home/u5922390/eski-php-site-yedek-20260902/` içinde duruyor, silinmedi. Web
kökünün dışında olduğu için internetten erişilemez. İçinde eski CodeIgniter
uygulaması ve onun `.htaccess`'i var.

### Geri dönüş (GitHub Pages'e)

Sertifika bir gün gelirse: Natro DNS panelinde apex ve `www`'yi
`94.73.145.212` yerine GitHub'ın dört adresine (`185.199.108–111.153`) çevirin;
`www` için CNAME `ercepan.github.io.` tercih edilir. Depodaki `CNAME` dosyası
zaten yerinde. `public_html` içeriğini silmeyin, sadece DNS'i çevirin.

### DNS — bozmayın

**"DNS Kayıtlarını Sıfırla" ve "MX Kayıtlarını Sıfırla" düğmelerine basılmaz.**
Bölgeyi varsayılana döndürür, `info@herkim.com.tr` çalışmaz hâle gelir, DKIM ve
DMARC kaybolur. **Apex'e CNAME konulmaz** (RFC 1034; MX ve TXT geçersizleşir).
Panelin "Değiştir" düğmesi aslında **ekler**, eskisini ayrıca silmek gerekir;
Server alanı textarea görünse de **tek IP** kabul eder.

Şu anki kayıtlar ve tam döküm: `yedek/dns-tam-bolge-20260901.txt`.

---

## 5. Bekleyen işler

| İş | Durum | Kimde |
|---|---|---|
| **Natro hosting yenilemesi — 19 Eylül 2026** | **ACİL, aşağıya bakın** | şirket |
| `info@herkim.com.tr` gönder/al testi | yapılmadı | şirket |
| HTTPS | **çalışıyor** — Natro'daki Sectigo sertifikası | — |
| Web3Forms "Website URL" alanı → herkim.com.tr | yapılmadı | hesap sahibi |
| Google Search Console'a yeni alan adı + sitemap | yapılmadı | hesap sahibi |
| İletişim formunun canlı denemesi (captcha çözülerek) | yapılmadı | şirket |
| Filigransız tanıtım videosu | bekliyor | video kaynağı olan kişi |
| KVKK metni | şablon — hukukçuya danışılacak | şirket |
| MERSİS / ticaret sicil numarası | eksik | şirket |
| ISO 9001 belgesi | kartı var, belge yok | şirket |
| Web3Forms alan adı kısıtlaması | Pro özelliği, kapalı | karar |

### HTTPS sertifikası neden gecikti, ne yapıldı

Alan adı taşındıktan sonra GitHub sertifika siparişini hiç oluşturmadı —
`gh api .../pages` yanıtında `https_certificate` alanı "beklemede" değil, hiç
yoktu. Sebebi: sipariş, alan adı ilk atandığında (DNS hâlâ Natro'yu
gösterirken) başarısız olmuş ve GitHub bunu kendiliğinden tekrar denemiyor.

Sırayla denenenler:
1. `www`'yi A kaydından CNAME'e çevirmek — sağlık kontrolündeki
   `InvalidARecordError` böyle kapandı, apex ve www ikisi de geçerli oldu.
2. Pages'e yeniden derleme isteği (kesintisiz) — tetiklemedi.
3. Özel alan adını kaldırıp yeniden eklemek (GitHub'ın belgelediği çözüm) —
   alan adı 2 saniye bağsız kaldı, site kesintiye uğramadı. Sağlık kontrolü
   tamamen yeşile döndü ama sipariş yine oluşmadı.

Bu noktadan sonra alan adına DOKUNULMAMALI: her `PUT .../pages` çağrısı
süreci baştan başlatır ve sertifikayı daha da geciktirir.

`.github/workflows/https-zorlamasi.yml` saatte bir bakar ve sertifika hazır
olduğunda "Enforce HTTPS" ayarını kendisi açar. Sertifikayı üretmez, yalnızca
kutucuğu işaretler. İşi bitince silinebilir.

**24 saat içinde gelmezse** GitHub Support'a başvurulmalı: depo adı,
`gh api .../pages` ve `.../pages/health` çıktıları ve `https_certificate`
alanının hiç oluşmadığı bilgisiyle. Sertifika siparişini elle kuyruğa
alabiliyorlar.

### Natro hosting 19 Eylül 2026'da bitiyor — DNS oraya bağlı

Panelde "Hosting Yaşam Bilgisi (18 gün kaldı)" yazıyor. Hizmet 19 Eylül 2012'de
başlamış, son yenileme tarihi **19 Eylül 2026** (Sınırsız Xtreme Paket,
290,28 $/12 ay).

Site artık GitHub'da duruyor, o yüzden "hosting'e ne gerek var" diye
düşünülebilir. **Düşünmeyin.** O hosting hesabı iki kritik şeyi taşıyor:

1. **DNS bölgesi.** `herkim.com.tr`'nin bütün kayıtları o hesabın altında
   duruyor. Hesap kapanırsa alan adı hiçbir yeri göstermez — site de, mail de.
2. **`info@herkim.com.tr` postası.** Mail sunucusu ayrı makinede ama hesap
   aynı.

Yenilenmezse ya da DNS başka bir sağlayıcıya taşınmazsa 19 Eylül'de hem site
hem e-posta durur. Karar şirkete ait; bu notun amacı tarihin gözden
kaçmamasıdır.

**Filigran notu:** tanıtım videosundaki `clideo.com` filigranı silinemedi —
kendi PAN HOLDING logonuzun üstüne biniyor. Üzerine opak bir PAN HOLDING
plakası konarak kapatıldı. Videonun filigransız hâli bulunursa
`assets/video/herkim-tanitim.mp4` yerine konup poster karesi yenilenmeli.

---

## 6. Bozmayın

1. **`innerHTML` kullanmayın.** Dinamik içerik yalnız `createElement` /
   `textContent` ile — XSS güvenliği.
2. **Her yeni metin üç dile eklenir.** HTML'de `data-i18n="anahtar"`,
   `i18n.js`'te TR + EN + RU bloklarına aynı anahtar. Biri eksik kalırsa
   ziyaretçi ham anahtar adını görür.
3. **Fiyat/iskonto/marj yalnız `data.js`'teki `HK_FIYAT` bloğuna yazılır.**
   `tools/fiyat-bekcisi.sh` diğer dosyalara sızan fiyat verisini yakalar ve
   commit'i reddeder. Müşteriye özel fiyat hiçbir dosyaya yazılmaz — yeri
   sunucu tarafıdır.
4. **Videoyu tekrar tekrar commit etmeyin.** Git ikili dosyaları her sürümüyle
   kalıcı saklar; bu depo bir kez 103 MB'a şişti ve geçmişi temizlemek
   gerekti. Videoyu değiştirmeden önce sorun.
5. **Portal linki menüye eklenmez** (yalnız yönetim bilir), `portal.html`
   `noindex` kalır.
6. Büyük harf gereken yerde `text-transform: uppercase` KULLANMAYIN —
   Türkçe "i → İ" dönüşümünü bozar, metni doğrudan büyük yazın.

---

## 7. Kontrol komutları

```bash
bash tools/fiyat-bekcisi.sh                        # fiyat sızıntısı var mı
for f in assets/js/*.js; do node --check "$f"; done # JS sözdizimi
python3 tools/sema-uret.py                          # şemalar güncel mi
grep -rn "394 11" --exclude-dir=.git .              # telefon her yerde aynı mı
```

Yerel önizleme: `.claude/launch.json` içindeki `herkim-site` yapılandırması
`python3 -m http.server 4173` çalıştırır.

---

Ayrıntılı teknik açıklamalar `README.md` içinde. Kodun içindeki yorumlar da
"neden böyle yapıldı" sorusunu cevaplar — özellikle `data.js` ve
`portal-store.js` başlıkları.
