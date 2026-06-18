'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseType } from '@/types';
import { ExerciseIcon, CameraIcon } from '@/components/Icon';

type Step     = { text: string };
type EGuide = {
  name: string;
  target: string; benefit: string; duration: string;
  steps: Step[]; cautions: string[];
};

const GUIDES: Record<ExerciseType, EGuide> = {
  squat: {
    name: '스쿼트',
    target: '허벅지 · 엉덩이 · 종아리', benefit: '하체 근력과 둔근, 대퇴사두근을 강화해 기능적 움직임의 기초를 만듭니다', duration: '3세트 × 20초',
    steps: [
      { text: '발을 어깨너비로 벌리고 바르게 서세요' },
      { text: '양손은 앞으로 나란히 또는 허리에 올려주세요' },
      { text: '등을 곧게 편 채로 천천히 무릎을 굽혀요' },
      { text: '허벅지가 바닥과 수평이 될 때까지 앉아요' },
      { text: '천천히 다시 일어서요. 무릎은 발끝 방향으로' },
    ],
    cautions: ['무릎이 발끝 앞으로 너무 나오지 않게 하세요', '허리를 구부리지 마세요', '무릎 통증이 생기면 즉시 중단하세요'],
  },
  deadlift: {
    name: '데드리프트',
    target: '엉덩이 · 등 후면 · 햄스트링', benefit: '후면 사슬(햄스트링, 둔근, 척추기립근)을 강화해 들기 동작의 안정성을 높입니다', duration: '3세트 × 20초',
    steps: [
      { text: '발을 어깨너비로 벌리고 바르게 서세요' },
      { text: '무릎을 살짝만 굽힌 채 고정해요' },
      { text: '등을 곧게 편 채 엉덩이를 뒤로 빼며 상체를 숙여요' },
      { text: '손이 정강이 앞을 지날 때까지 깊게 숙여요' },
      { text: '엉덩이를 앞으로 밀며 천천히 일어서요' },
    ],
    cautions: ['등을 둥글게 말지 말고 항상 곧게 펴세요', '무릎을 너무 굽히면 스쿼트가 됩니다', '허리 통증이 있으면 즉시 중단하세요'],
  },
  lunge: {
    name: '런지',
    target: '허벅지 · 엉덩이 · 균형 근육', benefit: '단측 하지 근력과 동적 균형 능력을 동시에 발달시킵니다', duration: '3세트 × 20초',
    steps: [
      { text: '바르게 선 뒤 한 발을 앞으로 크게 내딛어요' },
      { text: '필요하면 의자나 벽을 옆에 두고 균형을 잡으세요' },
      { text: '양 무릎이 90도가 될 때까지 천천히 내려가요' },
      { text: '앞 무릎이 발끝을 넘지 않게 주의해요' },
      { text: '앞발로 바닥을 밀며 처음 자세로 돌아와요' },
    ],
    cautions: ['앞 무릎이 발끝보다 앞으로 나오지 않게 하세요', '상체는 곧게 세운 상태를 유지하세요', '균형이 불안하면 보조물을 잡으세요'],
  },
  hip_hinge: {
    name: '힙힌지',
    target: '엉덩이 · 햄스트링', benefit: '고관절 굴곡-신전 패턴을 학습시켜 척추 부담을 줄이는 움직임 기전을 형성합니다', duration: '3세트 × 20초',
    steps: [
      { text: '발을 어깨너비로 벌리고 바르게 서세요' },
      { text: '무릎을 거의 편 상태로 고정해요' },
      { text: '엉덩이를 뒤로 밀며 상체를 45도 정도 숙여요' },
      { text: '햄스트링(허벅지 뒤)이 당기는 느낌까지만 숙여요' },
      { text: '엉덩이를 앞으로 밀며 천천히 일어서요' },
    ],
    cautions: ['무릎을 굽히지 말고 엉덩이만 뒤로 빼세요', '너무 깊게 숙이면 허리에 무리가 갑니다', '등은 항상 곧게 편 상태를 유지하세요'],
  },
};

const VALID: ExerciseType[] = ['squat', 'deadlift', 'lunge', 'hip_hinge'];

export default function GuidePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const router   = useRouter();
  const exType   = VALID.includes(type as ExerciseType) ? (type as ExerciseType) : 'squat';
  const g        = GUIDES[exType];

  return (
    <main className="min-h-screen bg-[#14181d] flex flex-col">

      {/* 헤더 */}
      <div className="bg-[#1a2026] px-6 pt-14 pb-6 border-b border-[#2a3139]">
        <button
          onClick={() => router.push('/exercise')}
          className="flex items-center gap-1.5 text-base text-[#a0a0a0] mb-5 active:opacity-60 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          운동 선택
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#23291a] text-[#d8ff36]">
            <ExerciseIcon type={exType} size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0] tracking-tight">{g.name}</h1>
            <p className="text-base text-[#a0a0a0] mt-0.5">{g.duration}</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 bg-[#14181d] rounded-xl px-4 py-2">
          <span className="text-sm text-[#a0a0a0]">운동 부위</span>
          <span className="text-sm font-semibold text-[#f0f0f0]">{g.target}</span>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto">

        {/* 효과 */}
        <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] px-5 py-5">
          <p className="text-sm text-[#a0a0a0] mb-1">이 운동의 효과</p>
          <p className="text-lg font-semibold text-[#f0f0f0] leading-snug">{g.benefit}</p>
        </div>

        {/* 동작 순서 */}
        <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] px-5 py-5">
          <p className="text-lg font-bold text-[#f0f0f0] mb-4">동작 순서</p>
          <div className="flex flex-col gap-4">
            {g.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#23291a]">
                  <span className="text-sm font-bold text-[#d8ff36]">{i + 1}</span>
                </div>
                <p className="text-base text-[#f0f0f0] leading-relaxed flex-1 pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] px-5 py-5">
          <p className="text-lg font-bold text-[#f0f0f0] mb-4">주의사항</p>
          <div className="flex flex-col gap-3">
            {g.cautions.map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#ffb84d] text-[#14181d] text-sm font-bold shrink-0 mt-0.5 flex items-center justify-center">!</span>
                <p className="text-base text-[#f0f0f0] leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 시작 버튼 */}
      <div className="px-5 pb-12 pt-3">
        <button
          onClick={() => router.push(`/exercise/${exType}`)}
          className="w-full min-h-[56px] rounded-2xl bg-[#d8ff36] text-[#14181d] text-lg font-bold
                     active:scale-95 transition-transform flex items-center justify-center gap-2.5"
        >
          <CameraIcon size={22} />
          카메라로 운동 시작
        </button>
        <p className="text-center text-sm text-[#6a6a6a] mt-3">카메라가 자세를 실시간으로 안내해요</p>
      </div>
    </main>
  );
}
