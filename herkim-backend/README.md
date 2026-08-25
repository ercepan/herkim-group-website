# Herkim Group B2B — Backend

Bu klasör sitenin **arka tarafıdır**: veritabanı şeması, güvenlik politikaları,
sunucu fonksiyonları ve e-posta şablonları. Site (statik HTML) buradan beslenir.

> **BU KLASÖR PRIVATE BİR DEPODA DURMALIDIR.** Site deposu (`herkim-group-website`)
> herkese açıktır; şema ve doğrulama akışları orada durmamalıdır.

---

## Neyi garanti ediyor

**Fiyat gizliliği veritabanının içinde zorlanır**, JavaScript'te değil.
"Müşteri yalnız kendi fiyatını görür" kuralı Postgres politikası olarak yazılıdır;
tarayıcıdan elle sorgu atılsa, konsoldan oynanınsa, doğrudan REST adresi çağrılsa
bile veritabanı yetkisiz satırı **döndürmez**.

Dört ayak:
1. **Fiyat ayrı tablolarda** — `products` ve `order_items` içinde fiyat sütunu *yoktur*;
   `0002_rls.sql` sonundaki denetim, biri ileride eklemeye kalkarsa migration'ı kırar.
2. **Satır seviyesi güvenlik (RLS)** — depo rolü için fiyat tablosunda *hiç politika yok*;
   RLS'te "politika yok" = "satır yok". Depo `select count(*)` çalıştırsa 0 görür.
3. **Fiyat istemciden gelmez** — `place_order()` fonksiyonunun imzasında fiyat parametresi
   yoktur. Tarayıcı yalnız (ürün, miktar) yollar; birim fiyatı sunucu çözer.
4. **E-postada beyaz liste** — 11 şablon fiyat değişkeni kabul etmez; geçirilirse gönderim
   sessizce sızmak yerine gürültüyle başarısız olur.

Bunlar iddia değil, **test edilmiş olgudur**: `npm test` → 29 test.

---

## Kurulum (adım adım)

### 1. Supabase projesi
1. [supabase.com](https://supabase.com) → **kurumsal e-posta ile** hesap aç
2. Yeni proje: ad `herkim-prod`, bölge **EU Central (Frankfurt)** ⚠️ *bölge sonradan değişmez*
3. Veritabanı şifresini parola yöneticisine kaydet
4. Panel → Settings → API: iki değeri not al
   - `Project URL`
   - `anon / publishable key` → bunlar **herkese açık olacak, sorun değil**
   - `service_role key` → **ASLA** tarayıcıya, depoya veya bu klasöre yazma

### 2. Şemayı yükle
Supabase panelinde **SQL Editor**'ü aç ve dosyaları **sırayla** yapıştırıp çalıştır:

```
supabase/migrations/0001_schema.sql        → tablolar
supabase/migrations/0002_rls.sql           → güvenlik politikaları
supabase/migrations/0003_rpc.sql           → sunucu fonksiyonları
supabase/migrations/0004_seed_products.sql → 42 ürün
```

**Kontrol:** Table Editor'da hiçbir tablonun yanında `Unrestricted` yazmamalı.
Yazıyorsa canlıya çıkma.

### 3. Siteyi bağla
`assets/js/hg-config.js` dosyasını doldur (site deposunda):

```js
window.HG_CONFIG = {
  url: "https://xxxxxxxx.supabase.co",
  anonKey: "eyJhbGci...",
  demo: false          // false = gerçek backend, true = yerel demo
};
```

Sayfalara şu iki satır eklenir (data.js'ten sonra):
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/js/hg-config.js"></script>
<script src="assets/js/hg-api.js"></script>
```
⚠️ **UMD paketi kullanılır, ESM değil** — ESM sürümünde bilinen bir başlatma hatası var.

### 4. E-posta (Brevo)
1. [brevo.com](https://brevo.com) hesabı aç (ücretsiz: 300 e-posta/gün)
2. Senders & Domains → `herkimgroup.com` alan adını ekle
3. Verdiği **DKIM/SPF kayıtlarını** DNS paneline ekletin (kurumsal BT)
4. API key üret

### 5. Bildirim fonksiyonunu yayınla
Supabase panel → Edge Functions → `notify` adıyla yeni fonksiyon;
`supabase/functions/notify/` içindeki iki dosyayı yükle.

Ortam değişkenleri (Settings → Edge Functions → Secrets):
```
BREVO_API_KEY    = xkeysib-...
MAIL_FROM        = bildirim@herkimgroup.com
MAIL_FROM_NAME   = Herkim Group
MAIL_REPLY_TO    = sales@herkimgroup.com
NOTIFY_SECRET    = (rastgele uzun bir dize)
```

Dakikada bir çalışması için SQL Editor'de:
```sql
select cron.schedule('herkim-bildirim', '* * * * *', $$
  select net.http_post(
    url := 'https://XXXX.supabase.co/functions/v1/notify',
    headers := '{"x-notify-secret":"SIZIN_SECRET"}'::jsonb
  );
$$);
```

### 6. Personel hesapları
Supabase panel → Authentication → Users → **Invite user** ile satış/depo/yönetim
kişilerini davet et. Sonra SQL Editor'de rolünü ata:

```sql
update public.profiles set rol = 'satis'   where eposta = 'ayse@herkimgroup.com';
update public.profiles set rol = 'depo'    where eposta = 'hasan@herkimgroup.com';
update public.profiles set rol = 'yonetim' where eposta = 'mudur@herkimgroup.com';
```
> Personel **kendi kendine kayıt olamaz** — yalnız davetle.

---

## Testler

```bash
npm install
npm test
```

29 test koşar: müşteri başkasının fiyatını/siparişini göremiyor mu, depo hiç fiyat
görüyor mu, fiyat sunucuda mı çözülüyor, yetkisiz durum geçişi engelleniyor mu,
ziyaretçi ne görebiliyor, mükerrer başvuru engelleniyor mu.

**Bu test kırmızıysa canlıya çıkılmaz.** Her `git push`'ta GitHub Actions'ta da koşar.

---

## Günlük kullanım (satış ekibi)

| İş | Nerede |
|---|---|
| Bekleyen başvuruları görmek | Portal → Müşteri Kartları · veya Supabase Table Editor → `applications` |
| Hesap onaylamak | Portalda "Onayla" · veya `select approve_application('<başvuru-id>')` |
| Fiyat girmek | Supabase Table Editor → `customer_prices` (firma + ürün + fiyat + para birimi) |
| Sipariş onaylamak | Portal → Siparişler · veya `select advance_order('<sipariş-id>','onay')` |
| Gönderilen e-postaları görmek | Table Editor → `notifications_outbox` |

---

## Klasör yapısı

```
herkim-backend/
├─ supabase/
│  ├─ migrations/       0001 şema · 0002 güvenlik · 0003 fonksiyonlar · 0004 ürünler
│  └─ functions/notify/ e-posta işçisi + 10 şablon (TR/EN/RU)
├─ test/                sızıntı testi (gerçek Postgres, WASM)
└─ .github/workflows/   her push'ta test
```

## Kapsam dışı (bu turda yok)
Logo Tiger entegrasyonu · kredi kartıyla ödeme · cari bakiye gösterimi ·
gerçek zamanlı stok · e-fatura. Şemada `cari_kod`, `stok_kodu`, `logo_order_no`
alanları ileriye dönük **şimdiden açıldı** — alan açmak bedava, sonradan şema
değiştirmek maliyetli.
