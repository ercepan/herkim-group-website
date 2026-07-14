/* ============================================================
   PAN HOLDING — Çok Dilli Sözlük ve Motor (TR / EN / RU)
   Kullanım: data-i18n (metin), data-i18n-ph (placeholder),
   data-i18n-title / data-i18n-aria (nitelik). Tercih: localStorage "pan_lang".
   Şablonlu metinlerde {x} yer tutucuları kod tarafında doldurulur.
   Güvenlik: innerHTML kullanılmaz.
   ============================================================ */

var PAN_I18N = {
  tr: {
    steps: ["Sipariş Alındı", "Üretimde", "Kalite Kontrol", "Sevkiyatta", "Teslim Edildi"],
    "st.s0": "Sipariş Alındı", "st.s1": "Üretimde", "st.s2": "Kalite Kontrol", "st.s3": "Sevkiyatta", "st.s4": "Teslim Edildi",

    "nav.corp": "Kurumsal", "nav.cos": "Şirketler", "nav.prod": "Üretim",
    "nav.sust": "Sürdürülebilirlik", "nav.news": "Haberler",
    "nav.portal": "Müşteri Portalı", "nav.contact": "İletişim", "nav.close": "KAPAT ×",

    "hero.kicker": "1975'TEN BU YANA",
    "hero.t1": "İhtiyaçlarınıza uygun ", "hero.t2": "çözümler.",
    "hero.lead": "Sizin için değer yaratmak, talep ve gereksinimlerinizi en üst düzeyde karşılamak için varız. Deri ve kimya sanayiinde üretim, kalite ve teknik servisi tek çatı altında buluşturuyoruz.",
    "hero.b1": "Grup şirketlerimiz", "hero.b2": "Bizi tanıyın",
    "hero.stat": "bölgede uygulama laboratuvarı",
    "hero.alt": "Pan Holding tesisi — Herkim, Farben ve Helsa",

    "strip.label": "GRUP ŞİRKETLERİ & MARKALARIMIZ",

    "about.kicker": "PAN HOLDİNG KİMDİR?",
    "about.title": "Kalite, süreklilik ve güvenirlik üzerine kurulu bir sanayi grubu",
    "about.p1": "Herkim Şirketler Grubu, ana firması Herkim Kimya ile birlikte 1975 yılında, Türkiye'de deri sektörünün modernizasyon döneminde İstanbul–Kazlıçeşme'deki ünlü deri sanayi bölgesinde kuruldu.",
    "about.p2": "1997'de üretim firması Farben Kimya'yı hayata geçirerek deri kimyasalları, tekstil kimyasalları, boya ve binder gruplarında üretim ve satışa; ardından inşaat, matbaa ve polimer sektörlerine genişledi. Bugün başta Rusya ve Ukrayna olmak üzere 10 ülkeye ihracat yapıyor.",
    "about.f1t": "Üretim Teknolojisi", "about.f1d": "İleri teknoloji, bilgisayar kontrollü ekipmanlar.",
    "about.f2t": "Çevreye Saygı", "about.f2d": "İnsan ve çevre dostu, su bazlı ürünler.",
    "about.alt": "Deri atölyesinde el işçiliği",

    "stats.s1": "Kuruluş yılı", "stats.s2": "Bölgede uygulama laboratuvarı",
    "stats.s3": "Ülkeye ihracat", "stats.s4": "Farben fabrika alanı",

    "cos.kicker": "GRUP ŞİRKETLERİMİZ", "cos.title": "Tek çatı, üç uzmanlık",
    "cos.d1": "1975'ten bu yana deri kimyasallarının tüm ürün gruplarını teknik servisiyle sunar. 12 satış noktasıyla sektörde lider konumdadır.",
    "cos.d2": "1972'den beri finisaj kimyasalları üretir. Tuzla OSB'de 15.000 m² arazi, 8.000 m² fabrika; AR-GE ile çevre dostu kimyasallar geliştirir.",
    "cos.d3": "Grup bünyesinde deri ve tekstil kimyasalları alanında faaliyet gösteren, uluslararası pazarlara yönelen kardeş markadır.",
    "cos.l3": "İletişime geçin →",

    "br.kicker": "MARKALARIMIZ & İŞ ORTAKLARIMIZ",
    "br.title": "Her ürün grubu için uzmanlaşmış markalar",
    "br.side": "Farben, ürün gruplarına göre yarattığı markaları ve uzman ekipleriyle yurtiçi ve yurtdışında hizmet verir.",
    "br.p1": "Deri finisaj ürün ailesi", "br.p2": "Deri ve tekstil kimyasalları",
    "br.p3": "Leather — premium seri", "br.other": "ve grup bünyesindeki diğer markalar",

    "pr.kicker": "ÜRETİM TEKNOLOJİSİ",
    "pr.title": "Tekrarlanabilir kalite, ölçülebilir hassasiyet",
    "pr.lead": "İleri teknoloji, bilgisayar kontrollü ekipmanlar ve eğitimli iş gücüyle \"exproof\" bir ortamda, işçi sağlığı ve güvenliğiyle özdeşleşmiş üretim yapıyoruz.",
    "pr.s1t": "ISO 9001 mantığı", "pr.s1d": "Hassasiyet ve tekrarlanabilirlik maksimize edilerek insan kaynaklı hatalar en aza indirilir.",
    "pr.s2t": "Kalite kontrol laboratuvarları", "pr.s2d": "Üretim sırasında alınan ara numuneler test edilerek proses kontrol altında tutulur.",
    "pr.alt": "Renkli deri ruloları",

    "eco.kicker": "ÇEVREYE SAYGI",
    "eco.title": "Odağında çevre ve insan olan bir üretim anlayışı",
    "eco.lead": "Üretiminden kullanımına kadar tüm ürünlerimizin insan ve çevre dostu olmasına özen gösteriyoruz. Kullanılan hammaddelerin parçalanabilir ve Dünya Sağlık Teşkilatı limitlerine uygun olmasına dikkat ediyoruz.",
    "eco.c1t": "Su bazlı", "eco.c1d": "Üretimimizin çok büyük bir kısmını su bazlı ürünler oluşturur.",
    "eco.c2t": "Üçlü Sorumluluk", "eco.c2d": "Kuruluşundan bu yana benimsenmiş ve resmen onaylanmış bir taahhüt.",
    "eco.c3t": "Arıtma", "eco.c3d": "Son teknoloji arıtma sistemine sahip İstanbul Organize Deri Sanayi Bölgesi.",

    "val.kicker": "İLKE VE DEĞERLERİMİZ",
    "val.title": "Değer yaratmak, güvenle sürdürmek",
    "val.lead": "Müşteriler için değer yaratmak, talep ve gereksinimlerini en üst düzeyde karşılamak, kaliteli ürün ve hizmet sağlamak ve istikrarlı politikalar izlemek temel yaklaşımımızdır.",
    "val.1": "Müşteri Memnuniyeti", "val.2": "Dürüstlük", "val.3": "Süreklilik", "val.4": "Kalite",
    "val.5": "Açıklık", "val.6": "Ekip Çalışması", "val.7": "Sosyal Sorumluluk", "val.8": "Güvenilirlik",

    "pp.kicker": "MÜŞTERİ PORTALI · YENİ",
    "pp.t1": "Siparişiniz hangi aşamada?", "pp.t2": "Bir bakışta",
    "pp.lead": "Yetkilendirilmiş müşterilerimiz ve satış ekibimiz; siparişleri, teslimat durumunu ve talep geçmişini artık doğrudan web üzerinden takip ediyor.",
    "pp.f1": "7/24 sipariş ve teslimat durumu takibi — üretimden teslimata adım adım",
    "pp.f2": "Yeni talepler anında satış temsilcinizin CRM kartına düşer",
    "pp.f3": "Sipariş belgeleri ve görüşme geçmişi tek ekranda",
    "pp.btn": "Portala giriş yapın",
    "pp.note": "* Demo sürüm — örnek verilerle canlı olarak deneyebilirsiniz.",
    "pp.live": "CANLI DURUM",
    "pp.s1": "🔐 Yetki bazlı erişim", "pp.s2": "🛡 KVKK uyumlu", "pp.s3": "⏱ Otomatik oturum sonlandırma",

    "nw.kicker": "SON GELİŞMELER", "nw.title": "Bizden haberler",
    "nw.all": "Tüm haberler →", "nw.tag": "FUAR",
    "nw.1t": "Leather Fair India", "nw.1d": "Pan Holding, Hindistan'daki yoğun katılımlı fuarda yerini aldı.",
    "nw.2t": "Leather Fair İstanbul", "nw.2d": "İstanbul'daki fuarda yeni ürün gruplarımızı ziyaretçilerle buluşturduk.",
    "nw.3t": "Uluslararası Deri Fuarı", "nw.3d": "Global sektör fuarlarını yakından takip ederek son trendleri müşterilerimize taşıyoruz.",

    "ct.kicker": "İLETİŞİM", "ct.title": "Bir mesaj kadar yakınız",
    "ct.l1": "TELEFON", "ct.l2": "WHATSAPP", "ct.l2v": "Mesaj gönderin →",
    "ct.l3": "E-POSTA", "ct.l4": "ADRES", "ct.l5": "ÇALIŞMA SAATLERİ",
    "ct.hours": "Hafta içi 08:30 – 17:30",
    "ct.addr": "İstanbul Deri OSB, Pres Sokak No:3, Tuzla — İstanbul",

    "nb.title": "E-Bülten Aboneliği",
    "nb.lead": "Bizimle ilgili haberleri ilk siz öğrenmek isterseniz e-bültenimize abone olun.",
    "nb.ph1": "Ad Soyad", "nb.ph2": "E-posta adresiniz", "nb.btn": "Abone ol",
    "nb.ok": "E-bülten kaydınız alındı. Teşekkürler!", "nb.err": "Geçerli bir e-posta adresi girin.",

    "ft.desc": "1975'ten bu yana deri ve kimya sanayiinde üretim, kalite ve teknik servisi tek çatı altında buluşturan sanayi grubu.",
    "ft.corp": "KURUMSAL", "ft.l1": "Pan Holding Kimdir", "ft.l2": "Şirketlerimiz",
    "ft.l3": "Üretim Teknolojisi", "ft.l4": "Çevreye Saygı", "ft.l5": "Müşteri Portalı",
    "ft.contact": "İLETİŞİM",
    "ft.rights": "© 2026 Pan Holding. Tüm hakları saklıdır.",
    "ft.kvkk": "KVKK", "ft.terms": "Kullanıcı Sözleşmesi", "ft.cookie": "Çerez Politikası",

    "wa.msg": "Merhaba, Pan Holding web sitesinden ulaşıyorum. Bilgi almak istiyorum.",
    "wa.title": "WhatsApp ile yazın",

    /* ---- PORTAL ---- */
    "lg.h1a": "Siparişiniz nerede?", "lg.h1b": "Gece yarısı bile görün.",
    "lg.lead": "Yetkilendirilmiş müşterilerimiz sipariş ve teslimat durumunu izler, talep açar; her talep anında satış temsilcisinin CRM kartına düşer.",
    "lg.back": "← panholding.com.tr'ye dön",
    "lg.title": "Portala giriş", "lg.sub": "Sipariş takibi ve talepleriniz için oturum açın.",
    "lg.mail": "E-POSTA", "lg.pass": "ŞİFRE", "lg.passDemo": "(demo: demo1234)",
    "lg.btn": "Giriş yap",
    "lg.errWrong": "E-posta veya şifre hatalı. ({n}/3 deneme)",
    "lg.errLock": "Çok fazla hatalı deneme. Güvenlik için giriş {s} sn kilitlendi.",
    "lg.s1": "🔐 Yetki bazlı erişim", "lg.s2": "⏱ 15 dk hareketsizlikte çıkış",
    "lg.s3": "🚫 3 hatalı girişte kilit", "lg.s4": "🛡 KVKK uyumlu",
    "lg.demoT": "Demo sürüm — tek tıkla farklı rollerle deneyin:",
    "lg.demo1": "👤 Müşteri olarak gir (Derim Deri A.Ş.)",
    "lg.demo2": "💼 Satış temsilcisi olarak gir",
    "lg.waHelp": "💬 Giriş sorunu mu var? WhatsApp destek hattına yazın",

    "sb.portal": "PORTAL", "sb.dash": "⬛ Özet", "sb.orders": "📦 Siparişlerim",
    "sb.reqs": "📝 Taleplerim", "sb.hist": "🗂 Görüşme Geçmişi", "sb.inbox": "📥 Gelen Talepler",
    "sb.logout": "↩ Çıkış yap", "sb.last": "Son giriş: ",

    "tp.crumb": "PAN HOLDİNG · MÜŞTERİ PORTALI · ", "tp.newReq": "+ Yeni Talep",
    "tp.badge": "DEMO ORTAMI",
    "t.dash": "Özet", "t.orders": "Siparişlerim", "t.ordersAll": "Siparişler (Tüm Müşteriler)",
    "t.reqs": "Taleplerim", "t.hist": "Görüşme Geçmişi", "t.scopeAll": "Tüm müşteriler",

    "k.active": "Aktif sipariş", "k.ship": "Sevkiyatta", "k.open": "Açık talep", "k.done": "Tamamlanan (2026)",

    "p.recent": "Son siparişler", "p.all": "Tümünü gör →", "p.orders": "Siparişler",
    "p.searchPh": "Sipariş no / ürün ara…", "p.stAll": "Tüm durumlar",
    "th.order": "SİPARİŞ", "th.cust": " / MÜŞTERİ", "th.items": "KALEMLER", "th.date": "TARİH",
    "th.status": "DURUM", "th.prog": "İLERLEME", "th.eta": "TAHMİNİ TESLİM", "th.prod": "ÜRÜN",
    "p.none": "Kayıt bulunamadı.",

    "cn.dashB": "Entegre çalışır:",
    "cn.dashT": " Bu portal gerçek kurulumda Akıllı CRM ve Logo Tiger'a bağlanır — siparişler, stok ve cari veriler otomatik akar; talepler satış temsilcisinin CRM kartına düşer.",
    "cn.histB": "CRM'den gelir:",
    "cn.histT": " Telefon, e-posta, WhatsApp ve saha ziyaretleri tek müşteri kartında toplanır; temsilciniz değişse bile geçmişiniz kaybolmaz.",

    "rq.new": "Yeni talep oluştur", "rq.chip": "Anında CRM'e düşer",
    "rq.subj": "KONU", "rq.subjPh": "örn. Numune talebi — su bazlı top coat",
    "rq.det": "DETAY", "rq.detPh": "İhtiyacınızı kısaca anlatın; miktar ve termin varsa ekleyin.",
    "rq.send": "Talebi gönder",
    "rq.open": "Açık", "rq.crm": "CRM'e iletildi", "rq.ans": "Yanıtlandı",
    "rq.none": "Henüz talep yok.",

    "dw.status": "SİPARİŞ DURUMU", "dw.items": "KALEMLER", "dw.ship": "SEVKİYAT & TEMSİLCİ",
    "dw.carrier": "NAKLİYE", "dw.track": "TAKİP NO", "dw.eta": "TAHMİNİ TESLİM",
    "dw.rep": "SATIŞ TEMSİLCİNİZ", "dw.docs": "BELGELER", "dw.close": "KAPAT ×",
    "dw.cont": "Devam ediyor…", "dw.orderDate": " · Sipariş tarihi ",

    "to.reqOk": "Talebiniz alındı ve CRM'e iletildi ✓",
    "to.reqErr": "Lütfen konu ve detay girin.",
    "to.doc": "Demo: {d} belgesi gerçek sistemde Logo Tiger'dan gelir.",
    "to.sysReply": "Talebiniz satış temsilciniz {rep}'in CRM kartına düştü. En kısa sürede dönüş yapılacak.",
    "to.sysBy": "Sistem", "to.now": "şimdi"
  },

  en: {
    steps: ["Order Received", "In Production", "Quality Control", "In Transit", "Delivered"],
    "st.s0": "Order Received", "st.s1": "In Production", "st.s2": "Quality Control", "st.s3": "In Transit", "st.s4": "Delivered",

    "nav.corp": "Corporate", "nav.cos": "Companies", "nav.prod": "Production",
    "nav.sust": "Sustainability", "nav.news": "News",
    "nav.portal": "Customer Portal", "nav.contact": "Contact", "nav.close": "CLOSE ×",

    "hero.kicker": "SINCE 1975",
    "hero.t1": "Solutions built around ", "hero.t2": "your needs.",
    "hero.lead": "We exist to create value for you and to meet your demands at the highest level. We bring production, quality and technical service together under one roof in the leather and chemical industries.",
    "hero.b1": "Our group companies", "hero.b2": "Get to know us",
    "hero.stat": "application laboratories across regions",
    "hero.alt": "Pan Holding facility — Herkim, Farben and Helsa",

    "strip.label": "GROUP COMPANIES & BRANDS",

    "about.kicker": "WHO IS PAN HOLDING?",
    "about.title": "An industrial group built on quality, continuity and reliability",
    "about.p1": "Herkim Group was founded in 1975, together with its parent company Herkim Kimya, in Istanbul's famous Kazlıçeşme leather district during the modernization era of the Turkish leather industry.",
    "about.p2": "In 1997 it launched its manufacturing company Farben Kimya, moving into the production and sale of leather chemicals, textile chemicals, dyes and binders, later expanding into construction, printing and polymer sectors. Today it exports to 10 countries, led by Russia and Ukraine.",
    "about.f1t": "Production Technology", "about.f1d": "Advanced technology, computer-controlled equipment.",
    "about.f2t": "Respect for the Environment", "about.f2d": "Human- and eco-friendly, water-based products.",
    "about.alt": "Craftsmanship in a leather workshop",

    "stats.s1": "Year founded", "stats.s2": "Application laboratories across regions",
    "stats.s3": "Export countries", "stats.s4": "Farben factory area",

    "cos.kicker": "OUR GROUP COMPANIES", "cos.title": "One roof, three specialties",
    "cos.d1": "Since 1975, it has offered every product group of leather chemicals with technical service. A sector leader with 12 sales points.",
    "cos.d2": "Producing finishing chemicals since 1972. 15,000 m² of land and an 8,000 m² factory in Tuzla OSB; develops eco-friendly chemicals through R&D.",
    "cos.d3": "A sister brand within the group operating in leather and textile chemicals, focused on international markets.",
    "cos.l3": "Get in touch →",

    "br.kicker": "OUR BRANDS & PARTNERS",
    "br.title": "Specialized brands for every product group",
    "br.side": "Farben serves at home and abroad with the brands it created per product group and its expert teams.",
    "br.p1": "Leather finishing family", "br.p2": "Leather and textile chemicals",
    "br.p3": "Leather — premium series", "br.other": "and other brands within the group",

    "pr.kicker": "PRODUCTION TECHNOLOGY",
    "pr.title": "Repeatable quality, measurable precision",
    "pr.lead": "With advanced technology, computer-controlled equipment and a trained workforce, we manufacture in an \"exproof\" environment synonymous with occupational health and safety.",
    "pr.s1t": "ISO 9001 mindset", "pr.s1d": "Precision and repeatability are maximized to minimize human error.",
    "pr.s2t": "Quality control laboratories", "pr.s2d": "In-process samples are tested to keep production under control.",
    "pr.alt": "Colorful leather rolls",

    "eco.kicker": "RESPECT FOR THE ENVIRONMENT",
    "eco.title": "A production approach centered on people and the environment",
    "eco.lead": "From production to use, we make sure all our products are human- and eco-friendly. We take care that raw materials are biodegradable and within World Health Organization limits.",
    "eco.c1t": "Water-based", "eco.c1d": "The vast majority of our production consists of water-based products.",
    "eco.c2t": "Responsible Care", "eco.c2d": "A commitment embraced and officially endorsed since our founding.",
    "eco.c3t": "Treatment", "eco.c3d": "Istanbul Organized Leather Industrial Zone with a state-of-the-art treatment system.",

    "val.kicker": "PRINCIPLES & VALUES",
    "val.title": "Creating value, sustaining it with trust",
    "val.lead": "Creating value for customers, meeting their demands at the highest level, providing quality products and services, and following consistent policies is our core approach.",
    "val.1": "Customer Satisfaction", "val.2": "Integrity", "val.3": "Continuity", "val.4": "Quality",
    "val.5": "Transparency", "val.6": "Teamwork", "val.7": "Social Responsibility", "val.8": "Reliability",

    "pp.kicker": "CUSTOMER PORTAL · NEW",
    "pp.t1": "Where is your order?", "pp.t2": "At a glance",
    "pp.lead": "Our authorized customers and sales team now track orders, delivery status and request history directly on the web.",
    "pp.f1": "24/7 order and delivery tracking — step by step from production to delivery",
    "pp.f2": "New requests instantly land on your sales rep's CRM card",
    "pp.f3": "Order documents and conversation history on a single screen",
    "pp.btn": "Sign in to the portal",
    "pp.note": "* Demo version — try it live with sample data.",
    "pp.live": "LIVE STATUS",
    "pp.s1": "🔐 Role-based access", "pp.s2": "🛡 GDPR/KVKK compliant", "pp.s3": "⏱ Automatic session timeout",

    "nw.kicker": "LATEST NEWS", "nw.title": "News from us",
    "nw.all": "All news →", "nw.tag": "FAIR",
    "nw.1t": "Leather Fair India", "nw.1d": "Pan Holding took its place at the well-attended fair in India.",
    "nw.2t": "Leather Fair Istanbul", "nw.2d": "We introduced our new product groups to visitors at the Istanbul fair.",
    "nw.3t": "International Leather Fair", "nw.3d": "We closely follow global industry fairs, bringing the latest trends to our customers.",

    "ct.kicker": "CONTACT", "ct.title": "As close as a message",
    "ct.l1": "PHONE", "ct.l2": "WHATSAPP", "ct.l2v": "Send a message →",
    "ct.l3": "E-MAIL", "ct.l4": "ADDRESS", "ct.l5": "WORKING HOURS",
    "ct.hours": "Weekdays 08:30 – 17:30",
    "ct.addr": "Istanbul Leather OIZ, Pres Sokak No:3, Tuzla — Istanbul",

    "nb.title": "Newsletter",
    "nb.lead": "Subscribe to our newsletter to be the first to hear our news.",
    "nb.ph1": "Full name", "nb.ph2": "Your e-mail address", "nb.btn": "Subscribe",
    "nb.ok": "You're subscribed. Thank you!", "nb.err": "Please enter a valid e-mail address.",

    "ft.desc": "An industrial group uniting production, quality and technical service in the leather and chemical industries under one roof since 1975.",
    "ft.corp": "CORPORATE", "ft.l1": "Who is Pan Holding", "ft.l2": "Our Companies",
    "ft.l3": "Production Technology", "ft.l4": "Respect for the Environment", "ft.l5": "Customer Portal",
    "ft.contact": "CONTACT",
    "ft.rights": "© 2026 Pan Holding. All rights reserved.",
    "ft.kvkk": "Privacy", "ft.terms": "Terms of Use", "ft.cookie": "Cookie Policy",

    "wa.msg": "Hello, I'm reaching out via the Pan Holding website. I'd like some information.",
    "wa.title": "Message us on WhatsApp",

    "lg.h1a": "Where is your order?", "lg.h1b": "See it even at midnight.",
    "lg.lead": "Authorized customers track order and delivery status and open requests; every request instantly lands on the sales rep's CRM card.",
    "lg.back": "← back to panholding.com.tr",
    "lg.title": "Portal sign-in", "lg.sub": "Sign in for order tracking and your requests.",
    "lg.mail": "E-MAIL", "lg.pass": "PASSWORD", "lg.passDemo": "(demo: demo1234)",
    "lg.btn": "Sign in",
    "lg.errWrong": "Incorrect e-mail or password. ({n}/3 attempts)",
    "lg.errLock": "Too many failed attempts. Sign-in locked for {s}s for security.",
    "lg.s1": "🔐 Role-based access", "lg.s2": "⏱ Sign-out after 15 min idle",
    "lg.s3": "🚫 Lock after 3 failed attempts", "lg.s4": "🛡 KVKK compliant",
    "lg.demoT": "Demo version — try different roles with one click:",
    "lg.demo1": "👤 Enter as customer (Derim Deri A.Ş.)",
    "lg.demo2": "💼 Enter as sales representative",
    "lg.waHelp": "💬 Trouble signing in? Message our WhatsApp support",

    "sb.portal": "PORTAL", "sb.dash": "⬛ Overview", "sb.orders": "📦 My Orders",
    "sb.reqs": "📝 My Requests", "sb.hist": "🗂 Conversation History", "sb.inbox": "📥 Incoming Requests",
    "sb.logout": "↩ Sign out", "sb.last": "Last sign-in: ",

    "tp.crumb": "PAN HOLDING · CUSTOMER PORTAL · ", "tp.newReq": "+ New Request",
    "tp.badge": "DEMO ENVIRONMENT",
    "t.dash": "Overview", "t.orders": "My Orders", "t.ordersAll": "Orders (All Customers)",
    "t.reqs": "My Requests", "t.hist": "Conversation History", "t.scopeAll": "All customers",

    "k.active": "Active orders", "k.ship": "In transit", "k.open": "Open requests", "k.done": "Completed (2026)",

    "p.recent": "Recent orders", "p.all": "View all →", "p.orders": "Orders",
    "p.searchPh": "Search order no / product…", "p.stAll": "All statuses",
    "th.order": "ORDER", "th.cust": " / CUSTOMER", "th.items": "ITEMS", "th.date": "DATE",
    "th.status": "STATUS", "th.prog": "PROGRESS", "th.eta": "EST. DELIVERY", "th.prod": "PRODUCT",
    "p.none": "No records found.",

    "cn.dashB": "Fully integrated:",
    "cn.dashT": " In a real deployment this portal connects to Smart CRM and Logo Tiger — orders, stock and account data flow automatically; requests land on the sales rep's CRM card.",
    "cn.histB": "Comes from CRM:",
    "cn.histT": " Phone, e-mail, WhatsApp and field visits are collected on a single customer card; your history is preserved even if your rep changes.",

    "rq.new": "Create a new request", "rq.chip": "Lands in CRM instantly",
    "rq.subj": "SUBJECT", "rq.subjPh": "e.g. Sample request — water-based top coat",
    "rq.det": "DETAILS", "rq.detPh": "Briefly describe your need; add quantity and deadline if any.",
    "rq.send": "Send request",
    "rq.open": "Open", "rq.crm": "Sent to CRM", "rq.ans": "Answered",
    "rq.none": "No requests yet.",

    "dw.status": "ORDER STATUS", "dw.items": "ITEMS", "dw.ship": "SHIPPING & REP",
    "dw.carrier": "CARRIER", "dw.track": "TRACKING NO", "dw.eta": "EST. DELIVERY",
    "dw.rep": "YOUR SALES REP", "dw.docs": "DOCUMENTS", "dw.close": "CLOSE ×",
    "dw.cont": "In progress…", "dw.orderDate": " · Order date ",

    "to.reqOk": "Your request was received and sent to CRM ✓",
    "to.reqErr": "Please enter a subject and details.",
    "to.doc": "Demo: the {d} document comes from Logo Tiger in the real system.",
    "to.sysReply": "Your request landed on the CRM card of your sales rep {rep}. We'll get back to you shortly.",
    "to.sysBy": "System", "to.now": "now"
  },

  ru: {
    steps: ["Заказ принят", "В производстве", "Контроль качества", "В пути", "Доставлен"],
    "st.s0": "Заказ принят", "st.s1": "В производстве", "st.s2": "Контроль качества", "st.s3": "В пути", "st.s4": "Доставлен",

    "nav.corp": "О компании", "nav.cos": "Компании", "nav.prod": "Производство",
    "nav.sust": "Устойчивость", "nav.news": "Новости",
    "nav.portal": "Портал клиента", "nav.contact": "Контакты", "nav.close": "ЗАКРЫТЬ ×",

    "hero.kicker": "С 1975 ГОДА",
    "hero.t1": "Решения под ", "hero.t2": "ваши задачи.",
    "hero.lead": "Мы существуем, чтобы создавать ценность для вас и максимально отвечать вашим требованиям. Объединяем производство, качество и технический сервис в кожевенной и химической отраслях под одной крышей.",
    "hero.b1": "Компании группы", "hero.b2": "Узнать о нас",
    "hero.stat": "лабораторий применения в регионах",
    "hero.alt": "Комплекс Pan Holding — Herkim, Farben и Helsa",

    "strip.label": "КОМПАНИИ ГРУППЫ И БРЕНДЫ",

    "about.kicker": "КТО ТАКОЙ PAN HOLDING?",
    "about.title": "Промышленная группа, построенная на качестве, стабильности и надёжности",
    "about.p1": "Группа Herkim была основана в 1975 году вместе с головной компанией Herkim Kimya в знаменитом кожевенном районе Казлычешме в Стамбуле, в эпоху модернизации турецкой кожевенной отрасли.",
    "about.p2": "В 1997 году была создана производственная компания Farben Kimya — производство и продажа кожевенной и текстильной химии, красителей и биндеров; затем группа расширилась в строительный, полиграфический и полимерный секторы. Сегодня экспорт ведётся в 10 стран, прежде всего в Россию и Украину.",
    "about.f1t": "Технология производства", "about.f1d": "Передовые технологии, компьютерное управление оборудованием.",
    "about.f2t": "Забота об экологии", "about.f2d": "Экологичные продукты на водной основе.",
    "about.alt": "Ручная работа в кожевенной мастерской",

    "stats.s1": "Год основания", "stats.s2": "Лабораторий применения в регионах",
    "stats.s3": "Стран экспорта", "stats.s4": "Площадь завода Farben",

    "cos.kicker": "КОМПАНИИ ГРУППЫ", "cos.title": "Одна крыша, три специализации",
    "cos.d1": "С 1975 года предлагает все группы кожевенной химии с техническим сервисом. Лидер отрасли с 12 точками продаж.",
    "cos.d2": "С 1972 года производит финишную химию. 15 000 м² земли и завод 8 000 м² в ОПЗ Тузла; разрабатывает экологичную химию через НИОКР.",
    "cos.d3": "Дочерний бренд группы в области кожевенной и текстильной химии, ориентированный на международные рынки.",
    "cos.l3": "Связаться →",

    "br.kicker": "НАШИ БРЕНДЫ И ПАРТНЁРЫ",
    "br.title": "Специализированные бренды для каждой группы продукции",
    "br.side": "Farben работает в Турции и за рубежом с брендами, созданными по группам продукции, и экспертными командами.",
    "br.p1": "Семейство финишных продуктов для кожи", "br.p2": "Кожевенная и текстильная химия",
    "br.p3": "Leather — премиум-серия", "br.other": "и другие бренды группы",

    "pr.kicker": "ТЕХНОЛОГИЯ ПРОИЗВОДСТВА",
    "pr.title": "Повторяемое качество, измеримая точность",
    "pr.lead": "С передовыми технологиями, компьютерным управлением и обученным персоналом мы производим во взрывобезопасной среде, отождествляемой с охраной труда.",
    "pr.s1t": "Подход ISO 9001", "pr.s1d": "Максимальная точность и повторяемость сводят человеческий фактор к минимуму.",
    "pr.s2t": "Лаборатории контроля качества", "pr.s2d": "Промежуточные пробы тестируются, держа процесс под контролем.",
    "pr.alt": "Цветные рулоны кожи",

    "eco.kicker": "ЗАБОТА ОБ ЭКОЛОГИИ",
    "eco.title": "Производство, в центре которого — человек и природа",
    "eco.lead": "От производства до применения мы следим, чтобы вся продукция была безопасна для человека и природы. Сырьё — биоразлагаемое и в пределах норм Всемирной организации здравоохранения.",
    "eco.c1t": "На водной основе", "eco.c1d": "Подавляющая часть нашей продукции — на водной основе.",
    "eco.c2t": "Responsible Care", "eco.c2d": "Обязательство, принятое и официально подтверждённое с момента основания.",
    "eco.c3t": "Очистка", "eco.c3d": "Стамбульская организованная кожевенная промзона с новейшей системой очистки.",

    "val.kicker": "ПРИНЦИПЫ И ЦЕННОСТИ",
    "val.title": "Создавать ценность, сохранять доверие",
    "val.lead": "Создавать ценность для клиентов, максимально отвечать их требованиям, обеспечивать качественные продукты и услуги и вести последовательную политику — наш базовый подход.",
    "val.1": "Удовлетворённость клиентов", "val.2": "Честность", "val.3": "Стабильность", "val.4": "Качество",
    "val.5": "Открытость", "val.6": "Командная работа", "val.7": "Социальная ответственность", "val.8": "Надёжность",

    "pp.kicker": "ПОРТАЛ КЛИЕНТА · НОВОЕ",
    "pp.t1": "На каком этапе ваш заказ?", "pp.t2": "С первого взгляда",
    "pp.lead": "Авторизованные клиенты и отдел продаж теперь отслеживают заказы, статус доставки и историю запросов прямо на сайте.",
    "pp.f1": "Отслеживание заказов и доставки 24/7 — шаг за шагом от производства до доставки",
    "pp.f2": "Новые запросы мгновенно попадают в CRM-карту вашего менеджера",
    "pp.f3": "Документы по заказу и история общения на одном экране",
    "pp.btn": "Войти в портал",
    "pp.note": "* Демо-версия — попробуйте вживую на примерах данных.",
    "pp.live": "ОНЛАЙН-СТАТУС",
    "pp.s1": "🔐 Доступ по ролям", "pp.s2": "🛡 Соответствие KVKK", "pp.s3": "⏱ Автозавершение сессии",

    "nw.kicker": "ПОСЛЕДНИЕ СОБЫТИЯ", "nw.title": "Наши новости",
    "nw.all": "Все новости →", "nw.tag": "ВЫСТАВКА",
    "nw.1t": "Leather Fair India", "nw.1d": "Pan Holding принял участие в многолюдной выставке в Индии.",
    "nw.2t": "Leather Fair Istanbul", "nw.2d": "На выставке в Стамбуле мы представили посетителям новые группы продукции.",
    "nw.3t": "Международная кожевенная выставка", "nw.3d": "Мы внимательно следим за мировыми отраслевыми выставками, принося клиентам последние тренды.",

    "ct.kicker": "КОНТАКТЫ", "ct.title": "Мы на расстоянии одного сообщения",
    "ct.l1": "ТЕЛЕФОН", "ct.l2": "WHATSAPP", "ct.l2v": "Написать →",
    "ct.l3": "E-MAIL", "ct.l4": "АДРЕС", "ct.l5": "ЧАСЫ РАБОТЫ",
    "ct.hours": "Будни 08:30 – 17:30",
    "ct.addr": "Стамбульская кожевенная ОПЗ, ул. Pres No:3, Тузла — Стамбул",

    "nb.title": "Подписка на рассылку",
    "nb.lead": "Подпишитесь на рассылку, чтобы первыми узнавать наши новости.",
    "nb.ph1": "Имя и фамилия", "nb.ph2": "Ваш e-mail", "nb.btn": "Подписаться",
    "nb.ok": "Вы подписаны. Спасибо!", "nb.err": "Введите корректный e-mail.",

    "ft.desc": "Промышленная группа, с 1975 года объединяющая производство, качество и технический сервис в кожевенной и химической отраслях.",
    "ft.corp": "О КОМПАНИИ", "ft.l1": "Кто такой Pan Holding", "ft.l2": "Наши компании",
    "ft.l3": "Технология производства", "ft.l4": "Забота об экологии", "ft.l5": "Портал клиента",
    "ft.contact": "КОНТАКТЫ",
    "ft.rights": "© 2026 Pan Holding. Все права защищены.",
    "ft.kvkk": "Конфиденциальность", "ft.terms": "Пользовательское соглашение", "ft.cookie": "Политика cookie",

    "wa.msg": "Здравствуйте! Пишу с сайта Pan Holding, хочу получить информацию.",
    "wa.title": "Написать в WhatsApp",

    "lg.h1a": "Где ваш заказ?", "lg.h1b": "Видно даже в полночь.",
    "lg.lead": "Авторизованные клиенты отслеживают статус заказов и доставки, создают запросы; каждый запрос мгновенно попадает в CRM-карту менеджера.",
    "lg.back": "← вернуться на panholding.com.tr",
    "lg.title": "Вход в портал", "lg.sub": "Войдите для отслеживания заказов и запросов.",
    "lg.mail": "E-MAIL", "lg.pass": "ПАРОЛЬ", "lg.passDemo": "(демо: demo1234)",
    "lg.btn": "Войти",
    "lg.errWrong": "Неверный e-mail или пароль. (попытка {n}/3)",
    "lg.errLock": "Слишком много неудачных попыток. Вход заблокирован на {s} с.",
    "lg.s1": "🔐 Доступ по ролям", "lg.s2": "⏱ Выход после 15 мин простоя",
    "lg.s3": "🚫 Блокировка после 3 ошибок", "lg.s4": "🛡 Соответствие KVKK",
    "lg.demoT": "Демо-версия — попробуйте разные роли в один клик:",
    "lg.demo1": "👤 Войти как клиент (Derim Deri A.Ş.)",
    "lg.demo2": "💼 Войти как менеджер по продажам",
    "lg.waHelp": "💬 Проблемы со входом? Напишите в WhatsApp",

    "sb.portal": "ПОРТАЛ", "sb.dash": "⬛ Обзор", "sb.orders": "📦 Мои заказы",
    "sb.reqs": "📝 Мои запросы", "sb.hist": "🗂 История общения", "sb.inbox": "📥 Входящие запросы",
    "sb.logout": "↩ Выйти", "sb.last": "Последний вход: ",

    "tp.crumb": "PAN HOLDING · ПОРТАЛ КЛИЕНТА · ", "tp.newReq": "+ Новый запрос",
    "tp.badge": "ДЕМО-СРЕДА",
    "t.dash": "Обзор", "t.orders": "Мои заказы", "t.ordersAll": "Заказы (все клиенты)",
    "t.reqs": "Мои запросы", "t.hist": "История общения", "t.scopeAll": "Все клиенты",

    "k.active": "Активные заказы", "k.ship": "В пути", "k.open": "Открытые запросы", "k.done": "Завершено (2026)",

    "p.recent": "Последние заказы", "p.all": "Смотреть все →", "p.orders": "Заказы",
    "p.searchPh": "Поиск по № заказа / продукту…", "p.stAll": "Все статусы",
    "th.order": "ЗАКАЗ", "th.cust": " / КЛИЕНТ", "th.items": "ПОЗИЦИИ", "th.date": "ДАТА",
    "th.status": "СТАТУС", "th.prog": "ПРОГРЕСС", "th.eta": "ОЖИД. ДОСТАВКА", "th.prod": "ПРОДУКТ",
    "p.none": "Записей не найдено.",

    "cn.dashB": "Полная интеграция:",
    "cn.dashT": " В реальной среде портал подключается к Smart CRM и Logo Tiger — заказы, склад и данные по счетам поступают автоматически; запросы попадают в CRM-карту менеджера.",
    "cn.histB": "Данные из CRM:",
    "cn.histT": " Телефон, e-mail, WhatsApp и визиты собираются в единой карте клиента; история сохраняется даже при смене менеджера.",

    "rq.new": "Создать новый запрос", "rq.chip": "Мгновенно попадает в CRM",
    "rq.subj": "ТЕМА", "rq.subjPh": "напр. Запрос образца — водный топ-кот",
    "rq.det": "ДЕТАЛИ", "rq.detPh": "Кратко опишите потребность; укажите объём и срок, если есть.",
    "rq.send": "Отправить запрос",
    "rq.open": "Открыт", "rq.crm": "Передан в CRM", "rq.ans": "Отвечен",
    "rq.none": "Запросов пока нет.",

    "dw.status": "СТАТУС ЗАКАЗА", "dw.items": "ПОЗИЦИИ", "dw.ship": "ДОСТАВКА И МЕНЕДЖЕР",
    "dw.carrier": "ПЕРЕВОЗЧИК", "dw.track": "№ ОТСЛЕЖИВАНИЯ", "dw.eta": "ОЖИД. ДОСТАВКА",
    "dw.rep": "ВАШ МЕНЕДЖЕР", "dw.docs": "ДОКУМЕНТЫ", "dw.close": "ЗАКРЫТЬ ×",
    "dw.cont": "Выполняется…", "dw.orderDate": " · Дата заказа ",

    "to.reqOk": "Запрос получен и передан в CRM ✓",
    "to.reqErr": "Укажите тему и детали.",
    "to.doc": "Демо: документ «{d}» в реальной системе поступает из Logo Tiger.",
    "to.sysReply": "Ваш запрос попал в CRM-карту менеджера {rep}. Мы свяжемся с вами в ближайшее время.",
    "to.sysBy": "Система", "to.now": "сейчас"
  }
};

/* ---------------- Motor ---------------- */
(function () {
  "use strict";
  var LANGS = ["tr", "en", "ru"];
  var KEY = "pan_lang";
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  var lang = LANGS.indexOf(stored) >= 0 ? stored : "tr";

  window.PAN_LANG = lang;
  window.pT = function (k) {
    var d = PAN_I18N[lang];
    if (d && d[k] != null) return d[k];
    return PAN_I18N.tr[k] != null ? PAN_I18N.tr[k] : k;
  };
  window.pSteps = function () { return PAN_I18N[lang].steps; };

  function apply() {
    document.documentElement.lang = lang;
    var els, i;
    els = document.querySelectorAll("[data-i18n]");
    for (i = 0; i < els.length; i++) els[i].textContent = window.pT(els[i].getAttribute("data-i18n"));
    els = document.querySelectorAll("[data-i18n-ph]");
    for (i = 0; i < els.length; i++) els[i].setAttribute("placeholder", window.pT(els[i].getAttribute("data-i18n-ph")));
    els = document.querySelectorAll("[data-i18n-title]");
    for (i = 0; i < els.length; i++) els[i].setAttribute("title", window.pT(els[i].getAttribute("data-i18n-title")));
    els = document.querySelectorAll("[data-i18n-aria]");
    for (i = 0; i < els.length; i++) els[i].setAttribute("aria-label", window.pT(els[i].getAttribute("data-i18n-aria")));
    els = document.querySelectorAll("[data-i18n-alt]");
    for (i = 0; i < els.length; i++) els[i].setAttribute("alt", window.pT(els[i].getAttribute("data-i18n-alt")));
    els = document.querySelectorAll("[data-plang]");
    for (i = 0; i < els.length; i++) els[i].classList.toggle("on", els[i].getAttribute("data-plang") === lang);
  }

  window.pSetLang = function (l) {
    if (LANGS.indexOf(l) < 0) return;
    lang = l;
    window.PAN_LANG = l;
    try { localStorage.setItem(KEY, l); } catch (e) {}
    apply();
    document.dispatchEvent(new CustomEvent("pan:lang", { detail: { lang: l } }));
  };

  document.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-plang]") : null;
    if (b) { e.preventDefault(); window.pSetLang(b.getAttribute("data-plang")); }
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", apply);
  else apply();
  window.pApply = apply;
})();
