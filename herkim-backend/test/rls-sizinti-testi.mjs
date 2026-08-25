/* ============================================================
   HERKİM B2B — SIZINTI TESTİ (projenin tek kritik güvenlik kapısı)

   Ne yapar: migration'ları gerçek bir Postgres'e (WASM/PGlite)
   uygular, iki müşteri + satış + depo hesabı kurar ve şunları
   KANITLAR: müşteri başkasının fiyatını/siparişini göremez,
   depo hiçbir fiyat göremez, fiyat sunucuda çözülür, durum
   geçişleri yetkisiz yapılamaz.

   ÇALIŞTIRMA:  npm install && npm test
   BU TEST KIRMIZIYSA CANLIYA ÇIKILMAZ.
   ============================================================ */
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Migration klasörü — depo kökünden çalıştırın: node test/rls-sizinti-testi.mjs
const DIR = fileURLToPath(new URL('../supabase/migrations', import.meta.url));
const db = await PGlite.create();
// pgcrypto PGlite'ta yok — gen_random_uuid Postgres 13+ zaten çekirdekte
await db.exec("create schema if not exists ext;");
const out = [];
const ok = (n, c, d = '') => out.push((c ? 'GEÇTİ  ' : 'KALDI  ') + n + (d ? ' → ' + d : ''));

// ---- Supabase ortamı taklidi: auth şeması, roller, auth.uid() ----
await db.exec(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key, email text);
  create role anon; create role authenticated; create role service_role;
  create table public._ctx (uid uuid);
  insert into public._ctx values (null);
  create or replace function auth.uid() returns uuid
    language sql stable as $$ select uid from public._ctx limit 1 $$;
`);

// ---- Migration'ları sırayla çalıştır ----
for (const f of ['0001_schema.sql','0002_rls.sql','0003_rpc.sql','0004_seed_products.sql']) {
  try {
    let sql = fs.readFileSync(`${DIR}/${f}`, 'utf8');
    sql = sql.replace(/create extension if not exists pgcrypto;/, '-- (test: pgcrypto Supabase\'da hazır)');
    await db.exec(sql);
    ok('migration ' + f, true);
  } catch (e) {
    ok('migration ' + f, false, e.message);
    console.log(out.join('\n')); process.exit(1);
  }
}

// PGlite'ta superuser RLS'i atlar → Supabase'deki gibi zorla
await db.exec(`
  do $$ declare t text; begin
    for t in select tablename from pg_tables where schemaname='public'
      and tablename not in ('_ctx') loop
      execute format('alter table public.%I force row level security', t);
      execute format('grant select, insert, update on public.%I to anon, authenticated', t);
    end loop;
  end $$;
  grant usage on schema public to anon, authenticated;
  grant execute on all functions in schema public to anon, authenticated;
  grant all on public._ctx to anon, authenticated;
`);

const asUser = async (uid, sql) => {
  await db.exec(`update public._ctx set uid = ${uid ? `'${uid}'::uuid` : 'null'}`);
  await db.exec(`set role authenticated`);
  try { return await db.query(sql); }
  finally { await db.exec(`reset role`); }
};

// ---- Test verisi (superuser olarak) ----
const U = { musA:'11111111-1111-1111-1111-111111111111', musB:'22222222-2222-2222-2222-222222222222',
            satis:'33333333-3333-3333-3333-333333333333', depo:'44444444-4444-4444-4444-444444444444' };
await db.exec(`
  insert into auth.users(id,email) values
    ('${U.musA}','a@a.example'),('${U.musB}','b@b.example'),
    ('${U.satis}','s@herkim.example'),('${U.depo}','d@herkim.example');
  insert into companies(id,unvan,vkn,durum) values
    ('aaaaaaaa-0000-0000-0000-000000000001','A Deri A.Ş.','1111111111','aktif'),
    ('bbbbbbbb-0000-0000-0000-000000000002','B Tekstil Ltd.','2222222222','aktif');
  insert into profiles(id,company_id,rol,ad_soyad,eposta) values
    ('${U.musA}','aaaaaaaa-0000-0000-0000-000000000001','musteri','A Yetkili','a@a.example'),
    ('${U.musB}','bbbbbbbb-0000-0000-0000-000000000002','musteri','B Yetkili','b@b.example'),
    ('${U.satis}',null,'satis','Satışçı','s@herkim.example'),
    ('${U.depo}',null,'depo','Depocu','d@herkim.example');
  insert into customer_prices(company_id,product_id,birim_fiyat,para_birimi) values
    ('aaaaaaaa-0000-0000-0000-000000000001',22,145.5000,'TRY'),
    ('aaaaaaaa-0000-0000-0000-000000000001',11,88.2500,'TRY'),
    ('bbbbbbbb-0000-0000-0000-000000000002',22,131.0000,'TRY');
`);

// ================= SIZINTI TESTLERİ =================
let r;

// 1) Müşteri A yalnız KENDİ fiyatını görür
r = await asUser(U.musA, 'select company_id, product_id, birim_fiyat from customer_prices');
ok('Müşteri A yalnız kendi fiyatlarını görür (2 satır)', r.rows.length === 2, r.rows.length + ' satır');
ok('Müşteri A, B\'nin fiyatını GÖREMEZ',
   !r.rows.some(x => x.company_id === 'bbbbbbbb-0000-0000-0000-000000000002'));

// 2) DEPO hiçbir fiyat göremez
r = await asUser(U.depo, 'select count(*)::int n from customer_prices');
ok('Depo fiyat tablosunda 0 satır görür', r.rows[0].n === 0, r.rows[0].n + ' satır');

// 3) Satış hepsini görür
r = await asUser(U.satis, 'select count(*)::int n from customer_prices');
ok('Satış tüm fiyatları görür (3)', r.rows[0].n === 3, r.rows[0].n + ' satır');

// 4) Sipariş: fiyat SUNUCUDA çözülür (istemci fiyat göndermiyor)
r = await asUser(U.musA, `select public.place_order('[{"product_id":22,"miktar":3},{"product_id":11,"miktar":2}]'::jsonb,'Test notu') res`);
const res = r.rows[0].res;
ok('Müşteri A sipariş verebildi', !!res.ref, res.ref);
ok('İki kalem işlendi', res.kalem === 2, 'kalem=' + res.kalem);
ok('Fiyatı olmayan kalem yok', res.fiyatsiz_kalem === 0);
r = await db.query(`select oip.birim_fiyat from order_item_prices oip
  join orders o on o.id = oip.order_id where o.ref = '${res.ref}' order by oip.birim_fiyat`);
ok('Fiyatlar sunucu tarafında listeden çözüldü (88.25 + 145.50)',
   r.rows.length === 2 && Number(r.rows[0].birim_fiyat) === 88.25 && Number(r.rows[1].birim_fiyat) === 145.5,
   JSON.stringify(r.rows.map(x => x.birim_fiyat)));

// 5) Müşteri B, A'nın siparişini GÖREMEZ (ref bilse bile)
r = await asUser(U.musB, `select count(*)::int n from orders where ref = '${res.ref}'`);
ok('Müşteri B, A\'nın siparişini göremez', r.rows[0].n === 0, r.rows[0].n + ' satır');
r = await asUser(U.musB, `select count(*)::int n from order_item_prices`);
ok('Müşteri B, A\'nın satır fiyatlarını göremez', r.rows[0].n === 0, r.rows[0].n + ' satır');

// 6) Depo siparişi görür ama fiyatını göremez
r = await asUser(U.depo, `select count(*)::int n from orders`);
ok('Depo siparişleri görür', r.rows[0].n === 1, r.rows[0].n + ' satır');
r = await asUser(U.depo, `select count(*)::int n from order_item_prices`);
ok('Depo sipariş satır fiyatını GÖREMEZ', r.rows[0].n === 0, r.rows[0].n + ' satır');

// 7) Müşteri kendi siparişini "teslim" yapamaz
const oid = (await db.query(`select id from orders where ref='${res.ref}'`)).rows[0].id;
try {
  await asUser(U.musA, `select public.advance_order('${oid}'::uuid,'teslim')`);
  ok('Müşteri siparişi "teslim" yapamaz', false, 'izin verildi!');
} catch (e) { ok('Müşteri siparişi "teslim" yapamaz', true, 'reddedildi'); }

// 8) Depo "beklemede → teslim" atlayamaz
try {
  await asUser(U.depo, `select public.advance_order('${oid}'::uuid,'teslim')`);
  ok('Depo durum atlayamaz (beklemede→teslim)', false, 'izin verildi!');
} catch (e) { ok('Depo durum atlayamaz (beklemede→teslim)', true, 'reddedildi'); }

// 9) Doğru akış: satış onaylar → depo üretime alır
await asUser(U.satis, `select public.advance_order('${oid}'::uuid,'onay')`);
await asUser(U.depo,  `select public.advance_order('${oid}'::uuid,'uretim')`);
r = await db.query(`select durum from orders where id='${oid}'`);
ok('Doğru akış çalışıyor (satış onay → depo üretim)', r.rows[0].durum === 'uretim', r.rows[0].durum);

// 10) Askıya alınmış firma sipariş veremez
await db.exec(`update companies set durum='askida' where id='aaaaaaaa-0000-0000-0000-000000000001'`);
try {
  await asUser(U.musA, `select public.place_order('[{"product_id":22,"miktar":1}]'::jsonb)`);
  ok('Onaysız/askıdaki firma sipariş veremez', false, 'izin verildi!');
} catch (e) { ok('Onaysız/askıdaki firma sipariş veremez', true, 'reddedildi'); }
await db.exec(`update companies set durum='aktif' where id='aaaaaaaa-0000-0000-0000-000000000001'`);

// 11) Giriş yapmamış ziyaretçi: yalnız ürün görür
await db.exec(`update public._ctx set uid=null; set role anon;`);
const anonProd = await db.query('select count(*)::int n from products');
let anonPrice = -1, anonOrders = -1;
try { anonPrice = (await db.query('select count(*)::int n from customer_prices')).rows[0].n; } catch(e) { anonPrice = -2; }
try { anonOrders = (await db.query('select count(*)::int n from orders')).rows[0].n; } catch(e) { anonOrders = -2; }
await db.exec('reset role');
ok('Ziyaretçi ürünleri görür (42)', anonProd.rows[0].n === 42, anonProd.rows[0].n + ' ürün');
ok('Ziyaretçi HİÇBİR fiyat göremez', anonPrice === 0 || anonPrice === -2, 'n=' + anonPrice);
ok('Ziyaretçi HİÇBİR sipariş göremez', anonOrders === 0 || anonOrders === -2, 'n=' + anonOrders);

// 12) Başvuru akışı (ziyaretçi)
await db.exec(`update public._ctx set uid=null; set role anon;`);
let bref = null, dupBlocked = false;
try {
  bref = (await db.query(`select public.apply_for_account('Test Kimya A.Ş.','Tuzla','4621003580','02160000000','Ali Test','ali@test.example','05320000000',null,null,null,true) r`)).rows[0].r;
} catch (e) { bref = 'HATA: ' + e.message; }
try {
  await db.query(`select public.apply_for_account('Test Kimya A.Ş.','Tuzla','4621003580','02160000000','Ali Test','ali@test.example','05320000000',null,null,null,true)`);
} catch (e) { dupBlocked = true; }
await db.exec('reset role');
ok('Ziyaretçi başvuru yapabilir', typeof bref === 'string' && bref.startsWith('BV-'), bref);
ok('Mükerrer başvuru engellendi', dupBlocked);
r = await db.query(`select count(*)::int n from notifications_outbox where sablon in ('basvuru_alindi','ic_basvuru')`);
ok('Başvuru 2 bildirim üretti (müşteri + iç)', r.rows[0].n === 2, r.rows[0].n + ' bildirim');

// 13) KVKK onayı olmadan başvuru reddedilir
await db.exec(`update public._ctx set uid=null; set role anon;`);
let kvkkBlocked = false;
try { await db.query(`select public.apply_for_account('X A.Ş.','Y','8123456786','021','Z','z@z.example','053',null,null,null,false)`); }
catch (e) { kvkkBlocked = true; }
await db.exec('reset role');
ok('KVKK onayı olmadan başvuru reddedilir', kvkkBlocked);

// 14) Ziyaretçi başvuru tablosunu OKUYAMAZ
await db.exec(`set role anon`);
let anonApps = -1;
try { anonApps = (await db.query('select count(*)::int n from applications')).rows[0].n; } catch(e) { anonApps = -2; }
await db.exec('reset role');
ok('Ziyaretçi başvuruları okuyamaz', anonApps === 0 || anonApps === -2, 'n=' + anonApps);

// 15) products/order_items tablolarında fiyat sütunu yok
r = await db.query(`select count(*)::int n from information_schema.columns
  where table_schema='public' and table_name in ('products','order_items')
  and column_name ~* 'fiyat|price|tutar'`);
ok('products/order_items içinde fiyat sütunu YOK', r.rows[0].n === 0);

console.log(out.join('\n'));
const kaldi = out.filter(x => x.startsWith('KALDI')).length;
console.log('\n' + (out.length - kaldi) + '/' + out.length + ' test geçti');
process.exit(kaldi ? 1 : 0);
