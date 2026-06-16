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
    target: '허벅지 · 엉덩이 · 종아리', benefit: '하체 근력을 키워 일어서기가 편해져요', duration: '3세트 × 20초',
    steps: [
      { text: '발을 어깨너비로 벌리고 바르게 서세요' },
      { text: '양손은 앞으로 나란히 또는 허리에 올려주세요' },
      { text: '등을 곧게 편 채로 천천히 무릎을 굽혀요' },
      { text: '허벅지가 바닥과 수평이 될 때까지 앉아요' },
      { text: '천천히 다시 일어서요. 무릎은 발끝 방향으로' },
    ],
    cautions: ['무릎이 발끝 앞으로 너무 나오지 않게 하세요', '허리를 구부리지 마세요', '무릎 통증이 생기면 즉시 중단하세요'],
  },
  calf: {
    name: '종아리 운동',
    target: '종아리 근육 (비복근)', benefit: '균형 감각과 혈액 순환이 좋아져요', duration: '3세트 × 20초',
    steps: [
      { text: '의자나 벽 앞에 서서 가볍게 잡아 균형을 잡으세요' },
      { text: '발을 어깨너비로 벌리고 바르게 서세요' },
      { text: '발뒤꿈치를 천천히 들어올려요 (2초)' },
      { text: '발끝으로 서는 느낌으로 최대한 올라가세요' },
      { text: '천천히 내려와요. 발뒤꿈치가 쿵 닿지 않게' },
    ],
    cautions: ['균형을 위해 의자나 벽을 꼭 잡으세요', '발목 통증이 있으면 범위를 줄이세요', '내려올 때 발뒤꿈치를 바닥에 조용히 내려놓으세요'],
  },
  push: {
    name: '팔 운동',
    target: '어깨 · 팔 · 가슴 근육', benefit: '상체 근력이 강해져 일상 동작이 편해져요', duration: '3세트 × 20초',
    steps: [
      { text: '의자 앞에 서거나 벽을 마주 보고 서세요' },
      { text: '양팔을 어깨너비로 벌려 벽(의자 등받이)에 올려요' },
      { text: '팔꿈치를 굽히며 몸을 천천히 당기세요' },
      { text: '가슴이 가까워지면 잠시 멈춰요' },
      { text: '팔을 천천히 펴며 원래 자리로 돌아와요' },
    ],
    cautions: ['어깨에 무리한 힘이 들어가지 않게 하세요', '손목이 불편하면 주먹을 쥐고 하세요', '어깨 통증이 생기면 즉시 중단하세요'],
  },
  balance: {
    name: '균형 운동',
    target: '발목 · 종아리 · 코어', benefit: '낙상을 예방하고 중심 잡기가 쉬워져요', duration: '3세트 × 20초',
    steps: [
      { text: '의자나 벽 옆에 서서 가볍게 잡아 균형을 잡으세요' },
      { text: '시선은 정면의 한 점을 바라보세요' },
      { text: '한쪽 발을 천천히 10cm 정도 들어올려요' },
      { text: '그 자세로 균형을 유지해요 (10초)' },
      { text: '반대쪽 발도 같은 방법으로 해요' },
    ],
    cautions: ['반드시 의자나 벽을 옆에 두고 하세요', '어지러움이 느껴지면 즉시 중단하세요', '처음에는 발을 낮게 들어도 괜찮아요'],
  },
};

const VALID: ExerciseType[] = ['squat', 'calf', 'push', 'balance'];

export default function GuidePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const router   = useRouter();
  const exType   = VALID.includes(type as ExerciseType) ? (type as ExerciseType) : 'squat';
  const g        = GUIDES[exType];

  return (
    <main className="min-h-screen bg-[#f2f4f6] flex flex-col">

      {/* 헤더 */}
      <div className="bg-white px-6 pt-14 pb-6 border-b border-[#f2f4f6]">
        <button
          onClick={() => router.push('/exercise')}
          className="flex items-center gap-1.5 text-xl text-[#6b7684] mb-5 active:opacity-60 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          운동 선택
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#ebf3ff] text-[#0064ff]">
            <ExerciseIcon type={exType} size={28} />
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-[#202632]">{g.name}</h1>
            <p className="text-lg text-[#6b7684] mt-0.5">{g.duration}</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 bg-[#f2f4f6] rounded-xl px-4 py-2">
          <span className="text-lg text-[#6b7684]">운동 부위</span>
          <span className="text-lg font-semibold text-[#202632]">{g.target}</span>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto">

        {/* 효과 */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-5">
          <p className="text-lg text-[#6b7684] mb-1">이 운동의 효과</p>
          <p className="text-2xl font-semibold text-[#202632] leading-snug">{g.benefit}</p>
        </div>

        {/* 동작 순서 */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-5">
          <p className="text-xl font-bold text-[#202632] mb-5">동작 순서</p>
          <div className="flex flex-col gap-5">
            {g.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#ebf3ff]">
                  <span className="text-base font-bold text-[#0064ff]">{i + 1}</span>
                </div>
                <p className="text-2xl text-[#202632] leading-snug flex-1 pt-0.5">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 주의사항 */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-5">
          <p className="text-xl font-bold text-[#202632] mb-4">주의사항</p>
          <div className="flex flex-col gap-3">
            {g.cautions.map((c, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#202632] text-white text-sm font-bold shrink-0 mt-0.5 flex items-center justify-center">!</span>
                <p className="text-xl text-[#202632] leading-snug">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 시작 버튼 */}
      <div className="px-5 pb-12 pt-3">
        <button
          onClick={() => router.push(`/exercise/${exType}`)}
          className="w-full min-h-[60px] rounded-2xl bg-[#0064ff] text-white text-2xl font-bold
                     active:scale-95 transition-transform flex items-center justify-center gap-2.5"
        >
          <CameraIcon size={24} />
          카메라로 운동 시작
        </button>
        <p className="text-center text-lg text-[#b0b8c1] mt-3">카메라가 자세를 실시간으로 안내해요</p>
      </div>
    </main>
  );
}
