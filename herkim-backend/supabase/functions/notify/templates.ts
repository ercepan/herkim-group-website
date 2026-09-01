// ============================================================
// HERKİM GROUP B2B — E-POSTA ŞABLONLARI
//
// Tek iskelet, iki aile:
//   A) Müşteriye giden (TR/EN/RU) — kurumsal, güven veren
//   B) Herkim ekibine giden (TR)  — hızlı okunur, aksiyon odaklı
//
// TASARIM: 600px tablo, satır içi CSS, GÖRSEL YOK (spam skoru ve
// görsel engelleyen Outlook için), koyu mod uyumlu, marka renkleri.
// Metinler kaçırılır (escape) — sipariş notu gibi serbest alanlar
// doğrudan gövdeye giremez.
// ============================================================

const C = {
  crimson: "#A31C3C", hot: "#C42449", ink: "#1B1216",
  ink2: "#43333A", ink3: "#7A6A70", paper: "#F2ECE3",
  white: "#FFFFFF", line: "#E4DED6", soft: "#FAF6F1",
};

// Fiyat değişkeni kabul ETMEYEN şablonlar (beyaz liste denetimi)
export const FIYAT_YASAK = [
  "basvuru_alindi", "hesap_onaylandi", "basvuru_red", "siparis_alindi",
  "siparis_onay", "siparis_sevk", "siparis_teslim", "talep_alindi",
  "ic_basvuru", "ic_siparis", "ic_talep",
];

const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SITE = "https://ercepan.github.io/herkim-group-website";

type Dil = "tr" | "en" | "ru";

const ALTBILGI: Record<Dil, string> = {
  tr: "Herkim Group Kimyevi Maddeler A.Ş. · Deri OSB Mah. Pres Sok. No: 3, Tuzla / İstanbul · 444 56 58 · sales@herkimgroup.com<br>Bu e-posta, sitemiz üzerinden yaptığınız işlem nedeniyle gönderilmiştir.",
  en: "Herkim Group Kimyevi Maddeler A.Ş. · Deri OSB Mah. Pres Sok. No: 3, Tuzla / İstanbul, Türkiye · +90 216 394 11 25 · sales@herkimgroup.com<br>You are receiving this e-mail because of a transaction you made on our website.",
  ru: "Herkim Group Kimyevi Maddeler A.Ş. · Deri OSB Mah. Pres Sok. No: 3, Тузла / Стамбул · +90 216 394 11 25 · sales@herkimgroup.com<br>Вы получили это письмо в связи с действием, совершённым на нашем сайте.",
};

/* ---------- İskelet ---------- */
function iskelet(o: {
  dil: Dil; baslik: string; onizleme: string; govde: string;
  ctaMetin?: string; ctaUrl?: string; uyari?: string; ic?: boolean;
}) {
  const cta = o.ctaMetin && o.ctaUrl
    ? `<tr><td style="padding:6px 34px 30px 34px">
         <table role="presentation" cellpadding="0" cellspacing="0"><tr>
           <td class="hg-btn-bg" style="background:${C.crimson};border-radius:3px">
             <a href="${o.ctaUrl}" style="display:inline-block;padding:13px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none">${esc(o.ctaMetin)}</a>
           </td></tr></table></td></tr>`
    : "";
  const uyari = o.uyari
    ? `<tr><td class="hg-pad" style="padding:0 34px 22px 34px">
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
           <tr><td class="hg-soft hg-ink2" style="background:${C.soft};border-left:3px solid ${C.crimson};padding:13px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:${C.ink2}">${o.uyari}</td></tr>
         </table></td></tr>`
    : "";
  const marka = o.ic ? "HERKİM · İÇ BİLDİRİM" : "HERKİM GROUP";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${o.dil}"><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light dark" />
<title>${esc(o.baslik)}</title>
<style type="text/css">
 body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
 table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse}
 a{color:${C.crimson}}
 @media only screen and (max-width:620px){
   .hg-card{width:100%!important}.hg-pad{padding-left:22px!important;padding-right:22px!important}
   .hg-h1{font-size:24px!important;line-height:30px!important}}
 @media (prefers-color-scheme:dark){
   .hg-page{background:#100B0D!important}.hg-card-bg{background:#1B1216!important}
   .hg-ink{color:#F5EFE8!important}.hg-ink2{color:#C9BBC1!important}.hg-ink3{color:#9A8A90!important}
   .hg-accent{color:#F0879E!important}.hg-line{border-color:#3A2B31!important}.hg-soft{background:#2A1A20!important}
   .hg-btn-bg{background:#C42449!important}}
 [data-ogsc] .hg-page{background:#100B0D!important}[data-ogsc] .hg-card-bg{background:#1B1216!important}
 [data-ogsc] .hg-ink{color:#F5EFE8!important}[data-ogsc] .hg-ink2{color:#C9BBC1!important}
 [data-ogsc] .hg-accent{color:#F0879E!important}[data-ogsc] .hg-soft{background:#2A1A20!important}[data-ogsc] .hg-btn-bg{background:#C42449!important}
</style></head>
<body class="hg-page" style="margin:0;padding:0;width:100%;background:${C.paper}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.onizleme)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}">
<tr><td align="center" style="padding:28px 12px">
  <table role="presentation" class="hg-card" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px">

    <tr><td class="hg-pad" style="padding:0 34px 14px 34px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;color:${C.crimson};font-weight:bold">${marka}</td></tr>

    <tr><td class="hg-card-bg" style="background:${C.white};border:1px solid ${C.line};border-radius:3px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td class="hg-pad" style="padding:32px 34px 10px 34px">
          <h1 class="hg-h1 hg-ink" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:27px;line-height:34px;color:${C.ink};font-weight:normal">${esc(o.baslik)}</h1>
        </td></tr>
        <tr><td class="hg-pad hg-ink2" style="padding:14px 34px 22px 34px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${C.ink2}">${o.govde}</td></tr>
        ${uyari}${cta}
      </table>
    </td></tr>

    <tr><td class="hg-pad hg-ink3" style="padding:20px 34px 8px 34px;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;line-height:18px;color:${C.ink3}">${ALTBILGI[o.dil]}</td></tr>
  </table>
</td></tr></table></body></html>`;
}

/* ---------- Anahtar/değer bloğu ---------- */
function bilgi(satirlar: [string, string][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 2px 0">` +
    satirlar.map(([k, v]) =>
      `<tr><td class="hg-line hg-ink3" style="padding:7px 0;border-bottom:1px solid ${C.line};font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.ink3};width:38%">${esc(k)}</td>
       <td class="hg-line hg-ink" style="padding:7px 0;border-bottom:1px solid ${C.line};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.ink2};font-weight:bold">${esc(v)}</td></tr>`
    ).join("") + `</table>`;
}
const ref = (v: string) =>
  `<div style="font-family:'Courier New',monospace;font-size:19px;letter-spacing:1px;color:${C.crimson};font-weight:bold;padding:4px 0 2px 0" class="hg-accent">${esc(v)}</div>`;

/* ---------- Metin (düz) sürüm ---------- */
const duz = (html: string) =>
  html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|tr|div|h1)>/gi, "\n")
      .replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, "\n\n").trim();

/* ============================================================
   ŞABLONLAR
   ============================================================ */
type Ciktı = { konu: string; html: string; metin: string };

export function render(sablon: string, dil: string, d: Record<string, unknown>): Ciktı {
  const L = (["tr", "en", "ru"].includes(dil) ? dil : "tr") as Dil;
  const s = (k: string) => esc(d[k]);
  let konu = "", baslik = "", onizleme = "", govde = "", ctaMetin, ctaUrl, uyari, ic = false;

  switch (sablon) {
    /* ---------- A) MÜŞTERİYE ---------- */
    case "basvuru_alindi": {
      const m = {
        tr: { k: `Başvurunuz alındı — ${s("ref")}`, b: "Başvurunuz alındı",
              g: `Sayın ${s("yetkili")},<br><br><b>${s("unvan")}</b> adına yaptığınız müşteri hesabı başvurusunu aldık. Başvuru numaranız:`,
              n: "Satış ekibimiz firma bilgilerinizi resmî kayıtlardan doğrulayacak ve en geç <b>1 iş günü</b> içinde size dönüş yapacaktır. Hesabınız onaylandığında şifrenizi belirleyeceğiniz bir bağlantı göndereceğiz.",
              c: "Ürün kataloğunu inceleyin" },
        en: { k: `Your application has been received — ${s("ref")}`, b: "Application received",
              g: `Dear ${s("yetkili")},<br><br>We have received the customer account application for <b>${s("unvan")}</b>. Your application number:`,
              n: "Our sales team will verify your company details against official records and get back to you within <b>1 business day</b>. Once approved, we will send you a link to set your password.",
              c: "Browse the product catalogue" },
        ru: { k: `Заявка получена — ${s("ref")}`, b: "Заявка получена",
              g: `Уважаемый(ая) ${s("yetkili")},<br><br>Мы получили заявку на клиентский аккаунт для <b>${s("unvan")}</b>. Номер заявки:`,
              n: "Отдел продаж проверит данные компании по официальным реестрам и свяжется с вами в течение <b>1 рабочего дня</b>. После одобрения мы вышлем ссылку для установки пароля.",
              c: "Смотреть каталог" },
      }[L];
      konu = m.k; baslik = m.b; onizleme = m.k;
      govde = m.g + ref(String(d.ref));
      uyari = m.n; ctaMetin = m.c; ctaUrl = `${SITE}/urunler.html`;
      break;
    }
    case "hesap_onaylandi": {
      const m = {
        tr: { k: "Hesabınız onaylandı", g: `Sayın ${s("yetkili")},<br><br><b>${s("unvan")}</b> için müşteri hesabınız <b>onaylandı</b>. Aşağıdaki düğmeden şifrenizi belirleyip giriş yapabilirsiniz.`,
              n: "Giriş yaptıktan sonra size özel fiyat listenizi görebilir, sipariş talebi oluşturabilir ve siparişlerinizin durumunu anlık takip edebilirsiniz.", c: "Şifremi belirle" },
        en: { k: "Your account has been approved", g: `Dear ${s("yetkili")},<br><br>Your customer account for <b>${s("unvan")}</b> has been <b>approved</b>. Use the button below to set your password and sign in.`,
              n: "Once signed in you can see your dedicated price list, create order requests and track their status in real time.", c: "Set my password" },
        ru: { k: "Ваш аккаунт подтверждён", g: `Уважаемый(ая) ${s("yetkili")},<br><br>Клиентский аккаунт для <b>${s("unvan")}</b> <b>подтверждён</b>. Нажмите кнопку ниже, чтобы задать пароль и войти.`,
              n: "После входа вы увидите свой прайс-лист, сможете создавать заявки на заказ и отслеживать их статус.", c: "Задать пароль" },
      }[L];
      konu = m.k; baslik = m.k; onizleme = m.k; govde = m.g;
      uyari = m.n; ctaMetin = m.c; ctaUrl = String(d.davet_url ?? `${SITE}/hesap.html`);
      break;
    }
    case "siparis_alindi": {
      const m = {
        tr: { k: `Sipariş talebiniz alındı — ${s("ref")}`, b: "Sipariş talebiniz alındı",
              g: `Sipariş talebinizi aldık. Talep numaranız:`,
              n: "<b>Bu bir sipariş talebidir.</b> Fiyat, miktar ve teslim tarihi satış temsilciniz onayladıktan sonra kesinleşir; onaya kadar stok ayrılmaz. Ödeme, mevcut cari hesap koşullarınıza göre yapılır.",
              c: "Siparişlerimi görüntüle" },
        en: { k: `Your order request has been received — ${s("ref")}`, b: "Order request received",
              g: "We have received your order request. Your request number:",
              n: "<b>This is an order request.</b> Price, quantity and delivery date are confirmed after your sales representative approves it; no stock is reserved until then. Payment follows your existing account terms.",
              c: "View my orders" },
        ru: { k: `Заявка на заказ получена — ${s("ref")}`, b: "Заявка на заказ получена",
              g: "Мы получили вашу заявку на заказ. Номер заявки:",
              n: "<b>Это заявка на заказ.</b> Цена, количество и срок поставки фиксируются после подтверждения вашим менеджером; до этого товар не резервируется. Оплата — по условиям вашего счёта.",
              c: "Мои заказы" },
      }[L];
      konu = m.k; baslik = m.b; onizleme = m.k;
      govde = m.g + ref(String(d.ref)) + bilgi([[L === "tr" ? "Kalem sayısı" : L === "en" ? "Line items" : "Позиции", String(d.kalem ?? "")]]);
      uyari = m.n; ctaMetin = m.c; ctaUrl = `${SITE}/siparislerim.html`;
      break;
    }
    case "siparis_onay": {
      const m = {
        tr: { k: `Siparişiniz onaylandı — ${s("ref")}`, g: "Sipariş talebiniz satış ekibimizce <b>onaylandı</b> ve hazırlık sürecine alındı.", c: "Siparişimi takip et" },
        en: { k: `Your order is approved — ${s("ref")}`, g: "Your order request has been <b>approved</b> by our sales team and moved into preparation.", c: "Track my order" },
        ru: { k: `Заказ подтверждён — ${s("ref")}`, g: "Ваша заявка <b>подтверждена</b> отделом продаж и передана в подготовку.", c: "Отследить заказ" },
      }[L];
      konu = m.k; baslik = m.k; onizleme = m.k; govde = m.g + ref(String(d.ref));
      ctaMetin = m.c; ctaUrl = `${SITE}/siparislerim.html`;
      break;
    }
    case "siparis_sevk": {
      const m = {
        tr: { k: `Siparişiniz sevkiyata çıktı — ${s("ref")}`, g: "Siparişiniz depodan çıktı ve yola verildi.", c: "Siparişimi takip et",
              t: "Takip no", ta: "Taşıyıcı" },
        en: { k: `Your order has shipped — ${s("ref")}`, g: "Your order has left our warehouse and is on its way.", c: "Track my order",
              t: "Tracking no", ta: "Carrier" },
        ru: { k: `Заказ отправлен — ${s("ref")}`, g: "Ваш заказ отгружен со склада и находится в пути.", c: "Отследить заказ",
              t: "Номер отслеживания", ta: "Перевозчик" },
      }[L];
      const sat: [string, string][] = [];
      if (d.takip_no) sat.push([m.t, String(d.takip_no)]);
      if (d.tasiyici) sat.push([m.ta, String(d.tasiyici)]);
      konu = m.k; baslik = m.k; onizleme = m.k;
      govde = m.g + ref(String(d.ref)) + (sat.length ? bilgi(sat) : "");
      ctaMetin = m.c; ctaUrl = `${SITE}/siparislerim.html`;
      break;
    }
    case "siparis_teslim": {
      const m = {
        tr: { k: `Siparişiniz teslim edildi — ${s("ref")}`, g: "Siparişiniz teslim edilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz.", c: "Yeni sipariş oluştur" },
        en: { k: `Your order has been delivered — ${s("ref")}`, g: "Your order has been delivered. Thank you for choosing us.", c: "Create a new order" },
        ru: { k: `Заказ доставлен — ${s("ref")}`, g: "Ваш заказ доставлен. Благодарим за доверие.", c: "Создать новый заказ" },
      }[L];
      konu = m.k; baslik = m.k; onizleme = m.k; govde = m.g + ref(String(d.ref));
      ctaMetin = m.c; ctaUrl = `${SITE}/urunler.html`;
      break;
    }
    case "talep_alindi": {
      const m = {
        tr: { k: `Talebiniz alındı — ${s("ref")}`, g: `Talebinizi aldık: <b>${s("konu")}</b>`, n: "Satış ekibimiz en kısa sürede size dönüş yapacaktır." },
        en: { k: `Your request has been received — ${s("ref")}`, g: `We have received your request: <b>${s("konu")}</b>`, n: "Our sales team will get back to you shortly." },
        ru: { k: `Ваш запрос получен — ${s("ref")}`, g: `Мы получили ваш запрос: <b>${s("konu")}</b>`, n: "Отдел продаж свяжется с вами в ближайшее время." },
      }[L];
      konu = m.k; baslik = m.k.split(" — ")[0]; onizleme = m.k;
      govde = m.g + ref(String(d.ref)); uyari = m.n;
      break;
    }

    /* ---------- B) HERKİM EKİBİNE (TR) ---------- */
    case "ic_basvuru": {
      ic = true;
      konu = `Yeni hesap başvurusu — ${s("unvan")}`;
      baslik = "Yeni hesap başvurusu";
      onizleme = `${s("unvan")} · VKN ${s("vkn")}`;
      govde = ref(String(d.ref)) + bilgi([
        ["Firma", String(d.unvan ?? "")],
        ["Vergi dairesi / No", `${d.vergi_dairesi ?? ""} / ${d.vkn ?? ""}`],
        ["Yetkili", String(d.yetkili ?? "")],
        ["E-posta", String(d.eposta ?? "")],
        ["Cep", String(d.cep ?? "")],
        ["Firma telefonu", String(d.telefon ?? "")],
        ["Kaynak", String((d.kaynak as Record<string, unknown>)?.kanal ?? "—")],
      ]) + `<br><span style="font-size:13px;color:${C.ink3}">Doğrulama: 
        <a href="https://ivd.gib.gov.tr/">GİB</a> · 
        <a href="https://www.ticaretsicil.gov.tr/">Ticaret Sicil</a></span>`;
      uyari = "Firma doğrulanmadan onaylamayın. Onay, müşteriye şifre belirleme bağlantısı gönderir.";
      ctaMetin = "Portalda aç"; ctaUrl = `${SITE}/portal.html`;
      break;
    }
    case "ic_siparis": {
      ic = true;
      konu = `Yeni sipariş talebi — ${s("firma")}`;
      baslik = "Yeni sipariş talebi";
      onizleme = `${s("firma")} · ${s("kalem")} kalem`;
      govde = ref(String(d.ref)) + bilgi([
        ["Firma", String(d.firma ?? "")],
        ["Kalem sayısı", String(d.kalem ?? "")],
      ]);
      if (Number(d.fiyatsiz ?? 0) > 0) {
        uyari = `<b>${esc(d.fiyatsiz)} kalemin fiyatı tanımsız.</b> Onaylamadan önce müşteri fiyat listesine ekleyin.`;
      }
      ctaMetin = "Siparişi aç"; ctaUrl = `${SITE}/portal.html`;
      break;
    }
    case "ic_talep": {
      ic = true;
      konu = `Yeni talep — ${s("konu")}`;
      baslik = "Yeni talep";
      onizleme = `${s("tur")} · ${s("konu")}`;
      govde = ref(String(d.ref)) + bilgi([
        ["Tür", String(d.tur ?? "")],
        ["Konu", String(d.konu ?? "")],
        ["Ad", String(d.ad ?? "—")],
        ["E-posta", String(d.eposta ?? "—")],
        ["Telefon", String(d.tel ?? "—")],
        ["Kaynak", String((d.kaynak as Record<string, unknown>)?.kanal ?? "—")],
      ]);
      ctaMetin = "Portalda aç"; ctaUrl = `${SITE}/portal.html`;
      break;
    }
    default:
      throw new Error(`Bilinmeyen şablon: ${sablon}`);
  }

  const html = iskelet({ dil: L, baslik, onizleme, govde, ctaMetin, ctaUrl, uyari, ic });
  return { konu, html, metin: duz(govde + (uyari ? "\n\n" + uyari : "")) };
}
