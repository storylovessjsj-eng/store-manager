-- Migration 005: เปิด Supabase Auth + แยกข้อมูลตาม user

-- 1. เพิ่ม user_id ทุกตาราง (default = auth.uid() ของคน insert)
ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE shop_profile ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 2. shop_profile: ยกเลิก singleton (id=1) — ใช้ user_id แทน
ALTER TABLE shop_profile DROP CONSTRAINT IF EXISTS shop_profile_id_check;

-- 3. เปลี่ยน RLS: user เห็นเฉพาะข้อมูลตัวเอง
DROP POLICY IF EXISTS "Allow all" ON products;
DROP POLICY IF EXISTS "Allow all" ON sales;
DROP POLICY IF EXISTS "Allow all" ON sale_items;
DROP POLICY IF EXISTS "Allow all" ON expenses;
DROP POLICY IF EXISTS "Allow all" ON orders;
DROP POLICY IF EXISTS "Allow all" ON shop_profile;

CREATE POLICY "own_data" ON products
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON sales
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON expenses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON orders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_data" ON shop_profile
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- sale_items: ต่อกับ sales — เช็คผ่าน sale_id
CREATE POLICY "own_data" ON sale_items
  FOR ALL
  USING (sale_id IN (SELECT id FROM sales WHERE user_id = auth.uid()))
  WITH CHECK (sale_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
