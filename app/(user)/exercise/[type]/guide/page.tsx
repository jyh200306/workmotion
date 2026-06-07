'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseType } from '@/types';

type GuideStep = { icon: string; text: string };

type ExerciseGuide = {
  name: string;
  emoji: string;
  from: string;
  to: string;
  target: string;
  benefit: string;
  duration: string;
  steps: GuideStep[];
  cautions: string[];
};

const GUIDES: Record<ExerciseType, ExerciseGuide> = {
  squat: {
    name: '스쿼트',
    emoji: '🦵',
    from: 'from-orange-500',
    to: 'to-red-600',
    target: '허벅지 · 엉덩이 · 종아리',
    benefit: '하체 근력 강화, 일어서기 능력 향상',
    duration: '3세트 × 20초',
    steps: [
      { icon: '1️⃣', text: '발을 어깨너비로 벌리고 바르게 서세요' },
      { icon: '2️⃣', text: '양손은 앞으로 나란히 또는 허리에 올려주세요' },
      { icon: '3️⃣', text: '등을 곧게 편 채로 천천히 무릎을 굽혀요' },
      { icon: '4️⃣', text: '허벅지가 바닥과 수평이 될 때까지 앉아요' },
      { icon: '5️⃣', text: '천천히 다시 일어서세요. 무릎은 발끝 방향으로!' },
    ],
    cautions: [
      '무릎이 발끝 앞으로 너무 나오지 않게 하세요',
      '허리를 구부리지 마세요',
      '무릎 통증이 있으면 즉시 중단하세요',
    ],
  },
  calf: {
    name: '종아리 운동',
    emoji: '🦶',
    from: 'from-emerald-500',
    to: 'to-teal-600',
    target: '종아리 근육 (비복근)',
    benefit: '균형 감각 향상, 혈액 순환 촉진',
    duration: '3세트 × 20초',
    steps: [
      { icon: '1️⃣', text: '의자나 벽 앞에 서서 가볍게 잡아 균형을 잡으세요' },
      { icon: '2️⃣', text: '발을 어깨너비로 벌리고 바르게 서세요' },
      { icon: '3️⃣', text: '발뒤꿈치를 천천히 들어올려요 (2초간)' },
      { icon: '4️⃣', text: '발끝으로 서는 느낌으로 최대한 올라가세요' },
      { icon: '5️⃣', text: '천천히 내려와요. 반복합니다!' },
    ],
    cautions: [
      '균형을 잃지 않도록 의자나 벽을 잡으세요',
      '발목 통증이 있으면 운동 범위를 줄이세요',
      '내려올 때 발뒤꿈치가 바닥에 쿵 닿지 않게 하세요',
    ],
  },
  push: {
    name: '팔 운동',
    emoji: '💪',
    from: 'from-blue-500',
    to: 'to-indigo-600',
    target: '어깨 · 팔 · 가슴 근육',
    benefit: '상체 근력 강화, 일상생활 동작 개선',
    duration: '3세트 × 20초',
    steps: [
      { icon: '1️⃣', text: '의자 앞에 서거나 벽을 마주 보고 서세요' },
      { icon: '2️⃣', text: '양팔을 어깨너비로 벌려 벽(또는 의자 등받이)에 올려요' },
      { icon: '3️⃣', text: '팔꿈치를 구부리며 몸을 벽 쪽으로 천천히 당기세요' },
      { icon: '4️⃣', text: '가슴이 벽에 가까워지면 잠시 멈춰요' },
      { icon: '5️⃣', text: '팔을 천천히 펴며 원래 자리로 돌아와요' },
    ],
    cautions: [
      '어깨에 과도한 힘이 들어가지 않게 하세요',
      '손목이 불편하면 주먹을 쥐고 하세요',
      '어깨 통증이 있으면 즉시 중단하세요',
    ],
  },
  balance: {
    name: '균형 운동',
    emoji: '⚖️',
    from: 'from-violet-500',
    to: 'to-purple-600',
    target: '발목 · 종아리 · 코어 근육',
    benefit: '낙상 예방, 균형 감각 향상',
    duration: '3세트 × 20초',
    steps: [
      { icon: '1️⃣', text: '의자나 벽 옆에 서서 가볍게 잡아 균형을 잡으세요' },
      { icon: '2️⃣', text: '시선은 정면의 한 점을 바라보세요' },
      { icon: '3️⃣', text: '한쪽 발을 천천히 10cm 정도 들어올려요' },
      { icon: '4️⃣', text: '그 자세로 균형을 유지해요 (10초)' },
      { icon: '5️⃣', text: '반대쪽 발도 같은 방법으로 해요' },
    ],
    cautions: [
      '반드시 의자나 벽을 옆에 두고 하세요',
      '어지러움이 느껴지면 즉시 중단하세요',
      '처음에는 발을 낮게 들어도 괜찮아요',
    ],
  },
};

const VALID: ExerciseType[] = ['squat', 'calf', 'push', 'balance'];

export default function GuidePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const router   = useRouter();
  const exType   = VALID.includes(type as ExerciseType) ? (type as ExerciseType) : 'squat';
  const guide    = GUIDES[exType];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* 헤더 */}
      <div className={`bg-gradient-to-r ${guide.from} ${guide.to} px-6 pt-12 pb-8 shrink-0`}>
        <button
          onClick={() => router.push('/exercise')}
          className="text-white/70 text-xl mb-5 active:scale-90 transition-transform inline-block"
        >
          ← 뒤로
        </button>
        <div className="flex items-center gap-4">
          <span className="text-7xl">{guide.emoji}</span>
          <div>
            <h1 className="text-4xl font-black text-white">{guide.name}</h1>
            <p className="text-white/80 text-xl mt-1">{guide.duration}</p>
          </div>
        </div>

        {/* 효과 배지 */}
        <div className="flex flex-wrap gap-2 mt-5">
          <span className="bg-white/20 text-white text-lg px-4 py-1.5 rounded-full font-semibold">
            💪 {guide.target}
          </span>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5 overflow-y-auto">

        {/* 운동 효과 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xl font-black text-gray-500 mb-2">운동 효과</p>
          <p className="text-2xl font-bold text-gray-900 leading-snug">{guide.benefit}</p>
        </div>

        {/* 동작 순서 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-2xl font-black text-gray-800 mb-5">동작 순서</p>
          <div className="flex flex-col gap-4">
            {guide.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-3xl shrink-0 mt-0.5">{step.icon}</span>
                <p className="text-2xl text-gray-800 leading-snug flex-1">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-2xl font-black text-amber-800 mb-4">⚠️ 주의사항</p>
          <div className="flex flex-col gap-3">
            {guide.cautions.map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-amber-500 text-xl mt-0.5 shrink-0">•</span>
                <p className="text-xl text-amber-900 leading-snug">{c}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 시작 버튼 */}
        <button
          onClick={() => router.push(`/exercise/${exType}`)}
          className={`w-full min-h-[80px] rounded-2xl bg-gradient-to-r ${guide.from} ${guide.to}
                      text-white text-3xl font-black active:scale-95 transition-transform shadow-lg
                      flex items-center justify-center gap-3`}
        >
          <span className="text-3xl">📷</span>
          카메라로 운동 시작
        </button>

        <p className="text-center text-xl text-gray-400 -mt-2">
          카메라가 자세를 실시간으로 가이드해 드려요
        </p>
      </div>
    </main>
  );
}
