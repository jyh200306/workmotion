'use client';

import { useRouter } from 'next/navigation';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import { ExerciseType } from '@/types';

const EXERCISES: ExerciseType[] = ['squat', 'calf', 'push', 'balance'];

export default function ExercisePage() {
  const router = useRouter();

  function handleSelect(type: ExerciseType) {
    router.push(`/exercise/${type}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col px-6 py-10 gap-6">
      <div className="mb-2">
        <p className="text-4xl font-black text-gray-800">운동 선택</p>
        <p className="text-2xl text-gray-500 mt-1">오늘 할 운동을 선택해 주세요</p>
      </div>

      <div className="flex flex-col gap-4">
        {EXERCISES.map((type) => (
          <ExerciseCard key={type} type={type} onClick={handleSelect} />
        ))}
      </div>

      <button
        onClick={() => router.push('/login')}
        className="mt-auto text-2xl text-gray-400 underline text-center py-4"
      >
        로그아웃
      </button>
    </main>
  );
}
