// 단색 라인 아이콘 모음 (화이트/블루/그레이/블랙 팔레트 전용, 이모티콘 대체)
//
// 모든 아이콘은 currentColor 를 사용하므로 부모의 text-* 색을 따라갑니다.
// 운동 4종 + 대시보드/프로필에서 쓰는 보조 아이콘을 한 곳에 모았습니다.

import { ExerciseType } from '@/types';

type IconProps = { size?: number; className?: string };

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
});

// ── 운동별 아이콘 ──────────────────────────────────────────
function SquatIcon({ size = 24, className }: IconProps) {
  // 다리 굽힘(스쿼트) 추상화
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5v5l-3.5 3v5" />
      <path d="M12 11.5l3.5 3v5" />
      <path d="M8.5 14.5h7" />
    </svg>
  );
}

function CalfIcon({ size = 24, className }: IconProps) {
  // 발뒤꿈치 들기(까치발)
  return (
    <svg {...base(size, className)}>
      <path d="M9 3v9" />
      <path d="M9 12c0 3 1.5 5 4.5 5.5L18 18" />
      <path d="M6 21h9" />
      <path d="M9 12l-3 1" />
    </svg>
  );
}

function PushIcon({ size = 24, className }: IconProps) {
  // 팔 굽혔다 펴기(팔 운동)
  return (
    <svg {...base(size, className)}>
      <circle cx="6.5" cy="6" r="2" />
      <path d="M6.5 8v5" />
      <path d="M6.5 10h6l3.5-3.5" />
      <path d="M12.5 10l4 4" />
    </svg>
  );
}

function BalanceIcon({ size = 24, className }: IconProps) {
  // 한 발 균형
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5v8" />
      <path d="M12 14.5l-3 5.5" />
      <path d="M12 11l4-2" />
      <path d="M5 20h6" />
    </svg>
  );
}

const EXERCISE_ICONS: Record<ExerciseType, (p: IconProps) => React.JSX.Element> = {
  squat: SquatIcon,
  calf: CalfIcon,
  push: PushIcon,
  balance: BalanceIcon,
};

export function ExerciseIcon({ type, size, className }: IconProps & { type: ExerciseType }) {
  const Cmp = EXERCISE_ICONS[type];
  return <Cmp size={size} className={className} />;
}

// ── 보조(UI) 아이콘 ────────────────────────────────────────
export function FlameIcon({ size = 24, className }: IconProps) {
  // 연속 운동 (불꽃 → 단순 상승 곡선으로 추상화)
  return (
    <svg {...base(size, className)}>
      <path d="M12 3c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.6-2.6 1.5-3.5C9.8 8.8 11 7 12 3z" />
    </svg>
  );
}

export function RunIcon({ size = 24, className }: IconProps) {
  // 총 운동(활동)
  return (
    <svg {...base(size, className)}>
      <circle cx="13" cy="5" r="1.8" />
      <path d="M13 7l-2 4 3 2v5" />
      <path d="M11 11l-3 1-2 3" />
      <path d="M14 13l3 1" />
    </svg>
  );
}

export function StackIcon({ size = 24, className }: IconProps) {
  // 총 세트(누적)
  return (
    <svg {...base(size, className)}>
      <path d="M12 4l8 4-8 4-8-4 8-4z" />
      <path d="M4 12l8 4 8-4" />
      <path d="M4 16l8 4 8-4" />
    </svg>
  );
}

export function BuildingIcon({ size = 24, className }: IconProps) {
  // 시설(관리자)
  return (
    <svg {...base(size, className)}>
      <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" />
      <path d="M14 9h4a1 1 0 0 1 1 1v11" />
      <path d="M3 21h18" />
      <path d="M8 8h2M8 12h2M8 16h2" />
    </svg>
  );
}

export function CameraIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
      <circle cx="12" cy="12.5" r="3" />
    </svg>
  );
}

export function PoseIcon({ size = 24, className }: IconProps) {
  // 가이드 라인에 맞춰 서기
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.5v7" />
      <path d="M8 9h8" />
      <path d="M12 13.5l-2.5 6" />
      <path d="M12 13.5l2.5 6" />
    </svg>
  );
}

export function BellIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}
