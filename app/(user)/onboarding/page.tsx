'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StackIcon, PoseIcon, RunIcon, CameraIcon, BellIcon } from '@/components/Icon';

const GOALS = [
  { id: 'strength', label: '근력 강화',  desc: '다리·팔 근육을 키우고 싶어요', Icon: StackIcon },
  { id: 'balance',  label: '균형 향상',  desc: '균형 잡기가 어렵거나 낙상이 걱정돼요', Icon: PoseIcon },
  { id: 'health',   label: '건강 유지',  desc: '꾸준하게 몸을 움직이고 싶어요', Icon: RunIcon },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step,      setStep]      = useState(1);
  const [name,      setName]      = useState('');
  const [goal,      setGoal]      = useState('');
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
      localStorage.setItem('wm_onboarded', '1');
      localStorage.setItem('wm_name', name.trim());
      localStorage.setItem('wm_goal', goal);
      router.push('/exercise');
    }
  }

  const canNext = step === 1 ? !!name.trim() : step === 2 ? !!goal : true;

  return (
    <main className="min-h-screen bg-white flex flex-col select-none">

      {/* 진행 바 */}
      <div className="h-1 bg-[#f2f4f6]">
        <div
          className="h-full bg-[#0064ff] transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* 헤더 */}
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <span className="text-xl font-semibold text-[#b0b8c1]">{step} / 3</span>
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} className="text-xl text-[#6b7684] active:opacity-60 transition-opacity">
            이전
          </button>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 px-6 flex flex-col">

        {step === 1 && (
          <>
            <p className="text-[32px] font-bold text-[#202632] leading-tight mb-2">
              안녕하세요
            </p>
            <p className="text-[32px] font-bold text-[#202632] leading-tight mb-8">
              이름이 어떻게 되세요?
            </p>

            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameError(''); }}
                placeholder="홍길동"
                maxLength={10}
                autoFocus
                className="w-full border-b-2 border-[#e5e8eb] bg-transparent text-[28px] font-semibold
                           text-[#202632] py-3 placeholder-[#b0b8c1] focus:outline-none
                           focus:border-[#0064ff] transition-colors"
              />
              {nameError && <p className="text-lg text-[#202632] font-semibold mt-1">{nameError}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-[32px] font-bold text-[#202632] leading-tight mb-2">
              {name}님,
            </p>
            <p className="text-[32px] font-bold text-[#202632] leading-tight mb-8">
              운동 목표가 뭔가요?
            </p>

            <div className="flex flex-col gap-3">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] text-left
                    ${goal === g.id
                      ? 'border-[#0064ff] bg-[#ebf3ff]'
                      : 'border-[#e5e8eb] bg-white'
                    }`}
                >
                  <span className={`shrink-0 ${goal === g.id ? 'text-[#0064ff]' : 'text-[#b0b8c1]'}`}>
                    <g.Icon size={36} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-2xl font-bold ${goal === g.id ? 'text-[#0064ff]' : 'text-[#202632]'}`}>
                      {g.label}
                    </p>
                    <p className="text-lg text-[#6b7684] mt-0.5">{g.desc}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    goal === g.id ? 'bg-[#0064ff] border-[#0064ff]' : 'border-[#b0b8c1]'
                  }`}>
                    {goal === g.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-8 text-center pb-8">
            <div className="w-24 h-24 bg-[#ebf3ff] rounded-full flex items-center justify-center">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#0064ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-[32px] font-bold text-[#202632] mb-3">준비됐어요</p>
              <p className="text-2xl text-[#6b7684] leading-relaxed">
                카메라 앞에 서면<br />자세를 실시간으로 안내해 드려요
              </p>
            </div>
            <div className="w-full bg-[#f2f4f6] rounded-2xl p-5 text-left flex flex-col gap-4">
              {[
                { Icon: CameraIcon, text: '카메라로 내 동작을 확인해요' },
                { Icon: PoseIcon,   text: '파란 가이드 라인에 맞춰 운동해요' },
                { Icon: BellIcon,   text: '세트 완료 안내음이 울려요' },
              ].map(t => (
                <div key={t.text} className="flex items-center gap-3">
                  <span className="text-[#0064ff] shrink-0"><t.Icon size={24} /></span>
                  <p className="text-xl text-[#202632]">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="px-6 pb-12 pt-4">
        <button
          onClick={goNext}
          disabled={!canNext}
          className="w-full min-h-[60px] rounded-2xl text-2xl font-bold transition-all duration-150
                     active:scale-95 bg-[#0064ff] text-white disabled:bg-[#b0b8c1]"
        >
          {step === 3 ? '운동 시작' : '다음'}
        </button>
      </div>
    </main>
  );
}
