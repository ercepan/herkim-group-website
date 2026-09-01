# GERİ DÖNÜŞ TALİMATI — herkim.com.tr

Alan adı GitHub Pages'e taşınmadan **önceki** durum. Bir aksilik olursa
Natro panelinde aşağıdaki kayıtlar birebir geri yazılır ve site eski hâline
döner.

Yedek alındığı an: **1 Eylül 2026, 14:47 (TSİ)**
DNS yönetimi: `ns1.natrohost.com` / `ns2.natrohost.com`

---

## Eski hâle döndürmek için

Natro DNS panelinde şu iki kaydı eski değerine çevirmek yeterlidir:

```
A     @      94.73.145.212
A     www    94.73.145.212
```

Ayrıca depodaki `CNAME` dosyası silinir ve GitHub → Settings → Pages →
Custom domain alanı boşaltılır. DNS yayılımı 10 dakika ile birkaç saat
arasında sürer.

Eski sitenin sayfaları `yedek/eski-site/` klasöründe duruyor (7 sayfa, 140 KB).
Natro sunucusundaki dosyalar silinmediği sürece site zaten olduğu yerde kalır;
bu arşiv yalnız ek güvencedir.

---

## DEĞİŞMEYECEK KAYITLAR — mail bunlara bağlı

Aşağıdakilere **dokunulmaz**. Biri silinirse `info@herkim.com.tr` çalışmaz
hâle gelir ya da giden mailler spam'e düşer.

| Tür | Ad | Değer | Ne işe yarar |
|---|---|---|---|
| MX | @ | `10 mail.herkim.com.tr.` | Gelen mailin hangi sunucuya gideceği |
| A | mail | `85.97.197.8` | Mail sunucusunun kendisi |
| TXT | @ | `v=spf1 mx ip4:85.97.197.8 -all` | SPF — giden mailin sahte olmadığını kanıtlar |
| TXT | \_dmarc | `v=DMARC1; p=quarantine; rua=mailto:rua@herkim.com.tr; ruf=mailto:ruf@herkim.com.tr; sp=none; fo=1; ri=86400; adkim=r; aspf=r` | DMARC politikası |
| CNAME | autodiscover | `mail.kurumsaleposta.com.` | Outlook'un ayarları otomatik bulması |
| TXT | @ | `google-site-verification=s2e0cxDzgzDPl832ltjFgPDbiS2Mo01kPnq4mkz8zuU` | Google Search Console doğrulaması |

**Neden mail etkilenmiyor:** mail sunucusu (`85.97.197.8`) web sitesinden
(`94.73.145.212`) **ayrı bir makinede**. Web sitesinin A kaydını değiştirmek
mail akışına dokunmaz. SPF kaydındaki `mx` mekanizması MX kaydını gösterir,
MX de değişmediği için SPF geçerli kalır.

**Tehlike şurada:** apex alan adına (`@`) CNAME kaydı konulursa RFC 1034 gereği
o isimde başka hiçbir kayıt geçerli olamaz — MX ve TXT dâhil. Mail o anda
kesilir. Bu yüzden apex için **A kaydı** kullanılır, CNAME yalnız `www` için.

---

## Yapılacak değişiklik

Yalnız iki kayıt:

```
ESKİ:  A     @      94.73.145.212
YENİ:  A     @      185.199.108.153
       A     @      185.199.109.153
       A     @      185.199.110.153
       A     @      185.199.111.153

ESKİ:  A     www    94.73.145.212
YENİ:  CNAME www    ercepan.github.io.
```

GitHub adresleri 1 Eylül 2026'da `dig ercepan.github.io` ile doğrulandı,
belgeden ezbere alınmadı.

İsteğe bağlı IPv6 (AAAA, `@` için):
`2606:50c0:8000::153`, `2606:50c0:8001::153`,
`2606:50c0:8002::153`, `2606:50c0:8003::153`

---

## Değişiklikten sonra kontrol

```bash
dig +short herkim.com.tr          # 185.199.10x.153 dönmeli
dig +short herkim.com.tr MX       # 10 mail.herkim.com.tr.  DEĞİŞMEMELİ
dig +short herkim.com.tr TXT      # SPF ve Google doğrulaması DURMALI
dig +short mail.herkim.com.tr     # 85.97.197.8  DEĞİŞMEMELİ
```

**Mail testi:** DNS yayıldıktan sonra `info@herkim.com.tr` adresine dışarıdan
bir deneme maili atın ve geldiğini görün. Bir de o adresten dışarı mail atıp
spam'e düşmediğini kontrol edin. Bu ikisi yapılmadan geçiş tamamlanmış
sayılmaz.

---

Ham DNS çıktısı aynı klasördeki `dns-anlik-*.txt` dosyasındadır.
