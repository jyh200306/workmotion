'use client';

import { useEffect, useRef, useState } from 'react';
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
  /** 측면(옆모습) 자세인지 — true 면 "측면을 보세요" 안내를 함께 표시 */
  side?: boolean;
}

// ── 6가지 자세 정의 (viewBox 0 0 100 175) ──────────────
const POSES: Record<string, Pose> = {

  /** 기본 서있는 자세 (정면) — 팔 자연스럽게 몸 옆으로 내림 */
  standing: {
    head: [50, 15],
    neck:       [[50,24],[50,31]],
    torso:      [[50,31],[50,77]],
    armUpperL:  [[38,32],[31,60]], armLowerL: [[31,60],[30,88]],
    armUpperR:  [[62,32],[69,60]], armLowerR: [[69,60],[70,88]],
    legUpperL:  [[44,78],[42,118]], legLowerL: [[42,118],[43,158]],
    legUpperR:  [[56,78],[58,118]], legLowerR: [[58,118],[57,158]],
    footL: [[35,161],[49,161]], footR: [[51,161],[65,161]],
    label: '시작 자세',
  },

  /** 스쿼트 (정면) — 허벅지 수평까지 앉음, 무릎은 발끝 방향으로, 팔은 앞으로 나란히 */
  squat: {
    head: [50, 44],
    neck:       [[50,53],[50,60]],
    torso:      [[50,60],[50,98]],            // 상체 살짝만 앞으로 (등은 곧게)
    // 팔 앞으로 나란히 (정면이라 좌우로 약간 벌려 표현)
    armUpperL:  [[40,63],[33,84]], armLowerL: [[33,84],[34,104]],
    armUpperR:  [[60,63],[67,84]], armLowerR: [[67,84],[66,104]],
    // 허벅지: 엉덩이→무릎이 거의 수평(앉은 깊이), 정강이는 거의 수직(무릎이 발 위)
    legUpperL:  [[44,100],[32,124]], legLowerL: [[32,124],[34,160]],
    legUpperR:  [[56,100],[68,124]], legLowerR: [[68,124],[66,160]],
    footL: [[27,163],[43,163]], footR: [[57,163],[73,163]],
    label: '스쿼트 자세',
  },

  /** 데드리프트 (측면) — 무릎 살짝 굽힌 채 엉덩이 뒤로 빼고 상체를 깊게 숙여 바닥 향함 */
  deadlift: {
    head: [70, 52],                           // 머리: 앞(오른쪽 아래)을 바라봄
    neck:       [[62,52],[56,57]],
    torso:      [[56,57],[34,72]],            // 어깨→엉덩이, 상체 깊게(약 70°) 숙임
    // 양팔 수직으로 늘어뜨려 바닥 향함 (옆모습이라 겹침 — 살짝 어긋나게)
    armUpperL:  [[55,60],[57,90]], armLowerL: [[57,90],[58,120]],
    armUpperR:  [[57,59],[59,90]], armLowerR: [[59,90],[60,120]],
    // 엉덩이는 뒤(왼쪽)로 빠지고, 다리는 거의 수직(무릎 살짝만 굽힘)
    legUpperL:  [[34,74],[33,116]], legLowerL: [[33,116],[37,158]],
    legUpperR:  [[36,74],[35,116]], legLowerR: [[35,116],[39,158]],
    footL: [[31,161],[52,161]], footR: [[33,161],[54,161]], // 발: 옆모습 → 앞으로 길게
    label: '데드리프트 자세',
    side: true,
  },

  /** 런지 (측면) — 상체 직립, 앞다리(오른쪽) 무릎 약 90°(정강이 수직), 뒷다리(왼쪽) 뒤로 뻗어 무릎 내리고 발뒤꿈치 들림 */
  lunge: {
    head: [46, 28],                           // 머리: 앞(오른쪽)을 살짝 바라봄
    neck:       [[47,37],[48,44]],
    torso:      [[48,44],[50,88]],            // 상체 곧게 세움(거의 직립)
    // 팔: 측면이라 한 팔(앞)은 앞으로, 다른 팔은 뒤로 자연스럽게
    armUpperR:  [[50,47],[57,70]], armLowerR: [[57,70],[55,92]],   // 앞쪽 팔
    armUpperL:  [[48,47],[42,70]], armLowerL: [[42,70],[44,92]],   // 뒤쪽 팔
    // 앞다리(오른쪽): 엉덩이→무릎 앞으로, 정강이 수직, 무릎 약 90°
    legUpperR:  [[52,90],[68,122]], legLowerR: [[68,122],[68,158]],
    footR: [[62,161],[82,161]],               // 앞발: 앞쪽, 발바닥 디딤
    // 뒷다리(왼쪽): 엉덩이에서 뒤로 길게 뻗고 무릎이 바닥 가까이 내려감, 정강이는 무릎→발끝(앞쪽 아래)
    legUpperL:  [[49,90],[26,126]], legLowerL: [[26,126],[34,158]],
    footL: [[30,160],[44,162]],               // 뒷발: 발뒤꿈치 들려 발끝(앞쪽)으로 디딤
    label: '런지 자세',
    side: true,
  },

  /** 힙힌지 (측면) — 무릎 고정(거의 폄), 엉덩이 뒤로 빼고 상체 약 45° 숙임 (데드리프트보다 덜 숙임) */
  hip_hinge: {
    head: [66, 40],                           // 머리: 앞(오른쪽)을 바라봄, 상체보다 덜 숙임
    neck:       [[59,42],[53,46]],
    torso:      [[53,46],[38,72]],            // 어깨→엉덩이, 상체 약 45° 숙임 (덜 깊음)
    // 팔은 가슴 앞으로 가볍게 모음 (옆모습)
    armUpperL:  [[51,50],[55,72]], armLowerL: [[55,72],[57,94]],
    armUpperR:  [[53,49],[57,72]], armLowerR: [[57,72],[59,94]],
    // 엉덩이 뒤(왼쪽)로 빠지고 다리는 곧게(무릎 고정)
    legUpperL:  [[38,74],[37,116]], legLowerL: [[37,116],[40,158]],
    legUpperR:  [[40,74],[39,116]], legLowerR: [[39,116],[42,158]],
    footL: [[34,161],[55,161]], footR: [[36,161],[57,161]], // 발: 옆모습 → 앞으로 길게
    label: '힙힌지 자세',
    side: true,
  },
};

// ── 운동 종류 × 단계 → 자세 이름 매핑 ─────────────────
const POSE_MAP: Record<ExerciseType, Record<ExercisePhase, string>> = {
  squat:     { ready: 'standing', active: 'squat',     rest: 'standing' },
  deadlift:  { ready: 'standing', active: 'deadlift',  rest: 'standing' },
  lunge:     { ready: 'standing', active: 'lunge',     rest: 'standing' },
  hip_hinge: { ready: 'standing', active: 'hip_hinge', rest: 'standing' },
};

// ── 두 자세 사이 보간(애니메이션용) ───────────────────
// from→to 를 t(0~1) 만큼 섞은 중간 자세를 만듭니다.
// 모든 좌표를 선형보간(lerp)하고, label/side 는 도착 자세(to) 기준으로 둡니다.
function lerpN(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
function lerpP(a: P, b: P, t: number): P {
  return [lerpN(a[0], b[0], t), lerpN(a[1], b[1], t)];
}
function lerpL(a: Limb, b: Limb, t: number): Limb {
  return [lerpP(a[0], b[0], t), lerpP(a[1], b[1], t)];
}
function lerpPose(from: Pose, to: Pose, t: number): Pose {
  return {
    head:      lerpP(from.head, to.head, t),
    neck:      lerpL(from.neck, to.neck, t),
    torso:     lerpL(from.torso, to.torso, t),
    armUpperL: lerpL(from.armUpperL, to.armUpperL, t), armLowerL: lerpL(from.armLowerL, to.armLowerL, t),
    armUpperR: lerpL(from.armUpperR, to.armUpperR, t), armLowerR: lerpL(from.armLowerR, to.armLowerR, t),
    legUpperL: lerpL(from.legUpperL, to.legUpperL, t), legLowerL: lerpL(from.legLowerL, to.legLowerL, t),
    legUpperR: lerpL(from.legUpperR, to.legUpperR, t), legLowerR: lerpL(from.legLowerR, to.legLowerR, t),
    footL:     lerpL(from.footL, to.footL, t), footR: lerpL(from.footR, to.footR, t),
    label:     to.label,
    side:      to.side,
  };
}

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

// 자세 왕복 애니메이션 1회 주기(ms). 작을수록 빠르게 움직입니다.
const ANIM_PERIOD_MS = 2600;

export function SilhouetteOverlay({
  exerciseType,
  phase,
  opacity = 70,
}: SilhouetteOverlayProps) {
  const key  = POSE_MAP[exerciseType]?.[phase];
  const basePose = POSES[key];

  // 운동 중(active)일 때만 시작자세(standing) ↔ 목표자세 를 왕복 애니메이션.
  // 그 외(ready/rest)는 정적. 시작자세와 목표자세가 같으면 애니메이션 불필요.
  const animate = phase === 'active' && key !== 'standing' && !!POSES.standing && !!basePose;

  // rAF 로 진행도 t(0~1)를 핑퐁(사인 ease)으로 갱신
  const [t, setT] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!animate) { setT(0); return; }
    const tick = () => {
      // (sin+1)/2 → 0↔1 부드럽게 왕복(ease in/out)
      setT((Math.sin((performance.now() / ANIM_PERIOD_MS) * Math.PI * 2) + 1) / 2);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [animate]);

  if (!basePose) return null;

  // 애니메이션 중이면 보간 자세, 아니면 정적 자세
  const pose = animate ? lerpPose(POSES.standing, basePose, t) : basePose;

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

      {/* 자세 레이블 (하단) — 화면을 가리지 않게 작게 하나만.
          측면 자세면 "측면을 보세요"만 간결히 안내(자세명은 생략해 길이 최소화). */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className="bg-black/45 text-white/90 text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm">
          {pose.side ? '측면을 보세요' : pose.label}
        </span>
      </div>
    </div>
  );
}
