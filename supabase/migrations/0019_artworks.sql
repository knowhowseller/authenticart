-- 작품 마켓
CREATE TABLE IF NOT EXISTS artworks (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  price       integer NOT NULL CHECK (price >= 0),
  images      text[] NOT NULL DEFAULT '{}',
  category    text NOT NULL DEFAULT '기타',
  material    text,
  size_info   text,
  status      text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold_out','hidden')),
  stock       integer NOT NULL DEFAULT 1,
  view_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS artwork_orders (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id      uuid NOT NULL REFERENCES artworks(id),
  buyer_id        uuid NOT NULL REFERENCES users(id),
  seller_id       uuid NOT NULL REFERENCES users(id),
  amount          integer NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  payment_id      text,
  receipt_url     text,
  shipping_name   text,
  shipping_phone  text,
  shipping_address text,
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE artworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artworks_public_read" ON artworks;
DROP POLICY IF EXISTS "artworks_seller_ins"  ON artworks;
DROP POLICY IF EXISTS "artworks_seller_upd"  ON artworks;
DROP POLICY IF EXISTS "artworks_seller_del"  ON artworks;

CREATE POLICY "artworks_public_read"  ON artworks FOR SELECT USING (status != 'hidden' OR auth.uid() = seller_id);
CREATE POLICY "artworks_seller_ins"   ON artworks FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "artworks_seller_upd"   ON artworks FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "artworks_seller_del"   ON artworks FOR DELETE USING (auth.uid() = seller_id);

ALTER TABLE artwork_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aw_orders_read"   ON artwork_orders;
DROP POLICY IF EXISTS "aw_orders_insert" ON artwork_orders;
DROP POLICY IF EXISTS "aw_orders_update" ON artwork_orders;

CREATE POLICY "aw_orders_read"   ON artwork_orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role='admin'));
CREATE POLICY "aw_orders_insert" ON artwork_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "aw_orders_update" ON artwork_orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR EXISTS(SELECT 1 FROM users WHERE id=auth.uid() AND role='admin'));

CREATE INDEX IF NOT EXISTS idx_artworks_status ON artworks(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artworks_seller ON artworks(seller_id);

-- artwork-images 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('artwork-images', 'artwork-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "artwork_images_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_auth_insert"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_auth_update"  ON storage.objects;
DROP POLICY IF EXISTS "artwork_images_auth_delete"  ON storage.objects;
CREATE POLICY "artwork_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'artwork-images');
CREATE POLICY "artwork_images_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'artwork-images' AND auth.role() = 'authenticated');
CREATE POLICY "artwork_images_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'artwork-images' AND auth.role() = 'authenticated');
CREATE POLICY "artwork_images_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'artwork-images' AND auth.role() = 'authenticated');
