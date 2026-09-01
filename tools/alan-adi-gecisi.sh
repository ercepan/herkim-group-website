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
for f in *.html robots.txt sitemap.xml; do
  [ -f "$f" ] || continue
  if grep -q "$ESKI" "$f"; then
    # sondaki / farkını da düzelt: .../herkim-group-website/ -> https://herkim.com.tr/
    sed -i '' "s|$ESKI|$YENI|g" "$f"
    DEGISEN=$((DEGISEN+1))
    echo "  güncellendi: $f"
  fi
done

echo "$ALAN" > CNAME
echo "CNAME dosyası yazıldı: $ALAN"

KALAN=$(grep -rl "ercepan.github.io" -- *.html robots.txt sitemap.xml 2>/dev/null || true)
if [ -n "$KALAN" ]; then
  echo ""
  echo "UYARI — hâlâ eski adres geçen dosyalar var:"
  echo "$KALAN"
  exit 1
fi

echo ""
echo "$DEGISEN dosya güncellendi, eski adres kalmadı."
echo "Şimdi: commit + push, sonra GitHub Pages ayarından özel alan adını girin."
