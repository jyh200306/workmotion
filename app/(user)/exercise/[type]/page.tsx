'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CameraFeed } from '@/components/camera/CameraFeed';
import { SilhouetteOverlay } from '@/components/camera/SilhouetteOverlay';
import { speak } from '@/lib/tts';
import { ExerciseType, ExercisePhase } from '@/types';

async function saveSessionToDb(exType: string, sets: number, durationSec: number) {
  try {
    const userStr = localStorage.getItem('wm_user');
    if (!userStr) return;
    const { id: userId } = JSON.parse(userStr);
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, exerciseType: exType, setsCompleted: sets, durationSec }),
    });
  } catch { /**/ }
}

const EX_INFO: Record<ExerciseType, { name: string; emoji: string; dot: string }> = {
  squat:   { name: '스쿼트',    emoji: '🦵', dot: '#ff6b00' },
  calf:    { name: '종아리 운동', emoji: '🦶', dot: '#00b900' },
  push:    { name: '팔 운동',   emoji: '💪', dot: '#0064ff' },
  balance: { name: '균형 운동',  emoji: '⚖️', dot: '#7c3aed' },
};

const TIPS: Record<ExerciseType, string> = {
  squat:   '등을 곧게 펴고 천천히 앉아주세요',
  calf:    '발뒤꿈치를 천천히 올리세요',
  push:    '팔을 천천히 뻗었다 당기세요',
  balance: '한 발씩 천천히 들어올리세요',
};

const VALID: ExerciseType[] = ['squat', 'calf', 'push', 'balance'];
const TOTAL_SETS = 3;
const SET_SEC    = 20;
const REST_SEC   = 8;

type Stage = 'ready' | 'exercise' | 'rest' | 'done';
const STAGE_TO_PHASE: Record<Stage, ExercisePhase> = {
  ready: 'ready', exercise: 'active', rest: 'rest', done: 'rest',
};

export default function ExerciseSessionPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const router   = useRouter();
  const exType   = VALID.includes(type as ExerciseType) ? (type as ExerciseType) : 'squat';
  const info     = EX_INFO[exType];

  const [stage,      setStage]      = useState<Stage>('ready');
  const [sets,       setSets]       = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(SET_SEC);
  const [paused,     setPaused]     = useState(false);
  const [silOpacity, setSilOpacity] = useState(65);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

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

  const onSetDone = useCallback(() => {
    setSets(prev => {
      const next = prev + 1;
      if (next >= TOTAL_SETS) {
        setStage('done');
        speak('모든 세트 완료! 수고하셨습니다!');
        const dur = Math.floor((Date.now() - startTimeRef.current) / 1000);
        saveSessionToDb(exType, next, dur);
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
  }, [startCountdown, exType]);

  function handleStart() {
    startTimeRef.current = Date.now();
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

      {/* 헤더 */}
      <div className="bg-[#111] px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/10">
        <button onClick={() => router.push('/exercise')} className="text-white/60 text-xl active:opacity-50 transition-opacity px-1">
          나가기
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{info.emoji}</span>
          <span className="text-white text-xl font-semibold">{info.name}</span>
        </div>
        <div className="bg-white/10 px-4 py-2 rounded-xl min-w-[68px] text-center">
          <span className="text-white text-xl font-bold">{sets}/{TOTAL_SETS}</span>
        </div>
      </div>

      {/* 카메라 */}
      <div className="flex-1 relative min-h-0">
        <CameraFeed>
          {stage !== 'done' && (
            <SilhouetteOverlay exerciseType={exType} phase={STAGE_TO_PHASE[stage]} opacity={silOpacity} />
          )}
        </CameraFeed>

        {/* 단계 뱃지 */}
        {stage !== 'ready' && stage !== 'done' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className={`px-5 py-2 rounded-full text-lg font-semibold text-white backdrop-blur-sm ${
              stage === 'exercise' ? 'bg-[#0064ff]/80' : 'bg-[#ff6b00]/80'
            }`}>
              {stage === 'exercise' ? '운동 중' : '휴식 중'}
            </span>
          </div>
        )}

        {/* 시작 전 팁 */}
        {stage === 'ready' && (
          <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
            <div className="bg-black/60 rounded-2xl px-5 py-3 backdrop-blur-sm">
              <p className="text-white/90 text-xl text-center">{TIPS[exType]}</p>
            </div>
          </div>
        )}

        {/* 완료 오버레이 */}
        {stage === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70">
            <div className="bg-white rounded-3xl px-8 py-8 flex flex-col items-center gap-4 mx-6">
              <div className="w-20 h-20 bg-[#ebf3ff] rounded-full flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#0064ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[28px] font-bold text-[#202632]">운동 완료!</p>
              <p className="text-xl text-[#6b7684]">{TOTAL_SETS}세트 모두 마쳤어요</p>
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="bg-[#111] px-5 pt-4 pb-8 shrink-0 flex flex-col gap-3">

        {stage === 'ready' && (
          <button onClick={handleStart}
            className="w-full min-h-[68px] rounded-2xl bg-[#0064ff] text-white text-2xl font-bold active:scale-95 transition-transform">
            운동 시작
          </button>
        )}

        {(stage === 'exercise' || stage === 'rest') && (
          <div className="flex items-center gap-4">
            {/* 원형 타이머 */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#2a2a2a" strokeWidth="8"/>
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={stage === 'rest' ? '#ff6b00' : '#0064ff'}
                  strokeWidth="8"
                  strokeDasharray={circum}
                  strokeDashoffset={circum * (1 - progress / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white leading-none">{timeLeft}</span>
                <span className="text-sm text-white/50 mt-0.5">초</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2.5">
              <button onClick={togglePause}
                className={`min-h-[56px] rounded-2xl text-xl font-semibold text-white active:scale-95 transition-transform
                            ${paused ? 'bg-[#0064ff]' : 'bg-white/10'}`}>
                {paused ? '계속하기' : '일시정지'}
              </button>
              <button onClick={() => router.push('/exercise')}
                className="min-h-[56px] rounded-2xl text-xl font-semibold text-white/60 bg-white/5 active:scale-95 transition-transform">
                운동 종료
              </button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <button onClick={() => router.push('/exercise')}
            className="w-full min-h-[68px] rounded-2xl bg-[#0064ff] text-white text-2xl font-bold active:scale-95 transition-transform">
            완료하기
          </button>
        )}

        {/* 실루엣 투명도 */}
        {stage !== 'done' && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-white/40 text-lg">가이드</span>
            <input type="range" min={0} max={100} value={silOpacity}
              onChange={e => setSilOpacity(Number(e.target.value))}
              className="flex-1 h-1.5 accent-[#0064ff] cursor-pointer" />
            <span className="text-white/40 text-lg w-10 text-right">{silOpacity}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
