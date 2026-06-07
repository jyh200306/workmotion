'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CameraFeed } from '@/components/camera/CameraFeed';
import { SilhouetteOverlay } from '@/components/camera/SilhouetteOverlay';
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
const SET_SEC    = 20;
const REST_SEC   = 8;

type Stage = 'ready' | 'exercise' | 'rest' | 'done';

const STAGE_TO_PHASE: Record<Stage, ExercisePhase> = {
  ready:    'ready',
  exercise: 'active',
  rest:     'rest',
  done:     'rest',
};

export default function ExerciseSessionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = use(params);
  const router   = useRouter();
  const exType   = VALID.includes(type as ExerciseType) ? (type as ExerciseType) : 'squat';
  const info     = EXERCISE_INFO[exType];

  const [stage,    setStage]    = useState<Stage>('ready');
  const [sets,     setSets]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(SET_SEC);
  const [paused,   setPaused]   = useState(false);
  const [silOpacity, setSilOpacity] = useState(65); // 실루엣 투명도

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const startCountdown = useCallback((duration: number, onDone: () => void) => {
    clearTimer();
    setTimeLeft(duration);
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearTimer(); onDone(); return 0; }
        if (prev <= 4) speak(String(prev - 1));
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearTimer(), []);

  // ── 세트 완료 핸들러 ──────────────────────────────
  const onSetDone = useCallback(() => {
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
  }, [startCountdown]);

  function handleStart() {
    setStage('exercise');
    speak(`${info.name} 시작합니다`);
    startCountdown(SET_SEC, onSetDone);
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

  const totalTime = stage === 'rest' ? REST_SEC : SET_SEC;
  const progress  = (stage === 'ready' || stage === 'done') ? 0 : (1 - timeLeft / totalTime) * 100;
  const circum    = 2 * Math.PI * 52;

  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden">

      {/* ── 헤더 ────────────────────────────────────── */}
      <div className={`bg-gradient-to-r ${info.from} ${info.to} px-5 py-4 flex items-center justify-between shrink-0`}>
        <button
          onClick={() => router.push('/exercise')}
          className="text-white/80 text-2xl active:scale-90 transition-transform px-1"
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

      {/* ── 카메라 + 실루엣 오버레이 ────────────────── */}
      <div className="flex-1 relative min-h-0">
        <CameraFeed>
          {/* 실루엣 가이드 오버레이 */}
          {stage !== 'done' && (
            <SilhouetteOverlay
              exerciseType={exType}
              phase={STAGE_TO_PHASE[stage]}
              opacity={silOpacity}
            />
          )}
        </CameraFeed>

        {/* 단계 뱃지 */}
        {stage !== 'ready' && stage !== 'done' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className={`px-6 py-2 rounded-full text-xl font-bold text-white shadow-lg backdrop-blur-sm ${
              stage === 'exercise' ? 'bg-blue-500/80' : 'bg-amber-500/80'
            }`}>
              {stage === 'exercise' ? '🏃 운동 중' : '😤 휴식 중'}
            </span>
          </div>
        )}

        {/* 시작 전 팁 */}
        {stage === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-end justify-end z-20 pointer-events-none p-4">
            <div className="bg-black/60 rounded-2xl px-5 py-3 backdrop-blur-sm w-full">
              <p className="text-white/90 text-xl text-center leading-relaxed">💡 {info.tip}</p>
            </div>
          </div>
        )}

        {/* 완료 오버레이 */}
        {stage === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/65">
            <div className="bg-white rounded-3xl px-8 py-8 flex flex-col items-center gap-3 shadow-2xl mx-6">
              <span className="text-8xl">🎉</span>
              <p className="text-4xl font-black text-gray-900">운동 완료!</p>
              <p className="text-2xl text-gray-500">{TOTAL_SETS}세트 모두 마쳤어요</p>
              <p className="text-xl text-gray-400 mt-1">정말 수고하셨습니다!</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 컨트롤 패널 ─────────────────────────────── */}
      <div className="bg-gray-900 px-5 pt-4 pb-7 shrink-0 flex flex-col gap-3">

        {stage === 'ready' && (
          <button
            onClick={handleStart}
            className={`w-full min-h-[72px] rounded-2xl bg-gradient-to-r ${info.from} ${info.to}
                        text-white text-3xl font-black active:scale-95 transition-transform shadow-lg`}
          >
            운동 시작
          </button>
        )}

        {(stage === 'exercise' || stage === 'rest') && (
          <div className="flex items-center gap-4">
            {/* 원형 타이머 */}
            <div className="relative w-28 h-28 shrink-0">
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
                <span className="text-base text-gray-400">초</span>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex-1 flex flex-col gap-3">
              <button
                onClick={togglePause}
                className={`min-h-[58px] rounded-2xl text-2xl font-bold text-white
                            active:scale-95 transition-transform
                            ${paused ? 'bg-blue-500' : 'bg-amber-500'}`}
              >
                {paused ? '▶ 재개' : '⏸ 일시정지'}
              </button>
              <button
                onClick={() => router.push('/exercise')}
                className="min-h-[58px] rounded-2xl text-2xl font-bold text-white
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
            ✓ 완료하기
          </button>
        )}

        {/* 실루엣 투명도 슬라이더 */}
        {stage !== 'done' && (
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-lg">실루엣</span>
            <input
              type="range"
              min={0} max={100}
              value={silOpacity}
              onChange={e => setSilOpacity(Number(e.target.value))}
              className="flex-1 h-2 accent-cyan-400 cursor-pointer"
              aria-label="실루엣 투명도 조절"
            />
            <span className="text-cyan-400 text-lg font-semibold w-10 text-right">{silOpacity}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
