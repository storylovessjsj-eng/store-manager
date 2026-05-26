'use client';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useFilter } from './FilterContext';

const titles: Record<string, string> = {
  '/': 'ภาพรวม',
  '/yearly': 'ภาพรวม',
  '/total': 'ภาพรวม',
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

// หน้าภาพรวม 3 แบบ — กำหนดขอบเขตข้อมูล (ต้องตรงกับ scope ของ OverviewBoard)
const OVERVIEW_SCOPE: Record<string, 'month' | 'year' | 'all'> = {
  '/': 'month',
  '/yearly': 'year',
  '/total': 'all',
};
const SCOPE_SUB: Record<'month' | 'year' | 'all', string> = { month: 'รายเดือน', year: 'รายปี', all: 'รายสุทธิ' };

// หน้าอื่นที่ใช้ฟิลเตอร์เดือน/ปีแบบเดิม (ขับด้วย view)
const LEGACY_FILTERED = new Set(['/sales', '/income', '/expense', '/reports', '/charts']);
const YEAR_ONLY_PATHS = new Set(['/charts']);
const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function Topbar() {
  const pathname = usePathname();
  const { month, year, view, setMonth, setYear, setDrawerOpen } = useFilter();

  const title = titles[pathname] || '';
  const scope = OVERVIEW_SCOPE[pathname];
  const legacy = LEGACY_FILTERED.has(pathname);

  const sub = scope ? SCOPE_SUB[scope] : legacy ? (view === 'year' ? 'รายปี' : 'รายเดือน') : '';
  const showMonth = scope ? scope === 'month' : (legacy && view === 'month' && !YEAR_ONLY_PATHS.has(pathname));
  const showYear = scope ? scope !== 'all' : legacy;

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
        {showMonth && (
          <select className="tsel" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        )}
        {showYear && (
          <select className="tsel" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {Array.from({ length: 11 }, (_, i) => 2020 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
