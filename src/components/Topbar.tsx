'use client';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useFilter } from './FilterContext';

const titles: Record<string, string> = {
  '/': 'ภาพรวม',
  '/sales': 'บันทึกรายการ',
  '/income': 'รายรับ',
  '/expense': 'รายจ่าย',
  '/expenses': 'ค่าใช้จ่าย',
  '/reports': 'สรุปกำไร-ขาดทุน',
  '/charts': 'กราฟ',
  '/products': 'สต็อกสินค้า',
  '/orders': 'ออเดอร์ / งาน',
  '/profile': 'โปรไฟล์ร้าน',
};

const FILTERED_PATHS = new Set(['/', '/sales', '/income', '/expense', '/reports', '/charts']);
const YEAR_ONLY_PATHS = new Set(['/charts']);
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function Topbar() {
  const pathname = usePathname();
  const { month, year, view, setMonth, setYear, setDrawerOpen } = useFilter();

  const title = titles[pathname] || '';
  const usesFilter = FILTERED_PATHS.has(pathname);
  const sub = usesFilter ? (view === 'year' ? 'รายปี' : 'รายเดือน') : '';

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
        <button
          className="mobile-menu-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="เปิดเมนู"
          type="button"
        >
          <Menu size={20} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div className="tb-title">{title}</div>
          <div className="tb-sub">{sub}</div>
        </div>
      </div>
      <div className="tb-r">
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'Kanit, sans-serif', border: '0.5px solid #dde1e7', background: '#fff', color: '#1a2b45' }}
        >
          ☁️ Sync
        </button>
        {usesFilter && view === 'month' && !YEAR_ONLY_PATHS.has(pathname) && (
          <select className="tsel" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        )}
        {usesFilter && (
          <select className="tsel" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>
        )}
      </div>
    </div>
  );
}
