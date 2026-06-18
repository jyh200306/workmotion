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
const TOTAL_SETS    = 3;
const REST_SEC      = 10;  // 세트 사이 휴식
const COUNTDOWN_SEC = 5;   // 운동 시작 전 준비 카운트다운

// 한 세트 목표 반복 횟수 — 자세 인식이 동작할 때 이 횟수를 채우면 세트 완료
const REPS_PER_SET: Record<ExerciseType, number> = {
  squat: 8, deadlift: 8, lunge: 10, hip_hinge: 10,
};

type Stage = 'ready' | 'countdown' | 'exercise' | 'rest' | 'done';

export default function ExerciseSessionPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = use(params);
  const router   = useRouter();
  const exType   = VALID.includes(type as ExerciseType) ? (type as ExerciseType) : 'squat';
  const info     = EX_INFO[exType];

  const [stage,      setStage]      = useState<Stage>('ready');
  const [sets,       setSets]       = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(REST_SEC); // 휴식 카운트다운 표시용
  const [countdown,  setCountdown]  = useState(COUNTDOWN_SEC); // 시작 전 5초 카운트다운 표시
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
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // ── 실시간 자세 인식 ────────────────────────────────────
  const videoRef    = useRef<HTMLVideoElement>(null);
  const goalReps    = REPS_PER_SET[exType];
  const lastSpokeRef = useRef<number>(0);

  const onSetDoneRef = useRef<() => void>(() => {});

  // 목표 반복을 채우면 즉시 세트 완료 처리 (횟수 카운트 음성은 없음 — 피드백 음성만 사용)
  const handleRep = useCallback((total: number) => {
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

  // 카운트다운 타이머 정리 (메모리 누수 방지)
  const clearCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  // 언마운트 시 모든 타이머·음성 정리
  useEffect(() => () => {
    clearTimer();
    clearCountdown();
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, [clearCountdown]);

  const completingRef = useRef(false); // 세트 완료 중복 처리 가드

  // 목표 반복 횟수 달성 시 세트 완료 (운동 중 타이머 없음 — 횟수로만 완료)
  const onSetDone = useCallback(() => {
    // 중복 호출 방지 가드
    if (completingRef.current) return;
    completingRef.current = true;

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
        // 휴식 카운트다운 종료 후 다음 세트 시작 (세트 타이머 없이 횟수만 카운트)
        startCountdown(REST_SEC, () => {
          pose.resetReps();
          completingRef.current = false;
          setStage('exercise');
          speak('다음 세트 시작합니다');
        });
      }
      return next;
    });
  }, [startCountdown, exType, pose]);

  useEffect(() => { onSetDoneRef.current = onSetDone; }, [onSetDone]);

  // ── 시작 전 5초 카운트다운 → "운동 시작" 음성 → 실제 운동 시작 ──────────

  // 실제 운동 시작 로직 (카메라 자세 인식만 — 세트 타이머 없이 목표 횟수로 완료)
  const beginExercise = useCallback(() => {
    startTimeRef.current = Date.now();
    completingRef.current = false;
    pose.resetReps();
    setStage('exercise');
  }, [pose]);

  // 의존성 순환을 피하기 위해 ref로 참조 (onSetDoneRef 패턴과 동일)
  const beginExerciseRef = useRef<() => void>(() => {});
  useEffect(() => { beginExerciseRef.current = beginExercise; }, [beginExercise]);

  // 숫자 갱신만 담당하는 순수 틱 로직 (함수형 분리)
  const tickCountdown = useCallback(() => {
    setCountdown(prev => {
      if (prev <= 1) {        // 0 도달 → 카운트다운 종료, 음성 끝난 직후 운동 시작
        clearCountdown();
        speak('운동 시작', { onEnd: () => beginExerciseRef.current() });
        return 0;
      }
      speak(String(prev - 1)); // "4","3","2","1" 안내
      return prev - 1;
    });
  }, [clearCountdown]);

  // 시작 버튼: ready → 카운트다운 시작 / countdown 중 재클릭 → 취소·초기화
  const handleStartButton = useCallback(() => {
    if (stage === 'countdown') {        // 재클릭 → 중단·초기화
      clearCountdown();
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
      setCountdown(COUNTDOWN_SEC);
      setStage('ready');
      return;
    }
    // ready → 카운트다운 시작
    clearCountdown();
    setCountdown(COUNTDOWN_SEC);
    setStage('countdown');
    speak('5');                          // 첫 숫자 즉시 안내
    countdownRef.current = setInterval(tickCountdown, 1000);
  }, [stage, clearCountdown, tickCountdown]);

  function togglePause() {
    if (paused) {
      setPaused(false);
      // 휴식 중이었다면 휴식 타이머 재개 (운동 중에는 타이머 없음 → 자세 인식만 재개)
      if (stage === 'rest') {
        intervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) { clearTimer(); return 0; }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      setPaused(true);
      clearTimer();
    }
  }

  // 휴식 타이머 진행도 (운동 중에는 타이머 없음)
  const progress = stage === 'rest' ? (1 - timeLeft / REST_SEC) * 100 : 0;
  const circum   = 2 * Math.PI * 52;

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
            <span className={`px-3.5 py-1 rounded-full text-sm font-semibold backdrop-blur-sm ${
              stage === 'exercise' ? 'bg-[#d8ff36]/90 text-[#14181d]' : 'bg-[#6b7684]/80 text-white'
            }`}>
              {stage === 'exercise' ? '운동 중' : '휴식 중'}
            </span>
          </div>
        )}

        {/* 실시간 진행도 + 자세 피드백 (운동 중, 자세 인식 동작 시) — 횟수는 하단 컨트롤에 표시 */}
        {stage === 'exercise' && pose.ready && (
          <>
            {/* 진행도 세로 막대 (우측) */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 pointer-events-none">
              <div className="w-2.5 h-44 bg-black/40 rounded-full overflow-hidden flex flex-col-reverse">
                <div
                  className="w-full bg-[#d8ff36] rounded-full transition-all duration-150"
                  style={{ height: `${pose.progress}%` }}
                />
              </div>
            </div>

            {/* 자세 피드백 (상단, 단계 뱃지 아래) */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none max-w-[90%]">
              <span className={`block px-3.5 py-1 rounded-full text-sm font-medium text-center backdrop-blur-sm ${
                pose.correctForm ? 'bg-[#d8ff36]/90 text-[#14181d]' : 'bg-[#6b7684]/85 text-white'
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

        {/* 시작 전 5초 카운트다운 오버레이 (전체 화면) */}
        {stage === 'countdown' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center
                          bg-black/60 backdrop-blur-sm pointer-events-none">
            <p className="text-white/70 text-lg mb-2">잠시 후 시작합니다</p>
            <span key={countdown}
              className="text-white text-[120px] font-bold leading-none tabular-nums animate-[pop_0.4s_ease-out]">
              {countdown === 0 ? '시작!' : countdown}
            </span>
          </div>
        )}

        {/* 완료 오버레이 */}
        {stage === 'done' && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/70">
            <div className="bg-[#1a2026] rounded-3xl px-8 py-7 flex flex-col items-center gap-3 mx-6">
              <div className="w-16 h-16 bg-[#23291a] rounded-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#d8ff36" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-2xl font-bold text-[#f0f0f0] tracking-tight">운동 완료!</p>
              <p className="text-base text-[#a0a0a0]">{TOTAL_SETS}세트 모두 마쳤어요</p>
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="bg-[#111] px-5 pt-4 pb-8 shrink-0 flex flex-col gap-3">

        {(stage === 'ready' || stage === 'countdown') && (
          <button onClick={handleStartButton}
            className={`w-full min-h-[60px] rounded-2xl text-lg font-bold active:scale-95 transition-transform
                        ${stage === 'countdown' ? 'bg-white/10 text-white' : 'bg-[#d8ff36] text-[#14181d]'}`}>
            {stage === 'countdown' ? '취소' : '운동 시작'}
          </button>
        )}

        {(stage === 'exercise' || stage === 'rest') && (
          <div className="flex items-center gap-4">
            {stage === 'rest' ? (
              /* 휴식 원형 타이머 */
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#2a2a2a" strokeWidth="8"/>
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke="#a0a0a0"
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
            ) : (
              /* 운동 중 횟수 카운트 (타이머 없음 — 목표 횟수로 세트 완료) */
              <div className="w-24 h-24 shrink-0 rounded-full bg-white/5 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-[#d8ff36] leading-none tabular-nums">{pose.reps}</span>
                <span className="text-xs text-white/50 mt-0.5">/ {goalReps}회</span>
              </div>
            )}

            <div className="flex-1 flex flex-col gap-2.5">
              <button onClick={togglePause}
                className={`min-h-[52px] rounded-xl text-base font-semibold active:scale-95 transition-transform
                            ${paused ? 'bg-[#d8ff36] text-[#14181d]' : 'bg-white/10 text-white'}`}>
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
            className="w-full min-h-[60px] rounded-2xl bg-[#d8ff36] text-[#14181d] text-lg font-bold active:scale-95 transition-transform">
            완료하기
          </button>
        )}
      </div>
    </div>
  );
}
