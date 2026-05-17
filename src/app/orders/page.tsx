'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus, ORDER_STATUS_LABEL, ORDER_STATUS_COLOR, formatTHB, todayISO } from '@/lib/types';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';
import { confirmDialog } from '@/components/confirm';

type Tab = 'all' | OrderStatus;

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Order | null>(null);
  const [form, setForm] = useState({
    customer: '',
    description: '',
    quantity: '1',
    price: '',
    due_date: '',
    status: 'pending' as OrderStatus,
    note: '',
  });

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setItems((data as Order[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useRealtimeRefresh('orders', () => load());

  function reset() {
    setEditing(null);
    setForm({ customer: '', description: '', quantity: '1', price: '', due_date: '', status: 'pending', note: '' });
  }

  function openEdit(o: Order) {
    setEditing(o);
    setForm({
      customer: o.customer,
      description: o.description,
      quantity: String(o.quantity),
      price: String(o.price),
      due_date: o.due_date || '',
      status: o.status,
      note: o.note || '',
    });
  }

  async function save() {
    if (!form.customer.trim() || !form.description.trim()) {
      alert('กรุณาระบุชื่อลูกค้าและรายละเอียด');
      return;
    }
    const payload = {
      customer: form.customer.trim(),
      description: form.description.trim(),
      quantity: parseInt(form.quantity) || 1,
      price: parseFloat(form.price) || 0,
      due_date: form.due_date || null,
      status: form.status,
      note: form.note.trim() || null,
    };
    const { error } = editing
      ? await supabase.from('orders').update(payload).eq('id', editing.id)
      : await supabase.from('orders').insert(payload);
    if (error) return alert('Error: ' + error.message);
    reset();
    load();
  }

  async function del(id: string) {
    if (!(await confirmDialog('ลบออเดอร์นี้?'))) return;
    await supabase.from('orders').delete().eq('id', id);
    load();
  }

  async function setStatus(o: Order, status: OrderStatus) {
    await supabase.from('orders').update({ status }).eq('id', o.id);
    load();
  }

  const today = todayISO();
  const filtered = tab === 'all' ? items : items.filter((x) => x.status === tab);
  const sorted = [...filtered].sort((a, b) => {
    const so: Record<OrderStatus, number> = { pending: 0, working: 1, done: 2, cancelled: 3 };
    if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status];
    return (a.due_date || '9999') > (b.due_date || '9999') ? 1 : -1;
  });

  return (
    <div className="page active">
      {/* Form */}
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>{editing ? 'แก้ไขออเดอร์' : 'เพิ่มออเดอร์ใหม่'}</div>
        <div className="ef-grid">
          <div><label>ชื่อลูกค้า</label><input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="ชื่อลูกค้า" /></div>
          <div><label>รายละเอียดงาน</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="เช่น เสื้อสกรีน 12 ตัว" /></div>
          <div><label>จำนวน</label><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
          <div><label>ราคารวม (฿)</label><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" /></div>
          <div><label>กำหนดส่ง</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          <div>
            <label>สถานะ</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OrderStatus })}>
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: '#8a9ab5', display: 'block', marginBottom: 3 }}>หมายเหตุ</label>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="(ถ้ามี)" style={{ width: '100%', fontSize: 12, fontFamily: 'Kanit', border: '0.5px solid #dde1e7', borderRadius: 6, padding: '6px 8px', color: '#1a2b45', background: '#fff', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-i" onClick={save}>{editing ? 'บันทึกการแก้ไข' : 'บันทึกออเดอร์'}</button>
          {editing && <button className="tbtn" onClick={reset}>ยกเลิก</button>}
        </div>
      </div>

      {/* Tabs + list */}
      <div className="card">
        <div className="rec-hd">
          <div className="card-title">รายการออเดอร์</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'pending', 'working', 'done'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={tab === t ? 'cbtn' : 'tbtn'}
                style={{ fontSize: 11, padding: '4px 10px' }}
              >
                {t === 'all' ? 'ทั้งหมด' : t === 'pending' ? 'รอ' : t === 'working' ? 'ทำอยู่' : 'เสร็จ'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty">กำลังโหลด...</div>
        ) : sorted.length === 0 ? (
          <div className="empty">ไม่มีออเดอร์ในหมวดนี้</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map((o) => {
              const overdue = o.due_date && o.due_date < today && o.status !== 'done' && o.status !== 'cancelled';
              const color = ORDER_STATUS_COLOR[o.status];
              return (
                <div key={o.id} style={{ border: '0.5px solid #e8eaed', borderRadius: 10, padding: 12, background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2b45' }}>{o.customer}</div>
                      <div style={{ fontSize: 12, color: '#8a9ab5', marginTop: 2 }}>{o.description}</div>
                      {o.note && <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 3, fontStyle: 'italic' }}>{o.note}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 100, fontWeight: 500, background: color + '22', color }}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                      {o.price > 0 && <div style={{ fontSize: 13, fontWeight: 500, color: '#1a2b45', marginTop: 4 }}>{formatTHB(o.price)}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: '#8a9ab5' }}>
                      <span>จำนวน {o.quantity}</span>
                      {o.due_date && (
                        <span style={{ color: overdue ? '#E24B4A' : '#8a9ab5', fontWeight: overdue ? 500 : 400 }}>
                          กำหนดส่ง {o.due_date.slice(5).replace('-', '/')}{overdue ? ' ⚠' : ''}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {o.status !== 'done' && o.status !== 'cancelled' && (
                        <button onClick={() => setStatus(o, 'done')} style={{ background: '#1D9E75', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'Kanit' }}>
                          เสร็จ
                        </button>
                      )}
                      <button className="ei-del" onClick={() => openEdit(o)} title="แก้ไข"><i className="ti ti-pencil-plus" style={{ fontSize: 11 }} /></button>
                      <button className="ei-del" onClick={() => del(o.id)} title="ลบ"><i className="ti ti-trash" style={{ fontSize: 11 }} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
