'use client';

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;   // 발화 종료(또는 미지원/에러) 시 호출
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  const { rate = 0.9, pitch = 1.0, onEnd } = opts;

  // 음성 미지원 환경에서도 흐름이 멈추지 않도록 onEnd는 항상 호출
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang  = 'ko-KR';
  utterance.rate  = rate;
  utterance.pitch = pitch;

  let done = false;
  const finish = () => { if (!done) { done = true; onEnd?.(); } };
  utterance.onend   = finish;
  utterance.onerror = finish;   // 에러 시에도 운동이 시작되도록 보장

  window.speechSynthesis.speak(utterance);
}
