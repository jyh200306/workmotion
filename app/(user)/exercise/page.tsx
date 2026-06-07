'use client';

import { useRouter } from 'next/navigation';
import { ExerciseType } from '@/types';

const EXERCISES = [
  {
    type: 'squat' as ExerciseType,
    emoji: '🦵',
    name: '스쿼트',
    desc: '하체 근력을 키워요',
    sets: '3세트 · 20초',
    from: 'from-orange-400',
    to: 'to-red-500',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
  },
  {
    type: 'calf' as ExerciseType,
    emoji: '🦶',
    name: '종아리 운동',
    desc: '균형 감각을 키워요',
    sets: '3세트 · 20초',
    from: 'from-emerald-400',
    to: 'to-teal-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    type: 'push' as ExerciseType,
    emoji: '💪',
    name: '팔 운동',
    desc: '상체 근력을 키워요',
    sets: '3세트 · 20초',
    from: 'from-blue-400',
    to: 'to-indigo-500',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    type: 'balance' as ExerciseType,
    emoji: '⚖️',
    name: '균형 운동',
    desc: '낙상을 예방해요',
    sets: '3세트 · 20초',
    from: 'from-violet-400',
    to: 'to-purple-500',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
];

const today = new Date().toLocaleDateString('ko-KR', {
  month: 'long', day: 'numeric', weekday: 'long',
});

export default function ExercisePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <p className="text-xl text-gray-400 mb-1">{today}</p>
        <h1 className="text-4xl font-black text-gray-900">오늘 운동 선택</h1>
        <p className="text-xl text-gray-500 mt-1">하고 싶은 운동을 골라주세요</p>
      </div>

      {/* 운동 카드 목록 */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-4">
        {EXERCISES.map(ex => (
          <button
            key={ex.type}
            onClick={() => router.push(`/exercise/${ex.type}`)}
            className="w-full bg-white rounded-3xl shadow-sm border border-gray-100
                       active:scale-[0.98] transition-transform duration-100 overflow-hidden text-left"
          >
            <div className="flex items-center gap-5 p-5">
              {/* 아이콘 영역 */}
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${ex.from} ${ex.to} flex items-center justify-center shrink-0 shadow-md`}>
                <span className="text-5xl">{ex.emoji}</span>
              </div>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-black text-gray-900">{ex.name}</p>
                <p className="text-xl text-gray-500 mt-0.5">{ex.desc}</p>
                <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full ${ex.bg}`}>
                  <span className={`text-lg font-semibold ${ex.text}`}>{ex.sets}</span>
                </div>
              </div>

              {/* 화살표 */}
              <span className="text-3xl text-gray-300 shrink-0">›</span>
            </div>
          </button>
        ))}
      </div>

      {/* 하단 푸터 */}
      <div className="px-6 pb-10 pt-2">
        <button
          onClick={() => router.push('/history')}
          className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 bg-white
                     text-2xl font-semibold text-gray-500 active:scale-95 transition-transform"
        >
          📋 운동 기록 보기
        </button>
      </div>
    </main>
  );
}
