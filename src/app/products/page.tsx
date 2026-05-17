'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, formatTHB } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', price: '', cost: '', stock: '', category: '' });

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ name: '', price: '', cost: '', stock: '', category: '' }); setShowForm(true); }
  function openEdit(p: Product) { setEditing(p); setForm({ name: p.name, price: String(p.price), cost: String(p.cost), stock: String(p.stock), category: p.category || '' }); setShowForm(true); }

  async function save() {
    if (!form.name.trim()) return alert('กรุณาระบุชื่อสินค้า');
    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock) || 0,
      category: form.category.trim() || null,
    };
    const { error } = editing
      ? await supabase.from('products').update(payload).eq('id', editing.id)
      : await supabase.from('products').insert(payload);
    if (error) return alert('Error: ' + error.message);
    setShowForm(false); load();
  }
  async function del(id: string) { if (!confirm('ลบสินค้านี้?')) return; await supabase.from('products').delete().eq('id', id); load(); }
  async function adjust(p: Product, d: number) { await supabase.from('products').update({ stock: Math.max(0, p.stock + d) }).eq('id', p.id); load(); }

  const lowCount = products.filter((p) => p.stock <= 5).length;

  return (
    <div className="page active">
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="rec-hd">
          <div className="card-title">รายการสินค้า</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="rec-cnt">{products.length} รายการ{lowCount > 0 ? ` · สต็อกต่ำ ${lowCount}` : ''}</span>
            <button className="cbtn" onClick={openNew}>+ เพิ่มสินค้า</button>
          </div>
        </div>
        <div className="entries-list">
          <div className="ei-header" style={{ gridTemplateColumns: '1fr 120px 130px 90px 90px 60px' }}>
            <div>สินค้า</div>
            <div>หมวด</div>
            <div style={{ textAlign: 'center' }}>สต็อก</div>
            <div style={{ textAlign: 'right' }}>ราคาขาย</div>
            <div style={{ textAlign: 'right' }}>ต้นทุน</div>
            <div></div>
          </div>
          {loading ? <div className="empty">กำลังโหลด...</div> : products.length === 0 ? (
            <div className="empty">ยังไม่มีสินค้า กด &quot;เพิ่มสินค้า&quot; เพื่อเริ่ม</div>
          ) : products.map((p) => {
            const low = p.stock <= 5;
            return (
              <div key={p.id} className="ei" style={{ gridTemplateColumns: '1fr 120px 130px 90px 90px 60px', background: low ? 'rgba(255,243,224,0.5)' : undefined }}>
                <div className="ei-desc">
                  {p.name}
                  {low && <span style={{ marginLeft: 6, fontSize: 10, background: '#FFF0E0', color: '#c07800', padding: '1px 6px', borderRadius: 4 }}>ต่ำ</span>}
                </div>
                <div>{p.category ? <span className="ei-cat">{p.category}</span> : <span style={{ color: '#a0aec0' }}>—</span>}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <button onClick={() => adjust(p, -1)} style={btnAdj}>−</button>
                  <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 500, color: low ? '#E24B4A' : '#1a2b45' }}>{p.stock}</span>
                  <button onClick={() => adjust(p, 1)} style={btnAdj}>+</button>
                </div>
                <div className="ei-amt" style={{ color: '#1a2b45' }}>{formatTHB(p.price)}</div>
                <div className="ei-amt" style={{ color: '#8a9ab5' }}>{formatTHB(p.cost)}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <button className="ei-del" onClick={() => openEdit(p)} title="แก้ไข"><i className="ti ti-pencil-plus" style={{ fontSize: 11 }} /></button>
                  <button className="ei-del" onClick={() => del(p.id)} title="ลบ"><i className="ti ti-trash" style={{ fontSize: 11 }} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div style={modalBg} onClick={() => setShowForm(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="card-hd">
              <div className="card-title">{editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</div>
              <button className="ei-del" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="ef-grid">
              <div style={{ gridColumn: 'span 2' }}><label>ชื่อสินค้า</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></div>
              <div style={{ gridColumn: 'span 2' }}><label>หมวดหมู่</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="เช่น เครื่องดื่ม" /></div>
              <div><label>ราคาขาย (฿)</label><input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><label>ต้นทุน (฿)</label><input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div style={{ gridColumn: 'span 2' }}><label>จำนวนสต็อก</label><input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
            </div>
            <button className="btn-i" onClick={save} style={{ marginTop: 12, width: '100%' }}>บันทึก</button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnAdj: React.CSSProperties = { width: 22, height: 22, borderRadius: 5, border: '0.5px solid #dde1e7', background: '#fff', color: '#1a2b45', cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: 'Kanit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };
const modalBg: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 };
