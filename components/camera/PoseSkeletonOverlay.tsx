'use client';

// 실시간 사용자 스켈레톤 오버레이.
//
// MediaPipe 가 추정한 관절 좌표(0~1 정규화)를 카메라 영상 위에 그립니다.
// SilhouetteOverlay(고정 가이드 자세)와 별개로, "지금 내 몸"을 그리는 레이어입니다.
//
// ⚠️ 떨림 보정(EMA 스무딩)은 "그리기 직전"에만 적용합니다.
//    각도 계산·반복 카운트에 쓰는 원본 좌표(usePoseCounter 의 landmarks)는 손대지 않습니다.

import { useRef } from 'react';
import { LM, smoothLandmarks, type Landmark } from '@/lib/poseAnalysis';

// ── 캡슐(알약) 굵기 기준값 (화면 px 단위) ──────────────
// viewBox 는 0~1 정규화이고 화면 비율에 맞춰 늘어나므로(preserveAspectRatio="none"),
// 선 두께를 viewBox 단위로 주면 가로/세로로 다르게 늘어나 캡슐이 찌그러집니다.
// 그래서 vector-effect="non-scaling-stroke" 로 두께를 "화면 px" 로 고정합니다.
// strokeLinecap="round" + 두꺼운 선 = 양 끝이 둥근 "캡슐" 모양.
const LIMB_W  = 22; // 팔·다리 등 일반 뼈대
const TORSO_W = 32; // 몸통(어깨~골반) — 더 두껍게
const THIN_W  = 15; // 정강이·발 등 가는 부위
const JOINT_W = 30; // 관절 점 지름 — 뼈대보다 약간 크게 (자연스러운 비율)

// ── 그릴 뼈대 연결(랜드마크 인덱스 쌍 + 굵기) ──────────
// BlazePose 인덱스 기준. 화면에 보이는 주요 관절만 연결합니다.
const BONES: { a: number; b: number; w: number }[] = [
  { a: LM.LEFT_SHOULDER,  b: LM.RIGHT_SHOULDER,   w: TORSO_W }, // 어깨선
  { a: LM.LEFT_HIP,       b: LM.RIGHT_HIP,        w: TORSO_W }, // 골반선
  { a: LM.LEFT_SHOULDER,  b: LM.LEFT_HIP,         w: TORSO_W }, // 왼쪽 몸통
  { a: LM.RIGHT_SHOULDER, b: LM.RIGHT_HIP,        w: TORSO_W }, // 오른쪽 몸통
  { a: LM.LEFT_HIP,       b: LM.LEFT_KNEE,        w: LIMB_W  }, // 왼 허벅지
  { a: LM.LEFT_KNEE,      b: LM.LEFT_ANKLE,       w: THIN_W  }, // 왼 정강이
  { a: LM.RIGHT_HIP,      b: LM.RIGHT_KNEE,       w: LIMB_W  }, // 오른 허벅지
  { a: LM.RIGHT_KNEE,     b: LM.RIGHT_ANKLE,      w: THIN_W  }, // 오른 정강이
  { a: LM.LEFT_ANKLE,     b: LM.LEFT_FOOT_INDEX,  w: THIN_W  }, // 왼발
  { a: LM.RIGHT_ANKLE,    b: LM.RIGHT_FOOT_INDEX, w: THIN_W  }, // 오른발
];

// 점으로 표시할 관절들
const JOINTS = [
  LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
  LM.LEFT_HIP, LM.RIGHT_HIP,
  LM.LEFT_KNEE, LM.RIGHT_KNEE,
  LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
];

export interface PoseSkeletonOverlayProps {
  /** usePoseCounter 가 내보내는 원본 좌표. null 이면 아무것도 그리지 않음 */
  landmarks: Landmark[] | null;
  /** 자세가 정확할 때(true) 강조색, 아닐 때 안내색 */
  correctForm?: boolean;
  opacity?: number; // 0~100
}

export function PoseSkeletonOverlay({
  landmarks,
  correctForm = true,
  opacity = 100,
}: PoseSkeletonOverlayProps) {
  // 직전 프레임의 "그리기용 보정 좌표"를 기억해 EMA 에 사용
  const prevRef = useRef<Landmark[] | null>(null);

  if (!landmarks || landmarks.length === 0) {
    prevRef.current = null; // 사람이 사라지면 기억 초기화 (다시 나타날 때 잔상 방지)
    return null;
  }

  // ── 그리기 직전 떨림 보정 ──
  const drawLms = smoothLandmarks(prevRef.current, landmarks);
  prevRef.current = drawLms;

  const color = correctForm ? '#4d94ff' : '#ffb84d';

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: opacity / 100 }}
      aria-hidden="true"
    >
      {/* 카메라가 좌우 반전(scale-x-[-1]) 이라 스켈레톤도 동일하게 반전 */}
      <svg
        viewBox="0 0 1 1"
        className="w-full h-full scale-x-[-1]"
        preserveAspectRatio="none"
      >
        {/* 뼈대: 두꺼운 선 + 둥근 끝 = 캡슐 모양 */}
        <g
          stroke={color}
          strokeLinecap="round"
          fill="none"
          vectorEffect="non-scaling-stroke"
        >
          {BONES.map(({ a, b, w }, i) => {
            const pa = drawLms[a];
            const pb = drawLms[b];
            if (!pa || !pb) return null;
            return (
              <line
                key={i}
                x1={pa.x} y1={pa.y}
                x2={pb.x} y2={pb.y}
                strokeWidth={w}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </g>

        {/* 관절: 길이 0 인 캡슐(둥근 끝 점) — px 단위라 찌그러지지 않는 원 */}
        <g
          stroke={color}
          strokeLinecap="round"
          strokeWidth={JOINT_W}
          vectorEffect="non-scaling-stroke"
        >
          {JOINTS.map((j) => {
            const p = drawLms[j];
            if (!p) return null;
            return (
              <line
                key={j}
                x1={p.x} y1={p.y}
                x2={p.x} y2={p.y}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
