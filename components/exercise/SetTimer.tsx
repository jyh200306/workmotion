'use client';

import { useEffect, useRef, useState } from 'react';
import { speak } from '@/lib/tts';
import { SeniorButton } from '@/components/ui/SeniorButton';

interface SetTimerProps {
  durationSec?: number;
  onComplete?: () => void;
}

export function SetTimer({ durationSec = 20, onComplete }: SetTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          speak('완료!');
          onComplete?.();
          return 0;
        }
        if (prev <= 4) speak(String(prev - 1));
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current!);
  }, [running, onComplete]);

  function handleToggle() {
    if (timeLeft === 0) {
      setTimeLeft(durationSec);
      setRunning(true);
    } else {
      setRunning((r) => !r);
    }
  }

  const progress = (timeLeft / durationSec) * 100;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={timeLeft === 0 ? '#22c55e' : '#3b82f6'}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-gray-800">
          {timeLeft}
        </span>
      </div>

      <SeniorButton onClick={handleToggle} variant={running ? 'secondary' : 'primary'}>
        {timeLeft === 0 ? '다시 시작' : running ? '일시정지' : '시작'}
      </SeniorButton>
    </div>
  );
}
