-- ============================================================
-- HERKİM GROUP B2B — SATIR SEVİYESİ GÜVENLİK (0002)
--
-- BU DOSYA PROJENİN GÜVENLİK OMURGASIDIR.
-- Kural: "müşteri yalnız kendi verisini görür" JavaScript'te değil,
-- Postgres'in içinde zorlanır. Tarayıcıdaki anon anahtar herkese
-- açıktır (tasarım gereği); yetkisiz satırı veritabanı vermez.
--
-- DENETİM: en altta, products/order_items tablolarına fiyat sütunu
-- eklenmesini engelleyen bir kontrol var. Biri ileride "fiyat"
-- sütunu eklemeye kalkarsa migration KIRILIR.
-- ============================================================

-- ---------- Yardımcı fonksiyonlar (SECURITY DEFINER) ----------
-- RLS politikaları içinde profiles'a bakarken sonsuz döngüye
-- girmemek için bu fonksiyonlar RLS'i atlar (definer haklarıyla).
create or replace function public.my_rol()
returns text language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid()
$$;

create or replace function public.my_company()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_durum()
returns text language sql stable security definer set search_path = public as $$
  select c.durum from public.profiles p
  join public.companies c on c.id = p.company_id
  where p.id = auth.uid()
$$;

create or replace function public.is_personel()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(rol in ('satis','depo','yonetim'), false)
  from public.profiles where id = auth.uid()
$$;

-- Onaylı müşteri mi? (fiyat ve sipariş için şart)
create or replace function public.is_aktif_musteri()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(p.rol = 'musteri' and p.aktif and c.durum = 'aktif', false)
  from public.profiles p
  join public.companies c on c.id = p.company_id
  where p.id = auth.uid()
$$;

-- ---------- RLS'i AÇ ----------
alter table public.companies            enable row level security;
alter table public.profiles             enable row level security;
alter table public.applications         enable row level security;
alter table public.products             enable row level security;
alter table public.customer_prices      enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_item_prices    enable row level security;
alter table public.order_events         enable row level security;
alter table public.requests             enable row level security;
alter table public.notifications_outbox enable row level security;

-- ============================================================
-- ÜRÜNLER — herkese açık okuma (fiyat içermez)
-- ============================================================
create policy products_read_all on public.products
  for select using (aktif);
create policy products_write_staff on public.products
  for all using (public.my_rol() in ('satis','yonetim'))
  with check (public.my_rol() in ('satis','yonetim'));

-- ============================================================
-- FİRMALAR
-- ============================================================
create policy companies_read_own on public.companies
  for select using (id = public.my_company() or public.is_personel());
create policy companies_write_staff on public.companies
  for all using (public.my_rol() in ('satis','yonetim'))
  with check (public.my_rol() in ('satis','yonetim'));

-- ============================================================
-- PROFİLLER
-- ============================================================
create policy profiles_read_self on public.profiles
  for select using (
    id = auth.uid()
    or (company_id = public.my_company() and company_id is not null)
    or public.is_personel()
  );
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and rol = public.my_rol());  -- kendi rolünü değiştiremez
create policy profiles_manage_staff on public.profiles
  for all using (public.my_rol() = 'yonetim')
  with check (public.my_rol() = 'yonetim');

-- ============================================================
-- BAŞVURULAR — ziyaretçi YAZAMAZ (yalnız sunucu fonksiyonu yazar)
-- Okuma: yalnız personel.
-- ============================================================
create policy applications_read_staff on public.applications
  for select using (public.my_rol() in ('satis','yonetim'));
create policy applications_update_staff on public.applications
  for update using (public.my_rol() in ('satis','yonetim'))
  with check (public.my_rol() in ('satis','yonetim'));

-- ============================================================
-- MÜŞTERİ FİYATLARI — EN KRİTİK TABLO
-- Depo rolü için politika YOK. RLS'te "politika yok" = "satır yok".
-- Depo `select count(*)` çalıştırsa hata bile almaz, 0 görür.
-- ============================================================
create policy cprices_read_own on public.customer_prices
  for select using (
    (company_id = public.my_company() and public.is_aktif_musteri())
    or public.my_rol() in ('satis','yonetim')
  );
create policy cprices_write_sales on public.customer_prices
  for all using (public.my_rol() in ('satis','yonetim'))
  with check (public.my_rol() in ('satis','yonetim'));

-- Ek kalkan: ileride biri geniş bir politika eklerse bile depoyu
-- dışarıda tutan KISITLAYICI (restrictive) katman.
create policy cprices_depo_asla on public.customer_prices
  as restrictive for all
  using (coalesce(public.my_rol(), '') <> 'depo');

-- ============================================================
-- SİPARİŞLER
-- Müşteri: yalnız kendi firmasının siparişi. Ardışık numara tahmini
-- işe yaramaz; zaten ref rastgele.
-- ============================================================
create policy orders_read on public.orders
  for select using (
    company_id = public.my_company() or public.is_personel()
  );
-- Müşteri doğrudan INSERT yapamaz — sipariş yalnız place_order()
-- fonksiyonuyla oluşur (fiyat sunucuda çözülsün diye).
create policy orders_update_staff on public.orders
  for update using (public.my_rol() in ('satis','depo','yonetim'))
  with check (public.my_rol() in ('satis','depo','yonetim'));

create policy oitems_read on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id
            and (o.company_id = public.my_company() or public.is_personel()))
  );

-- Sipariş satır fiyatları: depo YOK
create policy oip_read on public.order_item_prices
  for select using (
    public.my_rol() in ('satis','yonetim')
    or exists (select 1 from public.orders o where o.id = order_id
               and o.company_id = public.my_company() and public.is_aktif_musteri())
  );
create policy oip_depo_asla on public.order_item_prices
  as restrictive for all
  using (coalesce(public.my_rol(), '') <> 'depo');

create policy oevents_read on public.order_events
  for select using (
    exists (select 1 from public.orders o where o.id = order_id
            and (o.company_id = public.my_company() or public.is_personel()))
  );

-- ============================================================
-- TALEPLER
-- ============================================================
create policy requests_read on public.requests
  for select using (
    (company_id is not null and company_id = public.my_company())
    or public.is_personel()
  );
create policy requests_insert_musteri on public.requests
  for insert with check (
    company_id = public.my_company() and public.my_rol() = 'musteri'
  );
create policy requests_update_staff on public.requests
  for update using (public.my_rol() in ('satis','yonetim'))
  with check (public.my_rol() in ('satis','yonetim'));

-- ============================================================
-- BİLDİRİM KUYRUĞU — yalnız sunucu (service_role) erişir.
-- Hiçbir politika yok: authenticated/anon HİÇBİR satır göremez.
-- ============================================================

-- ============================================================
-- DENETİM: fiyat sütunu sızmasın
-- products / order_items tablolarına fiyat benzeri sütun eklenirse
-- bu blok migration'ı kırar.
-- ============================================================
do $$
declare
  kacak text;
begin
  select string_agg(table_name || '.' || column_name, ', ')
  into kacak
  from information_schema.columns
  where table_schema = 'public'
    and table_name in ('products', 'order_items')
    and (column_name ~* 'fiyat|price|tutar|amount|iskonto|discount');
  if kacak is not null then
    raise exception 'FİYAT SIZINTISI: bu sütunlar olmamalı -> %', kacak;
  end if;
end $$;
