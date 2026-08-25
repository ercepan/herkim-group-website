-- ============================================================
-- HERKİM GROUP B2B — ÜRÜN TOHUMU (0004)
-- Kaynak: assets/js/data.js (resmî flyer, 42 kalem, 6 kategori).
-- FİYAT YOK — fiyat yalnız customer_prices tablosunda yaşar.
-- Ambalaj sütunu bilerek BOŞ: gerçek ambalaj verisi gelince
-- doldurulacak (uydurma veri yasak).
-- Yeniden çalıştırılabilir (on conflict do update).
-- ============================================================

insert into public.products (id, kod, ad_tr, ad_en, ad_ru, kategori, marka, sira) values
  (1, 'HK-001', 'Asetik Asit', 'Acetic Acid', 'Уксусная кислота', 'asit', 'Herkim', 0),
  (2, 'HK-002', 'Akrilik Asit', 'Acrylic Acid', 'Акриловая кислота', 'asit', 'Herkim', 10),
  (3, 'HK-003', 'Sitrik Asit Monohidrat', 'Citric Acid Monohydrate', 'Лимонная кислота моногидрат', 'asit', 'Herkim', 20),
  (4, 'HK-004', 'HEDP (Hidroksietiliden Difosfonik Asit)', 'HEDP (Hydroxyethylidene Diphosphonic Acid)', 'HEDP (оксиэтилидендифосфоновая кислота)', 'asit', 'Herkim', 30),
  (5, 'HK-005', 'Formik Asit %85', 'Formic Acid 85%', 'Муравьиная кислота 85%', 'asit', 'Luxi', 40),
  (6, 'HK-006', 'Oksalik Asit', 'Oxalic Acid', 'Щавелевая кислота', 'asit', 'Herkim', 50),
  (7, 'HK-007', 'Fosforik Asit %85', 'Phosphoric Acid 85%', 'Ортофосфорная кислота 85%', 'asit', 'Herkim', 60),
  (8, 'HK-008', 'Sülfürik Asit', 'Sulphuric Acid', 'Серная кислота', 'asit', 'Herkim', 70),
  (9, 'HK-009', 'Butil Glikol', 'Butyl Glycol', 'Бутилгликоль', 'alkol', 'Herkim', 80),
  (10, 'HK-010', 'İzopropil Alkol (IPA)', 'IPA (Isopropyl Alcohol)', 'Изопропиловый спирт (IPA)', 'alkol', 'Herkim', 90),
  (11, 'HK-011', 'Monoetilen Glikol (MEG)', 'MEG (Monoethylene Glycol)', 'Моноэтиленгликоль (MEG)', 'alkol', 'Herkim', 100),
  (12, 'HK-012', 'Monopropilen Glikol (MPG)', 'Mono Propylene Glycol (MPG)', 'Монопропиленгликоль (MPG)', 'alkol', 'Herkim', 110),
  (13, 'HK-013', 'Amonyum Bikarbonat', 'Ammonium Bicarbonate', 'Бикарбонат аммония', 'amonyum', 'Herkim', 120),
  (14, 'HK-014', 'Amonyum Klorür', 'Ammonium Chloride', 'Хлорид аммония', 'amonyum', 'Herkim', 130),
  (15, 'HK-015', 'Amonyum Sülfat', 'Ammonium Sulphate', 'Сульфат аммония', 'amonyum', 'Herkim', 140),
  (16, 'HK-016', 'Mimoza Tozu', 'Mimosa Powder', 'Порошок мимозы', 'deri', 'Tanac', 150),
  (17, 'HK-017', 'Kebrako (Quebracho)', 'Quebracho', 'Квебрахо', 'deri', 'Herkim', 160),
  (18, 'HK-018', 'Saviotan A (Astrenjan)', 'Saviotan A (Astringent)', 'Saviotan A (вяжущий)', 'deri', 'Saviotan', 170),
  (19, 'HK-019', 'Saviotan RS (Tatlandırılmış)', 'Saviotan RS (Sweetened)', 'Saviotan RS (подслащённый)', 'deri', 'Saviotan', 180),
  (20, 'HK-020', 'Tara Tozu', 'Tara Powder', 'Порошок тары', 'deri', 'Herkim', 190),
  (21, 'HK-021', 'Valeks (Palamut Ekstraktı)', 'Valex (Valonia Extract)', 'Валекс (экстракт валлонеи)', 'deri', 'Valex', 200),
  (22, 'HK-022', 'Kostik Soda', 'Caustic Soda', 'Каустическая сода', 'sodyum', 'Herkim', 210),
  (23, 'HK-023', 'Nanocon (Povercon) — Sodyum Naftalin Sülfonat (Açık Renk)', 'Nanocon (Povercon) — Sodium Naphthalene Sulfonate (Light Colour)', 'Nanocon (Povercon) — нафталинсульфонат натрия (светлый)', 'sodyum', 'Povercon', 220),
  (24, 'HK-024', 'Povercon 100 — Sodyum Naftalin Sülfonat', 'Povercon 100 — Sodium Naphthalene Sulfonate', 'Povercon 100 — нафталинсульфонат натрия', 'sodyum', 'Povercon', 230),
  (25, 'HK-025', 'Sodyum Bikarbonat', 'Sodium Bicarbonate', 'Бикарбонат натрия', 'sodyum', 'Herkim', 240),
  (26, 'HK-026', 'Sodyum Karbonat', 'Sodium Carbonate', 'Карбонат натрия', 'sodyum', 'Herkim', 250),
  (27, 'HK-027', 'Sodyum Format', 'Sodium Formate', 'Формиат натрия', 'sodyum', 'Herkim', 260),
  (28, 'HK-028', 'Sodyum Sülfhidrat', 'Sodium Sulphhydrate', 'Гидросульфид натрия', 'sodyum', 'Herkim', 270),
  (29, 'HK-029', 'Sodyum Hidrosülfit', 'Sodium Hydrosulphite', 'Гидросульфит натрия', 'sodyum', 'Herkim', 280),
  (30, 'HK-030', 'Sodyum Metabisülfit (TLG)', 'Sodium Metabisulphite (TLG Grade)', 'Метабисульфит натрия (TLG)', 'sodyum', 'Herkim', 290),
  (31, 'HK-031', 'Sodyum Perkarbonat', 'Sodium Percarbonate', 'Перкарбонат натрия', 'sodyum', 'Herkim', 300),
  (32, 'HK-032', 'Sodyum Sülfür', 'Sodium Sulphide', 'Сульфид натрия', 'sodyum', 'Herkim', 310),
  (33, 'HK-033', 'Amonyak', 'Ammonia', 'Аммиак', 'solvent', 'Herkim', 320),
  (34, 'HK-034', 'Butil Asetat', 'Butyl Acetate', 'Бутилацетат', 'solvent', 'Herkim', 330),
  (35, 'HK-035', 'Ham Gliserin', 'Crude Glycerine', 'Глицерин технический', 'solvent', 'Herkim', 340),
  (36, 'HK-036', 'Dietanolamin (DEA)', 'Diethanolamine (DEA)', 'Диэтаноламин (DEA)', 'solvent', 'Herkim', 350),
  (37, 'HK-037', 'Magnezyum Klorür (Pul)', 'Magnesium Chloride Flakes', 'Хлорид магния (чешуйки)', 'solvent', 'Herkim', 360),
  (38, 'HK-038', 'Metilen Klorür', 'Methylene Chloride', 'Метиленхлорид', 'solvent', 'Herkim', 370),
  (39, 'HK-039', 'Polivinil Alkol (PVA)', 'Polyvinyl Alcohol (PVA)', 'Поливиниловый спирт (PVA)', 'solvent', 'Herkim', 380),
  (40, 'HK-040', 'Potasyum Klorür', 'Potassium Chloride', 'Хлорид калия', 'solvent', 'Herkim', 390),
  (41, 'HK-041', 'Soya Lesitini', 'Soya Lecithin', 'Соевый лецитин', 'solvent', 'Herkim', 400),
  (42, 'HK-042', 'Triizobutil Fosfat', 'Triisobutyl Phosphate', 'Триизобутилфосфат', 'solvent', 'Herkim', 410)
on conflict (id) do update set
  kod = excluded.kod, ad_tr = excluded.ad_tr, ad_en = excluded.ad_en,
  ad_ru = excluded.ad_ru, kategori = excluded.kategori,
  marka = excluded.marka, sira = excluded.sira;
