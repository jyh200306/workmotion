'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CameraFeed } from '@/components/camera/CameraFeed';
import { SilhouetteOverlay } from '@/components/camera/SilhouetteOverlay';
import { SetTimer } from '@/components/exercise/SetTimer';
import { OpacitySlider } from '@/components/exercise/OpacitySlider';
import { SeniorButton } from '@/components/ui/SeniorButton';
import { ExerciseType, ExercisePhase } from '@/types';
import { speak } from '@/lib/tts';

const EXERCISE_NAME: Record<ExerciseType, string> = {
  squat: '스쿼트',
  calf: '종아리 운동',
  push: '팔 운동',
  balance: '균형 운동',
};

const VALID_TYPES: ExerciseType[] = ['squat', 'calf', 'push', 'balance'];

export default function ExerciseSessionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router = useRouter();

  const exerciseType = VALID_TYPES.includes(type as ExerciseType)
    ? (type as ExerciseType)
    : 'squat';

  const [phase, setPhase] = useState<ExercisePhase>('ready');
  const [opacity, setOpacity] = useState(50);
  const [sets, setSets] = useState(0);
  const [started, setStarted] = useState(false);

  function handleStart() {
    setStarted(true);
    setPhase('active');
    speak(`${EXERCISE_NAME[exerciseType]} 시작합니다`);
  }

  function handleSetComplete() {
    const next = sets + 1;
    setSets(next);
    setPhase('rest');
    speak(`${next}세트 완료! 잠시 쉬세요.`);
    setTimeout(() => setPhase('active'), 5000);
  }

  function handleFinish() {
    speak('운동을 마쳤습니다. 수고하셨습니다!');
    router.push('/exercise');
  }

  return (
    <main className="h-screen flex flex-col bg-black overflow-hidden">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-black text-white z-10">
        <button
          onClick={handleFinish}
          className="text-2xl text-gray-300 active:scale-95 transition-transform px-2"
        >
          ← 나가기
        </button>
        <p className="text-2xl font-bold">{EXERCISE_NAME[exerciseType]}</p>
        <p className="text-2xl text-blue-400 font-bold">{sets}세트</p>
      </div>

      {/* 카메라 + 실루엣 오버레이 (80%) */}
      <div className="flex-1 relative">
        <CameraFeed>
          {started && (
            <SilhouetteOverlay
              exerciseType={exerciseType}
              phase={phase}
              opacity={opacity}
            />
          )}
        </CameraFeed>

        {/* 페이즈 뱃지 */}
        {started && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <span className={`px-6 py-2 rounded-full text-2xl font-bold text-white ${
              phase === 'active' ? 'bg-blue-600' :
              phase === 'rest' ? 'bg-green-600' : 'bg-gray-600'
            }`}>
              {phase === 'active' ? '운동 중' : phase === 'rest' ? '휴식 중' : '준비'}
            </span>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 (20%) */}
      <div className="bg-gray-900 px-4 pt-4 pb-6 flex flex-col gap-3">
        <OpacitySlider value={opacity} onChange={setOpacity} />

        {!started ? (
          <SeniorButton onClick={handleStart} className="w-full">
            운동 시작
          </SeniorButton>
        ) : (
          <div className="flex gap-3">
            <div className="flex-1 flex items-center justify-center">
              <SetTimer
                key={`${sets}-${phase}`}
                durationSec={20}
                onComplete={handleSetComplete}
              />
            </div>
            <SeniorButton
              onClick={handleFinish}
              variant="danger"
              className="px-6"
            >
              종료
            </SeniorButton>
          </div>
        )}
      </div>
    </main>
  );
}
