'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StackIcon, PoseIcon, RunIcon, FlameIcon, BuildingIcon } from '@/components/Icon';

type StepKey = 'intro' | 'name' | 'gender' | 'birthdate' | 'height' | 'weight' | 'level' | 'goal' | 'frequency' | 'environment' | 'injury' | 'referral' | 'loading';
const STEPS: StepKey[] = ['intro', 'name', 'gender', 'birthdate', 'height', 'weight', 'level', 'goal', 'frequency', 'environment', 'injury', 'referral', 'loading'];

type OptIcon = (p: { size?: number; className?: string }) => React.JSX.Element;
type Option<T> = { id: T; label: string; desc?: string; Icon?: OptIcon };

const GENDERS: Option<string>[] = [
  { id: 'male',   label: '남성' },
  { id: 'female', label: '여성' },
  { id: 'other',  label: '기타' },
];

const LEVELS: Option<string>[] = [
  { id: 'beginner', label: '초급', desc: '운동을 거의 안 해봤어요',      Icon: RunIcon },
  { id: 'middle',   label: '중급', desc: '가끔 꾸준히 운동하는 편이에요', Icon: FlameIcon },
  { id: 'advanced', label: '고급', desc: '운동이 익숙하고 자신 있어요',   Icon: StackIcon },
];

const GOALS: Option<string>[] = [
  { id: 'muscle',  label: '근육량 증가',     desc: '탄탄하고 강한 몸을 만들고 싶어요',     Icon: StackIcon },
  { id: 'diet',    label: '다이어트',         desc: '체중을 줄이고 체형을 바꾸고 싶어요',   Icon: FlameIcon },
  { id: 'target',  label: '특정 부위 공략',   desc: '원하는 부위를 집중 강화하고 싶어요',   Icon: PoseIcon },
  { id: 'habit',   label: '건강한 습관',      desc: '꾸준히 몸을 움직이는 습관을 만들래요', Icon: RunIcon },
  { id: 'sports',  label: '스포츠 능력 강화', desc: '운동 능력과 퍼포먼스를 높이고 싶어요', Icon: StackIcon },
];

const FREQUENCIES: Option<number>[] = [
  { id: 2, label: '주 1~2회',   desc: '가볍게 시작할래요' },
  { id: 4, label: '주 3~4회',   desc: '규칙적으로 해볼래요' },
  { id: 5, label: '주 5회 이상', desc: '집중해서 운동할래요' },
];

const ENVIRONMENTS: Option<string>[] = [
  { id: 'gym',        label: '헬스장 기구', desc: '헬스장에서 운동해요',       Icon: BuildingIcon },
  { id: 'home',       label: '홈 짐 기구',  desc: '바벨, 덤벨, 머신 등 다양한 기구가 있어요',          Icon: RunIcon },
  { id: 'tools',      label: '소도구',      desc: '덤벨, 케틀벨, 밴드 등의 간단한 기구가 있어요', Icon: PoseIcon },
  { id: 'bodyweight', label: '맨몸 운동',   desc: '기구 없이 몸만 써요',       Icon: PoseIcon },
];

const INJURIES: Option<string>[] = [
  { id: 'none',     label: '없음',   desc: '불편한 부위가 없어요' },
  { id: 'neck',     label: '목' },
  { id: 'shoulder', label: '어깨' },
  { id: 'back',     label: '허리' },
  { id: 'elbow',    label: '팔꿈치' },
  { id: 'knee',     label: '무릎' },
  { id: 'ankle',    label: '발목' },
];

const REFERRALS: Option<string>[] = [
  { id: 'google',    label: '구글 검색' },
  { id: 'instagram', label: '인스타그램 광고' },
  { id: 'youtube',   label: '유튜브' },
  { id: 'friend',    label: '지인 추천' },
  { id: 'sns',       label: 'SNS 게시물' },
  { id: 'other',     label: '기타' },
];

const TITLES: Record<StepKey, { lead?: string; main: string }> = {
  intro:       { main: '' },
  name:        { lead: '안녕하세요',   main: '이름이 어떻게 되세요?' },
  gender:      { main: '성별이 어떻게 되세요?' },
  birthdate:   { main: '생년월일을 알려주세요' },
  height:      { main: '현재 키가 어떻게 되세요?' },
  weight:      { main: '현재 몸무게는요?' },
  level:       { main: '운동 수준이 어떻게 되세요?' },
  goal:        { main: '가장 중요한 목표는 무엇인가요?' },
  frequency:   { main: '일주일에 몇 번 운동할까요?' },
  environment: { main: '주로 어떤 환경에서 운동해요?' },
  injury:      { main: '불편한 부위가 있으신가요?' },
  referral:    { main: '워크모션을 어떻게 알게 되셨나요?' },
  loading:     { main: '' },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', gender: '', birthdate: '', height: '', weight: '',
    level: '', goal: '', frequency: 0, environment: '',
    injury: [] as string[], referral: '',
  });
  const [nameError, setNameError] = useState('');

  const key = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  function setField<K extends keyof typeof data>(k: K, value: typeof data[K]) {
    setData(prev => ({ ...prev, [k]: value }));
  }

  function pick<K extends keyof typeof data>(k: K, value: typeof data[K]) {
    setField(k, value);
    setStep(s => s + 1);
  }

  function toggleInjury(id: string) {
    setData(prev => {
      if (id === 'none') return { ...prev, injury: ['none'] };
      const without = prev.injury.filter(x => x !== 'none');
      if (without.includes(id)) return { ...prev, injury: without.filter(x => x !== id) };
      return { ...prev, injury: [...without, id] };
    });
  }

  function goNext() {
    if (key === 'name' && !data.name.trim()) { setNameError('이름을 입력해 주세요'); return; }
    setStep(s => s + 1);
  }

  useEffect(() => {
    if (key !== 'loading') return;
    const t = setTimeout(() => {
      localStorage.setItem('wm_onboarded', '1');
      localStorage.setItem('wm_name', data.name.trim());
      localStorage.setItem('wm_goal', data.goal);
      localStorage.setItem('wm_profile', JSON.stringify(data));
      router.push('/exercise');
    }, 1800);
    return () => clearTimeout(t);
  }, [key, data, router]);

  const goalLabel = GOALS.find(g => g.id === data.goal)?.label ?? '';

  const needsNextButton = key === 'intro' || key === 'name' || key === 'birthdate' || key === 'height' || key === 'weight' || key === 'injury';
  const isNextDisabled =
    (key === 'name' && !data.name.trim()) ||
    (key === 'injury' && data.injury.length === 0);

  return (
    <main className="min-h-screen bg-[#14181d] flex flex-col select-none">

      {/* 진행 바 */}
      <div className="h-1 bg-[#2a3139]">
        <div className="h-full bg-[#d8ff36] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* 헤더 (intro·loading 제외) */}
      {key !== 'intro' && key !== 'loading' && (
        <div className="px-6 pt-12 pb-6 flex items-center justify-between">
          <span className="text-xl font-semibold text-[#6a6a6a]">{step} / {STEPS.length - 2}</span>
          <button onClick={() => setStep(s => Math.max(0, s - 1))}
            className="text-xl text-[#a0a0a0] active:opacity-60 transition-opacity">
            이전
          </button>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 px-6 flex flex-col overflow-y-auto">

        {/* 인트로 */}
        {key === 'intro' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-8 text-center pb-8">
            <div className="w-20 h-20 bg-[#d8ff36] rounded-3xl flex items-center justify-center">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
                <path d="M13 3L4 14h8l-1 7 9-11h-8l1-10z" fill="#14181d" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#f0f0f0] leading-tight tracking-tight mb-3">
                워크모션 AI 코치<br />연호입니다
              </p>
              <p className="text-base text-[#a0a0a0] leading-relaxed">
                맞춤 추천 루틴과 상세 가이드,<br />
                자세 분석으로 효율적인 운동을 할 수 있어요.<br />
                AI 코치 연호가 함께 도와줄게요.<br />
                <span className="text-[#d8ff36] font-semibold">하빈아 사랑해!</span>
              </p>
            </div>
          </div>
        )}

        {/* 이름 */}
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
                className="w-full border-b-2 border-[#2a3139] bg-transparent text-xl font-semibold
                           text-[#f0f0f0] py-3 placeholder-[#6a6a6a] focus:outline-none
                           focus:border-[#d8ff36] transition-colors"
              />
              {nameError && <p className="text-base text-[#e05260] font-semibold mt-1">{nameError}</p>}
            </div>
          </>
        )}

        {/* 성별 */}
        {key === 'gender' && (
          <>
            <Title main={data.name ? `${data.name}님, ${TITLES.gender.main}` : TITLES.gender.main} />
            <div className="grid grid-cols-3 gap-3">
              {GENDERS.map(g => (
                <button
                  key={g.id}
                  onClick={() => pick('gender', g.id)}
                  className={`flex items-center justify-center py-8 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98]
                    ${data.gender === g.id ? 'border-[#d8ff36] bg-[#23291a]' : 'border-[#2a3139] bg-[#1a2026]'}`}
                >
                  <span className={`text-xl font-bold ${data.gender === g.id ? 'text-[#d8ff36]' : 'text-[#f0f0f0]'}`}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* 생년월일 */}
        {key === 'birthdate' && (
          <>
            <Title main={TITLES.birthdate.main} />
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="number"
                  value={data.birthdate}
                  onChange={e => setField('birthdate', e.target.value)}
                  placeholder="19900101"
                  maxLength={8}
                  autoFocus
                  className="w-full border-b-2 border-[#2a3139] bg-transparent text-xl font-semibold
                             text-[#f0f0f0] py-3 placeholder-[#6a6a6a] focus:outline-none
                             focus:border-[#d8ff36] transition-colors"
                />
              </div>
              <p className="text-sm text-[#6a6a6a]">8자리 숫자로 입력해 주세요 (예: 19900101)</p>
            </div>
          </>
        )}

        {/* 키 */}
        {key === 'height' && (
          <>
            <Title main={TITLES.height.main} />
            <div className="flex items-end gap-3 border-b-2 border-[#2a3139] focus-within:border-[#d8ff36] transition-colors pb-1">
              <input
                type="number"
                value={data.height}
                onChange={e => setField('height', e.target.value)}
                placeholder=""
                autoFocus
                className="flex-1 bg-transparent text-xl font-semibold text-[#f0f0f0] py-2
                           placeholder-[#6a6a6a] focus:outline-none"
              />
              <span className="text-lg font-semibold text-[#a0a0a0] pb-2 shrink-0">cm</span>
            </div>
          </>
        )}

        {/* 몸무게 */}
        {key === 'weight' && (
          <>
            <Title main={TITLES.weight.main} />
            <div className="flex items-end gap-3 border-b-2 border-[#2a3139] focus-within:border-[#d8ff36] transition-colors pb-1">
              <input
                type="number"
                value={data.weight}
                onChange={e => setField('weight', e.target.value)}
                placeholder=""
                autoFocus
                className="flex-1 bg-transparent text-xl font-semibold text-[#f0f0f0] py-2
                           placeholder-[#6a6a6a] focus:outline-none"
              />
              <span className="text-lg font-semibold text-[#a0a0a0] pb-2 shrink-0">kg</span>
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

        {/* 불편한 부위 (다중 선택) */}
        {key === 'injury' && (
          <>
            <Title main={TITLES.injury.main} />
            <div className="grid grid-cols-2 gap-3">
              {INJURIES.map(o => {
                const active = data.injury.includes(o.id);
                return (
                  <button
                    key={o.id}
                    onClick={() => toggleInjury(o.id)}
                    className={`flex flex-col items-center justify-center py-5 px-3 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98]
                      ${active ? 'border-[#d8ff36] bg-[#23291a]' : 'border-[#2a3139] bg-[#1a2026]'}
                      ${o.id === 'none' ? 'col-span-2' : ''}`}
                  >
                    <span className={`text-lg font-bold ${active ? 'text-[#d8ff36]' : 'text-[#f0f0f0]'}`}>{o.label}</span>
                    {o.desc && <span className="text-sm text-[#a0a0a0] mt-0.5">{o.desc}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 유입 경로 (단일 선택, 2열, 자동 진행) */}
        {key === 'referral' && (
          <>
            <Title main={TITLES.referral.main} />
            <div className="grid grid-cols-2 gap-3">
              {REFERRALS.map(o => (
                <button
                  key={o.id}
                  onClick={() => pick('referral', o.id)}
                  className={`flex items-center justify-center py-5 rounded-2xl border-2 transition-all duration-150 active:scale-[0.98]
                    ${data.referral === o.id ? 'border-[#d8ff36] bg-[#23291a]' : 'border-[#2a3139] bg-[#1a2026]'}`}
                >
                  <span className={`text-base font-bold text-center leading-snug ${data.referral === o.id ? 'text-[#d8ff36]' : 'text-[#f0f0f0]'}`}>
                    {o.label}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* AI 로딩 연출 */}
        {key === 'loading' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-7 text-center pb-8">
            <div className="w-16 h-16 rounded-full border-4 border-[#2a3139] border-t-[#d8ff36] animate-spin" />
            <div>
              <p className="text-2xl font-bold text-[#f0f0f0] mb-3 tracking-tight">
                {data.name ? `${data.name}님을 위한` : '회원님을 위한'}<br />맞춤 플랜을 구성중이에요
              </p>
              <p className="text-base text-[#a0a0a0] leading-relaxed">
                {goalLabel && `${goalLabel} · `}AI 코치 연호가<br />운동을 정리하고 있어요
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      {needsNextButton && (
        <div className="px-6 pb-12 pt-4">
          <button
            onClick={goNext}
            disabled={isNextDisabled}
            className="w-full min-h-[56px] rounded-2xl text-lg font-bold transition-all duration-150
                       active:scale-95 bg-[#d8ff36] text-[#14181d] disabled:bg-[#2a3139] disabled:text-[#6a6a6a]"
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
      {lead && <p className="text-2xl font-bold text-[#f0f0f0] leading-tight tracking-tight">{lead}</p>}
      <p className="text-2xl font-bold text-[#f0f0f0] leading-tight tracking-tight">{main}</p>
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
              ${active ? 'border-[#d8ff36] bg-[#23291a]' : 'border-[#2a3139] bg-[#1a2026]'}`}
          >
            {o.Icon && (
              <span className={`shrink-0 ${active ? 'text-[#d8ff36]' : 'text-[#6a6a6a]'}`}>
                <o.Icon size={34} />
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-lg font-bold ${active ? 'text-[#d8ff36]' : 'text-[#f0f0f0]'}`}>{o.label}</p>
              {o.desc && <p className="text-sm text-[#a0a0a0] mt-0.5">{o.desc}</p>}
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
              ${active ? 'bg-[#d8ff36] border-[#d8ff36]' : 'border-[#6a6a6a]'}`}>
              {active && <div className="w-2 h-2 rounded-full bg-[#14181d]" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
