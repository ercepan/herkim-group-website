-- ============================================================
-- HERKİM GROUP B2B — SUNUCU FONKSİYONLARI (0003)
--
-- İLKE: İstemci fiyat GÖNDEREMEZ. Sipariş fonksiyonunun imzasında
-- fiyat parametresi yoktur; tarayıcı yalnız (ürün, miktar) yollar,
-- birim fiyatı sunucu kendi çözer. "Gelen fiyat doğru mu" diye
-- kontrol yazmak yerine fiyatın gireceği deliği kapattık.
-- ============================================================

-- ---------- Hesap başvurusu (giriş yapmamış ziyaretçi) ----------
create or replace function public.apply_for_account(
  p_unvan text, p_vergi_dairesi text, p_vkn text,
  p_telefon text, p_yetkili_ad text, p_yetkili_eposta text, p_yetkili_cep text,
  p_adres text default null, p_web text default null, p_mesaj text default null,
  p_kvkk boolean default false, p_eti boolean default false, p_wa boolean default false,
  p_kaynak jsonb default null
) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_ref text;
  v_temiz_vkn text := regexp_replace(coalesce(p_vkn,''), '\D', '', 'g');
begin
  if not p_kvkk then
    raise exception 'KVKK aydınlatma onayı gereklidir.' using errcode = 'P0001';
  end if;
  if length(v_temiz_vkn) not in (10, 11) then
    raise exception 'Vergi/TC kimlik numarası geçersiz.' using errcode = 'P0001';
  end if;
  if position('@' in coalesce(p_yetkili_eposta,'')) < 2 then
    raise exception 'Geçerli bir e-posta adresi gereklidir.' using errcode = 'P0001';
  end if;

  -- Mükerrer başvuru: aynı VKN ile bekleyen kayıt varsa yenisini açma
  if exists (select 1 from applications
             where regexp_replace(vkn, '\D', '', 'g') = v_temiz_vkn
               and durum = 'beklemede') then
    raise exception 'Bu vergi numarasıyla bekleyen bir başvurunuz var.' using errcode = 'P0001';
  end if;
  -- Zaten aktif firma
  if exists (select 1 from companies
             where regexp_replace(coalesce(vkn,''), '\D', '', 'g') = v_temiz_vkn
               and durum = 'aktif') then
    raise exception 'Bu firma için aktif bir hesap zaten var.' using errcode = 'P0001';
  end if;

  insert into applications (unvan, vergi_dairesi, vkn, adres, telefon, web,
                            yetkili_ad, yetkili_eposta, yetkili_cep, mesaj,
                            kvkk_onay, eti_onay, wa_onay, kaynak)
  values (left(p_unvan,200), left(p_vergi_dairesi,100), v_temiz_vkn,
          left(p_adres,300), left(p_telefon,30), left(p_web,120),
          left(p_yetkili_ad,100), lower(left(p_yetkili_eposta,150)), left(p_yetkili_cep,30),
          left(p_mesaj,1000), p_kvkk, p_eti, p_wa, p_kaynak)
  returning ref into v_ref;

  -- Bildirimler: müşteriye teyit + satışa iç bildirim
  insert into notifications_outbox (kanal, sablon, alici, degiskenler)
  values ('eposta', 'basvuru_alindi', lower(p_yetkili_eposta),
          jsonb_build_object('ref', v_ref, 'unvan', p_unvan, 'yetkili', p_yetkili_ad)),
         ('eposta', 'ic_basvuru', 'sales@herkimgroup.com',
          jsonb_build_object('ref', v_ref, 'unvan', p_unvan, 'vkn', v_temiz_vkn,
                             'vergi_dairesi', p_vergi_dairesi, 'yetkili', p_yetkili_ad,
                             'eposta', p_yetkili_eposta, 'cep', p_yetkili_cep,
                             'telefon', p_telefon, 'kaynak', coalesce(p_kaynak, '{}'::jsonb)));
  return v_ref;
end $$;

revoke all on function public.apply_for_account from public;
grant execute on function public.apply_for_account to anon, authenticated;

-- ---------- Başvuruyu onayla (satış) ----------
create or replace function public.approve_application(p_app_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  a applications%rowtype;
  v_company uuid;
begin
  if public.my_rol() not in ('satis','yonetim') then
    raise exception 'Yetkiniz yok.' using errcode = '42501';
  end if;
  select * into a from applications where id = p_app_id and durum = 'beklemede';
  if not found then
    raise exception 'Başvuru bulunamadı veya zaten karara bağlanmış.' using errcode = 'P0001';
  end if;

  insert into companies (unvan, vergi_dairesi, vkn, adres, telefon, web, durum, temsilci_id)
  values (a.unvan, a.vergi_dairesi, a.vkn, a.adres, a.telefon, a.web, 'aktif', auth.uid())
  returning id into v_company;

  update applications
     set durum = 'onay', karar_veren = auth.uid(), karar_at = now(), company_id = v_company
   where id = p_app_id;

  -- Davet e-postası: müşteri kendi şifresini belirleyecek
  insert into notifications_outbox (kanal, sablon, alici, degiskenler)
  values ('eposta', 'hesap_onaylandi', a.yetkili_eposta,
          jsonb_build_object('ref', a.ref, 'unvan', a.unvan, 'yetkili', a.yetkili_ad,
                             'company_id', v_company));
  return v_company;
end $$;

revoke all on function public.approve_application from public;
grant execute on function public.approve_application to authenticated;

-- ---------- SİPARİŞ OLUŞTUR — fiyat parametresi YOK ----------
-- p_items: [{"product_id": 22, "miktar": 3}, ...]
create or replace function public.place_order(
  p_items jsonb,
  p_not text default null,
  p_teslim_adres text default null,
  p_kaynak jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.my_company();
  v_order_id uuid;
  v_ref text;
  it jsonb;
  v_item_id uuid;
  v_fiyat numeric(12,4);
  v_para text;
  v_fiyatsiz int := 0;
  v_kalem int := 0;
begin
  if not public.is_aktif_musteri() then
    raise exception 'Sipariş vermek için onaylı müşteri hesabı gerekir.' using errcode = '42501';
  end if;
  if not exists (select 1 from profiles where id = auth.uid() and siparis_yetkisi) then
    raise exception 'Bu kullanıcının sipariş verme yetkisi yok.' using errcode = '42501';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Sipariş kalemi bulunamadı.' using errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'Tek siparişte en fazla 100 kalem olabilir.' using errcode = 'P0001';
  end if;

  insert into orders (company_id, veren_id, musteri_notu, teslim_adres, kaynak)
  values (v_company, auth.uid(), left(p_not, 500), left(p_teslim_adres, 300), p_kaynak)
  returning id, ref into v_order_id, v_ref;

  for it in select * from jsonb_array_elements(p_items) loop
    if not exists (select 1 from products where id = (it->>'product_id')::int and aktif) then
      continue;                                   -- bilinmeyen ürün sessizce atlanır
    end if;
    insert into order_items (order_id, product_id, miktar, birim)
    select v_order_id, (it->>'product_id')::int,
           least(greatest((it->>'miktar')::numeric, 0.001), 999999),
           coalesce(p.birim, 'adet')
      from products p where p.id = (it->>'product_id')::int
    returning id into v_item_id;
    v_kalem := v_kalem + 1;

    -- Fiyatı SUNUCU çözer: müşterinin geçerli liste fiyatı
    select cp.birim_fiyat, cp.para_birimi into v_fiyat, v_para
      from customer_prices cp
     where cp.company_id = v_company
       and cp.product_id = (it->>'product_id')::int
       and cp.gecerli_bas <= current_date
       and (cp.gecerli_bit is null or cp.gecerli_bit >= current_date)
     order by cp.gecerli_bas desc
     limit 1;

    if v_fiyat is not null then
      insert into order_item_prices (order_item_id, order_id, birim_fiyat, para_birimi, kaynak)
      values (v_item_id, v_order_id, v_fiyat, v_para, 'liste');
    else
      v_fiyatsiz := v_fiyatsiz + 1;               -- satış elle fiyatlayacak
    end if;
  end loop;

  if v_kalem = 0 then
    delete from orders where id = v_order_id;
    raise exception 'Geçerli ürün bulunamadı.' using errcode = 'P0001';
  end if;

  insert into order_events (order_id, yeni_durum, aktor_id, aciklama)
  values (v_order_id, 'beklemede', auth.uid(), 'Web sitesinden sipariş talebi');

  -- Bildirimler
  insert into notifications_outbox (kanal, sablon, alici, degiskenler)
  select 'eposta', 'siparis_alindi', p.eposta,
         jsonb_build_object('ref', v_ref, 'kalem', v_kalem)
    from profiles p where p.id = auth.uid() and p.eposta is not null;

  insert into notifications_outbox (kanal, sablon, alici, degiskenler)
  values ('eposta', 'ic_siparis', 'sales@herkimgroup.com',
          jsonb_build_object('ref', v_ref, 'kalem', v_kalem, 'fiyatsiz', v_fiyatsiz,
                             'firma', (select unvan from companies where id = v_company)));

  return jsonb_build_object('ref', v_ref, 'id', v_order_id,
                            'kalem', v_kalem, 'fiyatsiz_kalem', v_fiyatsiz);
end $$;

revoke all on function public.place_order from public;
grant execute on function public.place_order to authenticated;

-- ---------- Sipariş durumunu ilerlet (personel) ----------
-- Geçiş kuralları sunucuda: müşteri kendi siparişini "teslim" yapamaz,
-- "beklemede → teslim" atlaması yapılamaz.
create or replace function public.advance_order(p_order_id uuid, p_yeni text, p_aciklama text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  o orders%rowtype;
  v_rol text := public.my_rol();
  v_izin boolean := false;
begin
  select * into o from orders where id = p_order_id;
  if not found then raise exception 'Sipariş bulunamadı.' using errcode = 'P0001'; end if;

  -- Kim hangi geçişi yapabilir
  if v_rol = 'satis' and o.durum = 'beklemede' and p_yeni in ('onay','iptal') then v_izin := true; end if;
  if v_rol = 'depo'  and ((o.durum = 'onay'   and p_yeni = 'uretim')
                       or (o.durum = 'uretim' and p_yeni = 'sevk')
                       or (o.durum = 'sevk'   and p_yeni = 'teslim')) then v_izin := true; end if;
  if v_rol = 'yonetim' then v_izin := true; end if;

  if not v_izin then
    raise exception 'Bu durum geçişine yetkiniz yok (% -> %).', o.durum, p_yeni using errcode = '42501';
  end if;

  update orders set durum = p_yeni,
                    tahmini_teslim = case when p_yeni = 'onay'
                                          then current_date + 14 else tahmini_teslim end
   where id = p_order_id;

  insert into order_events (order_id, eski_durum, yeni_durum, aktor_id, aciklama)
  values (p_order_id, o.durum, p_yeni, auth.uid(), p_aciklama);

  -- Müşteriye durum bildirimi
  insert into notifications_outbox (kanal, sablon, alici, dil, degiskenler)
  select 'eposta', 'siparis_' || p_yeni, p.eposta, coalesce(p.dil,'tr'),
         jsonb_build_object('ref', o.ref, 'takip_no', coalesce(o.takip_no,''),
                            'tasiyici', coalesce(o.tasiyici,''))
    from profiles p
   where p.company_id = o.company_id and p.eposta is not null and p.rol = 'musteri'
     and p_yeni in ('onay','sevk','teslim');

  return p_yeni;
end $$;

revoke all on function public.advance_order from public;
grant execute on function public.advance_order to authenticated;

-- ---------- Misafir talebi (doküman / iletişim) ----------
create or replace function public.submit_request(
  p_tur text, p_konu text, p_detay text default null,
  p_product_id int default null, p_belge_turu text default null,
  p_ad text default null, p_eposta text default null, p_tel text default null,
  p_kaynak jsonb default null
) returns text
language plpgsql security definer set search_path = public as $$
declare v_ref text; v_company uuid := public.my_company();
begin
  if coalesce(p_konu,'') = '' then
    raise exception 'Konu gereklidir.' using errcode = 'P0001';
  end if;
  if v_company is null and position('@' in coalesce(p_eposta,'')) < 2
     and length(regexp_replace(coalesce(p_tel,''), '\D', '', 'g')) < 7 then
    raise exception 'İletişim bilgisi gereklidir.' using errcode = 'P0001';
  end if;

  insert into requests (company_id, acan_id, tur, konu, detay, product_id, belge_turu,
                        misafir_ad, misafir_eposta, misafir_tel, kaynak)
  values (v_company, auth.uid(),
          coalesce(nullif(p_tur,''),'genel'), left(p_konu,200), left(p_detay,2000),
          p_product_id, p_belge_turu,
          left(p_ad,100), lower(left(p_eposta,150)), left(p_tel,30), p_kaynak)
  returning ref into v_ref;

  insert into notifications_outbox (kanal, sablon, alici, degiskenler)
  values ('eposta', 'ic_talep', 'sales@herkimgroup.com',
          jsonb_build_object('ref', v_ref, 'tur', p_tur, 'konu', p_konu,
                             'ad', coalesce(p_ad,''), 'eposta', coalesce(p_eposta,''),
                             'tel', coalesce(p_tel,''), 'kaynak', coalesce(p_kaynak,'{}'::jsonb)));
  if position('@' in coalesce(p_eposta,'')) > 1 then
    insert into notifications_outbox (kanal, sablon, alici, degiskenler)
    values ('eposta', 'talep_alindi', lower(p_eposta),
            jsonb_build_object('ref', v_ref, 'konu', p_konu));
  end if;
  return v_ref;
end $$;

revoke all on function public.submit_request from public;
grant execute on function public.submit_request to anon, authenticated;
