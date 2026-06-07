'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'];

export default function LoginPage() {
  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleKey(key: string) {
    if (key === '←') {
      setPin((prev) => prev.slice(0, -1));
      setError('');
      return;
    }
    if (key === '') return;
    if (pin.length >= 4) return;

    const next = [...pin, key];
    setPin(next);
    setError('');

    if (next.length === 4) {
      handleSubmit(next.join(''));
    }
  }

  async function handleSubmit(code: string) {
    setLoading(true);
    // TODO: Supabase 인증 연동
    await new Promise((r) => setTimeout(r, 800));

    if (code === '1234') {
      router.push('/exercise');
    } else {
      setError('PIN이 올바르지 않습니다. 다시 입력해 주세요.');
      setPin([]);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-6 gap-10">
      <div className="text-center">
        <p className="text-5xl font-black text-blue-700 mb-2">WorkMotion</p>
        <p className="text-2xl text-gray-600">PIN 4자리를 입력해 주세요</p>
      </div>

      {/* PIN 표시 */}
      <div className="flex gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-4 transition-all duration-150 ${
              i < pin.length ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'
            }`}
          />
        ))}
      </div>

      {/* 오류 메시지 */}
      {error && (
        <p className="text-2xl text-red-500 font-semibold text-center">{error}</p>
      )}

      {/* 키패드 */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {KEYS.map((key, i) => (
          <button
            key={i}
            onClick={() => handleKey(key)}
            disabled={loading || key === ''}
            className={`
              min-h-[72px] rounded-2xl text-4xl font-bold
              active:scale-95 transition-transform duration-100
              ${key === '' ? 'invisible' : ''}
              ${key === '←'
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-white text-gray-800 shadow-md hover:bg-blue-50'
              }
              disabled:opacity-50
            `}
          >
            {loading && pin.length === 4 && key !== '←' ? '' : key}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-2xl text-blue-600 animate-pulse">확인 중...</p>
      )}

      <p className="text-xl text-gray-400">테스트 PIN: 1234</p>
    </main>
  );
}
