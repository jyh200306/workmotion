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
}

interface Options {
  exercise: ExerciseType;
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;       // 운동 중일 때만 분석
  onRep?: (total: number) => void;
}

export function usePoseCounter({ exercise, videoRef, active, onRep }: Options) {
  const [state, setState] = useState<PoseCounterState>({
    ready: false, reps: 0, progress: 0,
    feedback: '준비하세요', correctForm: false, error: null,
  });

  // mutable refs — 렌더 사이클과 무관하게 루프에서 사용
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const counterRef = useRef(new RepCounter());
  const rafRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const repsRef = useRef(0);

  // 콜백/운동종류를 ref 로 안정화 — 루프가 항상 최신 값을 보되 재구독 없이 동작
  const onRepRef = useRef(onRep);
  const exerciseRef = useRef(exercise);
  useEffect(() => { onRepRef.current = onRep; }, [onRep]);
  useEffect(() => { exerciseRef.current = exercise; }, [exercise]);

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

          if (lms && lms.length > 0) {
            const a = analyzePose(exerciseRef.current, lms);
            const completed = counterRef.current.update(a.endpoint);
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
            }));
          } else {
            setState(s => ({ ...s, feedback: '화면 안에 들어와 주세요', correctForm: false }));
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
    };
  }, [active, state.ready, videoRef]);

  const resetReps = useCallback(() => {
    repsRef.current = 0;
    counterRef.current.reset();
    setState(s => ({ ...s, reps: 0, progress: 0 }));
  }, []);

  return { ...state, resetReps };
}
