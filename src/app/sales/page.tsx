'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, formatTHB, todayISO } from '@/lib/types';
import { useFilter } from '@/components/FilterContext';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';
import { CategoryIcon, cleanCategoryLabel } from '@/components/CategoryIcon';

type Entry = {
  id: string;
  type: 'income' | 'expense';
  desc: string;
  cat: string;
  date: string;
  amt: number;
  image_url: string | null;
};

export default function RecordPage() {
  const { matches } = useFilter();
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState<string>(INCOME_CATEGORIES[0]);
  const [date, setDate] = useState(todayISO());
  const [img, setImg] = useState<string | null>(null);
  const [allEntries, setAllEntries] = useState<Entry[]>([]);
  const entries = allEntries.filter((e) => matches(e.date));
  const [viewImg, setViewImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  useRealtimeRefresh(['sales', 'expenses'], () => load());
  useEffect(() => {
    setCat(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }, [type]);

  async function load() {
    const [{ data: sales }, { data: expenses }] = await Promise.all([
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('expenses').select('*').order('date', { ascending: false }),
    ]);
    const list: Entry[] = [
      ...(sales || []).map((s) => ({
        id: s.id,
        type: 'income' as const,
        desc: s.description || s.notes || 'รายรับ',
        cat: s.category || 'ขายสินค้า',
        date: s.date,
        amt: Number(s.total),
        image_url: s.image_url,
      })),
      ...(expenses || []).map((x) => ({
        id: x.id,
        type: 'expense' as const,
        desc: x.description || x.category,
        cat: x.category,
        date: x.date,
        amt: Number(x.amount),
        image_url: x.image_url,
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));
    setAllEntries(list);
  }

  function handleImg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 5MB');
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const im = new window.Image();
      im.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / im.width);
        const cv = document.createElement('canvas');
        cv.width = im.width * scale;
        cv.height = im.height * scale;
        cv.getContext('2d')!.drawImage(im, 0, 0, cv.width, cv.height);
        setImg(cv.toDataURL('image/jpeg', 0.75));
      };
      im.src = ev.target!.result as string;
    };
    reader.readAsDataURL(f);
  }

  function clearImg() {
    setImg(null);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function save() {
    const a = parseFloat(amt);
    if (!desc.trim() || !a || a <= 0 || !date) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setSaving(true);
    if (type === 'income') {
      await supabase.from('sales').insert({
        date,
        total: a,
        description: desc.trim(),
        category: cat,
        image_url: img,
      });
    } else {
      await supabase.from('expenses').insert({
        date,
        amount: a,
        category: cat,
        description: desc.trim(),
        image_url: img,
      });
    }
    setSaving(false);
    setDesc('');
    setAmt('');
    clearImg();
    load();
  }

  async function del(e: Entry) {
    if (!confirm('ลบรายการนี้?')) return;
    if (e.type === 'income') await supabase.from('sales').delete().eq('id', e.id);
    else await supabase.from('expenses').delete().eq('id', e.id);
    load();
  }

  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="page active">
      <div className="card" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 10 }}>บันทึกรายการใหม่</div>

        <div className="type-toggle">
          <button
            className={`tbtn ${type === 'income' ? 'si' : ''}`}
            onClick={() => setType('income')}
          >
            <i className="ti ti-arrow-up" style={{ fontSize: 11 }} /> รายรับ
          </button>
          <button
            className={`tbtn ${type === 'expense' ? 'se' : ''}`}
            onClick={() => setType('expense')}
          >
            <i className="ti ti-arrow-down" style={{ fontSize: 11 }} /> รายจ่าย
          </button>
        </div>

        <div className="ef-grid">
          <div>
            <label>รายการ</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="ระบุรายการ" />
          </div>
          <div>
            <label>จำนวนเงิน (฿)</label>
            <input type="number" min="0" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0" />
          </div>
          <div>
            <label>หมวดหมู่</label>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>วันที่</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div style={{ marginTop: 6, marginBottom: 6 }}>
          <label style={{ fontSize: 11, color: '#8a9ab5', display: 'block', marginBottom: 4 }}>
            แนบรูป / สลิป (ถ้ามี)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="up-btn" onClick={() => fileInput.current?.click()}>
              <i className="ti ti-upload" style={{ fontSize: 11 }} /> เลือกรูป
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImg}
            />
            {img && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover', border: '0.5px solid #e8eaed', cursor: 'pointer' }}
                  onClick={() => setViewImg(img)}
                />
                <button
                  type="button"
                  onClick={clearImg}
                  style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#E24B4A', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          className={type === 'income' ? 'btn-i' : 'btn-e'}
          onClick={save}
          disabled={saving}
          style={{ marginTop: 4, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'กำลังบันทึก...' : `บันทึก${type === 'income' ? 'รายรับ' : 'รายจ่าย'}`}
        </button>
      </div>

      <div className="card">
        <div className="rec-hd">
          <div className="card-title">รายการทั้งหมด</div>
          <span className="rec-cnt">{entries.length} รายการ</span>
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
          ) : entries.map((e) => (
            <div key={`${e.type}-${e.id}`} className="ei">
              <div className="ei-dot-wrap">
                <div className={`ei-dot ${e.type === 'income' ? 'ei-i' : 'ei-e'}`} />
              </div>
              <div className="ei-desc">
                {e.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.image_url}
                    alt=""
                    style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', marginRight: 4, verticalAlign: 'middle', cursor: 'pointer', border: '0.5px solid #e8eaed' }}
                    onClick={(ev) => { ev.stopPropagation(); setViewImg(e.image_url!); }}
                    title="ดูรูป/สลิป"
                  />
                )}
                {e.desc}
              </div>
              <div><span className="ei-cat"><CategoryIcon category={e.cat} />{cleanCategoryLabel(e.cat)}</span></div>
              <div className="ei-date">{e.date.slice(5).replace('-', '/')}</div>
              <div className={`ei-amt ${e.type === 'income' ? 'ei-ai' : 'ei-ae'}`}>{formatTHB(e.amt)}</div>
              <button className="ei-del" onClick={() => del(e)} aria-label="ลบ">
                <i className="ti ti-trash" style={{ fontSize: 11 }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {viewImg && (
        <div
          onClick={() => setViewImg(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 20 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={viewImg} alt="" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}
