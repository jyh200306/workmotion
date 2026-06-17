'use client';

// MediaPipe Pose Landmarker 로 카메라 프레임을 분석해
// 실시간 반복 횟수·진행도·자세 피드백을 제공하는 훅.
//
// Exercise-Counter 의 메인 루프(VideoCapture → findPose → analyze → count)를
// 브라우저 requestAnimationFrame 루프로 옮긴 것입니다.

import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { ExerciseType } from '@/types';
import {
  analyzePose,
  isFrameVisible,
  RepCounter,
  type Landmark,
} from '@/lib/poseAnalysis';

// MediaPipe 모델/WASM 은 jsDelivr CDN 에서 로드 (별도 호스팅 불필요)
const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export interface PoseCounterState {
  ready: boolean;        // 모델 로드 완료
  reps: number;          // 누적 반복 횟수
  progress: number;      // 0~100 현재 동작 진행도
  feedback: string;      // 자세 피드백 문구
  correctForm: boolean;  // 자세 정확 여부
  error: string | null;
  /** 화면에 "그리기용"으로 내보내는 원본 관절 좌표(각도 판정과 무관). 없으면 null. */
  landmarks: Landmark[] | null;
}

interface Options {
  exercise: ExerciseType;
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;       // 운동 중일 때만 분석
  isSenior?: boolean;    // 60세 이상 → 완화 임계값 적용 (mvp.md)
  onRep?: (total: number) => void;
}

export function usePoseCounter({ exercise, videoRef, active, isSenior = false, onRep }: Options) {
  const [state, setState] = useState<PoseCounterState>({
    ready: false, reps: 0, progress: 0,
    feedback: '준비하세요', correctForm: false, error: null,
    landmarks: null,
  });

  // mutable refs — 렌더 사이클과 무관하게 루프에서 사용
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const counterRef = useRef(new RepCounter());
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const repsRef = useRef(0);

  // 콜백/운동종류/시니어를 ref 로 안정화 — 루프가 항상 최신 값을 보되 재구독 없이 동작
  const onRepRef = useRef(onRep);
  const exerciseRef = useRef(exercise);
  const seniorRef = useRef(isSenior);
  useEffect(() => { onRepRef.current = onRep; }, [onRep]);
  useEffect(() => { exerciseRef.current = exercise; }, [exercise]);
  useEffect(() => { seniorRef.current = isSenior; }, [isSenior]);

  // ── 모델 1회 로드 ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const { FilesetResolver, PoseLandmarker } = vision;
        const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
        const landmarker = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (cancelled) { landmarker.close(); return; }
        landmarkerRef.current = landmarker;
        setState(s => ({ ...s, ready: true }));
      } catch (err) {
        if (!cancelled) {
          setState(s => ({
            ...s,
            error: '자세 인식을 시작할 수 없습니다. 네트워크를 확인해 주세요.',
          }));
          console.error('[usePoseCounter] model load failed', err);
        }
      }
    })();

    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
    };
  }, []);

  // ── active 토글에 따라 프레임 분석 루프 시작/정지 ─────
  useEffect(() => {
    if (!active || !state.ready) return;

    const video = videoRef.current;

    function tick() {
      const landmarker = landmarkerRef.current;
      if (video && landmarker && video.readyState >= 2) {
        const t = video.currentTime;
        if (t !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = t;
          const result = landmarker.detectForVideo(video, performance.now());
          const lms: Landmark[] | undefined = result?.landmarks?.[0];

          if (!lms || lms.length === 0) {
            setState(s => ({ ...s, feedback: '화면 안에 들어와 주세요', correctForm: false, landmarks: null }));
          } else if (!isFrameVisible(lms)) {
            // 주요 랜드마크가 가려짐 → 운동 일시정지, 카운트 안 함 (mvp.md FRAME_WARNING)
            setState(s => ({ ...s, feedback: '뒤로 물러나세요 — 전신이 카메라에 들어와야 합니다', correctForm: false, landmarks: null }));
          } else {
            // 각도 판정은 원본 lms 를 그대로 사용 (스무딩 영향 없음)
            const a = analyzePose(exerciseRef.current, lms, seniorRef.current);
            const completed = counterRef.current.update(a.endpoint, a.progress);
            if (completed) {
              repsRef.current += 1;
              onRepRef.current?.(repsRef.current);
            }
            setState(s => ({
              ...s,
              reps: repsRef.current,
              progress: a.progress,
              feedback: a.feedback,
              correctForm: a.correctForm,
              landmarks: lms, // 그리기용으로 원본 좌표 내보내기 (스무딩은 렌더 직전에 적용)
            }));
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // 루프 중단 시 마지막 스켈레톤이 화면에 얼어붙지 않게 비움
      setState(s => ({ ...s, landmarks: null }));
    };
  }, [active, state.ready, videoRef]);

  const resetReps = useCallback(() => {
    repsRef.current = 0;
    counterRef.current.reset();
    setState(s => ({ ...s, reps: 0, progress: 0 }));
  }, []);

  return { ...state, resetReps };
}
