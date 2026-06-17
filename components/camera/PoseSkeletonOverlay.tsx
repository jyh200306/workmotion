'use client';

// 실시간 사용자 스켈레톤 오버레이.
//
// MediaPipe 가 추정한 관절 좌표(0~1 정규화)를 카메라 영상 위에 그립니다.
// SilhouetteOverlay(고정 가이드 자세)와 별개로, "지금 내 몸"을 그리는 레이어입니다.
//
// ⚠️ 떨림 보정(EMA 스무딩)은 "그리기 직전"에만 적용합니다.
//    각도 계산·반복 카운트에 쓰는 원본 좌표(usePoseCounter 의 landmarks)는 손대지 않습니다.
//
// 좌표 정렬:
//   <video> 가 object-cover(비율 유지·넘침 잘림)로 표시되므로,
//   MediaPipe 의 0~1 좌표(영상 원본 기준)를 그대로 화면에 늘이면 몸과 어긋납니다.
//   그래서 object-cover 와 동일한 "꽉 채워 자르기" 변환을 직접 계산해 px 좌표로 그립니다.

import { useRef, useState, useLayoutEffect, type RefObject } from 'react';
import { LM, smoothLandmarks, type Landmark } from '@/lib/poseAnalysis';

// ── 캡슐(알약) 굵기 비율 (화면 짧은 변 대비) ────────────
// 절대 px 가 아니라 컨테이너 크기에 비례시켜, 화면이 작든 크든
// 또 카메라에 가깝든 멀든 화면을 덮지 않는 적정 두께가 되게 합니다.
const TORSO_R = 0.024; // 몸통(어깨~골반) — 가장 두껍게
const LIMB_R  = 0.018; // 팔·허벅지 등 일반 뼈대
const THIN_R  = 0.012; // 정강이·발 등 가는 부위
const JOINT_R = 0.022; // 관절 점 지름 — 뼈대보다 약간 크게 (자연스러운 비율)

// ── 그릴 뼈대 연결(랜드마크 인덱스 쌍 + 굵기비율) ──────
// BlazePose 인덱스 기준. 화면에 보이는 주요 관절만 연결합니다.
const BONES: { a: number; b: number; r: number }[] = [
  { a: LM.LEFT_SHOULDER,  b: LM.RIGHT_SHOULDER,   r: TORSO_R }, // 어깨선
  { a: LM.LEFT_HIP,       b: LM.RIGHT_HIP,        r: TORSO_R }, // 골반선
  { a: LM.LEFT_SHOULDER,  b: LM.LEFT_HIP,         r: TORSO_R }, // 왼쪽 몸통
  { a: LM.RIGHT_SHOULDER, b: LM.RIGHT_HIP,        r: TORSO_R }, // 오른쪽 몸통
  { a: LM.LEFT_HIP,       b: LM.LEFT_KNEE,        r: LIMB_R  }, // 왼 허벅지
  { a: LM.LEFT_KNEE,      b: LM.LEFT_ANKLE,       r: THIN_R  }, // 왼 정강이
  { a: LM.RIGHT_HIP,      b: LM.RIGHT_KNEE,       r: LIMB_R  }, // 오른 허벅지
  { a: LM.RIGHT_KNEE,     b: LM.RIGHT_ANKLE,      r: THIN_R  }, // 오른 정강이
  { a: LM.LEFT_ANKLE,     b: LM.LEFT_FOOT_INDEX,  r: THIN_R  }, // 왼발
  { a: LM.RIGHT_ANKLE,    b: LM.RIGHT_FOOT_INDEX, r: THIN_R  }, // 오른발
];

// 점으로 표시할 관절들
const JOINTS = [
  LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
  LM.LEFT_HIP, LM.RIGHT_HIP,
  LM.LEFT_KNEE, LM.RIGHT_KNEE,
  LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
];

export interface PoseSkeletonOverlayProps {
  /** usePoseCounter 가 내보내는 원본 좌표(0~1). null 이면 아무것도 그리지 않음 */
  landmarks: Landmark[] | null;
  /** 카메라 video 요소 — 영상 원본 비율(videoWidth/Height)을 읽어 정렬에 사용 */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** 자세가 정확할 때(true) 강조색, 아닐 때 안내색 */
  correctForm?: boolean;
  opacity?: number; // 0~100
}

export function PoseSkeletonOverlay({
  landmarks,
  videoRef,
  correctForm = true,
  opacity = 100,
}: PoseSkeletonOverlayProps) {
  // 직전 프레임의 "그리기용 보정 좌표"를 기억해 EMA 에 사용
  const prevRef = useRef<Landmark[] | null>(null);

  // 오버레이 컨테이너의 실제 화면 크기(px). object-cover 매핑·두께 계산에 사용
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 사람이 사라지면 EMA 기억 초기화 (다시 나타날 때 잔상 방지)
  if (!landmarks || landmarks.length === 0) {
    prevRef.current = null;
  }

  // 컨테이너 크기 측정 전이면 그리지 않음 (좌표 변환 불가)
  const ready = box.w > 0 && box.h > 0 && !!landmarks && landmarks.length > 0;

  // ── 그리기 직전 떨림 보정 (정규화 0~1 좌표에서) ──
  const drawLms = ready ? smoothLandmarks(prevRef.current, landmarks!) : null;
  if (drawLms) prevRef.current = drawLms;

  // ── object-cover 매핑: 0~1 정규화 → 화면 px ──
  // 영상 원본 비율을 런타임에 읽되, 메타데이터 로드 전이면 16:9 폴백.
  const vid = videoRef.current;
  const srcW = vid?.videoWidth || 16;
  const srcH = vid?.videoHeight || 9;
  const scale = Math.max(box.w / srcW, box.h / srcH); // cover: 더 크게 맞춰 꽉 채움
  const dispW = srcW * scale;
  const dispH = srcH * scale;
  const offX = (box.w - dispW) / 2; // 넘치는 만큼 가운데 기준으로 잘림
  const offY = (box.h - dispH) / 2;
  const toPx = (n: Landmark) => ({
    x: n.x * dispW + offX,
    y: n.y * dispH + offY,
  });

  const base = Math.min(box.w, box.h); // 두께 기준(짧은 변)
  const color = correctForm ? '#4d94ff' : '#ffb84d';

  return (
    <div
      ref={boxRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: opacity / 100 }}
      aria-hidden="true"
    >
      {/* 카메라가 좌우 반전(scale-x-[-1]) 이라 스켈레톤도 동일하게 반전.
          viewBox 를 컨테이너 px 와 1:1 로 맞춰 그리므로 좌표가 영상과 정렬됩니다. */}
      {drawLms && (
        <svg
          viewBox={`0 0 ${box.w} ${box.h}`}
          width={box.w}
          height={box.h}
          className="w-full h-full scale-x-[-1]"
          preserveAspectRatio="none"
        >
          {/* 뼈대: 두꺼운 선 + 둥근 끝 = 캡슐 모양 */}
          <g stroke={color} strokeLinecap="round" fill="none">
            {BONES.map(({ a, b, r }, i) => {
              const na = drawLms[a];
              const nb = drawLms[b];
              if (!na || !nb) return null;
              const pa = toPx(na);
              const pb = toPx(nb);
              return (
                <line
                  key={i}
                  x1={pa.x} y1={pa.y}
                  x2={pb.x} y2={pb.y}
                  strokeWidth={base * r}
                />
              );
            })}
          </g>

          {/* 관절: 둥근 점 */}
          <g fill={color} stroke="none">
            {JOINTS.map((j) => {
              const n = drawLms[j];
              if (!n) return null;
              const p = toPx(n);
              return <circle key={j} cx={p.x} cy={p.y} r={(base * JOINT_R) / 2} />;
            })}
          </g>
        </svg>
      )}
    </div>
  );
}
