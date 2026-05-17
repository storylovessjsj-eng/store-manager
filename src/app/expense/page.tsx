'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Expense, formatTHB } from '@/lib/types';
import { useFilter } from '@/components/FilterContext';

export default function ExpensePage() {
  const { matches } = useFilter();
  const [all, setAll] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      setAll((data as Expense[]) || []);
      setLoading(false);
    })();
  }, []);

  const items = all.filter((e) => matches(e.date));
  const total = items.reduce((s, x) => s + Number(x.amount), 0);

  return (
    <div className="page active">
      <div className="card">
        <div className="rec-hd">
          <div className="card-title">รายจ่ายทั้งหมด</div>
          <span className="rec-cnt">รวม {formatTHB(total)} · {items.length} รายการ</span>
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
          {loading ? (
            <div className="empty">กำลังโหลด...</div>
          ) : items.length === 0 ? (
            <div className="empty">ยังไม่มีรายการ</div>
          ) : items.map((e) => (
            <div key={e.id} className="ei">
              <div className="ei-dot-wrap"><div className="ei-dot ei-e" /></div>
              <div className="ei-desc">
                {e.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.image_url} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', marginRight: 4, verticalAlign: 'middle', border: '0.5px solid #e8eaed' }} />
                )}
                {e.description || e.category}
              </div>
              <div><span className="ei-cat">{e.category}</span></div>
              <div className="ei-date">{e.date.slice(5).replace('-', '/')}</div>
              <div className="ei-amt ei-ae">{formatTHB(Number(e.amount))}</div>
              <div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
