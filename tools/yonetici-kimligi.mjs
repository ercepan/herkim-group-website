#!/usr/bin/env node
/* ============================================================
   YÖNETİCİ KİMLİĞİ ÜRETİCİ — Herkim Group portalı

   Ne yapar: rastgele bir kullanıcı adı ve parola üretir, ikisinin
   birleşiminden PBKDF2-HMAC-SHA256 özeti çıkarır ve assets/js/data.js
   dosyasına yapıştırılacak HK_ADMIN bloğunu ekrana yazar.

   Neden özet: bu site statiktir, arka uç yoktur. data.js'i tarayıcıya inen
   herkes okuyabilir. Parolanın kendisi orada yazsaydı gizli olmazdı. Özet
   yazınca kaynağı okuyan parolayı ÖĞRENEMEZ; yalnızca deneyerek kırmayı
   deneyebilir. İşte bu yüzden parola uzun ve rastgeledir, tur sayısı da
   yüksektir: her deneme yeniden 600.000 turluk türetme gerektirir.

   Kullanım:
     node tools/yonetici-kimligi.mjs
     node tools/yonetici-kimligi.mjs --kullanici "ad" --parola "kendi parolaniz"

   ÇIKTIDAKİ KULLANICI ADI VE PAROLA HİÇBİR DOSYAYA YAZILMAZ. Ekranda bir kez
   görünür; parola yöneticinize kaydedin. Kaybederseniz bu aracı yeniden
   çalıştırıp yeni bir kimlik üretmekten başka yol yoktur.
   ÜRETİLEN PAROLAYI DEPOYA KOYMAYIN — yalnız aşağıdaki blok commit edilir.
   ============================================================ */

import { pbkdf2Sync, randomBytes, randomInt } from "node:crypto";

const TUR = 600000;   // OWASP'ın PBKDF2-HMAC-SHA256 için önerdiği tur sayısı
const UZUNLUK = 24;   // üretilen parolanın karakter sayısı

/* Karıştırılabilecek karakterler bilerek yok: 0/O ve 1/l/I.
   Yönetici bunu elle yazacak; "sıfır mıydı O muydu" hatası parolanın
   kendisinden daha çok zaman kaybettirir. */
const ALFABE = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const KULLANICI_ALFABE = "abcdefghijkmnopqrstuvwxyz23456789";

function rastgeleMetin(n, alfabe) {
  let s = "";
  for (let i = 0; i < n; i++) s += alfabe[randomInt(0, alfabe.length)];
  return s;
}

const arg = (ad) => {
  const i = process.argv.indexOf("--" + ad);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
};

const kullanici = arg("kullanici") || "hk-" + rastgeleMetin(9, KULLANICI_ALFABE);
const parola = arg("parola") || rastgeleMetin(UZUNLUK, ALFABE);

if (parola.length < 12) {
  console.error("HATA: parola en az 12 karakter olmali. Bu ozet kaynakta gorunur;");
  console.error("      kisa parola cevrimdisi denenerek kirilir.");
  process.exit(1);
}

const tuz = randomBytes(16);

/* Kullanıcı adı ve parola BİRLİKTE özetlenir. İki sonucu var: ikisi de
   kaynakta görünmez, ve giriş ekranı "kullanıcı adı yanlış" ile "parola
   yanlış" arasında ayrım yapamaz — saldırgana hangi yarısını tutturduğunu
   söylemek işini yarı yarıya kolaylaştırırdı. */
const ozet = pbkdf2Sync(
  Buffer.from(kullanici + " " + parola, "utf8"),
  tuz, TUR, 32, "sha256"
).toString("hex");

// Entropi yalnızca bilinen alfabeden rastgele ürettiysek hesaplanabilir
const bit = arg("parola") ? null : Math.floor(UZUNLUK * Math.log2(ALFABE.length));

const satir = [];
satir.push("");
satir.push("=====================================================");
satir.push("  YONETICI KIMLIGI — BU EKRAN BIR KEZ GORUNUR");
satir.push("=====================================================");
satir.push("");
satir.push("  Kullanici adi :  " + kullanici);
satir.push("  Parola        :  " + parola);
if (bit) satir.push("  Guc           :  ~" + bit + " bit (rastgele uretildi)");
satir.push("");
satir.push("  Parolayi parola yoneticinize KAYDEDIN. Hicbir dosyaya yazilmadi.");
satir.push("  Bu iki satiri depoya, e-postaya, WhatsApp'a KOYMAYIN.");
satir.push("");
satir.push("=====================================================");
satir.push("  assets/js/data.js — HK_ADMIN blogunu bununla degistirin");
satir.push("=====================================================");
satir.push("");
console.log(satir.join("\n"));

console.log("const HK_ADMIN = {");
console.log("  /* Yönetici kimliği. Kullanıcı adı ve parola BURADA YAZMAZ: aşağıdaki ozet,");
console.log("     ikisinin birleşiminden PBKDF2-HMAC-SHA256 ile " + TUR + " turda türetildi.");
console.log("     Bu dosyayı okuyan parolayı öğrenemez.");
console.log("");
console.log("     Yeni kimlik üretmek için:  node tools/yonetici-kimligi.mjs");
console.log("     (Araç tools/ altındadır, _config.yml ile yayından hariç tutulur.) */");
console.log('  tuz: "' + tuz.toString("hex") + '",');
console.log("  tur: " + TUR + ",");
console.log('  ozet: "' + ozet + '",');
console.log("");
console.log("  /* Kaba kuvvet basamakları: [kaçıncı hatadan itibaren, kaç saniye kilit].");
console.log("     Yukarıdan aşağıya okunur, ilk uyan basamak uygulanır. */");
console.log("  gecikme: [");
console.log("    [10, 21600],  // 10. hatadan sonra 6 saat");
console.log("    [7, 3600],    // 7. hatadan sonra 1 saat");
console.log("    [5, 900],     // 5. hatadan sonra 15 dakika");
console.log("    [4, 300],     // 4. hatadan sonra 5 dakika");
console.log("    [3, 60]       // 3. hatadan sonra 1 dakika");
console.log("  ]");
console.log("};");
console.log("");
