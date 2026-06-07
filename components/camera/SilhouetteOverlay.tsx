'use client';

import { ExercisePhase, ExerciseType } from '@/types';

type SilhouetteConfig = {
  src: string;
  label: string;
};

const SILHOUETTE_MAP: Record<ExerciseType, Record<ExercisePhase, SilhouetteConfig>> = {
  squat: {
    ready: { src: '/silhouettes/squat_start.png', label: '시작 자세' },
    active: { src: '/silhouettes/squat_down.png', label: '앉는 동작' },
    rest: { src: '/silhouettes/squat_start.png', label: '시작 자세' },
  },
  calf: {
    ready: { src: '/silhouettes/calf_both.png', label: '준비 자세' },
    active: { src: '/silhouettes/calf_single.png', label: '들어올리기' },
    rest: { src: '/silhouettes/calf_both.png', label: '준비 자세' },
  },
  push: {
    ready: { src: '/silhouettes/push_ready.png', label: '준비 자세' },
    active: { src: '/silhouettes/push_extend.png', label: '팔 펴기' },
    rest: { src: '/silhouettes/push_ready.png', label: '준비 자세' },
  },
  balance: {
    ready: { src: '/silhouettes/balance_both.png', label: '준비 자세' },
    active: { src: '/silhouettes/balance_single.png', label: '한 발 서기' },
    rest: { src: '/silhouettes/balance_both.png', label: '준비 자세' },
  },
};

interface SilhouetteOverlayProps {
  exerciseType: ExerciseType;
  phase: ExercisePhase;
  opacity?: number; // 0~100
}

export function SilhouetteOverlay({ exerciseType, phase, opacity = 50 }: SilhouetteOverlayProps) {
  const config = SILHOUETTE_MAP[exerciseType]?.[phase];
  if (!config) return null;

  return (
    <img
      src={config.src}
      alt={config.label}
      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      style={{ opacity: opacity / 100 }}
      aria-hidden="true"
    />
  );
}
