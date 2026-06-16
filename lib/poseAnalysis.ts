// 운동 자세 분석 로직
//
// rushmash91/Exercise-Counter (Python + OpenCV + MediaPipe) 의 핵심 알고리즘을
// 브라우저용으로 포팅한 것입니다.
//   - findAngle:  관절 3점 사이 각도 (atan2 기반)
//   - interp:     각도 구간 → 0~100% 진행도 매핑 (np.interp 대응)
//   - RepCounter: 0%↔100% 방향 전환을 감지해 반복 1회를 카운트
//
// MediaPipe Pose Landmarker(BlazePose) 의 랜드마크 인덱스는 Python 버전과 동일합니다.

import { ExerciseType } from '@/types';

// ── MediaPipe BlazePose 랜드마크 인덱스 ───────────────────
export const LM = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
  LEFT_HEEL: 29, RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31, RIGHT_FOOT_INDEX: 32,
} as const;

// ── 좌표 타입 (MediaPipe NormalizedLandmark 일부) ─────────
export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * 세 랜드마크 p1-p2-p3 가 이루는 각도(도)를 계산합니다.
 * p2가 꼭짓점입니다. Exercise-Counter PoseModule.findAngle 과 동일한 공식.
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

// ── 운동별 분석 결과 ──────────────────────────────────────
export interface PoseAnalysis {
  progress: number;       // 0~100, 실루엣/막대 진행도
  correctForm: boolean;   // 자세가 기준을 만족하는가
  feedback: string;       // 한국어 피드백 문구
  /** 이번 프레임이 "내려간(아래)" 끝점이면 'down', "올라온(위)" 끝점이면 'up' */
  endpoint: 'up' | 'down' | null;
}

/**
 * 운동 종류별로 랜드마크에서 진행도·자세·끝점을 계산합니다.
 * 각 운동의 각도 기준은 Exercise-Counter 의 *_live.py 값을 시니어 운동에 맞게
 * 가동범위를 완화하여 조정했습니다.
 */
export function analyzePose(
  exercise: ExerciseType,
  lms: Landmark[],
): PoseAnalysis {
  switch (exercise) {
    case 'squat':   return analyzeSquat(lms);
    case 'push':    return analyzePush(lms);
    case 'calf':    return analyzeCalf(lms);
    case 'balance': return analyzeBalance(lms);
  }
}

// ── 스쿼트: 무릎 각도 기준 (SquatCounter_live.py) ─────────
function analyzeSquat(lms: Landmark[]): PoseAnalysis {
  const kneeAngle = findAngle(
    lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE], lms[LM.RIGHT_ANKLE],
  );
  const hipAngle = findAngle(
    lms[LM.RIGHT_SHOULDER], lms[LM.RIGHT_HIP], lms[LM.RIGHT_KNEE],
  );

  // 무릎 펴짐(서있음) ~165°, 앉음 ~100° → 0~100% 매핑
  const progress = interp(kneeAngle, [100, 165], [100, 0]);
  const backStraight = hipAngle > 140; // 등이 너무 굽지 않았는지

  if (kneeAngle <= 105 && backStraight)
    return { progress, correctForm: true, feedback: '좋아요!', endpoint: 'down' };
  if (kneeAngle >= 160 && backStraight)
    return { progress, correctForm: true, feedback: '바르게 섰어요', endpoint: 'up' };
  if (!backStraight)
    return { progress, correctForm: false, feedback: '등을 펴주세요', endpoint: null };
  return { progress, correctForm: true, feedback: '천천히 앉아주세요', endpoint: null };
}

// ── 팔 운동(이두 컬 응용): 팔꿈치 각도 (BicepCurlCounter_live.py) ─
function analyzePush(lms: Landmark[]): PoseAnalysis {
  // 양팔 중 더 잘 보이는 쪽을 사용
  const useLeft =
    (lms[LM.LEFT_ELBOW].visibility ?? 0) >= (lms[LM.RIGHT_ELBOW].visibility ?? 0);
  const [s, e, w] = useLeft
    ? [LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST]
    : [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST];

  const elbowAngle = findAngle(lms[s], lms[e], lms[w]);
  // 굽힘 ~50° ~ 폄 ~160° → 0~100%
  const progress = interp(elbowAngle, [50, 160], [0, 100]);

  if (elbowAngle >= 155)
    return { progress, correctForm: true, feedback: '팔을 폈어요', endpoint: 'up' };
  if (elbowAngle <= 55)
    return { progress, correctForm: true, feedback: '좋아요!', endpoint: 'down' };
  return { progress, correctForm: true, feedback: '천천히 움직이세요', endpoint: null };
}

// ── 종아리 운동(발뒤꿈치 들기): 발목 들림 ─────────────────
function analyzeCalf(lms: Landmark[]): PoseAnalysis {
  // 발뒤꿈치가 발끝보다 얼마나 위로 올라갔는지(정규화 y는 아래로 갈수록 큼)
  const heelLift =
    (lms[LM.RIGHT_FOOT_INDEX].y - lms[LM.RIGHT_HEEL].y +
     (lms[LM.LEFT_FOOT_INDEX].y - lms[LM.LEFT_HEEL].y)) / 2;
  // 평지일 때 ~0, 발뒤꿈치 들면 양수. 0~0.07 구간을 0~100%로
  const progress = interp(heelLift, [0.005, 0.06], [0, 100]);

  if (heelLift >= 0.05)
    return { progress, correctForm: true, feedback: '발뒤꿈치를 들었어요', endpoint: 'up' };
  if (heelLift <= 0.012)
    return { progress, correctForm: true, feedback: '좋아요!', endpoint: 'down' };
  return { progress, correctForm: true, feedback: '천천히 올리세요', endpoint: null };
}

// ── 균형 운동(한발 들기): 발목 높이차 ─────────────────────
function analyzeBalance(lms: Landmark[]): PoseAnalysis {
  // 두 발목의 높이차 — 한 발을 들면 차이가 커짐
  const ankleGap = Math.abs(lms[LM.LEFT_ANKLE].y - lms[LM.RIGHT_ANKLE].y);
  const progress = interp(ankleGap, [0.02, 0.18], [0, 100]);

  if (ankleGap >= 0.14)
    return { progress, correctForm: true, feedback: '잘 들고 있어요', endpoint: 'up' };
  if (ankleGap <= 0.04)
    return { progress, correctForm: true, feedback: '좋아요!', endpoint: 'down' };
  return { progress, correctForm: true, feedback: '천천히 들어올리세요', endpoint: null };
}

// ── 반복 카운터 (모든 *_live.py 의 movement_dir 로직 공통) ──
//
// down 끝점에 도달 → up 끝점에 도달 → 1회 완성.
// Python 의 counter += 0.5 / movement_dir 패턴을 상태머신으로 옮긴 것.
export class RepCounter {
  private dir: 'up' | 'down' = 'up'; // 현재 어느 끝점에 있는지

  /** 분석 결과를 받아 반복이 완성되면 true 반환 */
  update(endpoint: 'up' | 'down' | null): boolean {
    if (endpoint === 'down' && this.dir === 'up') {
      this.dir = 'down';
    } else if (endpoint === 'up' && this.dir === 'down') {
      this.dir = 'up';
      return true; // down → up 으로 돌아오면 1회 완성
    }
    return false;
  }

  reset() {
    this.dir = 'up';
  }
}
