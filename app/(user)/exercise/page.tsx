'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExerciseType } from '@/types';

const EXERCISES = [
  { type: 'squat'   as ExerciseType, emoji: '🦵', name: '스쿼트',    desc: '하체 근력을 키워요',  sets: '3세트 · 20초', from: 'from-orange-400', to: 'to-red-500',    bg: 'bg-orange-50', text: 'text-orange-600' },
  { type: 'calf'    as ExerciseType, emoji: '🦶', name: '종아리 운동', desc: '균형 감각을 키워요',  sets: '3세트 · 20초', from: 'from-emerald-400', to: 'to-teal-500',   bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { type: 'push'    as ExerciseType, emoji: '💪', name: '팔 운동',    desc: '상체 근력을 키워요',  sets: '3세트 · 20초', from: 'from-blue-400',   to: 'to-indigo-500', bg: 'bg-blue-50',    text: 'text-blue-600' },
  { type: 'balance' as ExerciseType, emoji: '⚖️', name: '균형 운동',  desc: '낙상을 예방해요',    sets: '3세트 · 20초', from: 'from-violet-400', to: 'to-purple-500', bg: 'bg-violet-50',  text: 'text-violet-600' },
];

const today = new Date().toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'long' });

function weekDates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function ExercisePage() {
  const router = useRouter();
  const [name,       setName]       = useState('');
  const [userId,     setUserId]     = useState('');
  const [weekDone,   setWeekDone]   = useState<Set<string>>(new Set());
  const [goalDays,   setGoalDays]   = useState(5);

  useEffect(() => {
    const saved = localStorage.getItem('wm_name') ?? '';
    try {
      const u = JSON.parse(localStorage.getItem('wm_user') ?? '{}');
      setName(saved || u.name || '');
      if (u.id) {
        setUserId(u.id);
        fetch(`/api/sessions?userId=${u.id}`)
          .then(r => r.json())
          .then(d => {
            if (d.sessions) {
              setWeekDone(new Set(d.sessions.map((s: { started_at: string }) => s.started_at.slice(0, 10))));
            }
          })
          .catch(() => {});
      }
    } catch { setName(saved); }

    const g = localStorage.getItem('wm_goal');
    if (g === 'strong') setGoalDays(5);
    else if (g === 'health') setGoalDays(3);
    else setGoalDays(4);
  }, []);

  const week      = weekDates();
  const doneCount = week.filter(d => weekDone.has(d)).length;
  const pct       = Math.min((doneCount / goalDays) * 100, 100);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* 헤더 */}
      <div className="bg-white px-6 pt-12 pb-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xl text-gray-400">{today}</p>
          <button
            onClick={() => router.push('/profile')}
            className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center active:scale-90 transition-transform">
            <span className="text-2xl font-black text-blue-600">{name ? name[0] : '👤'}</span>
          </button>
        </div>
        <h1 className="text-4xl font-black text-gray-900">
          {name ? `${name}님, 오늘 운동` : '오늘 운동 선택'}
        </h1>
        <p className="text-xl text-gray-500 mt-0.5">하고 싶은 운동을 골라주세요</p>

        {/* 주간 목표 바 */}
        <div className="mt-4 bg-blue-50 rounded-2xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-lg font-bold text-blue-700">이번 주 목표</p>
            <p className="text-lg font-black text-blue-700">
              {doneCount} / {goalDays}일
              {doneCount >= goalDays && <span className="ml-2">🎉</span>}
            </p>
          </div>
          <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {week.map((d, i) => {
              const done    = weekDone.has(d);
              const isToday = d === new Date().toISOString().slice(0, 10);
              const label   = ['일','월','화','수','목','금','토'][new Date(d + 'T12:00:00').getDay()];
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={`text-base ${isToday ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>{label}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                    done ? 'bg-blue-500 text-white' : isToday ? 'border-2 border-blue-400' : 'bg-gray-100'
                  }`}>
                    {done ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 운동 카드 */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-4">
        {EXERCISES.map(ex => (
          <button
            key={ex.type}
            onClick={() => router.push(`/exercise/${ex.type}/guide`)}
            className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform duration-100 overflow-hidden text-left"
          >
            <div className="flex items-center gap-5 p-5">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${ex.from} ${ex.to} flex items-center justify-center shrink-0 shadow-md`}>
                <span className="text-5xl">{ex.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-3xl font-black text-gray-900">{ex.name}</p>
                <p className="text-xl text-gray-500 mt-0.5">{ex.desc}</p>
                <div className={`inline-flex items-center mt-2 px-3 py-1 rounded-full ${ex.bg}`}>
                  <span className={`text-lg font-semibold ${ex.text}`}>{ex.sets}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-gray-400 font-medium">가이드 보기</span>
                <span className="text-3xl text-gray-300">›</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 하단 */}
      <div className="px-6 pb-10 pt-2 flex gap-3">
        <button onClick={() => router.push('/history')}
          className="flex-1 min-h-[60px] rounded-2xl border-2 border-gray-200 bg-white text-2xl font-semibold text-gray-500 active:scale-95 transition-transform">
          📋 기록
        </button>
        <button onClick={() => router.push('/profile')}
          className="flex-1 min-h-[60px] rounded-2xl border-2 border-gray-200 bg-white text-2xl font-semibold text-gray-500 active:scale-95 transition-transform">
          👤 프로필
        </button>
      </div>
    </main>
  );
}
