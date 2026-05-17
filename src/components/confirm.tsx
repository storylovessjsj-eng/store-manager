'use client';
import { useEffect, useState } from 'react';

type State = { msg: string; resolve: (b: boolean) => void } | null;
let openFn: ((msg: string) => Promise<boolean>) | null = null;

/** ใช้แทน window.confirm() — non-blocking + ปรับสไตล์ได้ */
export async function confirmDialog(msg: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!openFn) return window.confirm(msg);
  return openFn(msg);
}

export default function ConfirmHost() {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    openFn = (msg) => new Promise<boolean>((resolve) => setState({ msg, resolve }));
    return () => { openFn = null; };
  }, []);

  function close(answer: boolean) {
    if (!state) return;
    state.resolve(answer);
    setState(null);
  }

  if (!state) return null;

  return (
    <div onClick={() => close(false)} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={card}>
        <div style={msgStyle}>{state.msg}</div>
        <div style={buttons}>
          <button onClick={() => close(false)} style={btnCancel}>ยกเลิก</button>
          <button onClick={() => close(true)} style={btnOk} autoFocus>ตกลง</button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'Kanit, sans-serif' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 12, padding: 20, width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' };
const msgStyle: React.CSSProperties = { fontSize: 14, color: '#1a2b45', marginBottom: 16, lineHeight: 1.5 };
const buttons: React.CSSProperties = { display: 'flex', gap: 8, justifyContent: 'flex-end' };
const btnCancel: React.CSSProperties = { padding: '8px 16px', borderRadius: 6, border: '0.5px solid #dde1e7', background: '#fff', color: '#8a9ab5', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' };
const btnOk: React.CSSProperties = { padding: '8px 16px', borderRadius: 6, border: 'none', background: '#f5a623', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' };
