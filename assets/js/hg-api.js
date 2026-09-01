/* ============================================================
   HERKİM — Backend istemcisi (Supabase)

   TASARIM: Bu dosya siteyle backend arasındaki TEK kapıdır.
   Ekran çizen kod (main.js / portal-app.js) doğrudan Supabase
   çağırmaz; buradaki fonksiyonları çağırır. Böylece backend
   değişirse tek dosya değişir.

   ÖNEMLİ: supabase-js tarayıcıya UMD paketi olarak yüklenir
   (ESM sürümünde bilinen bir başlatma hatası var).

   Yapılandırma boşsa hgApi.hazir() false döner ve site bugünkü
   yerel demo moduyla çalışmaya devam eder — hiçbir şey kırılmaz.
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.HG_CONFIG || {};
  var sb = null;

  function hazir() {
    return !!(CFG.url && CFG.anonKey && !CFG.demo && window.supabase);
  }
  function istemci() {
    if (!hazir()) return null;
    if (!sb) sb = window.supabase.createClient(CFG.url, CFG.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return sb;
  }

  /* Hata mesajlarını kullanıcıya gösterilebilir hale getir */
  function hata(e) {
    var m = (e && (e.message || e.error_description)) || "Bilinmeyen hata";
    if (/Invalid login credentials/i.test(m)) return { kod: "giris", mesaj: "E-posta veya şifre hatalı." };
    if (/Email not confirmed/i.test(m)) return { kod: "dogrulama", mesaj: "E-posta adresinizi doğrulamanız gerekiyor." };
    if (/onaylı müşteri hesabı gerekir/i.test(m)) return { kod: "onaysiz", mesaj: m };
    if (/bekleyen bir başvurunuz/i.test(m)) return { kod: "mukerrer", mesaj: m };
    if (/KVKK/i.test(m)) return { kod: "kvkk", mesaj: m };
    return { kod: "genel", mesaj: m };
  }

  /* ---------- Oturum ---------- */
  async function girisYap(eposta, sifre) {
    /* Önbellek temizlenmezse aynı sekmede çıkış yapan ya da
       başka hesapla giren kullanıcı, önceki kişinin profiliyle
       görünmeye devam eder (onayliMusteri fiyat/sipariş kapısıdır). */
    profilCache = null;
    var c = istemci(); if (!c) throw new Error("Backend bağlı değil");
    var r = await c.auth.signInWithPassword({ email: eposta, password: sifre });
    if (r.error) throw hata(r.error);
    return r.data.user;
  }
  async function cikisYap() {
    /* Önbellek temizlenmezse aynı sekmede çıkış yapan ya da
       başka hesapla giren kullanıcı, önceki kişinin profiliyle
       görünmeye devam eder (onayliMusteri fiyat/sipariş kapısıdır). */
    profilCache = null;
    var c = istemci(); if (!c) return;
    await c.auth.signOut();
  }
  async function sifreSifirla(eposta) {
    var c = istemci(); if (!c) throw new Error("Backend bağlı değil");
    var r = await c.auth.resetPasswordForEmail(eposta, {
      redirectTo: location.origin + location.pathname.replace(/[^/]*$/, "") + "hesap.html#sifre"
    });
    if (r.error) throw hata(r.error);
    return true;
  }
  async function sifreBelirle(yeniSifre) {
    /* Önbellek temizlenmezse aynı sekmede çıkış yapan ya da
       başka hesapla giren kullanıcı, önceki kişinin profiliyle
       görünmeye devam eder (onayliMusteri fiyat/sipariş kapısıdır). */
    profilCache = null;
    var c = istemci(); if (!c) throw new Error("Backend bağlı değil");
    var r = await c.auth.updateUser({ password: yeniSifre });
    if (r.error) throw hata(r.error);
    return true;
  }

  /* Giriş yapan kullanıcının profili + firması (tek çağrı) */
  var profilCache = null;
  async function benKimim(taze) {
    var c = istemci(); if (!c) return null;
    if (profilCache && !taze) return profilCache;
    var s = await c.auth.getSession();
    if (!s.data.session) { profilCache = null; return null; }
    var r = await c.from("profiles")
      .select("id, rol, ad_soyad, eposta, dil, siparis_yetkisi, company_id, companies(id, unvan, durum)")
      .eq("id", s.data.session.user.id).maybeSingle();
    if (r.error) throw hata(r.error);
    profilCache = r.data;
    return profilCache;
  }
  /* Onaylı müşteri mi? (fiyat ve sipariş için şart) */
  async function onayliMusteri() {
    var p = await benKimim();
    return !!(p && p.rol === "musteri" && p.companies && p.companies.durum === "aktif");
  }

  /* ---------- Hesap başvurusu (giriş gerektirmez) ---------- */
  async function basvuruYap(f) {
    var c = istemci(); if (!c) throw new Error("Backend bağlı değil");
    var r = await c.rpc("apply_for_account", {
      p_unvan: f.unvan, p_vergi_dairesi: f.vergiDairesi, p_vkn: f.vkn,
      p_telefon: f.telefon, p_yetkili_ad: f.yetkiliAd,
      p_yetkili_eposta: f.eposta, p_yetkili_cep: f.cep,
      p_adres: f.adres || null, p_web: f.web || null, p_mesaj: f.mesaj || null,
      p_kvkk: !!f.kvkk, p_eti: !!f.eti, p_wa: !!f.wa,
      p_kaynak: f.kaynak || null
    });
    if (r.error) throw hata(r.error);
    return r.data;                       // BV-2026-XXXXXXXX
  }

  /* ---------- Ürünler (herkese açık, fiyatsız) ---------- */
  async function urunler() {
    var c = istemci(); if (!c) return null;
    var r = await c.from("products")
      .select("id, kod, ad_tr, ad_en, ad_ru, kategori, marka, ambalaj, birim")
      .eq("aktif", true).order("sira");
    if (r.error) throw hata(r.error);
    return r.data;
  }

  /* ---------- Fiyatlar (YALNIZ onaylı müşteri kendi fiyatını) ---------- */
  async function fiyatlarim() {
    var c = istemci(); if (!c) return null;
    var bugun = new Date().toISOString().slice(0, 10);
    var r = await c.from("customer_prices")
      .select("product_id, birim_fiyat, para_birimi, min_miktar, gecerli_bit")
      .lte("gecerli_bas", bugun)
      /* gecerli_bit SEÇİLİYOR ama süzülmüyordu: sözleşme dönemi bitmiş
         bir satır, yerine yenisi girilmediyse "güncel fiyat" olarak
         dönüyordu. Bitiş tarihi boş olan ya da bugünden ileri olanlar. */
      .or("gecerli_bit.is.null,gecerli_bit.gte." + bugun)
      .order("gecerli_bas", { ascending: false });
    if (r.error) throw hata(r.error);
    // Ürün başına en güncel kayıt
    var m = {};
    (r.data || []).forEach(function (x) { if (!m[x.product_id]) m[x.product_id] = x; });
    return m;
  }

  /* ---------- SİPARİŞ — fiyat GÖNDERİLMEZ ----------
     Tarayıcı yalnız (ürün, miktar) yollar; birim fiyatı sunucu
     kendi çözer. Fiyatın gireceği delik kapalıdır. */
  async function siparisVer(kalemler, notMetni, teslimAdres, kaynak) {
    var c = istemci(); if (!c) throw new Error("Backend bağlı değil");
    var temiz = (kalemler || []).map(function (k) {
      return { product_id: Number(k.id || k.product_id), miktar: Number(k.qty || k.miktar) };
    }).filter(function (k) { return k.product_id > 0 && k.miktar > 0; });
    if (!temiz.length) throw { kod: "bos", mesaj: "Sipariş kalemi bulunamadı." };
    var r = await c.rpc("place_order", {
      p_items: temiz, p_not: notMetni || null,
      p_teslim_adres: teslimAdres || null, p_kaynak: kaynak || null
    });
    if (r.error) throw hata(r.error);
    return r.data;                       // { ref, id, kalem, fiyatsiz_kalem }
  }

  async function siparislerim(limit) {
    var c = istemci(); if (!c) return null;
    var r = await c.from("orders")
      .select("id, ref, durum, created_at, tahmini_teslim, tasiyici, takip_no, musteri_notu, " +
              "order_items(product_id, miktar, birim, products(ad_tr, ad_en, ad_ru)), " +
              "order_events(eski_durum, yeni_durum, created_at)")
      .order("created_at", { ascending: false })
      .limit(limit || 50);
    if (r.error) throw hata(r.error);
    return r.data;
  }

  async function siparisIlerlet(orderId, yeniDurum, aciklama) {
    var c = istemci(); if (!c) throw new Error("Backend bağlı değil");
    var r = await c.rpc("advance_order", {
      p_order_id: orderId, p_yeni: yeniDurum, p_aciklama: aciklama || null
    });
    if (r.error) throw hata(r.error);
    return r.data;
  }

  /* ---------- Talepler (doküman / numune / teknik) ---------- */
  async function talepGonder(t) {
    var c = istemci(); if (!c) throw new Error("Backend bağlı değil");
    var r = await c.rpc("submit_request", {
      p_tur: t.tur || "genel", p_konu: t.konu, p_detay: t.detay || null,
      p_product_id: t.urunId || null, p_belge_turu: t.belgeTuru || null,
      p_ad: t.ad || null, p_eposta: t.eposta || null, p_tel: t.tel || null,
      p_kaynak: t.kaynak || null
    });
    if (r.error) throw hata(r.error);
    return r.data;                       // TL-2026-XXXXXXXX
  }

  /* ---------- Personel: bekleyen başvurular ---------- */
  async function bekleyenBasvurular() {
    var c = istemci(); if (!c) return null;
    var r = await c.from("applications").select("*")
      .eq("durum", "beklemede").order("created_at", { ascending: false });
    if (r.error) throw hata(r.error);
    return r.data;
  }
  async function basvuruOnayla(appId) {
    var c = istemci(); if (!c) throw new Error("Backend bağlı değil");
    var r = await c.rpc("approve_application", { p_app_id: appId });
    if (r.error) throw hata(r.error);
    return r.data;
  }

  window.hgApi = {
    hazir: hazir, istemci: istemci,
    girisYap: girisYap, cikisYap: cikisYap,
    sifreSifirla: sifreSifirla, sifreBelirle: sifreBelirle,
    benKimim: benKimim, onayliMusteri: onayliMusteri,
    basvuruYap: basvuruYap,
    urunler: urunler, fiyatlarim: fiyatlarim,
    siparisVer: siparisVer, siparislerim: siparislerim, siparisIlerlet: siparisIlerlet,
    talepGonder: talepGonder,
    bekleyenBasvurular: bekleyenBasvurular, basvuruOnayla: basvuruOnayla
  };
})();
