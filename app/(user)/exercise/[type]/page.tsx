'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CameraFeed } from '@/components/camera/CameraFeed';
import { speak } from '@/lib/tts';
import { ExerciseType, ExercisePhase } from '@/types';

const EXERCISE_INFO: Record<ExerciseType, {
  name: string; emoji: string; from: string; to: string; tip: string;
}> = {
  squat:   { name: '스쿼트',    emoji: '🦵', from: 'from-orange-500', to: 'to-red-600',    tip: '등을 곧게 펴고 천천히 앉아주세요' },
  calf:    { name: '종아리 운동', emoji: '🦶', from: 'from-emerald-500', to: 'to-teal-600',  tip: '발뒤꿈치를 천천히 올리세요' },
  push:    { name: '팔 운동',    emoji: '💪', from: 'from-blue-500',  to: 'to-indigo-600', tip: '팔을 천천히 뻗었다 당기세요' },
  balance: { name: '균형 운동',  emoji: '⚖️', from: 'from-violet-500', to: 'to-purple-600', tip: '한 발씩 천천히 들어올리세요' },
};

const VALID: ExerciseType[] = ['squat', 'calf', 'push', 'balance'];
const TOTAL_SETS = 3;
const SET_SEC = 20;
const REST_SEC = 8;

type Stage = 'ready' | 'exercise' | 'rest' | 'done';

export default function ExerciseSessionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router = useRouter();
  const exType = VALID.includes(type as ExerciseType) ? (type as ExerciseType) : 'squat';
  const info = EXERCISE_INFO[exType];

  const [stage, setStage]       = useState<Stage>('ready');
  const [sets, setSets]         = useState(0);
  const [timeLeft, setTimeLeft] = useState(SET_SEC);
  const [paused, setPaused]     = useState(false);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startCountdown = useCallback((duration: number, onDone: () => void) => {
    clearTimer();
    setTimeLeft(duration);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          onDone();
          return 0;
        }
        if (prev <= 4) speak(String(prev - 1));
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearTimer(), []);

  function startExercise() {
    setStage('exercise');
    speak(`${info.name} 시작합니다`);
    startCountdown(SET_SEC, onSetDone);
  }

  function onSetDone() {
    setSets(prev => {
      const next = prev + 1;
      if (next >= TOTAL_SETS) {
        setStage('done');
        speak('모든 세트 완료! 정말 수고하셨습니다!');
      } else {
        setStage('rest');
        speak(`${next}세트 완료! ${REST_SEC}초 쉬어가요.`);
        startCountdown(REST_SEC, () => {
          setStage('exercise');
          speak('다음 세트 시작합니다');
          startCountdown(SET_SEC, onSetDone);
        });
      }
      return next;
    });
  }

  function togglePause() {
    if (paused) {
      setPaused(false);
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearTimer(); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPaused(true);
      clearTimer();
    }
  }

  const totalTime  = stage === 'rest' ? REST_SEC : SET_SEC;
  const progress   = stage === 'ready' || stage === 'done' ? 0 : (1 - timeLeft / totalTime) * 100;
  const circum     = 2 * Math.PI * 52;

  const stageColor = {
    ready:    'bg-gray-500',
    exercise: 'bg-blue-500',
    rest:     'bg-amber-500',
    done:     'bg-green-500',
  }[stage];

  const stageLabel = {
    ready:    '준비',
    exercise: '운동 중',
    rest:     '휴식 중',
    done:     '완료!',
  }[stage];

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">

      {/* ── 헤더 ── */}
      <div className={`bg-gradient-to-r ${info.from} ${info.to} px-5 py-4 flex items-center justify-between shrink-0`}>
        <button
          onClick={() => router.push('/exercise')}
          className="text-white/80 text-2xl active:scale-90 transition-transform px-1 py-1"
        >
          ← 나가기
        </button>
        <div className="flex items-center gap-2">
          <span className="text-3xl">{info.emoji}</span>
          <span className="text-white text-2xl font-bold">{info.name}</span>
        </div>
        <div className="bg-black/20 px-4 py-2 rounded-xl min-w-[72px] text-center">
          <span className="text-white text-2xl font-black">{sets}/{TOTAL_SETS}</span>
        </div>
      </div>

      {/* ── 카메라 영역 ── */}
      <div className="flex-1 relative min-h-0">
        <CameraFeed>
          {/* 실루엣 오버레이 — 추후 삽입 */}
        </CameraFeed>

        {/* 상태 뱃지 */}
        {stage !== 'ready' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <span className={`${stageColor} px-6 py-2 rounded-full text-xl font-bold text-white shadow-lg`}>
              {stageLabel}
            </span>
          </div>
        )}

        {/* 시작 전 팁 */}
        {stage === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-8 gap-4">
            <div className="bg-black/55 rounded-3xl px-6 py-5 flex flex-col items-center gap-3">
              <span className="text-7xl">{info.emoji}</span>
              <p className="text-white text-2xl text-center leading-relaxed">{info.tip}</p>
            </div>
          </div>
        )}

        {/* 완료 화면 오버레이 */}
        {stage === 'done' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/60 px-8">
            <div className="bg-white rounded-3xl px-8 py-8 flex flex-col items-center gap-4 shadow-2xl">
              <span className="text-8xl">🎉</span>
              <p className="text-4xl font-black text-gray-900">운동 완료!</p>
              <p className="text-2xl text-gray-500">{TOTAL_SETS}세트 모두 마쳤어요</p>
              <p className="text-xl text-gray-400">정말 수고하셨습니다</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 컨트롤 패널 ── */}
      <div className="bg-gray-900 px-5 pt-5 pb-8 shrink-0">

        {stage === 'ready' && (
          <button
            onClick={startExercise}
            className={`w-full min-h-[72px] rounded-2xl bg-gradient-to-r ${info.from} ${info.to}
                        text-white text-3xl font-black active:scale-95 transition-transform shadow-lg`}
          >
            운동 시작
          </button>
        )}

        {(stage === 'exercise' || stage === 'rest') && (
          <div className="flex items-center gap-4">
            {/* 원형 타이머 */}
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#374151" strokeWidth="8"/>
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke={stage === 'rest' ? '#f59e0b' : '#3b82f6'}
                  strokeWidth="8"
                  strokeDasharray={circum}
                  strokeDashoffset={circum * (1 - progress / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white leading-none">{timeLeft}</span>
                <span className="text-lg text-gray-400">초</span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex-1 flex flex-col gap-3">
              <button
                onClick={togglePause}
                className={`min-h-[60px] rounded-2xl text-2xl font-bold text-white
                            active:scale-95 transition-transform
                            ${paused ? 'bg-blue-500' : 'bg-amber-500'}`}
              >
                {paused ? '▶ 재개' : '⏸ 일시정지'}
              </button>
              <button
                onClick={() => router.push('/exercise')}
                className="min-h-[60px] rounded-2xl text-2xl font-bold text-white
                           bg-red-500/80 active:scale-95 transition-transform"
              >
                운동 종료
              </button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <button
            onClick={() => router.push('/exercise')}
            className="w-full min-h-[72px] rounded-2xl bg-green-500
                       text-white text-3xl font-black active:scale-95 transition-transform shadow-lg"
          >
            ✓ 운동 완료
          </button>
        )}
      </div>
    </div>
  );
}
