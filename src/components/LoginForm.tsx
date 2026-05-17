'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setInfo('');
    if (!email || password.length < 6) {
      setErr('กรุณาใส่อีเมล และรหัสผ่านอย่างน้อย 6 ตัว');
      return;
    }
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErr(error.message);
      else setInfo('สมัครสำเร็จ! เช็คอีเมลเพื่อยืนยัน หรือลองเข้าสู่ระบบเลย');
    }
    setLoading(false);
  }

  return (
    <div style={overlay}>
      <form onSubmit={submit} style={card}>
        <div style={logo}>SM</div>
        <div style={title}>Store Manager</div>
        <div style={sub}>{mode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}</div>

        <label style={label}>อีเมล</label>
        <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={input} placeholder="you@example.com" />

        <label style={label}>รหัสผ่าน</label>
        <input type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={input} placeholder="•••••• (อย่างน้อย 6 ตัว)" />

        {err && <div style={errStyle}>{err}</div>}
        {info && <div style={infoStyle}>{info}</div>}

        <button type="submit" disabled={loading} style={{ ...btn, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'กำลังโหลด...' : mode === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>

        <div style={switchLink} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErr(''); setInfo(''); }}>
          {mode === 'signin' ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
        </div>
        <div style={hint}>ข้อมูลของคุณจะถูกแยกระหว่าง account</div>
      </form>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'linear-gradient(135deg,#1a2b45 0%,#2c4570 100%)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Kanit, sans-serif' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 16, padding: '32px 28px', width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' };
const logo: React.CSSProperties = { width: 64, height: 64, borderRadius: '50%', background: '#1a2b45', color: '#f5a623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, margin: '0 auto 14px' };
const title: React.CSSProperties = { fontSize: 18, fontWeight: 500, color: '#1a2b45', textAlign: 'center', marginBottom: 4 };
const sub: React.CSSProperties = { fontSize: 12, color: '#8a9ab5', textAlign: 'center', marginBottom: 18 };
const label: React.CSSProperties = { fontSize: 11, color: '#8a9ab5', display: 'block', marginBottom: 4, marginTop: 10 };
const input: React.CSSProperties = { width: '100%', fontSize: 14, fontFamily: 'inherit', border: '0.5px solid #dde1e7', borderRadius: 8, padding: '10px 12px', color: '#1a2b45', background: '#fff', outline: 'none' };
const btn: React.CSSProperties = { width: '100%', background: '#f5a623', color: '#fff', border: 'none', padding: 11, borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, marginTop: 14 };
const errStyle: React.CSSProperties = { fontSize: 11, color: '#E24B4A', textAlign: 'center', marginTop: 10 };
const infoStyle: React.CSSProperties = { fontSize: 11, color: '#1D9E75', textAlign: 'center', marginTop: 10 };
const switchLink: React.CSSProperties = { fontSize: 12, color: '#1a2b45', textAlign: 'center', marginTop: 14, cursor: 'pointer', fontWeight: 500 };
const hint: React.CSSProperties = { fontSize: 11, color: '#a0aec0', textAlign: 'center', marginTop: 10 };
