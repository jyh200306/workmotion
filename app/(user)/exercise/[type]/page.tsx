'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CameraFeed } from '@/components/camera/CameraFeed';
import { PoseSkeletonOverlay } from '@/components/camera/PoseSkeletonOverlay';
import { usePoseCounter } from '@/lib/hooks/usePoseCounter';
import { ExerciseIcon } from '@/components/Icon';
import { speak } from '@/lib/tts';
import { ExerciseType } from '@/types';

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

const EX_INFO: Record<ExerciseType, { name: string }> = {
  squat:     { name: '스쿼트' },
  deadlift:  { name: '데드리프트' },
  lunge:     { name: '런지' },
  hip_hinge: { name: '힙힌지' },
};

const TIPS: Record<ExerciseType, string> = {
  squat:     '등을 곧게 펴고 천천히 앉아주세요',
  deadlift:  '무릎은 고정하고 엉덩이를 뒤로 빼며 숙이세요',
  lunge:     '앞 무릎이 발끝을 넘지 않게 천천히 내려가세요',
  hip_hinge: '무릎은 펴고 엉덩이만 뒤로 빼며 숙이세요',
};

const VALID: ExerciseType[] = ['squat', 'deadlift', 'lunge', 'hip_hinge'];
const TOTAL_SETS = 3;
const SET_SEC    = 20;
const REST_SEC   = 8;

// 한 세트 목표 반복 횟수 — 자세 인식이 동작할 때 이 횟수를 채우면 세트 완료
const REPS_PER_SET: Record<ExerciseType, number> = {
  squat: 8, deadlift: 8, lunge: 10, hip_hinge: 10,
};

type Stage = 'ready' | 'exercise' | 'rest' | 'done';

export default function ExerciseSessionPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const router   = useRouter();
  const exType   = VALID.includes(type as ExerciseType) ? (type as ExerciseType) : 'squat';
  const info     = EX_INFO[exType];

  const [stage,      setStage]      = useState<Stage>('ready');
  const [sets,       setSets]       = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(SET_SEC);
  const [paused,     setPaused]     = useState(false);
  const [isSenior,   setIsSenior]   = useState(false); // 60세 이상 → 완화 임계값 (mvp.md)

  // 이용자 출생년도로 시니어 여부 판정
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('wm_user') ?? '{}');
      if (u.birth_year && new Date().getFullYear() - u.birth_year >= 60) setIsSenior(true);
    } catch { /**/ }
  }, []);

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // ── 실시간 자세 인식 ────────────────────────────────────
  const videoRef    = useRef<HTMLVideoElement>(null);
  const goalReps    = REPS_PER_SET[exType];
  const lastSpokeRef = useRef<number>(0);

  const onSetDoneRef = useRef<() => void>(() => {});

  // 목표 반복을 채우면 즉시 세트 완료 처리
  const handleRep = useCallback((total: number) => {
    speak(String(total));
    if (total >= goalReps) onSetDoneRef.current();
  }, [goalReps]);

  const pose = usePoseCounter({
    exercise: exType,
    videoRef,
    // 분석 루프(스켈레톤 좌표 생성)는 done 을 제외한 모든 단계에서 실행 → ready/rest 에도 스켈레톤 표시
    active: stage !== 'done' && !paused,
    // 반복 카운트는 운동 중에만 → 시작 전·휴식 중 동작은 세지 않음
    counting: stage === 'exercise' && !paused,
    isSenior,
    onRep: handleRep,
  });

  // 자세 교정 피드백 음성 안내 (4초 쓰로틀)
  useEffect(() => {
    if (stage !== 'exercise' || paused) return;
    if (pose.correctForm) return;
    const now = Date.now();
    if (now - lastSpokeRef.current > 4000) {
      lastSpokeRef.current = now;
      speak(pose.feedback);
    }
  }, [pose.feedback, pose.correctForm, stage, paused]);

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

  const completingRef = useRef(false); // 세트 완료 중복 처리 가드

  const onSetDone = useCallback(() => {
    // 타이머 만료와 목표 반복 달성이 동시에 발생해도 한 번만 처리
    if (completingRef.current) return;
    completingRef.current = true;
    clearTimer();

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
          pose.resetReps();
          completingRef.current = false;
          setStage('exercise');
          speak('다음 세트 시작합니다');
          startCountdown(SET_SEC, onSetDoneRef.current);
        });
      }
      return next;
    });
  }, [startCountdown, exType, pose]);

  useEffect(() => { onSetDoneRef.current = onSetDone; }, [onSetDone]);

  function handleStart() {
    startTimeRef.current = Date.now();
    completingRef.current = false;
    pose.resetReps();
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
      <div className="bg-[#111] px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-white/10">
        <button onClick={() => router.push('/exercise')} className="text-white/60 text-base active:opacity-50 transition-opacity px-1">
          나가기
        </button>
        <div className="flex items-center gap-2 text-white">
          <ExerciseIcon type={exType} size={20} />
          <span className="text-white text-lg font-semibold tracking-tight">{info.name}</span>
        </div>
        <div className="bg-white/10 px-3.5 py-1.5 rounded-lg min-w-[60px] text-center">
          <span className="text-white text-base font-bold tabular-nums">{sets}/{TOTAL_SETS}</span>
        </div>
      </div>

      {/* 카메라 */}
      <div className="flex-1 relative min-h-0">
        <CameraFeed videoRef={videoRef}>
          {/* 실시간 사용자 스켈레톤 — 완료 단계 제외 모든 단계에서 표시(유일한 가이드) */}
          {stage !== 'done' && (
            <PoseSkeletonOverlay landmarks={pose.landmarks} videoRef={videoRef} correctForm={pose.correctForm} />
          )}
        </CameraFeed>

        {/* 단계 뱃지 */}
        {stage !== 'ready' && stage !== 'done' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className={`px-3.5 py-1 rounded-full text-sm font-semibold text-white backdrop-blur-sm ${
              stage === 'exercise' ? 'bg-[#0064ff]/80' : 'bg-[#6b7684]/80'
            }`}>
              {stage === 'exercise' ? '운동 중' : '휴식 중'}
            </span>
          </div>
        )}

        {/* 실시간 반복 카운트 + 진행도 (운동 중, 자세 인식 동작 시) */}
        {stage === 'exercise' && pose.ready && (
          <>
            {/* 반복 횟수 (좌하단) */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
              <div className="bg-black/55 rounded-xl px-4 py-2.5 backdrop-blur-sm flex items-baseline gap-1">
                <span className="text-[#4d94ff] text-4xl font-bold leading-none tabular-nums">{pose.reps}</span>
                <span className="text-white/60 text-lg font-semibold">/ {goalReps}회</span>
              </div>
            </div>

            {/* 진행도 세로 막대 (우측) */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 pointer-events-none">
              <div className="w-2.5 h-44 bg-black/40 rounded-full overflow-hidden flex flex-col-reverse">
                <div
                  className="w-full bg-[#4d94ff] rounded-full transition-all duration-150"
                  style={{ height: `${pose.progress}%` }}
                />
              </div>
            </div>

            {/* 자세 피드백 (상단, 단계 뱃지 아래) */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-[90%]">
              <span className={`block px-3.5 py-1 rounded-full text-sm font-medium text-center backdrop-blur-sm text-white ${
                pose.correctForm ? 'bg-[#0064ff]/80' : 'bg-[#6b7684]/85'
              }`}>
                {pose.feedback}
              </span>
            </div>
          </>
        )}

        {/* 자세 인식 로딩 / 오류 안내 */}
        {stage === 'exercise' && !pose.ready && !pose.error && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className="bg-black/55 text-white/80 text-sm px-3.5 py-1 rounded-full backdrop-blur-sm">
              자세 인식 준비 중…
            </span>
          </div>
        )}
        {pose.error && stage === 'exercise' && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className="bg-black/55 text-white/70 text-sm px-3.5 py-1 rounded-full backdrop-blur-sm">
              타이머 모드로 진행합니다
            </span>
          </div>
        )}

        {/* 시작 전 팁 */}
        {stage === 'ready' && (
          <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
            <div className="bg-black/55 rounded-xl px-4 py-2.5 backdrop-blur-sm">
              <p className="text-white/90 text-base text-center leading-snug">{TIPS[exType]}</p>
            </div>
          </div>
        )}

        {/* 완료 오버레이 */}
        {stage === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70">
            <div className="bg-white rounded-3xl px-8 py-7 flex flex-col items-center gap-3 mx-6">
              <div className="w-16 h-16 bg-[#ebf3ff] rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#0064ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-2xl font-bold text-[#202632] tracking-tight">운동 완료!</p>
              <p className="text-base text-[#6b7684]">{TOTAL_SETS}세트 모두 마쳤어요</p>
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="bg-[#111] px-5 pt-4 pb-8 shrink-0 flex flex-col gap-3">

        {stage === 'ready' && (
          <button onClick={handleStart}
            className="w-full min-h-[60px] rounded-2xl bg-[#0064ff] text-white text-lg font-bold active:scale-95 transition-transform">
            운동 시작
          </button>
        )}

        {(stage === 'exercise' || stage === 'rest') && (
          <div className="flex items-center gap-4">
            {/* 원형 타이머 */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#2a2a2a" strokeWidth="8"/>
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={stage === 'rest' ? '#6b7684' : '#0064ff'}
                  strokeWidth="8"
                  strokeDasharray={circum}
                  strokeDashoffset={circum * (1 - progress / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-white leading-none tabular-nums">{timeLeft}</span>
                <span className="text-xs text-white/50 mt-0.5">초</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2.5">
              <button onClick={togglePause}
                className={`min-h-[52px] rounded-xl text-base font-semibold text-white active:scale-95 transition-transform
                            ${paused ? 'bg-[#0064ff]' : 'bg-white/10'}`}>
                {paused ? '계속하기' : '일시정지'}
              </button>
              <button onClick={() => router.push('/exercise')}
                className="min-h-[52px] rounded-xl text-base font-semibold text-white/60 bg-white/5 active:scale-95 transition-transform">
                운동 종료
              </button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <button onClick={() => router.push('/exercise')}
            className="w-full min-h-[60px] rounded-2xl bg-[#0064ff] text-white text-lg font-bold active:scale-95 transition-transform">
            완료하기
          </button>
        )}
      </div>
    </div>
  );
}
