'use client';
import {
  CreditCard, Lock, Truck, MoreHorizontal,
  Package, Users, Zap, Home, Wrench, Megaphone,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  // รายรับ
  'ลูกค้าชำระ': CreditCard,
  'ค่ามัดจำ': Lock,
  'ค่าขนส่ง': Truck,
  'อื่นๆ': MoreHorizontal,
  // รายจ่าย
  'ค่าของ/ต้นทุน': Package,
  'ต้นทุน': Package,
  'ค่าแรง': Users,
  'ค่าไฟ/น้ำ': Zap,
  'ค่าสาธารณูปโภค': Zap,
  'ค่าเช่า': Home,
  'อุปกรณ์': Wrench,
  'ซ่อมแซม/อุปกรณ์': Wrench,
  'ค่าโฆษณา': Megaphone,
};

function findIcon(category: string): LucideIcon {
  if (!category) return MoreHorizontal;
  // exact match
  if (ICONS[category]) return ICONS[category];
  // strip emoji/symbol prefix and try again
  const cleaned = category.replace(/[^฀-๿\w\s/]/g, '').trim();
  if (ICONS[cleaned]) return ICONS[cleaned];
  // fuzzy: find key contained in (or containing) the category text
  for (const [key, Icon] of Object.entries(ICONS)) {
    if (cleaned.includes(key) || key.includes(cleaned)) return Icon;
  }
  return MoreHorizontal;
}

export function CategoryIcon({ category, size = 11 }: { category: string; size?: number }) {
  const Icon = findIcon(category);
  return (
    <Icon
      size={size}
      style={{
        display: 'inline-block',
        verticalAlign: '-1px',
        marginRight: 4,
        flexShrink: 0,
      }}
    />
  );
}

/** ลบ emoji/symbol นำหน้าออกจากข้อความหมวด */
export function cleanCategoryLabel(category: string): string {
  if (!category) return '';
  return category.replace(/^[^฀-๿\w]+/, '').trim();
}

/** Emoji สำหรับใช้ใน native <select> dropdown (รองรับ emoji แต่ไม่รองรับ SVG) */
export const CATEGORY_EMOJI: Record<string, string> = {
  'ลูกค้าชำระ': '💳',
  'ค่ามัดจำ': '🔒',
  'ค่าขนส่ง': '🚚',
  'อื่นๆ': '📋',
  'ค่าของ/ต้นทุน': '📦',
  'ค่าแรง': '👥',
  'ค่าไฟ/น้ำ': '⚡',
  'ค่าเช่า': '🏠',
  'อุปกรณ์': '🔧',
  'ค่าโฆษณา': '📢',
};

export function emojiFor(category: string): string {
  return CATEGORY_EMOJI[category] || CATEGORY_EMOJI[cleanCategoryLabel(category)] || '•';
}
