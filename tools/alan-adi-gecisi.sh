#!/usr/bin/env bash
# ============================================================
# ALAN ADI GEÇİŞİ — github.io  ->  herkim.com.tr
#
# Sitenin adresi 59'dan fazla yerde yazılı: canonical, og:url,
# sitemap, robots.txt ve JSON-LD. Elle değiştirmek birini atlamaya
# davetiye; atlanan canonical Google'a "asıl adres eski yer" der ve
# yeni alan adı indekslenmez.
#
# SIRA ÖNEMLİ. Bu betiği DNS HAZIR OLMADAN çalıştırmayın:
#   1) Natro panelinde CNAME kaydı:  herkim.com.tr -> ercepan.github.io.
#      (apex alan adına CNAME KONULMAZ — MX/SPF kayıtlarını öldürür.
#       Apex için GitHub'ın A/AAAA adresleri kullanılır.)
#   2) DNS yayılınca bu betik:  bash tools/alan-adi-gecisi.sh
#   3) commit + push
#   4) GitHub → Settings → Pages → Custom domain: herkim.com.tr
#      ve "Enforce HTTPS" işaretlenir (sertifika birkaç dakikada gelir)
#
# CNAME dosyası bu betikle oluşur. DNS hazır değilken depoya CNAME
# koymak github.io adresini de kırar — site tamamen erişilemez olur.
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

ESKI="https://ercepan.github.io/herkim-group-website"
YENI="https://herkim.com.tr"
ALAN="herkim.com.tr"

echo "Adres değiştiriliyor:  $ESKI  ->  $YENI"
DEGISEN=0
# KAPSAM — adres yalnız HTML'lerde değil:
#   tools/sema-uret.py   SITE_KOK sabiti. Şema üretici her fiyat/SSS
#                        güncellemesinde çalışıyor; atlanırsa geçişten sonraki
#                        ilk çalıştırma JSON-LD'ye ESKİ adresi geri yazar.
#   notify/templates.ts  müşteriye giden e-postaların içindeki bağlantılar.
#                        Atlanırsa mailler ölü adrese götürür.
#   emails/onizleme/     yukarıdakinin önizleme çıktıları.
#   README.md            kurulum belgesi.
#
# pan/ BİLEREK DIŞARIDA: başka bir şirketin (Pan Holding) sitesi, bizim alan
# adımızla ilgisi yok. Bu betiğin kendisi de dışarıda — arama metnini
# değişken olarak taşıyor, kendini düzeltmeye kalkarsa bozulur.
DOSYALAR=$(ls *.html robots.txt sitemap.xml README.md 2>/dev/null)
DOSYALAR="$DOSYALAR tools/sema-uret.py"
DOSYALAR="$DOSYALAR herkim-backend/supabase/functions/notify/templates.ts"
DOSYALAR="$DOSYALAR $(ls herkim-backend/emails/onizleme/*.html 2>/dev/null)"

for f in $DOSYALAR; do
  [ -f "$f" ] || continue
  if grep -q "$ESKI" "$f"; then
    # sondaki / farkını da düzelt: .../herkim-group-website/ -> https://herkim.com.tr/
    # sed -i '' yalnız macOS/BSD sözdizimidir; GNU sed'de (Linux) boş '' ayrı
    # bir argüman sayılır ve komut kırılır. -i.bak iki tarafta da çalışır.
    sed -i.bak "s|$ESKI|$YENI|g" "$f" && rm -f "$f.bak"
    DEGISEN=$((DEGISEN+1))
    echo "  güncellendi: $f"
  fi
done

echo "$ALAN" > CNAME
echo "CNAME dosyası yazıldı: $ALAN"

# Bekçi TÜM depoyu tarar, yalnız yukarıdaki listeyi değil: ileride başka bir
# dosyaya adres yazılırsa sessizce hayatta kalmasın, burada patlasın.
#
# Aranan şey ESKI SITE ADRESİ ("$ESKI"), çıplak "ercepan.github.io" DEĞİL.
# Fark önemli: README'deki  CNAME www  ercepan.github.io.  satırı DNS kaydının
# kendisidir, www alt alanı GitHub'a bu isimle bağlanır ve DEĞİŞMEMELİDİR.
# Çıplak ana bilgisayar adını arasaydık bekçi o satıra takılıp geçişi
# başarısız sayardı.
#
# pan/ ve bu betiğin kendisi hariç (yukarıdaki açıklamaya bakın).
KALAN=$(grep -rl "$ESKI" . \
          --exclude-dir=.git --exclude-dir=pan \
          --exclude="*.bak" --exclude="alan-adi-gecisi.sh" 2>/dev/null || true)
if [ -n "$KALAN" ]; then
  echo ""
  echo "UYARI — hâlâ eski adres geçen dosyalar var:"
  echo "$KALAN"
  exit 1
fi

echo ""
echo "$DEGISEN dosya güncellendi, eski adres kalmadı."
echo "Şimdi: commit + push, sonra GitHub Pages ayarından özel alan adını girin."
