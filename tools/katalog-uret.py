# Herkim Group ürün kataloğu PDF üretici — flyer'ın birebir vektörel kopyası
# Çalıştırma: repo kökünden `python3 tools/katalog-uret.py` (gereksinim: pip install cairosvg)
# Ürün listesi değişince LEFT/RIGHT listelerini güncelleyin.
import base64, cairosvg

W, H = 595.28, 841.89  # A4 pt
CR = "#A31C3C"; INK = "#1B1216"; TXT = "#262024"; MUT = "#4A4046"

eagle_b64 = base64.b64encode(open("pan/assets/img/pan-emblem.png", "rb").read()).decode()

LEFT = [
    ("ACIDS", ["Acetic Acid", "Acrylic Acid", "Citric Acid Monohydrate",
               "HEDP (Hydroxyethylidene Diphosphonic", "Acid)",
               "Formic Acid 85% (Luxi)", "Oxalic Acid", "Phosphoric Acid 85%", "Sulphuric Acid"]),
    ("ALCOHOLS & GLYCOLS", ["Butyl Glycol", "IPA (Isopropyl Alcohol)",
                            "MEG (Monoethylene Glycol)", "Mono Propylene Glycol (MPG)"]),
    ("AMMONIUM BASED PRODUCTS", ["Ammonium Bicarbonate", "Ammonium Chloride", "Ammonium Sulphate"]),
    ("LEATHER & TANNING CHEMICALS", ["Mimosa Powder (Tanac)", "Quebracho", "Saviotan A (Astringent)",
                                     "Saviotan RS (Sweetened)", "Tara Powder", "Valex (Valonia Extract)"]),
]
RIGHT = [
    ("SODIUM BASED CHEMICALS", ["Caustic Soda", "Nanocon (Povercon) – Sodium",
                                "Naphthalene Sulfonate (Light Colour)",
                                "Povercon 100 – Sodium Naphthalene", "Sulfonate",
                                "Sodium Bicarbonate", "Sodium Carbonate", "Sodium Formate",
                                "Sodium Sulphhydrate", "Sodium Hydrosulphite",
                                "Sodium Metabisulphite (TLG Grade)", "Sodium Percarbonate", "Sodium Sulphide"]),
    ("SOLVENTS & INDUSTRIAL CHEMICALS", ["Ammonia", "Butyl Acetate", "Crude Glycerine",
                                         "Diethanolamine (DEA)", "Magnesium Chloride Flakes",
                                         "Methylene Chloride", "Polyvinyl Alcohol (PVA)",
                                         "Potassium Chloride", "Soya Lecithin", "Triisobutyl Phosphate"]),
]

LH = 16.2      # satır yüksekliği
GAP = 15       # kategori arası ek boşluk
Y0 = 292       # liste başlangıcı

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def column(x, groups):
    out, y = [], Y0
    for head, items in groups:
        out.append(f'<text x="{x}" y="{y}" font-family="Helvetica" font-size="11.5" font-weight="bold" fill="{INK}" letter-spacing="0.2">{esc(head)}</text>')
        y += LH
        for it in items:
            out.append(f'<text x="{x}" y="{y}" font-family="Helvetica" font-size="10.6" fill="{TXT}">{esc(it)}</text>')
            y += LH
        y += GAP
    return "\n".join(out)

# HK logosu — sitedeki markanın birebiri (daire + HK + alt yazı)
logo = f'''
<g transform="translate(62,58)">
  <circle cx="52" cy="52" r="49" fill="#FFFFFF" stroke="{CR}" stroke-width="3.6"/>
  <g transform="translate(52,44) scale(0.245) translate(-160,-160)" fill="{CR}">
    <rect x="76" y="92" width="27" height="136"/><rect x="103" y="146" width="43" height="28"/><rect x="126" y="92" width="27" height="136"/>
    <polygon points="153,152 215,92 253,92 181,164"/><polygon points="153,166 179,142 255,228 217,228"/>
  </g>
  <text x="52" y="86" text-anchor="middle" font-family="Helvetica" font-size="8.6" font-weight="bold" fill="{CR}" letter-spacing="0.6">HERKİM GROUP</text>
</g>'''

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<rect width="{W}" height="{H}" fill="#FFFFFF"/>

<!-- PAN HOLDING filigranı (kartal + yazı) -->
<g opacity="0.09">
  <image x="{W/2-170}" y="330" width="340" height="340" xlink:href="data:image/png;base64,{eagle_b64}"/>
</g>
<text x="{W/2}" y="620" text-anchor="middle" font-family="Helvetica" font-size="58" font-weight="bold" fill="#8A8F94" opacity="0.22" letter-spacing="6">PAN</text>
<text x="{W/2}" y="672" text-anchor="middle" font-family="Helvetica" font-size="44" font-weight="bold" fill="#C51230" opacity="0.16" letter-spacing="10">HOLDING</text>

{logo}

<!-- Şirket künyesi -->
<g text-anchor="middle" font-family="Helvetica">
  <text x="392" y="88"  font-size="13.2" font-weight="bold" fill="{INK}">HERKİM GROUP KİMYEVİ MADDELER A.Ş.</text>
  <text x="392" y="110" font-size="11.4" fill="{MUT}">Deri OSB Mah. Pres Sok. No: 3</text>
  <text x="392" y="128" font-size="11.4" fill="{MUT}">Tuzla / İstanbul</text>
  <text x="392" y="146" font-size="11.4" fill="{MUT}">sales@herkimgroup.com</text>
  <text x="392" y="164" font-size="11.4" fill="{MUT}">+90 (216) 394 11 33 (Ext: 224)</text>
</g>

<!-- İnce ayraç -->
<line x1="62" y1="232" x2="{W-62}" y2="232" stroke="#E4DED6" stroke-width="1"/>
<text x="62" y="254" font-family="Helvetica" font-size="9.4" font-weight="bold" fill="{CR}" letter-spacing="2.4">PRODUCT LIST · ÜRÜN LİSTESİ · 2026</text>

{column(75, LEFT)}
{column(322, RIGHT)}

<text x="{W/2}" y="806" text-anchor="middle" font-family="Helvetica" font-size="11" fill="{MUT}">www.herkimgroup.com</text>
</svg>'''

cairosvg.svg2pdf(bytestring=svg.encode(), write_to="assets/docs/herkim-urun-katalogu-2026.pdf")
print("assets/docs/herkim-urun-katalogu-2026.pdf üretildi")
