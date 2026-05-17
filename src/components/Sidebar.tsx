'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useFilter } from './FilterContext';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';

type NavGroup = { href: string; label: string; icon: string; sub?: string[] };

const mainNav: NavGroup[] = [
  { href: '/', label: 'ภาพรวม', icon: 'ti-layout-dashboard', sub: ['รายเดือน', 'รายปี'] },
  { href: '/sales', label: 'บันทึกรายการ', icon: 'ti-pencil-plus', sub: ['รายเดือน', 'รายปี'] },
  { href: '/income', label: 'รายรับ', icon: 'ti-arrow-up', sub: ['รายเดือน', 'รายปี'] },
  { href: '/expense', label: 'รายจ่าย', icon: 'ti-arrow-down', sub: ['รายเดือน', 'รายปี'] },
];

const reportNav: NavGroup[] = [
  { href: '/reports', label: 'สรุปกำไร', icon: 'ti-report-analytics', sub: ['รายเดือน', 'รายปี'] },
  { href: '/charts', label: 'กราฟ', icon: 'ti-chart-bar' },
];

const manageNav: NavGroup[] = [
  { href: '/products', label: 'สต็อกสินค้า', icon: 'ti-package' },
  { href: '/orders', label: 'ออเดอร์/งาน', icon: 'ti-clipboard-list' },
];

const THEMES = [
  { id: 'default', name: 'Default', swatch: 'linear-gradient(135deg,#1a2b45 50%,#f5a623 50%)' },
  { id: 'dark', name: 'Dark', swatch: 'linear-gradient(135deg,#09090b 50%,#a1a1aa 50%)' },
  { id: 'ocean', name: 'Ocean', swatch: 'linear-gradient(135deg,#1e3a4a 50%,#5b8fa8 50%)' },
  { id: 'forest', name: 'Forest', swatch: 'linear-gradient(135deg,#1c3226 50%,#5a8a6a 50%)' },
  { id: 'rose', name: 'Rose', swatch: 'linear-gradient(135deg,#2d1a1e 50%,#a06070 50%)' },
  { id: 'slate', name: 'Slate', swatch: 'linear-gradient(135deg,#1a1f2e 50%,#5a6a8a 50%)' },
  { id: 'sunset', name: 'Sunset', swatch: 'linear-gradient(135deg,#2a1a10 50%,#b07050 50%)' },
  { id: 'violet', name: 'Violet', swatch: 'linear-gradient(135deg,#1e1430 50%,#7060a0 50%)' },
  { id: 'midnight', name: 'Midnight', swatch: 'linear-gradient(135deg,#0a0a0c 50%,#606880 50%)' },
  { id: 'mint', name: 'Mint', swatch: 'linear-gradient(135deg,#142820 50%,#508070 50%)' },
];

type Row = Record<string, unknown>;

export default function Sidebar() {
  const pathname = usePathname();
  const { view, setView, drawerOpen, setDrawerOpen } = useFilter();
  const [themeOpen, setThemeOpen] = useState(false);

  // Auto-close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname, setDrawerOpen]);
  const [dataOpen, setDataOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [profile, setProfile] = useState<{ name: string; type: string; image_url: string | null }>({
    name: 'YOUR NAME',
    type: 'ร้านค้า',
    image_url: null,
  });

  async function loadProfile() {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    const { data } = await supabase.from('shop_profile').select('name,type,image_url').eq('user_id', userRes.user.id).maybeSingle();
    if (data) setProfile({ name: data.name, type: data.type || 'ร้านค้า', image_url: data.image_url });
    else setProfile({ name: userRes.user.email?.split('@')[0] || 'ร้านของฉัน', type: 'ร้านค้า', image_url: null });
  }

  async function handleLogout() {
    if (!confirm('ออกจากระบบ?')) return;
    await supabase.auth.signOut();
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sm_theme') || 'default';
      setCurrentTheme(saved);
      if (saved !== 'default') document.documentElement.setAttribute('data-theme', saved);
      else document.documentElement.removeAttribute('data-theme');
    } catch {}
    loadProfile();
    const handler = () => loadProfile();
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, []);

  useRealtimeRefresh('shop_profile', () => loadProfile());

  function setTheme(id: string) {
    setCurrentTheme(id);
    if (id === 'default') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', id);
    try { localStorage.setItem('sm_theme', id); } catch {}
  }

  async function exportJSON() {
    const [p, s, si, e, o] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('sales').select('*'),
      supabase.from('sale_items').select('*'),
      supabase.from('expenses').select('*'),
      supabase.from('orders').select('*'),
    ]);
    const data = {
      exportedAt: new Date().toISOString(),
      products: p.data || [],
      sales: s.data || [],
      sale_items: si.data || [],
      expenses: e.data || [],
      orders: o.data || [],
    };
    download(JSON.stringify(data, null, 2), `store_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  }

  async function exportCSV() {
    const [{ data: sales }, { data: expenses }] = await Promise.all([
      supabase.from('sales').select('*'),
      supabase.from('expenses').select('*'),
    ]);
    const rows: string[] = ['id,ประเภท,รายการ,หมวด,จำนวน,วันที่'];
    type S = { id: string; description?: string | null; notes?: string | null; category?: string | null; total: number; date: string };
    type E = { id: string; description?: string | null; category: string; amount: number; date: string };
    (sales as S[] || []).forEach((s) =>
      rows.push([s.id, 'รายรับ', q(s.description || s.notes || 'รายรับ'), q(s.category || 'ขายสินค้า'), String(s.total), s.date].join(','))
    );
    (expenses as E[] || []).forEach((e) =>
      rows.push([e.id, 'รายจ่าย', q(e.description || ''), q(e.category), String(e.amount), e.date].join(','))
    );
    download('﻿' + rows.join('\n'), `store_data_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
  }

  function exportPDF() { window.print(); }

  function triggerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());

        // Format A: flat transactions array (INKPRESS / profinance backup)
        if (Array.isArray(data.transactions) || Array.isArray(data.entries)) {
          const arr = (data.transactions || data.entries) as Array<{
            type: string; name?: string; desc?: string; description?: string;
            amount?: number; amt?: number; cat?: string; category?: string; date: string;
          }>;
          if (!confirm(`พบ ${arr.length} รายการ (รูปแบบ transactions) — นำเข้าทั้งหมด?`)) return;
          const salesRows = arr
            .filter((t) => t.type === 'income')
            .map((t) => ({
              date: t.date,
              total: Number(t.amount ?? t.amt ?? 0),
              description: t.name || t.desc || t.description || 'รายรับ',
              category: t.cat || t.category || 'ขายสินค้า',
              notes: null,
            }));
          const expenseRows = arr
            .filter((t) => t.type === 'expense')
            .map((t) => ({
              date: t.date,
              amount: Number(t.amount ?? t.amt ?? 0),
              description: t.name || t.desc || t.description || '',
              category: t.cat || t.category || 'อื่นๆ',
            }));
          if (salesRows.length) {
            const { error } = await supabase.from('sales').insert(salesRows);
            if (error) throw new Error('sales: ' + error.message);
          }
          if (expenseRows.length) {
            const { error } = await supabase.from('expenses').insert(expenseRows);
            if (error) throw new Error('expenses: ' + error.message);
          }
          alert(`นำเข้าสำเร็จ — รายรับ ${salesRows.length} · รายจ่าย ${expenseRows.length} รายการ\nรีเฟรชหน้าเพื่อดู`);
          return;
        }

        // Format B: native Store Manager backup (per-table)
        if (!confirm('นำเข้าข้อมูล? ข้อมูลที่ ID ตรงกันจะถูกอัพเดต (upsert)')) return;
        const tables: Array<[string, Row[]]> = [
          ['products', data.products],
          ['expenses', data.expenses],
          ['orders', data.orders],
          ['sales', data.sales],
          ['sale_items', data.sale_items],
        ];
        let total = 0;
        for (const [name, rows] of tables) {
          if (Array.isArray(rows) && rows.length) {
            const { error } = await supabase.from(name).upsert(rows);
            if (error) throw new Error(`${name}: ${error.message}`);
            total += rows.length;
          }
        }
        if (total === 0) {
          alert('ไม่พบข้อมูลในไฟล์ (ต้องมี transactions / entries / products / sales / expenses)');
          return;
        }
        alert(`นำเข้าสำเร็จ ${total} แถว — รีเฟรชหน้าเพื่อดูข้อมูลใหม่`);
      } catch (err) {
        alert('Error: ' + (err as Error).message);
      }
    };
    input.click();
  }

  const renderGroup = (n: NavGroup) => {
    const active = pathname === n.href;
    const hasSub = !!n.sub;
    return (
      <div key={n.href}>
        <Link href={n.href} className={`sbi ${active ? 'active open' : ''}`}>
          <div className="sbi-left">
            <i className={`ti ${n.icon}`} />
            <span>{n.label}</span>
          </div>
          {hasSub && <i className="ti ti-chevron-right sbi-arrow" />}
        </Link>
        {hasSub && (
          <div className={`sub-menu ${active ? 'open' : ''}`}>
            {n.sub!.map((label) => {
              const v = label === 'รายเดือน' ? 'month' : 'year';
              const isActive = view === v && active;
              return (
                <div
                  key={label}
                  className={`sub-item ${isActive ? 'active' : ''}`}
                  onClick={() => setView(v)}
                >
                  {label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSimple = (n: NavGroup) => {
    const active = pathname === n.href;
    return (
      <Link key={n.href} href={n.href} className={`sbi ${active ? 'active' : ''}`}>
        <div className="sbi-left">
          <i className={`ti ${n.icon}`} />
          <span>{n.label}</span>
        </div>
      </Link>
    );
  };

  return (
    <>
      {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />}
    <div className={`sidebar ${drawerOpen ? 'drawer-open' : ''}`}>
      <div className="sb-profile-fixed">
        <div className="sb-av">
          {profile.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          ) : (
            <div className="sb-av-icon">
              <i className="ti ti-user" style={{ fontSize: 22 }} />
            </div>
          )}
        </div>
        <div className="sb-name">{profile.name}</div>
        <div className="sb-email">{profile.type}</div>
        <div className="sb-div" />
      </div>

      <div className="sb-nav">
        <div className="sb-sec">หลัก</div>
        {mainNav.map(renderGroup)}

        <div className="sb-div" style={{ margin: '6px 0' }} />
        <div className="sb-sec">รายงาน</div>
        {reportNav.map((n) => (n.sub ? renderGroup(n) : renderSimple(n)))}

        <div className="sb-div" style={{ margin: '6px 0' }} />
        <div className="sb-sec">จัดการ</div>
        {manageNav.map(renderSimple)}

        <div className="sb-div" style={{ margin: '6px 0' }} />
        <div className="sb-sec">ตั้งค่า</div>
        {renderSimple({ href: '/profile', label: 'โปรไฟล์', icon: 'ti-user-circle' })}

        {/* Theme */}
        <div className={`sbi ${themeOpen ? 'open' : ''}`} onClick={() => setThemeOpen(!themeOpen)} style={{ cursor: 'pointer' }}>
          <div className="sbi-left">
            <i className="ti ti-palette" />
            <span>Theme</span>
          </div>
          <i className="ti ti-chevron-right sbi-arrow" />
        </div>
        <div className={`sub-menu ${themeOpen ? 'open' : ''}`}>
          <div className="sb-theme-grid">
            {THEMES.map((t) => (
              <div
                key={t.id}
                className={`sb-theme-opt ${currentTheme === t.id ? 'sel' : ''}`}
                onClick={() => setTheme(t.id)}
                title={t.name}
              >
                <div className="sb-swatch" style={{ background: t.swatch }} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data */}
        <div className={`sbi ${dataOpen ? 'open' : ''}`} onClick={() => setDataOpen(!dataOpen)} style={{ cursor: 'pointer' }}>
          <div className="sbi-left">
            <i className="ti ti-database" />
            <span>ข้อมูล</span>
          </div>
          <i className="ti ti-chevron-right sbi-arrow" />
        </div>
        <div className={`sub-menu ${dataOpen ? 'open' : ''}`}>
          <div className="sub-item" onClick={exportJSON}>
            <i className="ti ti-download" style={{ fontSize: 12, marginRight: 4 }} />
            ส่งออก JSON
          </div>
          <div className="sub-item" onClick={exportCSV}>
            <i className="ti ti-table-export" style={{ fontSize: 12, marginRight: 4 }} />
            ส่งออก CSV
          </div>
          <div className="sub-item" onClick={exportPDF}>
            <i className="ti ti-printer" style={{ fontSize: 12, marginRight: 4 }} />
            พิมพ์ / PDF
          </div>
          <div className="sub-item" onClick={triggerImport}>
            <i className="ti ti-upload" style={{ fontSize: 12, marginRight: 4 }} />
            นำเข้า JSON
          </div>
        </div>
      </div>

      <div className="sb-bot">
        <div className="sb-out" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <i className="ti ti-power" style={{ fontSize: 13 }} />
          <span>ออกจากระบบ</span>
        </div>
      </div>
    </div>
    </>
  );
}

function q(s: string) {
  return '"' + s.replace(/"/g, '""') + '"';
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
