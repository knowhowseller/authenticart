-- 목적: craft_categories에 3단계(소재류) 추가 + products에 craft_category_id 연결

-- products에 craft_category_id 추가
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS craft_category_id uuid REFERENCES public.craft_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_craft_category_id
  ON public.products(craft_category_id);

-- ============================================================
-- Level 3 소카테고리 — 레진아트
-- ============================================================
INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('resin_uv_resin','UV레진 원액',1),('resin_uv_light','UV 경화기·라이트',2),('resin_uv_mold','UV레진 몰드',3),('resin_uv_color','색소·첨가제',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='resin_uv' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('resin_coaster_epoxy','에폭시 레진',1),('resin_coaster_mold','트레이·코스터 몰드',2),('resin_coaster_color','색소·펄',3),('resin_coaster_tool','작업 도구',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='resin_coaster' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('resin_jewelry_resin','레진 원액',1),('resin_jewelry_mold','주얼리 몰드',2),('resin_jewelry_color','색소·파우더',3),('resin_jewelry_metal','금속 부자재',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='resin_jewelry' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('resin_epoxy_resin','에폭시 레진',1),('resin_epoxy_color','아트 색소·안료',2),('resin_epoxy_canvas','캔버스·기판',3),('resin_epoxy_tool','도포 도구',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='resin_epoxy' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('resin_objet_resin','에폭시 레진',1),('resin_objet_mold','오브제 몰드',2),('resin_objet_deco','장식 재료',3),('resin_objet_finish','마감재',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='resin_objet' ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Level 3 소카테고리 — 캔들·디퓨저
-- ============================================================
INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('candle_soy_wax','소이왁스',1),('candle_soy_scent','캔들 향오일',2),('candle_soy_wick','면 심지',3),('candle_soy_vessel','캔들 용기',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='candle_soy' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('candle_beeswax_wax','밀랍왁스',1),('candle_beeswax_scent','천연 향료',2),('candle_beeswax_wick','심지·홀더',3),('candle_beeswax_vessel','캔들 용기',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='candle_beeswax' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('candle_gel_wax','젤왁스',1),('candle_gel_vessel','글라스 용기',2),('candle_gel_deco','장식물·꽃',3),('candle_gel_wick','심지',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='candle_gel' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('candle_diffuser_base','디퓨저 원액',1),('candle_diffuser_scent','향 오일',2),('candle_diffuser_stick','디퓨저 스틱',3),('candle_diffuser_vessel','디퓨저 용기',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='candle_diffuser' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('candle_spray_ethanol','무수 에탄올',1),('candle_spray_scent','향 오일',2),('candle_spray_bottle','스프레이 용기',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='candle_spray' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('candle_wax_wax','팜·블렌드왁스',1),('candle_wax_flower','드라이플라워',2),('candle_wax_scent','향 오일',3),('candle_wax_deco','고리·장식',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='candle_wax' ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Level 3 소카테고리 — 플라워·압화
-- ============================================================
INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('flower_preserved_flower','프리저브드 꽃',1),('flower_preserved_foam','플로랄 폼',2),('flower_preserved_pack','포장 자재',3),('flower_preserved_tool','꽃다발 도구',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='flower_preserved' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('flower_dry_flower','드라이 꽃·식물',1),('flower_dry_ribbon','리본·와이어',2),('flower_dry_pack','포장 자재',3),('flower_dry_tool','건조 도구',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='flower_dry' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('flower_pressed_flower','압화 꽃',1),('flower_pressed_frame','압화 액자·배경',2),('flower_pressed_coat','코팅 용품',3),('flower_pressed_tool','압화 도구',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='flower_pressed' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('flower_fresh_wrap','포장지·랩',1),('flower_fresh_ribbon','리본·끈',2),('flower_fresh_foam','플로럴 폼',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='flower_fresh' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('flower_wreath_base','리스 베이스',1),('flower_wreath_wire','와이어·테이프',2),('flower_wreath_deco','장식 재료',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='flower_wreath' ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Level 3 소카테고리 — 도자기·석고
-- ============================================================
INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('ceramic_wheel_clay','도예용 흙',1),('ceramic_wheel_glaze','유약',2),('ceramic_wheel_tool','도예 도구',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='ceramic_wheel' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('ceramic_pinch_clay','도예용 흙',1),('ceramic_pinch_tool','핀칭 도구',2),('ceramic_pinch_glaze','유약',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='ceramic_pinch' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('ceramic_plaster_gypsum','석고 가루',1),('ceramic_plaster_scent','방향제 오일',2),('ceramic_plaster_mold','석고 몰드',3),('ceramic_plaster_color','색소·안료',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='ceramic_plaster' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('ceramic_objet_gypsum','석고 가루',1),('ceramic_objet_mold','석고 몰드',2),('ceramic_objet_color','색소·도료',3),('ceramic_objet_finish','마감재',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='ceramic_objet' ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Level 3 소카테고리 — 주얼리·비즈
-- ============================================================
INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('jewelry_wire_wire','구리·은 와이어',1),('jewelry_wire_tool','와이어 공구',2),('jewelry_wire_bead','비즈·스톤',3),('jewelry_wire_parts','금속 부자재',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='jewelry_wire' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('jewelry_beads_bead','비즈',1),('jewelry_beads_cord','낚싯줄·탄성줄',2),('jewelry_beads_clasp','클래스프·마감',3),('jewelry_beads_tool','비즈 도구',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='jewelry_beads' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('jewelry_silver_clay','은점토·실버클레이',1),('jewelry_silver_tool','실버 도구',2),('jewelry_silver_polish','연마재',3),('jewelry_silver_finish','마감재',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='jewelry_silver' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('jewelry_stone_stone','천연석·원석',1),('jewelry_stone_tool','가공 도구',2),('jewelry_stone_setting','설정·베젤',3),('jewelry_stone_adhesive','접착제',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='jewelry_stone' ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Level 3 소카테고리 — 자수·뜨개·패브릭
-- ============================================================
INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('textile_french_thread','자수실',1),('textile_french_fabric','자수 원단',2),('textile_french_hoop','수틀·바늘',3),('textile_french_tool','자수 도구',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='textile_french' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('textile_ribbon_ribbon','리본',1),('textile_ribbon_fabric','자수 원단',2),('textile_ribbon_hoop','수틀·바늘',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='textile_ribbon' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('textile_crochet_yarn','뜨개실',1),('textile_crochet_hook','코바늘',2),('textile_crochet_tool','뜨개 도구',3),('textile_crochet_button','단추·장식',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='textile_crochet' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('textile_knit_yarn','뜨개실',1),('textile_knit_needle','대바늘',2),('textile_knit_tool','뜨개 도구',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='textile_knit' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('textile_string_board','원목 판',1),('textile_string_nail','못·핀',2),('textile_string_thread','실·끈',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='textile_string' ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Level 3 소카테고리 — 회화·수채화
-- ============================================================
INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('painting_watercolor_paint','수채화 물감',1),('painting_watercolor_paper','수채화 종이',2),('painting_watercolor_brush','붓',3),('painting_watercolor_tool','팔레트·도구',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='painting_watercolor' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('painting_acrylic_paint','아크릴 물감',1),('painting_acrylic_canvas','캔버스·보드',2),('painting_acrylic_brush','붓·도구',3),('painting_acrylic_medium','미디엄·바니시',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='painting_acrylic' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('painting_oil_paint','유화 물감',1),('painting_oil_canvas','유화 캔버스',2),('painting_oil_brush','붓·팔레트나이프',3),('painting_oil_medium','미디엄·오일',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='painting_oil' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('painting_calli_ink','캘리 잉크·물감',1),('painting_calli_paper','캘리 종이',2),('painting_calli_brush','붓·펜',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='painting_calli' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('painting_drawing_pen','드로잉 연필·펜',1),('painting_drawing_paper','스케치북',2),('painting_drawing_color','채색 도구',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='painting_drawing' ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- Level 3 소카테고리 — 목공예·가죽·기타
-- ============================================================
INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('craft_wood_material','원목 자재',1),('craft_wood_tool','목공 도구',2),('craft_wood_finish','도료·오일',3),('craft_wood_parts','장식 부자재',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='craft_wood' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('craft_leather_leather','가죽 원단',1),('craft_leather_tool','가죽 도구',2),('craft_leather_thread','실·바늘',3),('craft_leather_parts','금속 부자재',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='craft_leather' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('craft_macrame_cord','마크라메 실·끈',1),('craft_macrame_ring','링·다울',2),('craft_macrame_bead','비즈·장식',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='craft_macrame' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('craft_paper_paper','색지·패턴지',1),('craft_paper_adhesive','풀·접착제',2),('craft_paper_tool','커팅 도구',3),('craft_paper_deco','장식 재료',4)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='craft_paper' ON CONFLICT (code) DO NOTHING;

INSERT INTO craft_categories (code, name, parent_id, sort_order) SELECT s.code, s.name, p.id, s.so FROM
  (VALUES ('craft_recycle_material','리사이클 재료',1),('craft_recycle_paint','도료·물감',2),('craft_recycle_tool','도구류',3)) AS s(code,name,so)
  JOIN craft_categories p ON p.code='craft_recycle' ON CONFLICT (code) DO NOTHING;
