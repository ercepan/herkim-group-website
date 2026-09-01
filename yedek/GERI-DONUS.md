# GERİ DÖNÜŞ TALİMATI — herkim.com.tr

Alan adı **1 Eylül 2026'da** Natro'daki eski siteden GitHub Pages'e taşındı.
Bu dosya, bir aksilik olursa nasıl geri dönüleceğini anlatır.

DNS yönetimi: `ns1.natrohost.com` / `ns2.natrohost.com` (Natro panelinde)

---

## Ne değişti — sadece iki isim

Bölgede **yalnız web'i gösteren A kayıtlarına** dokunuldu. Başka hiçbir kayıt
eklenmedi, silinmedi, düzenlenmedi.

| İsim | Önce | Sonra |
|---|---|---|
| `herkim.com.tr` (apex) | `A 94.73.145.212` | `A 185.199.108.153` + `.109` + `.110` + `.111` |
| `www.herkim.com.tr` | `A 94.73.145.212` | aynı dört adres |

Dört adres GitHub Pages'in kendi adresleridir; biri erişilemezse diğerleri
devreye girer. 1 Eylül 2026'da `dig ercepan.github.io` ile doğrulandı,
belgeden ezbere alınmadı.

## Eski hâle döndürmek için

1. Natro DNS panelinde apex ve `www` için eklenen sekiz A kaydını silin,
   her ikisine birer `A 94.73.145.212` kaydı ekleyin.
2. Depodaki `CNAME` dosyasını silin ve GitHub → Settings → Pages → Custom
   domain alanını boşaltın.
3. `bash tools/alan-adi-gecisi.sh` betiğinin yaptığı adres değişikliğini geri
   almak için o commit'i `git revert` edin.

Yayılım 10 dakika ile bir saat arasında sürer (bölgenin TTL'i 3600 sn).

Eski sitenin sayfaları `yedek/eski-site/` klasöründe duruyor (7 sayfa, 140 KB).
Natro sunucusundaki dosyalar silinmedi; site hâlâ `94.73.145.212` üzerinde
duruyor, sadece alan adı artık oraya bakmıyor.

---

## MAİL — hiçbirine dokunulmadı, dokunulmayacak

Aşağıdakiler bölgede aynen duruyor. Biri silinirse `info@herkim.com.tr`
çalışmaz hâle gelir ya da giden mailler spam'e düşer.

| Tür | Ad | Ne işe yarar |
|---|---|---|
| MX | @ | Gelen mailin hangi sunucuya gideceği |
| A | mail | Mail sunucusunun kendisi (`85.97.197.8`) |
| TXT | @ | SPF — giden mailin sahte olmadığını kanıtlar |
| TXT | mail | Mail alt alanının kendi SPF'i |
| TXT | \_dmarc | DMARC politikası |
| TXT | mail.\_domainkey | **DKIM imza anahtarı** |
| CNAME | autodiscover | Outlook'un ayarları otomatik bulması |
| CNAME | phaa4qp2icpx | Google Workspace alan adı doğrulaması |
| CNAME | \_ba2470… / \_ce5dd9… | Sectigo SSL doğrulama (DCV) kayıtları |

**Tam değerleri `dns-tam-bolge-20260901.txt` dosyasındadır.**

> **Not — ilk yedek eksikti.** `dns-anlik-20260901-1447.txt` alınırken Natro
> panelinin alt bölümleri ekrana sığmadığı için DKIM, `mail` SPF'i ve dört
> CNAME kaydı görülmemişti. Kayıtların kendisi yerindeydi; eksik olan yedekti.
> `dns-tam-bolge-20260901.txt` o eksiği kapatır. **Geri dönüşte o dosyayı
> kullanın, eskisini değil.**

**Neden mail etkilenmedi:** mail sunucusu (`85.97.197.8`) web sunucusundan
(`94.73.145.212`) ayrı bir makinede. Web'in A kaydını değiştirmek mail
akışına dokunmaz. SPF'teki `mx` mekanizması MX kaydını gösterir, MX de
değişmediği için SPF geçerli kaldı.

**Tehlike şurada:** apex alan adına (`@`) CNAME konulursa RFC 1034 gereği o
isimde başka hiçbir kayıt geçerli olamaz — MX ve TXT dâhil. Mail o anda
kesilir. Bu yüzden apex için **A kaydı** kullanıldı.

---

## Geçiş sonrası doğrulama — 1 Eylül 2026'da yapıldı

```bash
dig +short herkim.com.tr @ns1.natrohost.com        # dört GitHub adresi ✓
dig +short www.herkim.com.tr @ns1.natrohost.com    # dört GitHub adresi ✓
dig +short herkim.com.tr MX @ns1.natrohost.com     # 10 mail.herkim.com.tr. ✓
dig +short herkim.com.tr TXT @ns1.natrohost.com    # SPF + Google ✓
dig +short mail._domainkey.herkim.com.tr TXT @ns1.natrohost.com   # DKIM ✓
dig +short mail.herkim.com.tr @ns1.natrohost.com   # 85.97.197.8 ✓
```

Sitenin GitHub'dan sunulduğu da doğrulandı:

```bash
curl -sSL --resolve herkim.com.tr:80:185.199.108.153 http://herkim.com.tr/ | grep '<title>'
# <title>Herkim Kimya — Deri & Tekstil Kimyasalları · 1975'ten beri</title>
```

**Hâlâ yapılmadı — mail testi.** Dışarıdan `info@herkim.com.tr` adresine bir
deneme maili atıp geldiğini görün, bir de o adresten dışarı mail atıp spam'e
düşmediğini kontrol edin. DNS kayıtları yerinde ama gerçek bir gönderim
denenmeden geçiş "tamam" sayılmamalı.

---

Ham `dig` çıktısı: `dns-tam-bolge-20260901.txt` (güncel) ve
`dns-anlik-20260901-1447.txt` (geçiş öncesi, eksik).
