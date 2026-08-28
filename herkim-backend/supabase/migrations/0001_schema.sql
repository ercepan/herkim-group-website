-- ============================================================
-- HERKİM GROUP B2B — VERİTABANI ŞEMASI (0001)
-- Postgres 15+ / Supabase. Bölge: EU Central (Frankfurt).
--
-- TASARIM İLKESİ: Fiyat AYRI TABLOLARDA yaşar.
-- products ve order_items tablolarında fiyat sütunu YOKTUR ve
-- olmayacaktır (0002'deki denetim bunu zorlar). Sebep: Postgres
-- RLS satır gizler, sütun gizleyemez — depo rolünün fiyatı hiç
-- görmemesi ancak fiyat ayrı tabloda olursa garanti edilir.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Yardımcı: tahmin edilemez iş numarası ----------
-- Ardışık numara (HG-2026-1045) rakibe aylık sipariş adedini verir.
-- Karışan karakterler (0/O, 1/I) alfabede yok — telefonda okunabilir.
create or replace function public.gen_ref(prefix text)
returns text language plpgsql as $$
declare
  alfabe constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  s text := '';
  i int;
begin
  for i in 1..8 loop
    s := s || substr(alfabe, 1 + floor(random() * length(alfabe))::int, 1);
  end loop;
  return prefix || '-' || to_char(now(), 'YYYY') || '-' || s;
end $$;

-- ============================================================
-- FİRMALAR
-- ============================================================
create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  unvan         text not null,
  vergi_dairesi text,
  vkn           text,                       -- VKN(10) veya TCKN(11)
  adres         text,
  telefon       text,
  web           text,
  durum         text not null default 'beklemede'
                check (durum in ('beklemede','aktif','askida','red')),
  temsilci_id   uuid,                       -- profiles.id (satış temsilcisi)
  cari_kod      text,                       -- Logo Tiger eşleşmesi (ileride)
  dil           text not null default 'tr' check (dil in ('tr','en','ru')),
  notlar        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index companies_vkn_uniq on public.companies (vkn) where vkn is not null;
create index companies_durum_idx on public.companies (durum);

-- ============================================================
-- KULLANICI PROFİLLERİ (auth.users ile 1-1)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete set null,
  rol         text not null default 'musteri'
              check (rol in ('musteri','satis','depo','yonetim')),
  ad_soyad    text,
  telefon     text,
  eposta      text,
  -- Firma içinde sipariş verme yetkisi (asistan görebilir ama veremeyebilir)
  siparis_yetkisi boolean not null default true,
  aktif       boolean not null default true,
  dil         text not null default 'tr' check (dil in ('tr','en','ru')),
  son_giris   timestamptz,
  created_at  timestamptz not null default now()
);
create index profiles_company_idx on public.profiles (company_id);
create index profiles_rol_idx on public.profiles (rol);

alter table public.companies
  add constraint companies_temsilci_fk foreign key (temsilci_id)
  references public.profiles(id) on delete set null;

-- ============================================================
-- HESAP BAŞVURULARI (auth kullanıcısı henüz YOK)
-- ============================================================
create table public.applications (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null unique default public.gen_ref('BV'),
  unvan         text not null,
  vergi_dairesi text not null,
  vkn           text not null,
  adres         text,
  telefon       text not null,
  web           text,
  yetkili_ad    text not null,
  yetkili_eposta text not null,
  yetkili_cep   text not null,
  mesaj         text,
  kvkk_onay     boolean not null default false,
  eti_onay      boolean not null default false,   -- ticari elektronik ileti
  wa_onay       boolean not null default false,   -- WhatsApp bildirim izni
  durum         text not null default 'beklemede'
                check (durum in ('beklemede','onay','red','ek_bilgi')),
  red_kodu      text,
  karar_veren   uuid references public.profiles(id),
  karar_at      timestamptz,
  company_id    uuid references public.companies(id),
  -- Pazarlama atfı (hangi kanaldan geldi)
  kaynak        jsonb,
  ip_hash       text,
  created_at    timestamptz not null default now()
);
create index applications_durum_idx on public.applications (durum, created_at desc);
create index applications_vkn_idx on public.applications (vkn);

-- ============================================================
-- ÜRÜNLER — FİYAT YOK
-- ============================================================
create table public.products (
  id          int primary key,              -- data.js'teki id ile aynı
  kod         text unique,                  -- iç ürün kodu
  stok_kodu   text,                         -- Logo Tiger (ileride)
  ad_tr       text not null,
  ad_en       text not null,
  ad_ru       text not null,
  kategori    text not null,                -- asit/alkol/amonyum/deri/sodyum/solvent
  marka       text,
  ambalaj     text,                         -- "25 kg torba" (gerçek veri gelince)
  birim       text not null default 'adet',
  aktif       boolean not null default true,
  sira        int default 0
);
create index products_kategori_idx on public.products (kategori) where aktif;

-- ============================================================
-- MÜŞTERİYE ÖZEL FİYATLAR — GİZLİ TABLO
-- Bu tabloya erişim: yalnız kendi firması (aktifse) + satış + yönetim.
-- Depo rolü için politika YOK → satır de YOK.
-- ============================================================
create table public.customer_prices (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  product_id   int not null references public.products(id),
  birim_fiyat  numeric(12,4) not null check (birim_fiyat >= 0),
  para_birimi  text not null default 'TRY' check (para_birimi in ('TRY','USD','EUR')),
  min_miktar   numeric(12,3) default 1,
  gecerli_bas  date not null default current_date,
  gecerli_bit  date,
  giren_id     uuid references public.profiles(id),
  created_at   timestamptz not null default now()
);
create index cprices_lookup_idx on public.customer_prices (company_id, product_id, gecerli_bas desc);

-- ============================================================
-- SİPARİŞLER (sipariş TALEBİ)
-- ============================================================
create table public.orders (
  id           uuid primary key default gen_random_uuid(),
  ref          text not null unique default public.gen_ref('HG'),
  company_id   uuid not null references public.companies(id),
  veren_id     uuid references public.profiles(id),
  durum        text not null default 'beklemede'
               check (durum in ('beklemede','onay','uretim','sevk','teslim','iptal')),
  musteri_notu text,
  ic_not       text,                         -- yalnız personel görür
  teslim_adres text,
  tahmini_teslim date,
  tasiyici     text,
  takip_no     text,
  irsaliye_no  text,
  logo_order_no text,                        -- Logo Tiger (ileride)
  kaynak       jsonb,                        -- pazarlama atfı
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index orders_company_idx on public.orders (company_id, created_at desc);
create index orders_durum_idx on public.orders (durum) where durum in ('beklemede','onay','uretim','sevk');

-- Sipariş kalemleri — FİYAT YOK
create table public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  product_id int not null references public.products(id),
  miktar     numeric(12,3) not null check (miktar > 0),
  birim      text not null default 'adet',
  not_metni  text
);
create index order_items_order_idx on public.order_items (order_id);

-- Sipariş satır fiyatları — AYRI TABLO, depo göremez
create table public.order_item_prices (
  order_item_id uuid primary key references public.order_items(id) on delete cascade,
  order_id      uuid not null references public.orders(id) on delete cascade,
  birim_fiyat   numeric(12,4) not null,
  para_birimi   text not null default 'TRY',
  kaynak        text not null default 'liste'  -- liste | elle | teklif
);
create index oip_order_idx on public.order_item_prices (order_id);

-- Durum geçiş kaydı (denetim)
create table public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  eski_durum text,
  yeni_durum text not null,
  aktor_id   uuid references public.profiles(id),
  aciklama   text,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

-- ============================================================
-- TALEPLER (numune / teknik destek / doküman)
-- ============================================================
create table public.requests (
  id          uuid primary key default gen_random_uuid(),
  ref         text not null unique default public.gen_ref('TL'),
  company_id  uuid references public.companies(id),
  acan_id     uuid references public.profiles(id),
  tur         text not null default 'genel'
              check (tur in ('genel','numune','teknik','dokuman','fiyat')),
  konu        text not null,
  detay       text,
  product_id  int references public.products(id),
  belge_turu  text,                          -- TDS | SDS | KATALOG
  -- Giriş yapmamış ziyaretçi için iletişim bilgisi
  misafir_ad  text,
  misafir_eposta text,
  misafir_tel text,
  durum       text not null default 'acik' check (durum in ('acik','yanit','kapali')),
  yanit       text,
  yanitlayan_id uuid references public.profiles(id),
  yanit_at    timestamptz,
  kaynak      jsonb,
  created_at  timestamptz not null default now()
);
create index requests_durum_idx on public.requests (durum, created_at desc);
create index requests_company_idx on public.requests (company_id, created_at desc);

-- ============================================================
-- BİLDİRİM KUYRUĞU (e-posta / WhatsApp)
-- ============================================================
create table public.notifications_outbox (
  id          uuid primary key default gen_random_uuid(),
  kanal       text not null check (kanal in ('eposta','whatsapp')),
  sablon      text not null,
  alici       text not null,
  dil         text not null default 'tr',
  degiskenler jsonb not null default '{}'::jsonb,
  durum       text not null default 'bekliyor'
              check (durum in ('bekliyor','gonderildi','hata','iptal')),
  deneme      int not null default 0,
  hata_metni  text,
  gonderim_id text,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz
);
create index outbox_bekleyen_idx on public.notifications_outbox (durum, created_at)
  where durum = 'bekliyor';

-- ============================================================
-- updated_at otomatiği
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

create trigger companies_touch before update on public.companies
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
