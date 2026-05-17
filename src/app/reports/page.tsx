'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, Expense, formatTHB } from '@/lib/types';
import { useFilter } from '@/components/FilterContext';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';

export default function ReportsPage() {
  const { matches } = useFilter();
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
        <div className="cat-name">{name}</div>
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
    </div>
  );
}
