/* ============================================================
   HERKİM GROUP — Veri Katmanı
   Ürünler, kategoriler, duyurular, dokümanlar.
   NOT: Ürün listesi örnek/başlangıç veridir; kendi portföyünüze
   göre bu dosyayı düzenlemeniz yeterlidir — site otomatik güncellenir.
   Formül alanında rakamlar otomatik olarak alt simge (subscript) yazılır.
   ============================================================ */

const HK_CATS = {
  temel:   "Temel Kimyasallar",
  asit:    "Asitler",
  tuz:     "Tuzlar & Mineraller",
  yag:     "Yağlar & Yardımcılar",
  pigment: "Pigment & Dolgu",
  ozel:    "Özel Kimyasallar"
};

const HK_SECTORS = {
  deri:    "Deri & Tabaklama",
  tekstil: "Tekstil",
  su:      "Su Arıtma",
  gida:    "Gıda & Yem",
  tarim:   "Tarım & Gübre",
  insaat:  "İnşaat & Yapı",
  boya:    "Boya & Kaplama",
  kozmetik:"Kozmetik & Temizlik"
};

/* alan açıklaması:
   f: kısa formül (rakamlar alt simgeye çevrilir), cas: CAS numarası,
   cat: kategori anahtarı, sec: sektörler, pack: ambalaj, org: menşei,
   tag: "yeni" | "haftanin" | null */
const HK_PRODUCTS = [
  { id: 1,  name: "Sodyum Sülfür (Payet)",       f: "Na2S",        cas: "1313-82-2",  cat: "temel",   sec: ["deri","tekstil"],          pack: "25 kg torba",  org: "Türkiye",      tag: "haftanin" },
  { id: 2,  name: "Sodyum Sülfhidrat",           f: "NaHS",        cas: "16721-80-5", cat: "temel",   sec: ["deri"],                    pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 3,  name: "Boraks Dekahidrat",           f: "Na2B4O7",     cas: "1303-96-4",  cat: "tuz",     sec: ["insaat","tarim"],          pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 4,  name: "Borik Asit",                  f: "H3BO3",       cas: "10043-35-3", cat: "asit",    sec: ["insaat","tarim"],          pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 5,  name: "Formik Asit %85",             f: "HCOOH",       cas: "64-18-6",    cat: "asit",    sec: ["deri","tekstil"],          pack: "35 kg bidon",  org: "Almanya",      tag: "yeni" },
  { id: 6,  name: "Asetik Asit %80",             f: "CH3COOH",     cas: "64-19-7",    cat: "asit",    sec: ["deri","gida"],             pack: "30 kg bidon",  org: "Türkiye",      tag: null },
  { id: 7,  name: "Fosforik Asit %85",           f: "H3PO4",       cas: "7664-38-2",  cat: "asit",    sec: ["gida","tarim"],            pack: "35 kg bidon",  org: "Çin",          tag: null },
  { id: 8,  name: "Sülfürik Asit %98",           f: "H2SO4",       cas: "7664-93-9",  cat: "asit",    sec: ["su","tekstil"],            pack: "IBC / dökme",  org: "Türkiye",      tag: null },
  { id: 9,  name: "Oksalik Asit",                f: "C2H2O4",      cas: "144-62-7",   cat: "asit",    sec: ["deri","tekstil"],          pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 10, name: "Sitrik Asit Monohidrat",      f: "C6H8O7",      cas: "5949-29-1",  cat: "asit",    sec: ["gida","kozmetik"],         pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 11, name: "Amonyum Bikarbonat",          f: "NH4HCO3",     cas: "1066-33-7",  cat: "tuz",     sec: ["gida","deri"],             pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 12, name: "Amonyum Sülfat",              f: "(NH4)2SO4",   cas: "7783-20-2",  cat: "tuz",     sec: ["tarim","deri"],            pack: "50 kg torba",  org: "Türkiye",      tag: null },
  { id: 13, name: "Amonyum Klorür",              f: "NH4Cl",       cas: "12125-02-9", cat: "tuz",     sec: ["tekstil","tarim"],         pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 14, name: "Sodyum Format",               f: "HCOONa",      cas: "141-53-7",   cat: "tuz",     sec: ["deri","insaat"],           pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 15, name: "Sodyum Asetat",               f: "CH3COONa",    cas: "127-09-3",   cat: "tuz",     sec: ["deri","tekstil"],          pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 16, name: "Sodyum Metabisülfit",         f: "Na2S2O5",     cas: "7681-57-4",  cat: "tuz",     sec: ["deri","su"],               pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 17, name: "Sodyum Bikarbonat",           f: "NaHCO3",      cas: "144-55-8",   cat: "tuz",     sec: ["gida","kozmetik"],         pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 18, name: "Soda Külü (Hafif)",           f: "Na2CO3",      cas: "497-19-8",   cat: "temel",   sec: ["tekstil","su"],            pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 19, name: "Kostik Soda (Payet)",         f: "NaOH",        cas: "1310-73-2",  cat: "temel",   sec: ["tekstil","su","kozmetik"], pack: "25 kg torba",  org: "Türkiye",      tag: "haftanin" },
  { id: 20, name: "Potasyum Hidroksit",          f: "KOH",         cas: "1310-58-3",  cat: "temel",   sec: ["kozmetik","tarim"],        pack: "25 kg torba",  org: "Güney Kore",   tag: null },
  { id: 21, name: "Kalsiyum Klorür %94",         f: "CaCl2",       cas: "10043-52-4", cat: "tuz",     sec: ["insaat","su"],             pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 22, name: "Magnezyum Sülfat",            f: "MgSO4",       cas: "10034-99-8", cat: "tuz",     sec: ["tarim","gida"],            pack: "25 kg torba",  org: "Almanya",      tag: null },
  { id: 23, name: "Bazik Krom Sülfat",           f: "Cr(OH)SO4",   cas: "12336-95-7", cat: "temel",   sec: ["deri"],                    pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 24, name: "Sodyum Hidrosülfit",          f: "Na2S2O4",     cas: "7775-14-6",  cat: "temel",   sec: ["tekstil"],                 pack: "50 kg varil",  org: "Çin",          tag: null },
  { id: 25, name: "Hidrojen Peroksit %50",       f: "H2O2",        cas: "7722-84-1",  cat: "temel",   sec: ["tekstil","su"],            pack: "30 kg bidon",  org: "Türkiye",      tag: null },
  { id: 26, name: "Titanyum Dioksit (Rutil)",    f: "TiO2",        cas: "13463-67-7", cat: "pigment", sec: ["boya","kozmetik"],         pack: "25 kg torba",  org: "Çin",          tag: "yeni" },
  { id: 27, name: "Kaolin (Mikronize)",          f: "Al2Si2O5",    cas: "1332-58-7",  cat: "pigment", sec: ["boya","insaat"],           pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 28, name: "Kalsit (Mikronize)",          f: "CaCO3",       cas: "471-34-1",   cat: "pigment", sec: ["boya","insaat"],           pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 29, name: "Talk",                        f: "Mg3Si4O10",   cas: "14807-96-6", cat: "pigment", sec: ["boya","kozmetik"],         pack: "25 kg torba",  org: "Hindistan",    tag: null },
  { id: 30, name: "Çinko Oksit",                 f: "ZnO",         cas: "1314-13-2",  cat: "pigment", sec: ["boya","kozmetik","tarim"], pack: "25 kg torba",  org: "Türkiye",      tag: null },
  { id: 31, name: "Demir Oksit (Kırmızı)",       f: "Fe2O3",       cas: "1309-37-1",  cat: "pigment", sec: ["boya","insaat"],           pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 32, name: "Sülfite Balık Yağı",          f: "Yağ",         cas: "—",          cat: "yag",     sec: ["deri"],                    pack: "200 kg varil", org: "İtalya",       tag: null },
  { id: 33, name: "Sentetik Yağlama Yağı",       f: "Yağ",         cas: "—",          cat: "yag",     sec: ["deri","tekstil"],          pack: "200 kg varil", org: "İspanya",      tag: null },
  { id: 34, name: "Lanolin (Susuz)",             f: "Yağ",         cas: "8006-54-0",  cat: "yag",     sec: ["kozmetik","deri"],         pack: "50 kg varil",  org: "Yeni Zelanda", tag: null },
  { id: 35, name: "Parafin Likit",               f: "Yağ",         cas: "8012-95-1",  cat: "yag",     sec: ["kozmetik","tekstil"],      pack: "175 kg varil", org: "Türkiye",      tag: null },
  { id: 36, name: "Gliserin (USP %99,5)",        f: "C3H8O3",      cas: "56-81-5",    cat: "yag",     sec: ["kozmetik","gida"],         pack: "250 kg varil", org: "Malezya",      tag: "yeni" },
  { id: 37, name: "Propilen Glikol (USP)",       f: "C3H8O2",      cas: "57-55-6",    cat: "yag",     sec: ["kozmetik","gida"],         pack: "215 kg varil", org: "Almanya",      tag: null },
  { id: 38, name: "Mimoza Ekstraktı",            f: "Tanen",       cas: "1401-55-4",  cat: "ozel",    sec: ["deri"],                    pack: "25 kg torba",  org: "Brezilya",     tag: null },
  { id: 39, name: "Kebrako Ekstraktı",           f: "Tanen",       cas: "—",          cat: "ozel",    sec: ["deri"],                    pack: "25 kg torba",  org: "Arjantin",     tag: null },
  { id: 40, name: "Yağ Alma Ajanı (Degreaser)",  f: "Karışım",     cas: "—",          cat: "ozel",    sec: ["deri","tekstil"],          pack: "120 kg varil", org: "Türkiye",      tag: null },
  { id: 41, name: "Sodyum Perkarbonat",          f: "Na2CO3·H2O2", cas: "15630-89-4", cat: "temel",   sec: ["kozmetik","tekstil"],      pack: "25 kg torba",  org: "Çin",          tag: null },
  { id: 42, name: "Üre (Teknik)",                f: "CH4N2O",      cas: "57-13-6",    cat: "tuz",     sec: ["tarim","insaat"],          pack: "50 kg torba",  org: "Türkiye",      tag: null },
  { id: 43, name: "Polialüminyum Klorür",        f: "PAC",         cas: "1327-41-9",  cat: "ozel",    sec: ["su"],                      pack: "30 kg bidon",  org: "Türkiye",      tag: "yeni" },
  { id: 44, name: "Demir (III) Klorür %40",      f: "FeCl3",       cas: "7705-08-0",  cat: "ozel",    sec: ["su"],                      pack: "IBC / dökme",  org: "Türkiye",      tag: null }
];

const HK_NEWS = [
  {
    date: "2026-07-01", tag: "Ürün",
    title: "Su arıtma kimyasalları ürün grubumuz yayında",
    body: "PAC, demir (III) klorür ve yardımcı koagülantlardan oluşan yeni ürün grubumuz stoklarımızda. Belediye ve OSB arıtma tesisleri için özel tedarik programı sunuyoruz.",
    href: "urunler.html"
  },
  {
    date: "2026-06-15", tag: "Duyuru",
    title: "Temmuz 2026 fiyat listesi güncellendi",
    body: "Döviz kurları ve navlun maliyetlerindeki değişimler doğrultusunda güncellenen fiyat listemizi satış ekibimizden talep edebilirsiniz.",
    href: "iletisim.html"
  },
  {
    date: "2026-05-28", tag: "Kurumsal",
    title: "KKDİK kayıt süreçlerimiz tamamlandı",
    body: "Portföyümüzdeki tüm kayıt kapsamı ürünler için KKDİK yükümlülüklerimizi tamamladık. Güncel kayıt belgelerine Doküman Merkezi'nden ulaşabilirsiniz.",
    href: "dokumanlar.html"
  },
  {
    date: "2026-04-10", tag: "Operasyon",
    title: "Yeni depo ve dolum tesisimiz devrede",
    body: "Artan hacmimize paralel olarak devreye aldığımız ek depomuz ile sevkiyat sürelerimiz kısaldı; Marmara bölgesinde 24 saat içinde teslimat hedefliyoruz.",
    href: "duyurular.html"
  },
  {
    date: "2026-03-02", tag: "Duyuru",
    title: "Ramazan Bayramı çalışma takvimi",
    body: "Bayram süresince sipariş ve sevkiyat planlaması için satış temsilcinizle önceden iletişime geçmenizi rica ederiz. Acil talepler için WhatsApp hattımız açık kalacaktır.",
    href: "duyurular.html"
  },
  {
    date: "2026-02-11", tag: "Ürün",
    title: "Gıda ve kozmetik sınıfı gliserin stoklarda",
    body: "USP kalitesinde %99,5 gliserin ve propilen glikol düzenli stok programımıza alınmıştır. Analiz sertifikaları ürün sayfasından talep edilebilir.",
    href: "urunler.html"
  }
];

const HK_DOCS = [
  { ext: "PDF", title: "Ürün Kataloğu 2026",            desc: "Tüm ürün gruplarımız, ambalaj seçenekleri ve sektör uygulamaları ile birlikte.",                    meta: "v2026.2 · 8,4 MB",     cat: "katalog" },
  { ext: "PDF", title: "Genel Fiyat Listesi",           desc: "Güncel fiyat listemiz kayıtlı müşterilerimizle paylaşılır; talep formu ile isteyebilirsiniz.",      meta: "Aylık güncellenir",    cat: "katalog" },
  { ext: "PDF", title: "TDS — Teknik Veri Sayfaları",   desc: "Ürün bazlı teknik özellikler, analiz değerleri ve uygulama önerileri.",                             meta: "Ürün başına · TR/EN",  cat: "teknik" },
  { ext: "PDF", title: "SDS — Güvenlik Bilgi Formları", desc: "GHS/CLP uyumlu güvenlik bilgi formları; taşıma, depolama ve acil durum bilgileri.",                 meta: "Ürün başına · TR/EN",  cat: "teknik" },
  { ext: "PDF", title: "ISO 9001:2015 Sertifikası",     desc: "Kalite yönetim sistemi sertifikamızın güncel kopyası.",                                             meta: "Geçerlilik: 2027",     cat: "sertifika" },
  { ext: "PDF", title: "KKDİK Kayıt Belgeleri",         desc: "Kayıt kapsamındaki ürünlerimize ait KKDİK ön-kayıt ve kayıt belgeleri.",                            meta: "Ürün bazlı",           cat: "sertifika" },
  { ext: "ZIP", title: "Kurumsal Kimlik Kiti",          desc: "Logo (SVG/PNG), renk paleti, tipografi ve kullanım kuralları — basılı ve dijital işler için.",      meta: "Logo + kılavuz",       cat: "marka" },
  { ext: "PDF", title: "Şirket Tanıtım Sunumu",         desc: "Herkim Group'u tanıtan kurumsal sunum; tedarikçi değerlendirme dosyalarınız için.",                 meta: "16 sayfa · TR",        cat: "marka" },
  { ext: "PDF", title: "KVKK Aydınlatma Metni",         desc: "Kişisel verilerin korunmasına ilişkin aydınlatma metnimiz.",                                        meta: "Hukuki",               cat: "hukuki" }
];

/* Döviz kuru yedek değerleri (çevrimdışı gösterim) */
const HK_RATES_FALLBACK = { usd: 41.24, eur: 48.67, updated: "kapanış" };
