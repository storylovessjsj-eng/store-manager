-- Migration 002: เพิ่ม column สำหรับรับ-จ่ายแบบ INKPRESS + แนบรูป

ALTER TABLE sales ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS image_url TEXT;
