'use client';

const CATEGORY_EMOJI: Record<string, string> = {
  // รายรับ
  'ลูกค้าชำระ': '💳',
  'ค่ามัดจำ': '🔒',
  'ค่าขนส่ง': '🚚',
  'อื่นๆ': '📋',
  // รายจ่าย
  'ค่าของ/ต้นทุน': '📦',
  'ต้นทุน': '📦',
  'ค่าแรง': '👥',
  'ค่าไฟ/น้ำ': '⚡',
  'ค่าสาธารณูปโภค': '⚡',
  'ค่าเช่า': '🏠',
  'อุปกรณ์': '🔧',
  'ซ่อมแซม/อุปกรณ์': '🔧',
  'ค่าโฆษณา': '📢',
};

/** ลบ emoji/symbol นำหน้าออกจากข้อความหมวด */
export function cleanCategoryLabel(category: string): string {
  if (!category) return '';
  return category.replace(/^[^฀-๿\w]+/, '').trim();
}

/** Emoji ที่ตรงกับหมวด (รองรับทั้งชื่อสะอาดและชื่อที่มี emoji นำหน้า) */
export function emojiFor(category: string): string {
  if (!category) return '•';
  return (
    CATEGORY_EMOJI[category] ||
    CATEGORY_EMOJI[cleanCategoryLabel(category)] ||
    '•'
  );
}

/** Component แสดง emoji ของหมวด (drop-in สำหรับใช้แทน lucide icon เดิม) */
export function CategoryIcon({ category }: { category: string; size?: number }) {
  return (
    <span style={{ marginRight: 4, display: 'inline-block' }}>
      {emojiFor(category)}
    </span>
  );
}

export { CATEGORY_EMOJI };
