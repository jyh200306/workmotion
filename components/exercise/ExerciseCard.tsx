'use client';

import { ExerciseType } from '@/types';

const EXERCISE_INFO: Record<ExerciseType, { emoji: string; name: string; desc: string }> = {
  squat: { emoji: '🦵', name: '스쿼트', desc: '다리 근력 강화' },
  calf: { emoji: '🦶', name: '종아리 운동', desc: '균형 감각 향상' },
  push: { emoji: '💪', name: '팔 운동', desc: '상체 근력 강화' },
  balance: { emoji: '⚖️', name: '균형 운동', desc: '낙상 예방' },
};

interface ExerciseCardProps {
  type: ExerciseType;
  onClick: (type: ExerciseType) => void;
}

export function ExerciseCard({ type, onClick }: ExerciseCardProps) {
  const info = EXERCISE_INFO[type];

  return (
    <button
      onClick={() => onClick(type)}
      className="w-full flex items-center gap-6 p-6 bg-white rounded-3xl shadow-md
                 active:scale-95 transition-transform duration-100
                 hover:shadow-lg border-2 border-transparent hover:border-blue-300"
    >
      <span className="text-6xl">{info.emoji}</span>
      <div className="text-left">
        <p className="text-3xl font-bold text-gray-800">{info.name}</p>
        <p className="text-xl text-gray-500 mt-1">{info.desc}</p>
      </div>
    </button>
  );
}
