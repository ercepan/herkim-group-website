#!/bin/sh
# Fiyat bekçisi — kaynak dosyaya fiyat/tutar verisi girmesini engeller.
# Neden: bu dosyalar GitHub Pages'e AYNEN iner ve depo PUBLIC'tir; commit
# edilen bir fiyat rakip için tek tıklık indirmedir ve geçmişten silinemez.
# Fiyat YALNIZCA çalışma zamanında (satış temsilcisinin girdiği teklif
# nesnesinde) yaşar; kaynağa/depoya asla yazılmaz.
# Kurulum: chmod +x tools/fiyat-bekcisi.sh && ln -s ../../tools/fiyat-bekcisi.sh .git/hooks/pre-commit
DOSYALAR="assets/js/data.js assets/js/portal-store.js assets/js/portal-app.js assets/js/main.js"

ALAN='(^|[^A-Za-z])(price|unitPrice|listPrice|birimFiyat|listeFiyat|fiyat|tutar|araToplam|subtotal|kdv|iskonto|discount|katsayi|marj)[[:space:]]*:'
RAKAM='[0-9]+([.,][0-9]+)?[[:space:]]*(TL|TRY|USD|EUR)([[:space:]]*/[[:space:]]*(kg|ton|lt|adet))?'
SEMBOL='[0-9]+([.,][0-9]+)?[[:space:]]*(₺|€)'

HATA=0
for f in $DOSYALAR; do
  [ -f "$f" ] || continue
  grep -nE "$ALAN"   "$f" && HATA=1
  grep -nE "$RAKAM"  "$f" && HATA=1
  grep -nE "$SEMBOL" "$f" && HATA=1
done

if [ $HATA -eq 1 ]; then
  echo ""
  echo "FİYAT BEKÇİSİ — COMMIT REDDEDİLDİ."
  echo "Kaynak dosyaya fiyat/tutar verisi yazılmış. Bu dosyalar GitHub Pages'e"
  echo "aynen iner ve depo PUBLIC'tir; commit edilen fiyat geri alınamaz."
  exit 1
fi
echo "Fiyat bekçisi: temiz."
exit 0
