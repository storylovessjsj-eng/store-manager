'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, Expense, formatTHB, formatShort } from '@/lib/types';
import { useFilter } from '@/components/FilterContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function ChartsPage() {
  const { year: y } = useFilter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const monthly = Array.from({ length: 12 }, (_, m) => {
    const inc = sales.filter((s) => { const d = new Date(s.date); return d.getMonth() === m && d.getFullYear() === y; }).reduce((a, x) => a + Number(x.total), 0);
    const exp = expenses.filter((e) => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y; }).reduce((a, x) => a + Number(x.amount), 0);
    return { label: MONTHS[m], inc, exp, profit: inc - exp };
  });

  const yearly = Array.from({ length: 6 }, (_, idx) => {
    const yr = y - 5 + idx;
    const inc = sales.filter((s) => new Date(s.date).getFullYear() === yr).reduce((a, x) => a + Number(x.total), 0);
    const exp = expenses.filter((e) => new Date(e.date).getFullYear() === yr).reduce((a, x) => a + Number(x.amount), 0);
    return { label: String(yr), inc, exp, profit: inc - exp };
  });

  if (loading) return <div className="empty">กำลังโหลด...</div>;

  return (
    <div className="page active">
      <div className="chart4-grid">
        <ChartCard title="รายรับ-รายจ่าย รายเดือน" sub={`ปี ${y}`}>
          <BarChart data={monthly} margin={{ top: 22, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} tickFormatter={(v) => '฿' + v.toLocaleString()} />
            <Tooltip formatter={(v) => formatTHB(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, fontFamily: 'Kanit' }} />
            <Bar dataKey="inc" name="รายรับ" fill="#1a2b45" radius={3}>
              <LabelList dataKey="inc" position="top" fontSize={9} fill="#1a2b45" formatter={formatShort} />
            </Bar>
            <Bar dataKey="exp" name="รายจ่าย" fill="#f5a623" radius={3}>
              <LabelList dataKey="exp" position="top" fontSize={9} fill="#d4891a" formatter={formatShort} />
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="กำไรสุทธิ รายเดือน" sub={`ปี ${y}`}>
          <BarChart data={monthly} margin={{ top: 22, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v < 0 ? '-' : '') + '฿' + Math.abs(v).toLocaleString()} />
            <Tooltip formatter={(v) => formatTHB(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, fontFamily: 'Kanit' }} />
            <Bar dataKey="profit" radius={3}>
              {monthly.map((d, i) => <Cell key={i} fill={d.profit >= 0 ? '#1D9E75' : '#F09595'} />)}
              <LabelList dataKey="profit" position="top" fontSize={9} fill="#1a2b45" formatter={formatShort} />
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="รายรับ-รายจ่าย รายปี" sub="6 ปีล่าสุด">
          <BarChart data={yearly} margin={{ top: 22, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} tickFormatter={(v) => '฿' + v.toLocaleString()} />
            <Tooltip formatter={(v) => formatTHB(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, fontFamily: 'Kanit' }} />
            <Bar dataKey="inc" name="รายรับ" fill="#1a2b45" radius={4}>
              <LabelList dataKey="inc" position="top" fontSize={9} fill="#1a2b45" formatter={formatShort} />
            </Bar>
            <Bar dataKey="exp" name="รายจ่าย" fill="#f5a623" radius={4}>
              <LabelList dataKey="exp" position="top" fontSize={9} fill="#d4891a" formatter={formatShort} />
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="กำไรสุทธิ รายปี" sub="6 ปีล่าสุด">
          <BarChart data={yearly} margin={{ top: 22, right: 5, left: -10, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#a0aec0', fontFamily: 'Kanit' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v < 0 ? '-' : '') + '฿' + Math.abs(v).toLocaleString()} />
            <Tooltip formatter={(v) => formatTHB(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 8, fontFamily: 'Kanit' }} />
            <Bar dataKey="profit" radius={4}>
              {yearly.map((d, i) => <Cell key={i} fill={d.profit >= 0 ? '#1D9E75' : '#F09595'} />)}
              <LabelList dataKey="profit" position="top" fontSize={9} fill="#1a2b45" formatter={formatShort} />
            </Bar>
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub: string; children: React.ReactElement }) {
  return (
    <div className="card">
      <div className="card-hd">
        <div>
          <div className="card-title">{title}</div>
          <div style={{ fontSize: 11, color: '#8a9ab5', marginTop: 1 }}>{sub}</div>
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 320 }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}
