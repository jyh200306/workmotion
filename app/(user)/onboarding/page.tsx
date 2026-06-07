'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GOALS = [
  { id: 'strength', emoji: '💪', label: '근력 강화',  desc: '다리·팔 근육을 키워요' },
  { id: 'balance',  emoji: '⚖️', label: '균형 향상',  desc: '낙상을 예방해요' },
  { id: 'health',   emoji: '❤️', label: '건강 유지',  desc: '꾸준한 운동 습관을 만들어요' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [name, setName]       = useState('');
  const [goal, setGoal]       = useState('');
  const [nameError, setNameError] = useState('');

  function goNext() {
    if (step === 1) {
      if (!name.trim()) { setNameError('이름을 입력해 주세요'); return; }
      setNameError('');
      setStep(2);
    } else if (step === 2) {
      if (!goal) return;
      setStep(3);
    } else {
      // 완료 → 운동 선택으로
      if (typeof window !== 'undefined') {
        localStorage.setItem('wm_onboarded', '1');
        localStorage.setItem('wm_name', name.trim());
        localStorage.setItem('wm_goal', goal);
      }
      router.push('/exercise');
    }
  }

  const canNext = step === 1 ? !!name.trim() : step === 2 ? !!goal : true;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-600 to-indigo-700 flex flex-col px-6 py-12 select-none">

      {/* 상단 로고 */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
          <span className="text-2xl">🏃</span>
        </div>
        <span className="text-3xl font-black text-white">WorkMotion</span>
      </div>

      {/* 단계 표시 */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* ── STEP 1: 이름 입력 ── */}
      {step === 1 && (
        <div className="flex flex-col flex-1 gap-8">
          <div>
            <p className="text-3xl font-black text-white mb-1">안녕하세요! 👋</p>
            <p className="text-xl text-blue-200">WorkMotion에 오신 걸 환영해요.</p>
            <p className="text-xl text-blue-200 mt-1">먼저 이름을 알려주세요.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-2xl font-bold text-white">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); }}
              placeholder="홍길동"
              maxLength={10}
              className="w-full min-h-[68px] rounded-2xl bg-white/15 text-white text-3xl
                         font-bold px-5 placeholder-white/40 border-2 border-white/20
                         focus:outline-none focus:border-white/60"
            />
            {nameError && <p className="text-red-300 text-xl">{nameError}</p>}
          </div>
        </div>
      )}

      {/* ── STEP 2: 운동 목표 ── */}
      {step === 2 && (
        <div className="flex flex-col flex-1 gap-6">
          <div>
            <p className="text-3xl font-black text-white mb-1">{name}님의</p>
            <p className="text-3xl font-black text-white">운동 목표는 무엇인가요?</p>
          </div>

          <div className="flex flex-col gap-4">
            {GOALS.map(g => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`flex items-center gap-5 p-5 rounded-2xl border-2 transition-all duration-150 active:scale-95
                  ${goal === g.id
                    ? 'bg-white border-white'
                    : 'bg-white/10 border-white/20'
                  }`}
              >
                <span className="text-5xl">{g.emoji}</span>
                <div className="text-left">
                  <p className={`text-2xl font-black ${goal === g.id ? 'text-blue-700' : 'text-white'}`}>
                    {g.label}
                  </p>
                  <p className={`text-lg ${goal === g.id ? 'text-blue-500' : 'text-white/70'}`}>
                    {g.desc}
                  </p>
                </div>
                {goal === g.id && (
                  <span className="ml-auto text-3xl text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: 준비 완료 ── */}
      {step === 3 && (
        <div className="flex flex-col flex-1 items-center justify-center gap-8 text-center">
          <div className="w-36 h-36 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-8xl">🎯</span>
          </div>
          <div>
            <p className="text-4xl font-black text-white mb-3">준비 완료!</p>
            <p className="text-2xl text-blue-200">
              {name}님, 오늘도 건강한 하루 시작해요.
            </p>
            <div className="mt-6 bg-white/10 rounded-2xl px-6 py-4 text-left space-y-3">
              {[
                '📷 카메라로 내 동작을 확인해요',
                '🧍 파란 가이드 라인에 맞춰 운동해요',
                '🔊 완료 안내음이 세트를 알려줘요',
              ].map(tip => (
                <p key={tip} className="text-xl text-white/90">{tip}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 다음 버튼 */}
      <div className="mt-auto pt-6">
        <button
          onClick={goNext}
          disabled={!canNext}
          className={`w-full min-h-[72px] rounded-2xl text-3xl font-black
                      active:scale-95 transition-all duration-150
                      ${canNext
                        ? 'bg-white text-blue-700 shadow-lg'
                        : 'bg-white/30 text-white/50'
                      }`}
        >
          {step === 3 ? '운동 시작하기 🏃' : '다음'}
        </button>
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="w-full mt-3 py-3 text-xl text-white/60 active:scale-95 transition-transform"
          >
            이전으로
          </button>
        )}
      </div>
    </main>
  );
}
