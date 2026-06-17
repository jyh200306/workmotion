// 운동 자세 분석 로직 — WorkMotion MVP 4종목
//
// 임계값 단일 소스: thresholds.md/mvp.md (PM 정연호, v0.1)
//   - 종목: 스쿼트 · 데드리프트 · 런지 · 힙힌지
//   - 각도: atan2(y3-y2,x3-x2) - atan2(y1-y2,x1-x2) → degrees
//   - 카운팅: DOWN +0.5 / UP +0.5 → 합산 1회
//   - 프레임 경고: 주요 랜드마크 visibility < 0.7 시 운동 일시정지
//   - 시니어(60세+): senior_override 임계값 자동 적용
//
// MediaPipe Pose Landmarker(BlazePose) 랜드마크 인덱스는 Python 버전과 동일.

import { ExerciseType } from '@/types';

// ── BlazePose 랜드마크 인덱스 ─────────────────────────────
export const LM = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
} as const;

// 프레임 경고: 이 랜드마크들이 잘 보여야 운동 진행 (mvp.md FRAME_WARNING)
const WATCH_LANDMARKS = [11, 12, 23, 24, 25, 26];
const VISIBILITY_THRESHOLD = 0.7;

// ── 좌표 타입 (MediaPipe NormalizedLandmark 일부) ─────────
export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * 세 랜드마크 p1-p2-p3 가 이루는 각도(도). p2가 꼭짓점.
 * mvp.md 의 atan2 공식과 동일.
 */
export function findAngle(p1: Landmark, p2: Landmark, p3: Landmark): number {
  let angle =
    (Math.atan2(p3.y - p2.y, p3.x - p2.x) -
      Math.atan2(p1.y - p2.y, p1.x - p2.x)) *
    (180 / Math.PI);
  if (angle < 0) angle += 360;
  if (angle > 180) angle = 360 - angle; // 0~180 으로 정규화
  return angle;
}

// ── 화면 그리기 전용: 떨림 보정(EMA 저역통과 필터) ─────────
//
// MediaPipe 좌표는 프레임마다 미세하게 흔들립니다(노이즈).
// 화면에 "그리는 좌표"에만 지수이동평균(EMA)을 적용해 떨림을 줄입니다.
//   smoothed = prev * (1 - alpha) + now * alpha
// alpha 가 작을수록 더 부드럽지만(과거 비중↑) 반응이 느려지고,
// alpha 가 클수록 즉각 반응하지만 떨림이 덜 걸러집니다.
//
// ⚠️ 이 함수의 결과는 오직 "그리기용"입니다.
//    각도 계산·임계값 판정에는 원본 lms 를 그대로 써야 합니다.

/** EMA 스무딩 강도. 0~1, 작을수록 더 부드럽고 느림. (조정 가능 변수) */
export const SKELETON_SMOOTHING_ALPHA = 0.4;

/**
 * 직전 보정 좌표(prev)와 새 원본 좌표(now)를 EMA 로 섞어 떨림을 줄인 좌표를 반환.
 * prev 가 없으면(첫 프레임) now 를 그대로 반환합니다.
 * x, y, z, visibility 를 모두 보존하며 위치값만 평활화합니다.
 */
export function smoothLandmarks(
  prev: Landmark[] | null,
  now: Landmark[],
  alpha: number = SKELETON_SMOOTHING_ALPHA,
): Landmark[] {
  if (!prev || prev.length !== now.length) return now;
  const a = Math.max(0, Math.min(1, alpha));
  return now.map((cur, i) => {
    const p = prev[i];
    return {
      ...cur,
      x: p.x * (1 - a) + cur.x * a,
      y: p.y * (1 - a) + cur.y * a,
      z: p.z !== undefined && cur.z !== undefined ? p.z * (1 - a) + cur.z * a : cur.z,
    };
  });
}

/** np.interp 대응: value 를 [inMin,inMax] → [outMin,outMax] 로 선형 매핑(클램프). */
export function interp(
  value: number,
  [inMin, inMax]: [number, number],
  [outMin, outMax]: [number, number],
): number {
  if (inMax === inMin) return outMin;
  const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}

/** 주요 랜드마크가 충분히 보이는지 (mvp.md visibility < 0.7 → 경고) */
export function isFrameVisible(lms: Landmark[]): boolean {
  return WATCH_LANDMARKS.every(i => (lms[i]?.visibility ?? 1) >= VISIBILITY_THRESHOLD);
}

// ── 운동별 분석 결과 ──────────────────────────────────────
export interface PoseAnalysis {
  progress: number;       // 0~100, 진행도 바
  correctForm: boolean;   // 자세 기준 만족 여부
  feedback: string;       // 한국어 피드백
  /** 내려간 끝점이면 'down', 올라온 끝점이면 'up' */
  endpoint: 'up' | 'down' | null;
}

/**
 * 운동 종류별 분석. isSenior=true 면 senior_override 임계값 적용.
 */
export function analyzePose(
  exercise: ExerciseType,
  lms: Landmark[],
  isSenior = false,
): PoseAnalysis {
  switch (exercise) {
    case 'squat':     return analyzeSquat(lms, isSenior);
    case 'deadlift':  return analyzeDeadlift(lms);
    case 'lunge':     return analyzeLunge(lms, isSenior);
    case 'hip_hinge': return analyzeHipHinge(lms, isSenior);
  }
}

// ── 1. 스쿼트 (mvp.md §1) ─────────────────────────────────
// primary 23-25-27(무릎), secondary 11-23-25(척추)
function analyzeSquat(lms: Landmark[], senior: boolean): PoseAnalysis {
  const knee = findAngle(lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE], lms[LM.RIGHT_ANKLE]);
  const hip  = findAngle(lms[LM.RIGHT_SHOULDER], lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE]);

  const downKneeMax = senior ? 110 : 90;   // senior_override
  const hipBelow    = senior ? 125 : 140;  // 허리 굽힘 감지

  const progress = interp(knee, [downKneeMax, 160], [100, 0]);

  if (hip < hipBelow)
    return { progress, correctForm: false, feedback: '허리를 펴세요 — 등이 굽혀졌습니다', endpoint: null };
  if (knee < downKneeMax && hip > 140)
    return { progress, correctForm: true, feedback: '좋아요!', endpoint: 'down' };
  if (knee > 160)
    return { progress, correctForm: true, feedback: '바르게 섰어요', endpoint: 'up' };
  return { progress, correctForm: true, feedback: '천천히 앉아주세요', endpoint: null };
}

// ── 2. 데드리프트 (mvp.md §2, 시니어 완화 없음) ───────────
// primary 11-23-25(엉덩이), secondary 23-25-27(무릎)
function analyzeDeadlift(lms: Landmark[]): PoseAnalysis {
  const hip  = findAngle(lms[LM.RIGHT_SHOULDER], lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE]);
  const knee = findAngle(lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE], lms[LM.RIGHT_ANKLE]);

  // progress 역방향: 숙일수록 100%
  const progress = interp(hip, [60, 170], [100, 0]);

  if (knee < 140)
    return { progress, correctForm: false, feedback: '무릎을 펴세요 — 스쿼트가 아닌 데드리프트입니다', endpoint: null };
  if (hip < 70 && knee > 150)
    return { progress, correctForm: true, feedback: '좋아요!', endpoint: 'down' };
  if (hip > 160 && knee > 160)
    return { progress, correctForm: true, feedback: '바르게 섰어요', endpoint: 'up' };
  return { progress, correctForm: true, feedback: '엉덩이를 뒤로 빼며 숙이세요', endpoint: null };
}

// ── 3. 런지 (mvp.md §3) ───────────────────────────────────
// 앞다리 자동 판별: front_is_left = lm[27].x < lm[28].x
function analyzeLunge(lms: Landmark[], senior: boolean): PoseAnalysis {
  const leftKnee  = findAngle(lms[LM.LEFT_HIP],  lms[LM.LEFT_KNEE],  lms[LM.LEFT_ANKLE]);
  const rightKnee = findAngle(lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE], lms[LM.RIGHT_ANKLE]);

  const frontIsLeft = lms[LM.LEFT_ANKLE].x < lms[LM.RIGHT_ANKLE].x;
  const frontKnee = frontIsLeft ? leftKnee  : rightKnee;
  const backKnee  = frontIsLeft ? rightKnee : leftKnee;

  const downFrontMax = senior ? 115 : 100;  // senior_override
  const downBackMax  = senior ? 120 : 105;

  const progress = interp(frontKnee, [downFrontMax, 170], [100, 0]);

  if (frontKnee < 80)
    return { progress, correctForm: false, feedback: '앞 무릎이 발끝보다 앞으로 나왔습니다', endpoint: null };
  if (frontKnee < downFrontMax && backKnee < downBackMax)
    return { progress, correctForm: true, feedback: '좋아요!', endpoint: 'down' };
  if (frontKnee > 160)
    return { progress, correctForm: true, feedback: '바르게 섰어요', endpoint: 'up' };
  return { progress, correctForm: true, feedback: '천천히 내려가세요', endpoint: null };
}

// ── 4. 힙 힌지 (mvp.md §4) ────────────────────────────────
// primary 11-23-25(엉덩이), secondary 23-25-27(무릎 고정)
function analyzeHipHinge(lms: Landmark[], senior: boolean): PoseAnalysis {
  const hip  = findAngle(lms[LM.RIGHT_SHOULDER], lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE]);
  const knee = findAngle(lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE], lms[LM.RIGHT_ANKLE]);

  const targetMin = senior ? 60 : 45;   // senior_override
  const targetMax = senior ? 75 : 70;

  // progress 역방향: 숙일수록 100%
  const progress = interp(hip, [targetMin, 175], [100, 0]);

  if (knee < 150)
    return { progress, correctForm: false, feedback: '무릎을 펴세요 — 힙힌지는 무릎을 고정합니다', endpoint: null };
  if (hip < targetMin)
    return { progress, correctForm: false, feedback: '너무 많이 숙였습니다 — 허리에 무리가 올 수 있습니다', endpoint: null };
  if (hip >= targetMin && hip <= targetMax)
    return { progress, correctForm: true, feedback: '좋아요!', endpoint: 'down' };
  if (hip > 170)
    return { progress, correctForm: true, feedback: '바르게 섰어요', endpoint: 'up' };
  return { progress, correctForm: true, feedback: '엉덩이를 뒤로 빼며 숙이세요', endpoint: null };
}

// ── 반복 카운터 (DOWN +0.5 / UP +0.5 → 1회) ───────────────
// down 끝점 도달 → up 끝점 도달 시 1회 완성.
export class RepCounter {
  private dir: 'up' | 'down' = 'up';

  /** 분석 결과의 endpoint 를 받아 반복이 완성되면 true 반환 */
  update(endpoint: 'up' | 'down' | null): boolean {
    if (endpoint === 'down' && this.dir === 'up') {
      this.dir = 'down';
    } else if (endpoint === 'up' && this.dir === 'down') {
      this.dir = 'up';
      return true; // down → up 복귀 시 1회 완성
    }
    return false;
  }

  reset() {
    this.dir = 'up';
  }
}
