-- Migration 004: ตาราง shop_profile (singleton — เก็บ 1 row)

CREATE TABLE IF NOT EXISTS shop_profile (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'YOUR NAME',
  type TEXT DEFAULT 'ร้านค้า',
  tagline TEXT,
  image_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- เพิ่ม default row
INSERT INTO shop_profile (id, name, type, tagline)
VALUES (1, 'YOUR NAME', 'ร้านค้า', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE shop_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON shop_profile FOR ALL USING (true) WITH CHECK (true);
