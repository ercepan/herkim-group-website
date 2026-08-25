// ============================================================
// HERKİM GROUP B2B — BİLDİRİM İŞÇİSİ (Supabase Edge Function)
//
// notifications_outbox tablosundaki bekleyen kayıtları alır,
// şablonu doldurur, Brevo üzerinden gönderir, sonucu işler.
//
// GÜVENLİK: service_role anahtarı YALNIZ burada (sunucuda) yaşar,
// tarayıcıya asla inmez. Şablon değişkenleri beyaz listeyle
// denetlenir: fiyat anahtarı geçirilen şablon HATA fırlatır —
// RLS bir sorguyu durdurur, ama gönderilmiş e-posta geri alınamaz.
//
// Zamanlanmış çalıştırma (dakikada bir) için pg_cron kullanılır.
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { render, FIYAT_YASAK } from "./templates.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BREVO_KEY = Deno.env.get("BREVO_API_KEY")!;
const GONDEREN_AD = Deno.env.get("MAIL_FROM_NAME") ?? "Herkim Group";
const GONDEREN = Deno.env.get("MAIL_FROM") ?? "bildirim@herkimgroup.com";
const YANIT = Deno.env.get("MAIL_REPLY_TO") ?? "sales@herkimgroup.com";
const PARTI = 25;          // tek turda en fazla kayıt
const MAX_DENEME = 4;

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function brevoGonder(alici: string, konu: string, html: string, metin: string) {
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": BREVO_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: GONDEREN_AD, email: GONDEREN },
      replyTo: { email: YANIT },
      to: [{ email: alici }],
      subject: konu,
      htmlContent: html,
      textContent: metin,
    }),
  });
  if (!r.ok) throw new Error(`Brevo ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return (await r.json())?.messageId ?? "";
}

Deno.serve(async (req) => {
  // Yalnız zamanlanmış çağrı veya elle tetikleme (gizli anahtarla)
  const gizli = Deno.env.get("NOTIFY_SECRET");
  if (gizli && req.headers.get("x-notify-secret") !== gizli) {
    return new Response("yetkisiz", { status: 401 });
  }

  const { data: kuyruk, error } = await db
    .from("notifications_outbox")
    .select("*")
    .eq("durum", "bekliyor")
    .lt("deneme", MAX_DENEME)
    .order("created_at", { ascending: true })
    .limit(PARTI);

  if (error) return new Response(JSON.stringify({ hata: error.message }), { status: 500 });

  let gonderilen = 0, hatali = 0;
  for (const k of kuyruk ?? []) {
    try {
      if (k.kanal !== "eposta") continue;               // WhatsApp ayrı işçide

      // FİYAT BEYAZ LİSTESİ — sızıntıyı gürültüyle durdur
      if (FIYAT_YASAK.includes(k.sablon)) {
        for (const anahtar of Object.keys(k.degiskenler ?? {})) {
          if (/fiyat|price|tutar|amount|iskonto/i.test(anahtar)) {
            throw new Error(`Şablon "${k.sablon}" fiyat değişkeni kabul etmez: ${anahtar}`);
          }
        }
      }

      const { konu, html, metin } = render(k.sablon, k.dil ?? "tr", k.degiskenler ?? {});
      const id = await brevoGonder(k.alici, konu, html, metin);
      await db.from("notifications_outbox")
        .update({ durum: "gonderildi", sent_at: new Date().toISOString(), gonderim_id: id })
        .eq("id", k.id);
      gonderilen++;
    } catch (e) {
      hatali++;
      const deneme = (k.deneme ?? 0) + 1;
      await db.from("notifications_outbox")
        .update({
          deneme,
          durum: deneme >= MAX_DENEME ? "hata" : "bekliyor",
          hata_metni: String(e).slice(0, 500),
        })
        .eq("id", k.id);
    }
  }

  return new Response(JSON.stringify({ bakilan: kuyruk?.length ?? 0, gonderilen, hatali }), {
    headers: { "content-type": "application/json" },
  });
});
