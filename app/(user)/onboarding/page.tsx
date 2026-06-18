'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StackIcon, PoseIcon, RunIcon, FlameIcon, BuildingIcon } from '@/components/Icon';

type StepKey = 'intro' | 'name' | 'gender' | 'level' | 'goal' | 'frequency' | 'environment' | 'loading';
const STEPS: StepKey[] = ['intro', 'name', 'gender', 'level', 'goal', 'frequency', 'environment', 'loading'];

type OptIcon = (p: { size?: number; className?: string }) => React.JSX.Element;
type Option<T> = { id: T; label: string; desc?: string; Icon?: OptIcon };

const GENDERS: Option<string>[] = [
  { id: 'male',   label: '남성' },
  { id: 'female', label: '여성' },
];

const LEVELS: Option<string>[] = [
  { id: 'beginner', label: '초급', desc: '운동을 거의 안 해봤어요',      Icon: RunIcon },
  { id: 'middle',   label: '중급', desc: '가끔 꾸준히 운동하는 편이에요', Icon: FlameIcon },
  { id: 'advanced', label: '고급', desc: '운동이 익숙하고 자신 있어요',   Icon: StackIcon },
];

const GOALS: Option<string>[] = [
  { id: 'strength', label: '근력 강화', desc: '다리·팔 근육을 키우고 싶어요',        Icon: StackIcon },
  { id: 'balance',  label: '균형 향상', desc: '균형 잡기가 어렵거나 낙상이 걱정돼요', Icon: PoseIcon },
  { id: 'health',   label: '건강 유지', desc: '꾸준하게 몸을 움직이고 싶어요',        Icon: RunIcon },
];

const FREQUENCIES: Option<number>[] = [
  { id: 2, label: '주 1~2회', desc: '가볍게 시작할래요' },
  { id: 4, label: '주 3~4회', desc: '규칙적으로 해볼래요' },
  { id: 5, label: '주 5회 이상', desc: '집중해서 운동할래요' },
];

const ENVIRONMENTS: Option<string>[] = [
  { id: 'bodyweight', label: '맨몸 운동',   desc: '기구 없이 몸만 써요',        Icon: PoseIcon },
  { id: 'band',       label: '의자·밴드',   desc: '의자나 탄력밴드를 활용해요', Icon: RunIcon },
  { id: 'equipment',  label: '운동 기구',   desc: '덤벨 등 기구가 있어요',      Icon: BuildingIcon },
];

const TITLES: Record<StepKey, { lead?: string; main: string }> = {
  intro:       { main: '' },
  name:        { lead: '안녕하세요',   main: '이름이 어떻게 되세요?' },
  gender:      { main: '성별이 어떻게 되세요?' },
  level:       { main: '운동 수준이 어떻게 되세요?' },
  goal:        { main: '가장 중요한 목표는 뭔가요?' },
  frequency:   { main: '일주일에 몇 번 운동할까요?' },
  environment: { main: '주로 어떤 환경에서 운동해요?' },
  loading:     { main: '' },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', gender: '', level: '', goal: '', frequency: 0, environment: '',
  });
  const [nameError, setNameError] = useState('');

  const key = STEPS[step];
  // 진행바: 마지막(loading) 단계에서 100% 도달
  const progress = (step / (STEPS.length - 1)) * 100;

  function setField<K extends keyof typeof data>(k: K, value: typeof data[K]) {
    setData(prev => ({ ...prev, [k]: value }));
  }

  // 카드 선택 → 값 저장 + 자동 다음 (탭 수 최소화)
  function pick<K extends keyof typeof data>(k: K, value: typeof data[K]) {
    setField(k, value);
    setStep(s => s + 1);
  }

  // 입력형(intro/name) 단계의 '다음' 버튼
  function goNext() {
    if (key === 'name' && !data.name.trim()) { setNameError('이름을 입력해 주세요'); return; }
    setStep(s => s + 1);
  }

  // loading 단계: 연출 후 저장 & 이동 (실제 LLM 호출 없음)
  useEffect(() => {
    if (key !== 'loading') return;
    const t = setTimeout(() => {
      localStorage.setItem('wm_onboarded', '1');
      localStorage.setItem('wm_name', data.name.trim());
      localStorage.setItem('wm_goal', data.goal);
      localStorage.setItem('wm_profile', JSON.stringify(data));
      router.push('/exercise');
    }, 1800);
    return () => clearTimeout(t); // 이탈 시 정리 (잘못된 이동·메모리 누수 방지)
  }, [key, data, router]);

  const goalLabel = GOALS.find(g => g.id === data.goal)?.label ?? '';

  return (
    <main className="min-h-screen bg-white flex flex-col select-none">

      {/* 진행 바 */}
      <div className="h-1 bg-[#f2f4f6]">
        <div className="h-full bg-[#0064ff] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* 헤더 (intro·loading 제외) */}
      {key !== 'intro' && key !== 'loading' && (
        <div className="px-6 pt-12 pb-6 flex items-center justify-between">
          <span className="text-xl font-semibold text-[#b0b8c1]">{step} / {STEPS.length - 2}</span>
          <button onClick={() => setStep(s => Math.max(0, s - 1))}
            className="text-xl text-[#6b7684] active:opacity-60 transition-opacity">
            이전
          </button>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 px-6 flex flex-col">

        {/* 인트로 */}
        {key === 'intro' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-8 text-center pb-8">
            <div className="w-20 h-20 bg-[#0064ff] rounded-3xl flex items-center justify-center">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                <path d="M13 3L4 14h8l-1 7 9-11h-8l1-10z" fill="white" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#202632] leading-tight tracking-tight mb-3">
                워크모션 AI 코치<br />연호입니다
              </p>
              <p className="text-base text-[#6b7684] leading-relaxed">
                몇 가지만 여쭤보고<br />회원님께 맞는 운동을 준비할게요
              </p>
            </div>
          </div>
        )}

        {/* 이름 (밑줄 입력) */}
        {key === 'name' && (
          <>
            <Title lead={TITLES.name.lead} main={TITLES.name.main} />
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={data.name}
                onChange={e => { setField('name', e.target.value); setNameError(''); }}
                placeholder="홍길동"
                maxLength={10}
                autoFocus
                className="w-full border-b-2 border-[#e5e8eb] bg-transparent text-xl font-semibold
                           text-[#202632] py-3 placeholder-[#b0b8c1] focus:outline-none
                           focus:border-[#0064ff] transition-colors"
              />
              {nameError && <p className="text-base text-[#202632] font-semibold mt-1">{nameError}</p>}
            </div>
          </>
        )}

        {/* 성별 (2열 카드) */}
        {key === 'gender' && (
          <>
            <Title main={data.name ? `${data.name}님, ${TITLES.gender.main}` : TITLES.gender.main} />
            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map(g => (
                <button
                  key={g.id}
                  onClick={() => pick('gender', g.id)}
                  className={`flex items-center justify-center py-8 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98]
                    ${data.gender === g.id ? 'border-[#0064ff] bg-[#ebf3ff]' : 'border-[#e5e8eb] bg-white'}`}
                >
                  <span className={`text-xl font-bold ${data.gender === g.id ? 'text-[#0064ff]' : 'text-[#202632]'}`}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 운동 수준 */}
        {key === 'level' && (
          <>
            <Title main={TITLES.level.main} />
            <OptionList options={LEVELS} selected={data.level} onPick={v => pick('level', v)} />
          </>
        )}

        {/* 목표 */}
        {key === 'goal' && (
          <>
            <Title main={TITLES.goal.main} />
            <OptionList options={GOALS} selected={data.goal} onPick={v => pick('goal', v)} />
          </>
        )}

        {/* 주간 빈도 */}
        {key === 'frequency' && (
          <>
            <Title main={TITLES.frequency.main} />
            <OptionList options={FREQUENCIES} selected={data.frequency} onPick={v => pick('frequency', v)} />
          </>
        )}

        {/* 운동 환경 */}
        {key === 'environment' && (
          <>
            <Title main={TITLES.environment.main} />
            <OptionList options={ENVIRONMENTS} selected={data.environment} onPick={v => pick('environment', v)} />
          </>
        )}

        {/* AI 로딩 연출 */}
        {key === 'loading' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-7 text-center pb-8">
            <div className="w-16 h-16 rounded-full border-4 border-[#ebf3ff] border-t-[#0064ff] animate-spin" />
            <div>
              <p className="text-2xl font-bold text-[#202632] mb-3 tracking-tight">
                {data.name ? `${data.name}님을 위한` : '회원님을 위한'}<br />맞춤 플랜을 구성중이에요
              </p>
              <p className="text-base text-[#6b7684] leading-relaxed">
                {goalLabel && `${goalLabel} · `}AI 코치 연호가<br />운동을 정리하고 있어요
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 (intro·name 단계에서만 — 선택형은 카드 탭으로 자동 진행) */}
      {(key === 'intro' || key === 'name') && (
        <div className="px-6 pb-12 pt-4">
          <button
            onClick={goNext}
            disabled={key === 'name' && !data.name.trim()}
            className="w-full min-h-[56px] rounded-2xl text-lg font-bold transition-all duration-150
                       active:scale-95 bg-[#0064ff] text-white disabled:bg-[#b0b8c1]"
          >
            {key === 'intro' ? '시작하기' : '다음'}
          </button>
        </div>
      )}
    </main>
  );
}

// ── 보조 컴포넌트 ──────────────────────────────────────────

function Title({ lead, main }: { lead?: string; main: string }) {
  return (
    <div className="mb-8">
      {lead && <p className="text-2xl font-bold text-[#202632] leading-tight tracking-tight">{lead}</p>}
      <p className="text-2xl font-bold text-[#202632] leading-tight tracking-tight">{main}</p>
    </div>
  );
}

function OptionList<T extends string | number>({
  options, selected, onPick,
}: {
  options: Option<T>[];
  selected: T;
  onPick: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map(o => {
        const active = selected === o.id;
        return (
          <button
            key={String(o.id)}
            onClick={() => onPick(o.id)}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98] text-left
              ${active ? 'border-[#0064ff] bg-[#ebf3ff]' : 'border-[#e5e8eb] bg-white'}`}
          >
            {o.Icon && (
              <span className={`shrink-0 ${active ? 'text-[#0064ff]' : 'text-[#b0b8c1]'}`}>
                <o.Icon size={34} />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-lg font-bold ${active ? 'text-[#0064ff]' : 'text-[#202632]'}`}>{o.label}</p>
              {o.desc && <p className="text-sm text-[#6b7684] mt-0.5">{o.desc}</p>}
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
              ${active ? 'bg-[#0064ff] border-[#0064ff]' : 'border-[#b0b8c1]'}`}>
              {active && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
