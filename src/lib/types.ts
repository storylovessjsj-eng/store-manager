export type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  date: string;
  total: number;
  notes: string | null;
  description: string | null;
  category: string | null;
  image_url: string | null;
  created_at: string;
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
};

export type Expense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export type ShopProfile = {
  id: number;
  name: string;
  type: string | null;
  tagline: string | null;
  image_url: string | null;
  updated_at: string;
};

export type OrderStatus = 'pending' | 'working' | 'done' | 'cancelled';

export type Order = {
  id: string;
  customer: string;
  description: string;
  quantity: number;
  price: number;
  due_date: string | null;
  status: OrderStatus;
  note: string | null;
  created_at: string;
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'รอดำเนินการ',
  working: 'กำลังทำ',
  done: 'เสร็จแล้ว',
  cancelled: 'ยกเลิก',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#f5a623',
  working: '#378ADD',
  done: '#1D9E75',
  cancelled: '#a0aec0',
};

export const INCOME_CATEGORIES = [
  'ลูกค้าชำระ',
  'ค่ามัดจำ',
  'ค่าขนส่ง',
  'อื่นๆ',
] as const;

export const EXPENSE_CATEGORIES = [
  'ค่าของ/ต้นทุน',
  'ค่าแรง',
  'ค่าไฟ/น้ำ',
  'ค่าเช่า',
  'ค่าขนส่ง',
  'อุปกรณ์',
  'ค่าโฆษณา',
  'อื่นๆ',
] as const;

export const formatTHB = (n: number) =>
  '฿' + Math.round(n).toLocaleString('th-TH');

/** Format as short money string for bar chart labels: ฿1.2k / ฿850 / '' */
export const formatShort = (v: unknown): string => {
  const n = Math.round(Number(v));
  if (!n) return '';
  const abs = Math.abs(n);
  if (abs >= 1000) {
    const k = abs / 1000;
    return (n < 0 ? '-' : '') + '฿' + k.toFixed(abs % 1000 === 0 ? 0 : 1) + 'k';
  }
  return (n < 0 ? '-' : '') + '฿' + abs;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);
