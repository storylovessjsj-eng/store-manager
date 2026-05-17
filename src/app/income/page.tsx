'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, formatTHB } from '@/lib/types';
import { useFilter } from '@/components/FilterContext';

export default function IncomePage() {
  const { matches } = useFilter();
  const [all, setAll] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('sales').select('*').order('date', { ascending: false });
      setAll((data as Sale[]) || []);
      setLoading(false);
    })();
  }, []);

  const items = all.filter((s) => matches(s.date));
  const total = items.reduce((s, x) => s + Number(x.total), 0);

  return (
    <div className="page active">
      <div className="card">
        <div className="rec-hd">
          <div className="card-title">รายรับทั้งหมด</div>
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
          ) : items.map((s) => (
            <div key={s.id} className="ei">
              <div className="ei-dot-wrap"><div className="ei-dot ei-i" /></div>
              <div className="ei-desc">
                {s.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image_url} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover', marginRight: 4, verticalAlign: 'middle', border: '0.5px solid #e8eaed' }} />
                )}
                {s.description || s.notes || 'รายรับ'}
              </div>
              <div><span className="ei-cat">{s.category || 'ขายสินค้า'}</span></div>
              <div className="ei-date">{s.date.slice(5).replace('-', '/')}</div>
              <div className="ei-amt ei-ai">{formatTHB(Number(s.total))}</div>
              <div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
