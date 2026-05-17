'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, Expense, formatTHB, formatShort } from '@/lib/types';
import { useFilter } from '@/components/FilterContext';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';
import { CategoryIcon, cleanCategoryLabel } from '@/components/CategoryIcon';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList,
} from 'recharts';

type SaleItem = { product_name: string; quantity: number; price: number };
type SaleWithItems = Sale & { sale_items: SaleItem[] };
type Entry = { id: string; type: 'income' | 'expense'; desc: string; cat: string; date: string; amt: number };

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function Dashboard() {
  const { month: cm, year: cy, view, matches } = useFilter();
  const [sales, setSales] = useState<SaleWithItems[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: e }] = await Promise.all([
        supabase.from('sales').select('*, sale_items(product_name, quantity, price)').order('date', { ascending: false }),
        supabase.from('expenses').select('*').order('date', { ascending: false }),
      ]);
      setSales((s as SaleWithItems[]) || []);
      setExpenses(e || []);
      setLoading(false);
    })();
  }, [version]);

  useRealtimeRefresh(['sales', 'sale_items', 'expenses'], () => setVersion((v) => v + 1));

  const mSales = sales.filter((s) => matches(s.date));
  const mExp = expenses.filter((e) => matches(e.date));
  const tI = mSales.reduce((s, x) => s + Number(x.total), 0);
  const tE = mExp.reduce((s, x) => s + Number(x.amount), 0);
  const profit = tI - tE;
  const margin = tI > 0 ? Math.round((profit / tI) * 100) : 0;
  const profitPct = tI > 0 ? Math.round(((tI - tE) / tI) * 100) : 0;

  const chartData = view === 'year'
    ? Array.from({ length: 5 }, (_, idx) => {
        const yr = cy - 4 + idx;
        const sIn = sales.filter((s) => new Date(s.date).getFullYear() === yr).reduce((a, x) => a + Number(x.total), 0);
        const sEx = expenses.filter((e) => new Date(e.date).getFullYear() === yr).reduce((a, x) => a + Number(x.amount), 0);
        return { label: String(yr), inc: sIn, exp: sEx };
      })
    : Array.from({ length: 6 }, (_, idx) => {
        const i = 5 - idx;
        const d = new Date(cy, cm - i, 1);
        const m = d.getMonth(), y = d.getFullYear();
        const sIn = sales.filter((s) => { const dd = new Date(s.date); return dd.getMonth() === m && dd.getFullYear() === y; }).reduce((a, x) => a + Number(x.total), 0);
        const sEx = expenses.filter((e) => { const dd = new Date(e.date); return dd.getMonth() === m && dd.getFullYear() === y; }).reduce((a, x) => a + Number(x.amount), 0);
        return { label: MONTHS[m], inc: sIn, exp: sEx };
      });
  const chartTitle = view === 'year' ? 'รายรับ-รายจ่าย 5 ปีล่าสุด' : 'รายรับ-รายจ่าย 6 เดือนล่าสุด';

  const entries: Entry[] = [
    ...mSales.map((s) => ({
      id: s.id, type: 'income' as const,
      desc: s.sale_items?.map((i) => `${i.product_name} × ${i.quantity}`).join(', ') || 'บิลขาย',
      cat: 'ยอดขาย', date: s.date, amt: Number(s.total),
    })),
    ...mExp.map((e) => ({
      id: e.id, type: 'expense' as const,
      desc: e.description || e.category, cat: e.category, date: e.date, amt: Number(e.amount),
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  const catMap = new Map<string, number>();
  mExp.forEach((e) => catMap.set(e.category, (catMap.get(e.category) || 0) + Number(e.amount)));
  const cats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
  const catMax = Math.max(...cats.map((c) => c[1]), 1);

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#a0aec0', fontSize: 13 }}>กำลังโหลด...</div>;

  return (
    <div className="page active">
      {/* KPI ROW */}
      <div className="kpi-row">
        <Kpi label="รายรับ" value={formatTHB(tI)} sub={`${mSales.length} บิล`} accentBg="#1a2b45" iconColor="#f5a623" iconClass="ti-arrow-up" />
        <Kpi label="รายจ่าย" value={formatTHB(tE)} sub={`${mExp.length} รายการ`} accentBg="#fff3e0" iconColor="#f5a623" iconClass="ti-arrow-down" />
        <Kpi label="กำไรสุทธิ" value={formatTHB(Math.abs(profit))} sub={profit > 0 ? 'มีกำไร' : profit < 0 ? 'ขาดทุน' : 'เสมอตัว'} accentBg="#e8f4ff" iconColor="#378ADD" iconClass="ti-chart-line" valColor={profit >= 0 ? '#1D9E75' : '#E24B4A'} valPrefix={profit < 0 ? '-' : ''} />
        <Kpi label="อัตรากำไร (Margin)" value={`${margin}%`} sub="กำไร / รายรับ" accentBg="#e8f5ee" iconColor="#1D9E75" iconClass="ti-percentage" valColor={margin >= 50 ? '#1D9E75' : margin >= 0 ? '#d4891a' : '#E24B4A'} />
      </div>

      {/* MID ROW */}
      <div className="mid-row">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">{chartTitle}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <Legend dot="#1a2b45" label="รายรับ" />
                <Legend dot="#f5a623" label="รายจ่าย" />
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', width: '100%', height: 395 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 22, right: 5, left: -10, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} tickFormatter={(v) => '฿' + v.toLocaleString()} />
                <Tooltip cursor={false} formatter={(v) => formatTHB(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e8eaed', fontFamily: 'Kanit' }} />
                <Bar dataKey="inc" name="รายรับ" fill="#1a2b45" radius={3}>
                  <LabelList dataKey="inc" position="top" fontSize={9} fill="#1a2b45" formatter={formatShort} />
                </Bar>
                <Bar dataKey="exp" name="รายจ่าย" fill="#f5a623" radius={3}>
                  <LabelList dataKey="exp" position="top" fontSize={9} fill="#d4891a" formatter={formatShort} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title">สัดส่วน</div></div>
          <div className="donut-wrap">
            <div style={{ position: 'relative', width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[{ name: 'รายรับ', value: tI || 0.1 }, { name: 'รายจ่าย', value: tE || 0.1 }]} dataKey="value" cx="50%" cy="50%" innerRadius={48} outerRadius={72} startAngle={90} endAngle={-270} stroke="none">
                    <Cell fill="#1a2b45" /><Cell fill="#f5a623" />
                  </Pie>
                  <Tooltip cursor={false} formatter={(v) => formatTHB(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, fontFamily: 'Kanit' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, color: profitPct >= 0 ? '#1D9E75' : '#E24B4A' }}>{profitPct}%</div>
                <div style={{ fontSize: 11, color: '#8a9ab5', marginTop: 4 }}>อัตรากำไร</div>
              </div>
            </div>
            <div className="donut-items">
              <div className="di-row"><div className="di-dot" style={{ background: '#1a2b45' }} /><span style={{ flex: 1 }}>รายรับ</span><span style={{ fontWeight: 500, color: '#1a2b45' }}>{formatTHB(tI)}</span></div>
              <div className="di-row"><div className="di-dot" style={{ background: '#f5a623' }} /><span style={{ flex: 1 }}>รายจ่าย</span><span style={{ fontWeight: 500, color: '#d4891a' }}>{formatTHB(tE)}</span></div>
            </div>
          </div>
          <div style={{ height: '0.5px', background: 'var(--th-card-border)', margin: '10px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--th-text)', marginBottom: 6 }}>รายรับ-รายจ่าย</div>
          <div style={{ position: 'relative', width: '100%', height: 120 }}>
            <ResponsiveContainer>
              <BarChart data={[{ label: 'รายรับ', v: tI }, { label: 'รายจ่าย', v: tE }]} margin={{ top: 22, right: 5, left: -15, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip cursor={false} formatter={(v) => formatTHB(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, fontFamily: 'Kanit' }} />
                <Bar dataKey="v" radius={6}>
                  <Cell fill="#1a2b45" /><Cell fill="#f5a623" />
                  <LabelList dataKey="v" position="top" fontSize={9} fill="#1a2b45" formatter={formatShort} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BOT ROW */}
      <div className="bot-row">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">รายการล่าสุด</div>
            <a href="/sales" className="cbtn" style={{ textDecoration: 'none', display: 'inline-block' }}>+ เพิ่ม</a>
          </div>
          <div className="entries-list">
            <div className="ei-header">
              <div></div>
              <div>รายการ</div>
              <div>หมวด</div>
              <div style={{ textAlign: 'center' }}>วันที่</div>
              <div style={{ textAlign: 'right' }}>จำนวน</div>
              <div></div>
            </div>
            {entries.length === 0 ? (
              <div className="empty">ยังไม่มีรายการ</div>
            ) : entries.slice(0, 4).map((e) => (
              <div key={e.id} className="ei">
                <div className="ei-dot-wrap"><div className={`ei-dot ${e.type === 'income' ? 'ei-i' : 'ei-e'}`} /></div>
                <div className="ei-desc">{e.desc}</div>
                <div><span className="ei-cat"><CategoryIcon category={e.cat} />{cleanCategoryLabel(e.cat)}</span></div>
                <div className="ei-date">{e.date.slice(5).replace('-', '/')}</div>
                <div className={`ei-amt ${e.type === 'income' ? 'ei-ai' : 'ei-ae'}`}>{formatTHB(e.amt)}</div>
                <div></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-hd"><div className="card-title">หมวดค่าใช้จ่าย</div></div>
          {cats.length === 0 ? (
            <div className="empty">ยังไม่มีข้อมูล</div>
          ) : (
            <div>
              {cats.map(([name, val]) => (
                <div key={name} className="cat-row">
                  <div className="cat-name"><CategoryIcon category={name} />{cleanCategoryLabel(name)}</div>
                  <div className="cat-track">
                    <div className="cat-fill" style={{ width: `${Math.round((val / catMax) * 100)}%`, background: '#f5a623' }} />
                  </div>
                  <div className="cat-amt" style={{ color: '#d4891a' }}>{formatTHB(val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label, value, sub, accentBg, iconColor, iconClass, valColor, valPrefix = '',
}: {
  label: string; value: string; sub: string; accentBg: string; iconColor: string; iconClass: string; valColor?: string; valPrefix?: string;
}) {
  return (
    <div className="kpi">
      <div className="kpi-acc" style={{ background: accentBg }}>
        <i className={`ti ${iconClass}`} style={{ fontSize: 12, color: iconColor }} />
      </div>
      <div className="kpi-lbl">{label}</div>
      <div className="kpi-val" style={valColor ? { color: valColor } : undefined}>{valPrefix}{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#8a9ab5' }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: dot }} />
      <span>{label}</span>
    </div>
  );
}
