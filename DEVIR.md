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

Depo: `ercepan/herkim-group-website` — GitHub Pages'te yayınlanıyor.
Alan adı: `herkim.com.tr` — geçiş 1 Eylül 2026'da başlatıldı; kod tarafı
bitti (kökteki `CNAME` dosyası), DNS adımı için §4'e bakın.

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

## 4. Alan adı geçişi — herkim.com.tr

**DİKKAT: `herkim.com.tr` boş değil.** Natro'da (94.73.145.212) çalışan eski
Herkim sitesi var ve `info@herkim.com.tr` e-postası aktif (MX kaydı
`mail.herkim.com.tr`). Geçiş eski sitenin yerini alır.

### Sıra önemli

**1. Natro panelinde DNS.** `herkim.com.tr` bir apex alan adıdır.
**Apex'e CNAME KONULMAZ** — konursa MX kaydı geçersizleşir ve
`info@herkim.com.tr` mailleri gelmez olur (RFC 1034). Mevcut
`A → 94.73.145.212` kaydı şunlarla değiştirilir:

```
A     @      185.199.108.153
A     @      185.199.109.153
A     @      185.199.110.153
A     @      185.199.111.153
CNAME www    ercepan.github.io.
```

**MX kaydına DOKUNULMAZ.**

**2. DNS yayılınca** (`dig +short herkim.com.tr` GitHub adreslerini gösterince):

```bash
bash tools/alan-adi-gecisi.sh
```

Betik 21 dosyadaki adresi günceller — canonical, og:url, sitemap, robots,
JSON-LD, şema üretici ve **e-posta şablonları** dahil. `CNAME` dosyasını yazar.
Eski adres kalırsa hata verip durur.

**3.** commit + push

**4.** GitHub → Settings → Pages → Custom domain: `herkim.com.tr`, sonra
**Enforce HTTPS**. Sertifika birkaç dakikada gelir.

### DNS hazır olmadan `CNAME` dosyasını depoya koymayın

GitHub Pages özel alan adına yönlenir ve `github.io` adresi de kırılır — site
tamamen erişilemez olur.

### Geçişten sonra

- Web3Forms panelinde formun "Website URL" alanını `herkim.com.tr` yapın
- Google Search Console'a yeni alan adını ekleyip `sitemap.xml` gönderin
- Eski sayfa adresleri (`hakkimizda.html`, `fuar.html`…) 404 verecek —
  yönlendirme koymama kararı alındı

---

## 5. Bekleyen işler

| İş | Durum | Kimde |
|---|---|---|
| DNS'i GitHub'a yöneltmek | bekliyor | Natro paneli olan kişi |
| Filigransız tanıtım videosu | bekliyor | video kaynağı olan kişi |
| KVKK metni | şablon — hukukçuya danışılacak | şirket |
| MERSİS / ticaret sicil numarası | eksik | şirket |
| ISO 9001 belgesi | kartı var, belge yok | şirket |
| Web3Forms alan adı kısıtlaması | Pro özelliği, kapalı | karar |

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
