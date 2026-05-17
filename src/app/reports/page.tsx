'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, Expense, formatTHB } from '@/lib/types';
import { useFilter } from '@/components/FilterContext';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';
import { CategoryIcon, cleanCategoryLabel } from '@/components/CategoryIcon';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function ReportsPage() {
  const { matches, year } = useFilter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: e }] = await Promise.all([
        supabase.from('sales').select('*'),
        supabase.from('expenses').select('*'),
      ]);
      setSales((s as Sale[]) || []);
      setExpenses((e as Expense[]) || []);
      setLoading(false);
    })();
  }, [version]);

  useRealtimeRefresh(['sales', 'expenses'], () => setVersion((v) => v + 1));

  const mS = sales.filter((s) => matches(s.date));
  const mE = expenses.filter((e) => matches(e.date));

  // Monthly breakdown for the selected year
  const yearSales = sales.filter((s) => new Date(s.date).getFullYear() === year);
  const yearExpenses = expenses.filter((e) => new Date(e.date).getFullYear() === year);
  const monthly = Array.from({ length: 12 }, (_, m) => {
    const inc = yearSales
      .filter((s) => new Date(s.date).getMonth() === m)
      .reduce((a, x) => a + Number(x.total), 0);
    const exp = yearExpenses
      .filter((e) => new Date(e.date).getMonth() === m)
      .reduce((a, x) => a + Number(x.amount), 0);
    const profit = inc - exp;
    const margin = inc > 0 ? Math.round((profit / inc) * 100) : 0;
    return { label: MONTHS[m], inc, exp, profit, margin, hasData: inc > 0 || exp > 0 };
  });
  const yearTotalInc = monthly.reduce((a, r) => a + r.inc, 0);
  const yearTotalExp = monthly.reduce((a, r) => a + r.exp, 0);
  const yearTotalProfit = yearTotalInc - yearTotalExp;
  const yearTotalMargin = yearTotalInc > 0 ? Math.round((yearTotalProfit / yearTotalInc) * 100) : 0;
  const tI = mS.reduce((s, x) => s + Number(x.total), 0);
  const tE = mE.reduce((s, x) => s + Number(x.amount), 0);
  const p = tI - tE;
  const mg = tI > 0 ? Math.round((p / tI) * 100) : 0;

  const incCats = new Map<string, number>();
  mS.forEach((s) => incCats.set(s.category || 'ขายสินค้า', (incCats.get(s.category || 'ขายสินค้า') || 0) + Number(s.total)));
  const expCats = new Map<string, number>();
  mE.forEach((e) => expCats.set(e.category, (expCats.get(e.category) || 0) + Number(e.amount)));

  const renderCats = (cats: Map<string, number>, color: string, textColor: string) => {
    const arr = Array.from(cats.entries()).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...arr.map((c) => c[1]), 1);
    if (arr.length === 0) return <div className="empty">ยังไม่มีข้อมูล</div>;
    return arr.map(([name, val]) => (
      <div key={name} className="cat-row">
        <div className="cat-name"><CategoryIcon category={name} />{cleanCategoryLabel(name)}</div>
        <div className="cat-track"><div className="cat-fill" style={{ width: `${Math.round((val / max) * 100)}%`, background: color }} /></div>
        <div className="cat-amt" style={{ color: textColor }}>{formatTHB(val)}</div>
      </div>
    ));
  };

  if (loading) return <div className="empty">กำลังโหลด...</div>;

  return (
    <div className="page active">
      <div className="sum-kpi">
        <div className="kpi"><div className="kpi-lbl">รายรับรวม</div><div className="kpi-val" style={{ color: '#1D9E75' }}>{formatTHB(tI)}</div></div>
        <div className="kpi"><div className="kpi-lbl">รายจ่ายรวม</div><div className="kpi-val" style={{ color: '#E24B4A' }}>{formatTHB(tE)}</div></div>
        <div className="kpi"><div className="kpi-lbl">กำไรสุทธิ</div><div className="kpi-val" style={{ color: p >= 0 ? '#1D9E75' : '#E24B4A' }}>{(p < 0 ? '-' : '') + formatTHB(Math.abs(p))}</div></div>
        <div className="kpi"><div className="kpi-lbl">Margin</div><div className="kpi-val" style={{ color: mg >= 0 ? '#1D9E75' : '#E24B4A' }}>{mg}%</div></div>
      </div>
      <div className="sum-row2">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>รายจ่ายแยกหมวด</div>
          {renderCats(expCats, '#f5a623', '#d4891a')}
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>รายรับแยกหมวด</div>
          {renderCats(incCats, '#1a2b45', '#1D9E75')}
        </div>
      </div>

      {/* ตารางสรุปรายเดือนรายปี */}
      <div className="card" style={{ marginTop: 10 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>สรุปรายเดือน · ปี {year}</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Kanit' }}>
            <thead>
              <tr style={{ background: '#f8f9fb' }}>
                <th style={th}>เดือน</th>
                <th style={{ ...th, textAlign: 'right' }}>รายรับ</th>
                <th style={{ ...th, textAlign: 'right' }}>รายจ่าย</th>
                <th style={{ ...th, textAlign: 'right' }}>กำไร</th>
                <th style={{ ...th, textAlign: 'right' }}>Margin</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((r) => (
                <tr key={r.label} style={{ borderTop: '0.5px solid #f0f2f5' }}>
                  <td style={{ ...td, fontWeight: 500, color: '#1a2b45' }}>{r.label}</td>
                  <td style={{ ...td, textAlign: 'right', color: r.inc > 0 ? '#1D9E75' : '#c5ccd6', fontWeight: r.inc > 0 ? 500 : 400 }}>
                    {r.inc > 0 ? '฿' + r.inc.toLocaleString('th-TH') : '—'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: r.exp > 0 ? '#E24B4A' : '#c5ccd6', fontWeight: r.exp > 0 ? 500 : 400 }}>
                    {r.exp > 0 ? '฿' + r.exp.toLocaleString('th-TH') : '—'}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: !r.hasData ? '#c5ccd6' : r.profit >= 0 ? '#1D9E75' : '#E24B4A', fontWeight: r.hasData ? 500 : 400 }}>
                    {!r.hasData ? '—' : (r.profit < 0 ? '-' : '') + '฿' + Math.abs(r.profit).toLocaleString('th-TH')}
                  </td>
                  <td style={{ ...td, textAlign: 'right', color: r.inc === 0 ? '#c5ccd6' : r.margin >= 0 ? '#3759E3' : '#E24B4A', fontWeight: r.inc > 0 ? 500 : 400 }}>
                    {r.inc === 0 ? '—' : `${r.margin}%`}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '1.5px solid #e8eaed', background: '#fafbfc' }}>
                <td style={{ ...td, fontWeight: 600, color: '#a0aec0', fontSize: 11, letterSpacing: 0.3, textTransform: 'uppercase' }}>รวม</td>
                <td style={{ ...td, textAlign: 'right', color: '#1D9E75', fontWeight: 600 }}>฿{yearTotalInc.toLocaleString('th-TH')}</td>
                <td style={{ ...td, textAlign: 'right', color: '#E24B4A', fontWeight: 600 }}>฿{yearTotalExp.toLocaleString('th-TH')}</td>
                <td style={{ ...td, textAlign: 'right', color: yearTotalProfit >= 0 ? '#1D9E75' : '#E24B4A', fontWeight: 600 }}>
                  {(yearTotalProfit < 0 ? '-' : '') + '฿' + Math.abs(yearTotalProfit).toLocaleString('th-TH')}
                </td>
                <td style={{ ...td, textAlign: 'right', color: yearTotalMargin >= 0 ? '#3759E3' : '#E24B4A', fontWeight: 600 }}>{yearTotalMargin}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '8px 12px',
  textAlign: 'left',
  fontSize: 10,
  color: '#a0aec0',
  fontWeight: 500,
  letterSpacing: 0.3,
  textTransform: 'uppercase',
};
const td: React.CSSProperties = {
  padding: '9px 12px',
  whiteSpace: 'nowrap',
};
