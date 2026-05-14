-- 통합 공예·예술 카테고리 시스템
-- 클래스·상품·작품·강사 프로필이 공유하는 2계층 카테고리 구조

CREATE TABLE IF NOT EXISTS craft_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  name        text NOT NULL,
  name_en     text,
  parent_id   uuid REFERENCES craft_categories(id) ON DELETE CASCADE,
  sort_order  int DEFAULT 0,
  icon_url    text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE craft_categories ENABLE ROW LEVEL SECURITY;

-- 전체 조회 허용 (공개 데이터)
DROP POLICY IF EXISTS "craft_categories_select_all" ON craft_categories;
CREATE POLICY "craft_categories_select_all" ON craft_categories
  FOR SELECT USING (true);

-- 관리자만 생성·수정·삭제
DROP POLICY IF EXISTS "craft_categories_admin_all" ON craft_categories;
CREATE POLICY "craft_categories_admin_all" ON craft_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 인덱스
CREATE INDEX IF NOT EXISTS craft_categories_parent_id_idx ON craft_categories(parent_id);
CREATE INDEX IF NOT EXISTS craft_categories_code_idx ON craft_categories(code);
CREATE INDEX IF NOT EXISTS craft_categories_sort_order_idx ON craft_categories(sort_order);

-- ============================================================
-- 대카테고리 8개 시드 데이터
-- ============================================================
INSERT INTO craft_categories (code, name, name_en, sort_order) VALUES
  ('resin',    '레진아트',         'Resin Art',           1),
  ('candle',   '캔들·디퓨저',      'Candle & Diffuser',   2),
  ('flower',   '플라워·압화',      'Flower & Pressed',    3),
  ('ceramic',  '도자기·석고',      'Ceramic & Plaster',   4),
  ('jewelry',  '주얼리·비즈',      'Jewelry & Beads',     5),
  ('textile',  '자수·뜨개·패브릭', 'Textile & Fabric',    6),
  ('painting', '회화·수채화',      'Painting',            7),
  ('craft',    '목공예·가죽·기타', 'Craft & Others',      8)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 소카테고리 시드 데이터
-- ============================================================

-- 레진아트 소카테고리
INSERT INTO craft_categories (code, name, name_en, parent_id, sort_order)
SELECT
  sub.code, sub.name, sub.name_en,
  (SELECT id FROM craft_categories WHERE code = 'resin'),
  sub.sort_order
FROM (VALUES
  ('resin_coaster',   '레진 코스터·트레이',  'Resin Coaster & Tray',   1),
  ('resin_jewelry',   '레진 주얼리',         'Resin Jewelry',           2),
  ('resin_uv',        'UV레진 소품',         'UV Resin',                3),
  ('resin_epoxy',     '에폭시 아트',         'Epoxy Art',               4),
  ('resin_objet',     '레진 오브제',         'Resin Object',            5)
) AS sub(code, name, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- 캔들·디퓨저 소카테고리
INSERT INTO craft_categories (code, name, name_en, parent_id, sort_order)
SELECT
  sub.code, sub.name, sub.name_en,
  (SELECT id FROM craft_categories WHERE code = 'candle'),
  sub.sort_order
FROM (VALUES
  ('candle_soy',      '소이캔들',   'Soy Candle',       1),
  ('candle_beeswax',  '밀랍캔들',   'Beeswax Candle',   2),
  ('candle_gel',      '젤캔들',     'Gel Candle',       3),
  ('candle_diffuser', '디퓨저',     'Diffuser',         4),
  ('candle_spray',    '룸스프레이', 'Room Spray',       5),
  ('candle_wax',      '왁스 타블렛','Wax Tablet',       6)
) AS sub(code, name, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- 플라워·압화 소카테고리
INSERT INTO craft_categories (code, name, name_en, parent_id, sort_order)
SELECT
  sub.code, sub.name, sub.name_en,
  (SELECT id FROM craft_categories WHERE code = 'flower'),
  sub.sort_order
FROM (VALUES
  ('flower_preserved', '프리저브드 플라워', 'Preserved Flower', 1),
  ('flower_dry',       '드라이 플라워',     'Dry Flower',       2),
  ('flower_pressed',   '압화 액자',         'Pressed Flower',   3),
  ('flower_fresh',     '생화 꽃다발',       'Fresh Bouquet',    4),
  ('flower_wreath',    '화환·리스',         'Wreath',           5)
) AS sub(code, name, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- 도자기·석고 소카테고리
INSERT INTO craft_categories (code, name, name_en, parent_id, sort_order)
SELECT
  sub.code, sub.name, sub.name_en,
  (SELECT id FROM craft_categories WHERE code = 'ceramic'),
  sub.sort_order
FROM (VALUES
  ('ceramic_wheel',   '물레 도자기',    'Wheel Pottery',     1),
  ('ceramic_pinch',   '핀칭 도자기',    'Pinch Pottery',     2),
  ('ceramic_plaster', '석고 방향제',    'Plaster Diffuser',  3),
  ('ceramic_objet',   '석고 오브제',    'Plaster Object',    4)
) AS sub(code, name, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- 주얼리·비즈 소카테고리
INSERT INTO craft_categories (code, name, name_en, parent_id, sort_order)
SELECT
  sub.code, sub.name, sub.name_en,
  (SELECT id FROM craft_categories WHERE code = 'jewelry'),
  sub.sort_order
FROM (VALUES
  ('jewelry_wire',    '와이어 주얼리',       'Wire Jewelry',    1),
  ('jewelry_beads',   '비즈 목걸이·팔찌',   'Beads Jewelry',   2),
  ('jewelry_silver',  '실버 주얼리',         'Silver Jewelry',  3),
  ('jewelry_stone',   '천연석 가공',         'Natural Stone',   4)
) AS sub(code, name, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- 자수·뜨개·패브릭 소카테고리
INSERT INTO craft_categories (code, name, name_en, parent_id, sort_order)
SELECT
  sub.code, sub.name, sub.name_en,
  (SELECT id FROM craft_categories WHERE code = 'textile'),
  sub.sort_order
FROM (VALUES
  ('textile_french',  '프랑스 자수',  'French Embroidery', 1),
  ('textile_ribbon',  '리본 자수',    'Ribbon Embroidery', 2),
  ('textile_crochet', '코바늘 뜨개', 'Crochet',           3),
  ('textile_knit',    '대바늘 뜨개', 'Knitting',          4),
  ('textile_string',  '스트링아트',  'String Art',        5)
) AS sub(code, name, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- 회화·수채화 소카테고리
INSERT INTO craft_categories (code, name, name_en, parent_id, sort_order)
SELECT
  sub.code, sub.name, sub.name_en,
  (SELECT id FROM craft_categories WHERE code = 'painting'),
  sub.sort_order
FROM (VALUES
  ('painting_watercolor', '수채화',      'Watercolor',   1),
  ('painting_acrylic',    '아크릴화',    'Acrylic',      2),
  ('painting_oil',        '유화',        'Oil Painting', 3),
  ('painting_calli',      '캘리그라피', 'Calligraphy',  4),
  ('painting_drawing',    '드로잉',      'Drawing',      5)
) AS sub(code, name, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;

-- 목공예·가죽·기타 소카테고리
INSERT INTO craft_categories (code, name, name_en, parent_id, sort_order)
SELECT
  sub.code, sub.name, sub.name_en,
  (SELECT id FROM craft_categories WHERE code = 'craft'),
  sub.sort_order
FROM (VALUES
  ('craft_wood',      '목공예',      'Woodcraft',      1),
  ('craft_leather',   '가죽 공예',   'Leather Craft',  2),
  ('craft_macrame',   '마크라메',    'Macrame',        3),
  ('craft_paper',     '종이공예',    'Paper Craft',    4),
  ('craft_recycle',   '리사이클 아트','Recycle Art',   5)
) AS sub(code, name, name_en, sort_order)
ON CONFLICT (code) DO NOTHING;
