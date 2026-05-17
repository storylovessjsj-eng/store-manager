-- Migration 006: เปลี่ยน shop_profile primary key เป็น user_id (รองรับ multi-user)

DELETE FROM shop_profile WHERE user_id IS NULL;

ALTER TABLE shop_profile DROP CONSTRAINT IF EXISTS shop_profile_pkey;
ALTER TABLE shop_profile DROP COLUMN IF EXISTS id;
ALTER TABLE shop_profile ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE shop_profile ADD PRIMARY KEY (user_id);
