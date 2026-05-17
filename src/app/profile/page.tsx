'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatTHB } from '@/lib/types';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';

type Profile = { name: string; type: string; tagline: string; image_url: string | null };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ name: 'YOUR NAME', type: 'ร้านค้า', tagline: '', image_url: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ income: 0, expense: 0, count: 0 });
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  useRealtimeRefresh(['shop_profile', 'sales', 'expenses'], () => load());

  async function load() {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) { setLoading(false); return; }
    const [{ data: p }, { data: sales }, { data: expenses }] = await Promise.all([
      supabase.from('shop_profile').select('*').eq('user_id', uid).maybeSingle(),
      supabase.from('sales').select('total'),
      supabase.from('expenses').select('amount'),
    ]);
    if (p) setProfile({ name: p.name, type: p.type || '', tagline: p.tagline || '', image_url: p.image_url });
    const inc = (sales || []).reduce((s, x) => s + Number(x.total), 0);
    const exp = (expenses || []).reduce((s, x) => s + Number(x.amount), 0);
    setStats({ income: inc, expense: exp, count: (sales?.length || 0) + (expenses?.length || 0) });
    setLoading(false);
  }

  async function save() {
    if (!profile.name.trim()) return alert('กรุณาระบุชื่อร้าน');
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) return alert('ยังไม่ login');
    setSaving(true);
    const { error } = await supabase.from('shop_profile').upsert({
      user_id: uid,
      name: profile.name.trim(),
      type: profile.type.trim() || null,
      tagline: profile.tagline.trim() || null,
      image_url: profile.image_url,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) return alert('Error: ' + error.message);
    window.dispatchEvent(new CustomEvent('profile-updated'));
    alert('บันทึกสำเร็จ');
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
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
        const max = 400;
        const scale = Math.min(1, max / Math.max(im.width, im.height));
        const cv = document.createElement('canvas');
        cv.width = im.width * scale;
        cv.height = im.height * scale;
        cv.getContext('2d')!.drawImage(im, 0, 0, cv.width, cv.height);
        setProfile((p) => ({ ...p, image_url: cv.toDataURL('image/jpeg', 0.8) }));
      };
      im.src = ev.target!.result as string;
    };
    reader.readAsDataURL(f);
  }

  function clearAvatar() {
    setProfile((p) => ({ ...p, image_url: null }));
    if (fileInput.current) fileInput.current.value = '';
  }

  if (loading) return <div className="empty">กำลังโหลด...</div>;

  const initials = profile.name.slice(0, 2).toUpperCase();

  return (
    <div className="page active">
      <div className="pf-card">
        <div className="pf-av-row">
          <div className="pf-av-big">
            {profile.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image_url} alt="" />
            ) : initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--th-text)' }}>{profile.name}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
              <button type="button" className="up-btn" onClick={() => fileInput.current?.click()}>
                <i className="ti ti-upload" style={{ fontSize: 11 }} /> อัปโหลดรูป
              </button>
              {profile.image_url && (
                <button
                  type="button"
                  onClick={clearAvatar}
                  className="up-btn"
                  style={{ color: '#E24B4A', borderColor: '#fcc' }}
                >
                  <i className="ti ti-trash" style={{ fontSize: 11 }} /> ลบรูป
                </button>
              )}
            </div>
            <input ref={fileInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
          </div>
        </div>

        <div className="pf-field">
          <label>ชื่อร้าน</label>
          <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        </div>
        <div className="pf-field">
          <label>ประเภทร้าน</label>
          <input value={profile.type} onChange={(e) => setProfile({ ...profile, type: e.target.value })} placeholder="เช่น ร้านสกรีนเสื้อ" />
        </div>
        <div className="pf-field">
          <label>ที่อยู่ / เวลาเปิด</label>
          <input value={profile.tagline} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} placeholder="เช่น นครสวรรค์ · เปิดจันทร์-เสาร์ 09:00-18:00" />
        </div>

        <button className="pf-save" onClick={save} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>

        <div className="pf-stats">
          <div className="pf-stat">
            <div className="pf-stat-v" style={{ color: '#1D9E75' }}>{formatTHB(stats.income)}</div>
            <div className="pf-stat-l">รายรับรวม</div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat-v" style={{ color: '#E24B4A' }}>{formatTHB(stats.expense)}</div>
            <div className="pf-stat-l">รายจ่ายรวม</div>
          </div>
          <div className="pf-stat">
            <div className="pf-stat-v">{stats.count}</div>
            <div className="pf-stat-l">รายการ</div>
          </div>
        </div>
      </div>
    </div>
  );
}
