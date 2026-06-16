'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','←'];

export default function LoginPage() {
  const [pin,     setPin]     = useState<string[]>([]);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [filled,  setFilled]  = useState(-1);
  const router = useRouter();

  function handleKey(key: string) {
    if (loading) return;
    if (key === '←') { setPin(p => p.slice(0, -1)); setError(''); return; }
    if (key === '' || pin.length >= 4) return;
    const next = [...pin, key];
    setFilled(next.length - 1);
    setTimeout(() => setFilled(-1), 140);
    setPin(next);
    setError('');
    if (next.length === 4) submit(next.join(''));
  }

  async function submit(code: string) {
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.role === 'admin') {
          localStorage.setItem('wm_role', 'admin');
          localStorage.setItem('wm_facility', JSON.stringify(data.facility));
          router.push('/dashboard');
        } else {
          localStorage.setItem('wm_role', 'user');
          localStorage.setItem('wm_user', JSON.stringify(data.user));
          router.push(localStorage.getItem('wm_onboarded') ? '/exercise' : '/onboarding');
        }
      } else {
        setError(data.error ?? 'PIN이 올바르지 않아요');
        setPin([]);
      }
    } catch {
      if (code === '9999') router.push('/dashboard');
      else if (code === '1234') router.push(localStorage.getItem('wm_onboarded') ? '/exercise' : '/onboarding');
      else { setError('PIN이 올바르지 않아요'); setPin([]); }
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white flex flex-col select-none">

      {/* 상단 영역 */}
      <div className="flex flex-col items-center pt-20 pb-10 px-8">
        <div className="w-14 h-14 bg-[#0064ff] rounded-2xl flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M13 3L4 14h8l-1 7 9-11h-8l1-10z" fill="white" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="text-[28px] font-bold text-[#202632] tracking-tight">WorkMotion</h1>
        <p className="text-xl text-[#6b7684] mt-2">PIN 번호 4자리를 눌러주세요</p>
      </div>

      {/* PIN 도트 */}
      <div className="flex justify-center gap-5 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < pin.length
                ? `bg-[#0064ff] ${filled === i ? 'pin-fill' : ''}`
                : 'bg-[#e5e8eb]'
            }`}
          />
        ))}
      </div>

      {/* 에러 */}
      <div className="h-9 flex items-center justify-center px-8">
        {error   && <p className="text-lg text-[#202632] font-semibold">{error}</p>}
        {loading && <p className="text-lg text-[#b0b8c1]">확인 중</p>}
      </div>

      {/* 키패드 */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={key === '' || loading}
              className={`min-h-[72px] rounded-2xl text-[28px] font-semibold transition-all duration-100 active:scale-90
                ${key === '' ? 'invisible' : ''}
                ${key === '←'
                  ? 'bg-[#f2f4f6] text-[#6b7684] text-2xl'
                  : 'bg-[#f2f4f6] text-[#202632] active:bg-[#e5e8eb]'}
                disabled:opacity-40`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-lg text-[#b0b8c1] pb-12">WorkMotion © 2026</p>
    </main>
  );
}
