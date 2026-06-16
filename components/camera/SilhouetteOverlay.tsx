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

  /** 데드리프트 — 무릎 거의 핀 채 상체를 깊게 숙여 바닥의 바벨 잡기 */
  deadlift: {
    head: [33, 40],
    neck:       [[36,46],[42,52]],
    torso:      [[42,52],[55,86]],            // 상체 깊게 숙임
    armUpperL:  [[44,55],[44,92]], armLowerL: [[44,92],[44,120]],   // 팔 수직으로 내림
    armUpperR:  [[50,57],[50,92]], armLowerR: [[50,92],[50,120]],
    legUpperL:  [[55,88],[52,122]], legLowerL: [[52,122],[50,158]], // 다리 거의 핌
    legUpperR:  [[60,88],[58,122]], legLowerR: [[58,122],[56,158]],
    footL: [[44,161],[58,161]], footR: [[46,161],[60,161]],
    label: '데드리프트 자세',
  },

  /** 런지 — 앞다리 굽히고 뒷다리 뒤로 뻗기 */
  lunge: {
    head: [50, 28],
    neck:       [[50,37],[50,44]],
    torso:      [[50,44],[50,86]],            // 상체 직립
    armUpperL:  [[40,46],[34,72]], armLowerL: [[34,72],[36,96]],
    armUpperR:  [[60,46],[66,72]], armLowerR: [[66,72],[64,96]],
    legUpperL:  [[46,88],[34,118]], legLowerL: [[34,118],[34,156]], // 앞다리(굽힘)
    legUpperR:  [[54,88],[74,116]], legLowerR: [[74,116],[88,150]], // 뒷다리(뒤로 뻗음)
    footL: [[28,159],[42,159]], footR: [[82,150],[96,154]],
    label: '런지 자세',
  },

  /** 힙힌지 — 무릎 고정, 엉덩이 뒤로 빼고 상체 45~70° 숙임 (데드리프트보다 덜 숙임) */
  hip_hinge: {
    head: [36, 30],
    neck:       [[39,37],[44,43]],
    torso:      [[44,43],[56,74]],            // 상체 중간 정도 숙임
    armUpperL:  [[47,47],[47,80]], armLowerL: [[47,80],[47,108]],
    armUpperR:  [[53,49],[53,80]], armLowerR: [[53,80],[53,108]],
    legUpperL:  [[56,76],[55,118]], legLowerL: [[55,118],[54,158]], // 다리 핌(무릎 고정)
    legUpperR:  [[61,76],[61,118]], legLowerR: [[61,118],[60,158]],
    footL: [[48,161],[62,161]], footR: [[50,161],[64,161]],
    label: '힙힌지 자세',
  },
};

// ── 운동 종류 × 단계 → 자세 이름 매핑 ─────────────────
const POSE_MAP: Record<ExerciseType, Record<ExercisePhase, string>> = {
  squat:     { ready: 'standing', active: 'squat',     rest: 'standing' },
  deadlift:  { ready: 'standing', active: 'deadlift',  rest: 'standing' },
  lunge:     { ready: 'standing', active: 'lunge',     rest: 'standing' },
  hip_hinge: { ready: 'standing', active: 'hip_hinge', rest: 'standing' },
};

// ── 서브 컴포넌트 ──────────────────────────────────────
function Seg({ a, b, w }: { a: P; b: P; w: number }) {
  return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w} />;
}
function Dot({ p }: { p: P }) {
  return <circle cx={p[0]} cy={p[1]} r={2.8} fill="#4d94ff" stroke="none" />;
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
          stroke="#4d94ff"
          strokeDasharray="7 4"
          strokeLinecap="round"
          fill="none"
        >
          {/* 머리 */}
          <circle
            cx={pose.head[0]} cy={pose.head[1]} r={9}
            fill="rgba(77,148,255,0.08)"
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
        <span className="bg-black/50 text-[#4d94ff] text-xl font-bold px-4 py-1.5 rounded-full backdrop-blur-sm">
          {pose.label}
        </span>
      </div>
    </div>
  );
}
