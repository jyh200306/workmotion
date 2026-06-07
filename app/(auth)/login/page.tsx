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
    setTimeout(() => setFilled(-1), 150);
    setPin(next);
    setError('');
    if (next.length === 4) submit(next.join(''));
  }

  async function submit(code: string) {
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/pin', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pin: code }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.role === 'admin') {
          localStorage.setItem('wm_role',     'admin');
          localStorage.setItem('wm_facility', JSON.stringify(data.facility));
          router.push('/dashboard');
        } else {
          localStorage.setItem('wm_role', 'user');
          localStorage.setItem('wm_user', JSON.stringify(data.user));
          const onboarded = localStorage.getItem('wm_onboarded');
          router.push(onboarded ? '/exercise' : '/onboarding');
        }
      } else {
        setError(data.error ?? 'PIN이 올바르지 않습니다');
        setPin([]);
      }
    } catch {
      // Supabase 미연동 시 목 모드
      if (code === '9999')      router.push('/dashboard');
      else if (code === '1234') router.push(localStorage.getItem('wm_onboarded') ? '/exercise' : '/onboarding');
      else { setError('PIN이 올바르지 않습니다'); setPin([]); }
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-b from-blue-600 to-indigo-700 px-6 py-12 select-none">

      {/* 로고 */}
      <div className="flex flex-col items-center gap-2 pt-4">
        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mb-2">
          <span className="text-5xl">🏃</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">WorkMotion</h1>
        <p className="text-xl text-blue-200">스마트 운동 코칭</p>
      </div>

      {/* PIN 입력 */}
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        <p className="text-2xl text-white/90 font-medium">PIN 4자리를 입력해 주세요</p>

        <div className="flex gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
              i < pin.length ? `bg-white border-white ${filled === i ? 'pin-fill' : ''}` : 'bg-transparent border-white/50'
            }`} />
          ))}
        </div>

        <div className="h-8 flex items-center">
          {error   && <p className="text-red-200 text-xl font-semibold">{error}</p>}
          {loading && <p className="text-white/70 text-xl animate-pulse">확인 중...</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 w-full">
          {KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={key === '' || loading}
              className={`min-h-[72px] rounded-2xl text-3xl font-bold transition-all duration-100 active:scale-90
                ${key === '' ? 'invisible' : ''}
                ${key === '←' ? 'bg-white/10 text-white text-2xl' : 'bg-white/15 text-white hover:bg-white/25 shadow-sm'}
                disabled:opacity-40`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-blue-300 text-lg">이용자 PIN: <span className="font-bold text-white">1234</span></p>
          <p className="text-blue-400 text-base">관리자 PIN: <span className="font-bold text-blue-200">9999</span></p>
        </div>
      </div>

      <p className="text-blue-300 text-lg">WorkMotion © 2026</p>
    </main>
  );
}
