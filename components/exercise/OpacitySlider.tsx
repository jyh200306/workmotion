'use client';

interface OpacitySliderProps {
  value: number; // 0~100
  onChange: (value: number) => void;
}

export function OpacitySlider({ value, onChange }: OpacitySliderProps) {
  return (
    <div className="flex items-center gap-4 w-full px-4">
      <span className="text-2xl">👻</span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-3 accent-blue-600 cursor-pointer"
        aria-label="실루엣 투명도 조절"
      />
      <span className="text-2xl">🧍</span>
    </div>
  );
}
