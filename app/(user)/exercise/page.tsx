'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExerciseType } from '@/types';
import { ExerciseIcon } from '@/components/Icon';

const EXERCISES = [
  { type: 'squat'     as ExerciseType, name: '스쿼트',     desc: '하체 근력 · 무릎 강화' },
  { type: 'deadlift'  as ExerciseType, name: '데드리프트',  desc: '엉덩이 · 등 후면 강화' },
  { type: 'lunge'     as ExerciseType, name: '런지',       desc: '다리 균형 · 하체 안정' },
  { type: 'hip_hinge' as ExerciseType, name: '힙힌지',     desc: '엉덩이 · 햄스트링 활성' },
];

const todayStr = new Date().toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'long' });

function weekDates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function ExercisePage() {
  const router = useRouter();
  const [name,     setName]     = useState('');
  const [weekDone, setWeekDone] = useState<Set<string>>(new Set());
  const [goalDays, setGoalDays] = useState(4);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('wm_name') ?? '';
      const u = JSON.parse(localStorage.getItem('wm_user') ?? '{}');
      setName(saved || u.name || '');
      if (u.id) {
        fetch(`/api/sessions?userId=${u.id}`)
          .then(r => r.json())
          .then(d => {
            if (d.sessions) setWeekDone(new Set(d.sessions.map((s: { started_at: string }) => s.started_at.slice(0, 10))));
          })
          .catch(() => {});
      }
    } catch { /**/ }
    const g = localStorage.getItem('wm_goal');
    setGoalDays(g === 'strength' ? 5 : g === 'health' ? 3 : 4);
  }, []);

  const week      = weekDates();
  const doneCount = week.filter(d => weekDone.has(d)).length;

  return (
    <main className="min-h-screen bg-[#14181d] flex flex-col">

      {/* 헤더 */}
      <div className="bg-[#1a2026] px-6 pt-14 pb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-lg text-[#6a6a6a]">{todayStr}</p>
          <button
            onClick={() => router.push('/profile')}
            className="w-11 h-11 rounded-full bg-[#d8ff36] flex items-center justify-center active:opacity-75 transition-opacity">
            <span className="text-lg font-bold text-[#14181d]">{name ? name[0] : 'M'}</span>
          </button>
        </div>
        <h1 className="text-2xl font-bold text-[#f0f0f0] leading-tight tracking-tight">
          {name ? `${name}님, 오늘도 화이팅` : '오늘 운동 선택'}
        </h1>

        {/* 주간 목표 */}
        <div className="mt-5 pt-5 border-t border-[#2a3139]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-lg font-semibold text-[#f0f0f0]">이번 주 목표</p>
            <p className="text-base text-[#d8ff36] font-bold tabular-nums">{doneCount}/{goalDays}일</p>
          </div>
          <div className="flex gap-1.5">
            {week.map((d, i) => {
              const done    = weekDone.has(d);
              const isToday = d === new Date().toISOString().slice(0, 10);
              const label   = ['일','월','화','수','목','금','토'][new Date(d + 'T12:00:00').getDay()];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <p className={`text-sm font-medium ${isToday ? 'text-[#d8ff36]' : 'text-[#6a6a6a]'}`}>{label}</p>
                  <div className={`w-full aspect-square rounded-lg flex items-center justify-center ${
                    done ? 'bg-[#d8ff36]' : isToday ? 'bg-[#23291a] border border-[#d8ff36]' : 'bg-[#2a3139]'
                  }`}>
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="#14181d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 운동 목록 */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-3">
        {EXERCISES.map(ex => (
          <button
            key={ex.type}
            onClick={() => router.push(`/exercise/${ex.type}/guide`)}
            className="w-full bg-[#1a2026] rounded-2xl border border-[#2a3139] active:scale-[0.98] transition-transform duration-100 text-left overflow-hidden"
          >
            <div className="flex items-center gap-5 px-5 py-5">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-[#23291a] text-[#d8ff36]">
                <ExerciseIcon type={ex.type} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-[#f0f0f0]">{ex.name}</p>
                <p className="text-sm text-[#a0a0a0] mt-0.5">{ex.desc}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#6a6a6a]">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* 하단 */}
      <div className="px-5 pb-10 pt-1 flex gap-3">
        <button onClick={() => router.push('/history')}
          className="flex-1 min-h-[52px] rounded-2xl bg-[#1a2026] border border-[#2a3139] text-base font-semibold text-[#a0a0a0] active:scale-95 transition-transform">
          운동 기록
        </button>
        <button onClick={() => router.push('/profile')}
          className="flex-1 min-h-[52px] rounded-2xl bg-[#1a2026] border border-[#2a3139] text-base font-semibold text-[#a0a0a0] active:scale-95 transition-transform">
          내 프로필
        </button>
      </div>
    </main>
  );
}
