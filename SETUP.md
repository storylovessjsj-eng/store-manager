# Store Manager — Setup

ระบบจัดการร้านค้า · Next.js 16 + Supabase + Tailwind v4 + Recharts

## 1. ตั้งค่า Supabase (ใช้เวลา ~5 นาที)

1. ไปที่ [supabase.com](https://supabase.com) → สมัครฟรี (ใช้ GitHub login ก็ได้)
2. กด **New Project** → ตั้งชื่อ + รหัสผ่าน database → เลือก region (Singapore ใกล้สุด) → กด Create
3. รอ ~1 นาทีให้ project พร้อม
4. ไปเมนูซ้าย **SQL Editor** → กด **New query** → copy เนื้อหาจากไฟล์ `supabase-schema.sql` → กด **Run**
5. ไปเมนู **Project Settings → API** → copy 2 ค่า:
   - `Project URL`
   - `anon public` key (ในส่วน API Keys)

## 2. ใส่ค่า .env.local

```bash
cp .env.local.example .env.local
```

แก้ `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 3. รันแอป

```bash
npm run dev
```

เปิด http://localhost:3000

## โครงสร้าง

```
src/
├── app/
│   ├── layout.tsx          # Root layout + Sidebar
│   ├── page.tsx            # Dashboard
│   ├── sales/page.tsx      # บันทึกยอดขาย
│   ├── products/page.tsx   # จัดการสินค้า/สต็อก
│   └── expenses/page.tsx   # ค่าใช้จ่าย
├── components/
│   └── Sidebar.tsx
└── lib/
    ├── supabase.ts         # Supabase client
    └── types.ts            # TypeScript types
```

## ฟีเจอร์

- **Dashboard** — ยอดขายวันนี้, กำไรเดือนนี้, กราฟ 30 วัน, สินค้าขายดี, ค่าใช้จ่ายแยกหมวด
- **บันทึกยอดขาย** — เลือกสินค้าจากลิสต์, ระบุจำนวน, บันทึกบิล + **ลด stock อัตโนมัติ**
- **สินค้า/สต็อก** — เพิ่ม/แก้ไข/ลบสินค้า + ปุ่ม `+/-` ปรับสต็อก + แจ้งเตือนสต็อกต่ำ
- **ค่าใช้จ่าย** — บันทึกค่าใช้จ่ายตามหมวด (ค่าน้ำ, ค่าไฟ, ค่าของ, ฯลฯ)

## Deploy

แนะนำ **Vercel** (ฟรี + เร็ว):
1. push code ขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → Import repo
3. ใส่ env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy → ได้ URL ใช้งานทันที
