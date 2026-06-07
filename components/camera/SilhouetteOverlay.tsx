'use client';

import { ExerciseType, ExercisePhase } from '@/types';

// ── 좌표 타입 ──────────────────────────────────────────
type P = [number, number];
type Limb = [P, P];

interface Pose {
  head: P;
  neck: Limb;
  torso: Limb;
  armUpperL: Limb; armLowerL: Limb;
  armUpperR: Limb; armLowerR: Limb;
  legUpperL: Limb; legLowerL: Limb;
  legUpperR: Limb; legLowerR: Limb;
  footL: Limb; footR: Limb;
  label: string;
}

// ── 6가지 자세 정의 (viewBox 0 0 100 175) ──────────────
const POSES: Record<string, Pose> = {

  /** 기본 서있는 자세 */
  standing: {
    head: [50, 15],
    neck:       [[50,24],[50,31]],
    torso:      [[50,31],[50,77]],
    armUpperL:  [[37,31],[22,62]], armLowerL: [[22,62],[27,93]],
    armUpperR:  [[63,31],[78,62]], armLowerR: [[78,62],[73,93]],
    legUpperL:  [[41,78],[39,118]], legLowerL: [[39,118],[41,158]],
    legUpperR:  [[59,78],[61,118]], legLowerR: [[61,118],[59,158]],
    footL: [[33,161],[49,161]], footR: [[51,161],[67,161]],
    label: '시작 자세',
  },

  /** 스쿼트 — 무릎 구부림, 몸 낮춤 */
  squat: {
    head: [50, 44],
    neck:       [[50,53],[50,60]],
    torso:      [[50,60],[50,100]],
    armUpperL:  [[37,61],[20,90]], armLowerL: [[20,90],[18,118]],
    armUpperR:  [[63,61],[80,90]], armLowerR: [[80,90],[82,118]],
    legUpperL:  [[41,101],[18,133]], legLowerL: [[18,133],[36,163]],
    legUpperR:  [[59,101],[82,133]], legLowerR: [[82,133],[64,163]],
    footL: [[26,166],[44,166]], footR: [[56,166],[74,166]],
    label: '스쿼트 자세',
  },

  /** 한발 들기 — 왼발 발뒤꿈치 올리기, 오른발 뒤로 들기 */
  calf_single: {
    head: [50, 15],
    neck:       [[50,24],[50,31]],
    torso:      [[50,31],[50,77]],
    armUpperL:  [[37,31],[22,62]], armLowerL: [[22,62],[27,93]],
    armUpperR:  [[63,31],[78,62]], armLowerR: [[78,62],[73,93]],
    legUpperL:  [[41,78],[39,118]], legLowerL: [[39,118],[37,155]],
    legUpperR:  [[59,78],[67,115]], legLowerR: [[67,115],[57,148]],
    footL: [[30,155],[37,155]], footR: [[50,148],[60,152]],
    label: '한발 들기',
  },

  /** 팔 준비 — 골포스트 자세 (팔꿈치 어깨 높이, 전완 위로) */
  push_ready: {
    head: [50, 15],
    neck:       [[50,24],[50,31]],
    torso:      [[50,31],[50,77]],
    armUpperL:  [[37,31],[11,31]], armLowerL: [[11,31],[11,11]],
    armUpperR:  [[63,31],[89,31]], armLowerR: [[89,31],[89,11]],
    legUpperL:  [[41,78],[39,118]], legLowerL: [[39,118],[41,158]],
    legUpperR:  [[59,78],[61,118]], legLowerR: [[61,118],[59,158]],
    footL: [[33,161],[49,161]], footR: [[51,161],[67,161]],
    label: '팔 준비',
  },

  /** 팔 펴기 — 양팔 수평으로 완전히 펴기 */
  push_extend: {
    head: [50, 15],
    neck:       [[50,24],[50,31]],
    torso:      [[50,31],[50,77]],
    armUpperL:  [[37,31],[20,31]], armLowerL: [[20,31],[3,31]],
    armUpperR:  [[63,31],[80,31]], armLowerR: [[80,31],[97,31]],
    legUpperL:  [[41,78],[39,118]], legLowerL: [[39,118],[41,158]],
    legUpperR:  [[59,78],[61,118]], legLowerR: [[61,118],[59,158]],
    footL: [[33,161],[49,161]], footR: [[51,161],[67,161]],
    label: '팔 펴기',
  },

  /** 한발 균형 — 한발 들고 균형 잡기, 팔 수평 */
  balance_single: {
    head: [50, 15],
    neck:       [[50,24],[50,31]],
    torso:      [[50,31],[50,77]],
    armUpperL:  [[37,31],[10,43]], armLowerL: [[10,43],[13,70]],
    armUpperR:  [[63,31],[90,43]], armLowerR: [[90,43],[87,70]],
    legUpperL:  [[41,78],[39,118]], legLowerL: [[39,118],[41,158]],
    legUpperR:  [[59,78],[80,108]], legLowerR: [[80,108],[68,143]],
    footL: [[33,161],[49,161]], footR: [[60,143],[72,147]],
    label: '한발 균형',
  },
};

// ── 운동 종류 × 단계 → 자세 이름 매핑 ─────────────────
const POSE_MAP: Record<ExerciseType, Record<ExercisePhase, string>> = {
  squat:   { ready: 'standing',   active: 'squat',          rest: 'standing'  },
  calf:    { ready: 'standing',   active: 'calf_single',    rest: 'standing'  },
  push:    { ready: 'push_ready', active: 'push_extend',    rest: 'push_ready'},
  balance: { ready: 'standing',   active: 'balance_single', rest: 'standing'  },
};

// ── 서브 컴포넌트 ──────────────────────────────────────
function Seg({ a, b, w }: { a: P; b: P; w: number }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w} />;
}
function Dot({ p }: { p: P }) {
  return <circle cx={p[0]} cy={p[1]} r={2.8} fill="#67E8F9" stroke="none" />;
}

// ── 메인 컴포넌트 ─────────────────────────────────────
export interface SilhouetteOverlayProps {
  exerciseType: ExerciseType;
  phase: ExercisePhase;
  opacity?: number; // 0~100
}

export function SilhouetteOverlay({
  exerciseType,
  phase,
  opacity = 70,
}: SilhouetteOverlayProps) {
  const key  = POSE_MAP[exerciseType]?.[phase];
  const pose = POSES[key];
  if (!pose) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: opacity / 100 }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 175"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* 시안 빛 글로우 */}
          <filter id="sg" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 점선 스켈레톤 ── */}
        <g
          filter="url(#sg)"
          stroke="#67E8F9"
          strokeDasharray="7 4"
          strokeLinecap="round"
          fill="none"
        >
          {/* 머리 */}
          <circle
            cx={pose.head[0]} cy={pose.head[1]} r={9}
            fill="rgba(103,232,249,0.08)"
            strokeWidth={2.5}
          />
          {/* 목 */}
          <Seg a={pose.neck[0]}       b={pose.neck[1]}       w={3} />
          {/* 몸통 */}
          <Seg a={pose.torso[0]}      b={pose.torso[1]}      w={7} />
          {/* 왼팔 */}
          <Seg a={pose.armUpperL[0]}  b={pose.armUpperL[1]}  w={4.5} />
          <Seg a={pose.armLowerL[0]}  b={pose.armLowerL[1]}  w={3.5} />
          {/* 오른팔 */}
          <Seg a={pose.armUpperR[0]}  b={pose.armUpperR[1]}  w={4.5} />
          <Seg a={pose.armLowerR[0]}  b={pose.armLowerR[1]}  w={3.5} />
          {/* 왼다리 */}
          <Seg a={pose.legUpperL[0]}  b={pose.legUpperL[1]}  w={5.5} />
          <Seg a={pose.legLowerL[0]}  b={pose.legLowerL[1]}  w={4.5} />
          {/* 오른다리 */}
          <Seg a={pose.legUpperR[0]}  b={pose.legUpperR[1]}  w={5.5} />
          <Seg a={pose.legLowerR[0]}  b={pose.legLowerR[1]}  w={4.5} />
          {/* 발 */}
          <Seg a={pose.footL[0]}      b={pose.footL[1]}      w={3.5} />
          <Seg a={pose.footR[0]}      b={pose.footR[1]}      w={3.5} />
        </g>

        {/* ── 관절 점 ── */}
        <g filter="url(#sg)">
          <Dot p={pose.neck[0]} />
          <Dot p={pose.armUpperL[0]} /> <Dot p={pose.armUpperL[1]} />
          <Dot p={pose.armUpperR[0]} /> <Dot p={pose.armUpperR[1]} />
          <Dot p={pose.torso[1]} />
          <Dot p={pose.legUpperL[0]} /> <Dot p={pose.legUpperL[1]} />
          <Dot p={pose.legUpperR[0]} /> <Dot p={pose.legUpperR[1]} />
          <Dot p={pose.legLowerL[1]} />
          <Dot p={pose.legLowerR[1]} />
        </g>
      </svg>

      {/* 자세 레이블 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="bg-black/50 text-cyan-300 text-xl font-bold px-4 py-1.5 rounded-full backdrop-blur-sm">
          {pose.label}
        </span>
      </div>
    </div>
  );
}
