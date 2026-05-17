'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense, EXPENSE_CATEGORIES, formatTHB, todayISO } from '@/lib/types';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: todayISO(), amount: '', category: EXPENSE_CATEGORIES[0] as string, description: '' });

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return alert('กรุณาระบุจำนวนเงิน');
    const { error } = await supabase.from('expenses').insert({ date: form.date, amount, category: form.category, description: form.description.trim() || null });
    if (error) return alert('Error: ' + error.message);
    setForm({ ...form, amount: '', description: '' });
    load();
  }
  async function del(id: string) { if (!confirm('ลบรายการนี้?')) return; await supabase.from('expenses').delete().eq('id', id); load(); }

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="page active">
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>บันทึกค่าใช้จ่ายใหม่</div>
        <div className="ef-grid">
          <div><label>วันที่</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><label>จำนวนเงิน (฿)</label><input type="number" min="0" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><label>หมวด</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label>คำอธิบาย</label><input placeholder="รายละเอียด" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <button className="btn-e" onClick={add} style={{ marginTop: 4 }}>บันทึกรายจ่าย</button>
      </div>

      <div className="card">
        <div className="rec-hd">
          <div className="card-title">รายการทั้งหมด</div>
          <span className="rec-cnt">รวม {formatTHB(total)} · {expenses.length} รายการ</span>
        </div>
        <div className="entries-list">
          <div className="ei-header">
            <div></div>
            <div>คำอธิบาย</div>
            <div>หมวด</div>
            <div style={{ textAlign: 'center' }}>วันที่</div>
            <div style={{ textAlign: 'right' }}>จำนวนเงิน</div>
            <div></div>
          </div>
          {loading ? <div className="empty">กำลังโหลด...</div> : expenses.length === 0 ? (
            <div className="empty">ยังไม่มีรายการ</div>
          ) : expenses.map((e) => (
            <div key={e.id} className="ei">
              <div className="ei-dot-wrap"><div className="ei-dot ei-e" /></div>
              <div className="ei-desc">{e.description || e.category}</div>
              <div><span className="ei-cat">{e.category}</span></div>
              <div className="ei-date">{e.date.slice(5).replace('-', '/')}</div>
              <div className="ei-amt ei-ae">{formatTHB(Number(e.amount))}</div>
              <button className="ei-del" onClick={() => del(e.id)} aria-label="ลบ"><i className="ti ti-trash" style={{ fontSize: 11 }} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
