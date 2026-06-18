'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseType } from '@/types';
import { ExerciseIcon, RunIcon } from '@/components/Icon';

type Session = {
  id: string; exercise_type: string;
  sets_completed: number; duration_sec: number; started_at: string;
};

const EX: Record<string, { label: string }> = {
  squat:     { label: '스쿼트' },
  deadlift:  { label: '데드리프트' },
  lunge:     { label: '런지' },
  hip_hinge: { label: '힙힌지' },
};

function weekDates28() {
  return Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().slice(0, 10);
  });
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userName, setUserName] = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(`wm_admin_user_${id}`);
    if (cached) setUserName(JSON.parse(cached).name ?? '');

    fetch(`/api/sessions?userId=${id}`)
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const doneDates = new Set(sessions.map(s => s.started_at.slice(0, 10)));
  const totalSets = sessions.reduce((a, s) => a + s.sets_completed, 0);
  const activeDays = new Set(sessions.map(s => s.started_at.slice(0, 10))).size;

  const breakdown: Record<string, number> = {};
  sessions.forEach(s => { breakdown[s.exercise_type] = (breakdown[s.exercise_type] ?? 0) + 1; });
  const maxCount = Math.max(...Object.values(breakdown), 1);

  const days28 = weekDates28();
  const weeks  = Array.from({ length: 4 }, (_, w) => days28.slice(w * 7, w * 7 + 7));

  return (
    <main className="min-h-screen bg-[#14181d] flex flex-col">

      {/* 헤더 */}
      <div className="bg-[#1a2026] px-6 pt-14 pb-6 border-b border-[#2a3139]">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[#a0a0a0] text-base mb-5 active:opacity-60 transition-opacity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          대시보드
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#23291a] flex items-center justify-center">
            <span className="text-xl font-bold text-[#d8ff36]">{userName ? userName[0] : '?'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0] tracking-tight">{userName || '이용자'}</h1>
            <p className="text-[#a0a0a0] text-base mt-0.5">운동 기록</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto">

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'총 운동',  value: sessions.length, unit:'회'  },
            { label:'총 세트',  value: totalSets,        unit:'세트'},
            { label:'운동 일수', value: activeDays,       unit:'일' },
          ].map(c => (
            <div key={c.label} className="bg-[#1a2026] rounded-2xl border border-[#2a3139] p-4 text-center">
              <p className="text-2xl font-bold text-[#d8ff36] tabular-nums">{loading ? '·' : c.value}</p>
              <p className="text-sm text-[#6a6a6a]">{c.unit}</p>
              <p className="text-xs text-[#a0a0a0] mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* 4주 달력 */}
        <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] px-5 py-5">
          <p className="text-lg font-bold text-[#f0f0f0] mb-4">최근 4주</p>
          <div className="flex gap-1 mb-2">
            {['일','월','화','수','목','금','토'].map(d => (
              <p key={d} className="flex-1 text-center text-sm text-[#6a6a6a] font-medium">{d}</p>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex gap-1">
                {week.map((date, di) => {
                  const done    = doneDates.has(date);
                  const isToday = date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={di} className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                      done ? 'bg-[#d8ff36] text-[#14181d]'
                           : isToday ? 'border-2 border-[#d8ff36] text-[#d8ff36]'
                           : 'bg-[#14181d] text-[#6a6a6a]'
                    }`}>
                      {done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="#14181d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : new Date(date + 'T12:00:00').getDate()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 종목별 */}
        {Object.keys(breakdown).length > 0 && (
          <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] px-5 py-5">
            <p className="text-lg font-bold text-[#f0f0f0] mb-4">종목별 현황</p>
            <div className="flex flex-col gap-4">
              {Object.entries(breakdown).sort((a,b) => b[1]-a[1]).map(([key, cnt]) => {
                const meta = EX[key] ?? { label: key };
                const known = !!EX[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-7 text-[#d8ff36] shrink-0">{known ? <ExerciseIcon type={key as ExerciseType} size={20} /> : <RunIcon size={20} />}</span>
                    <span className="text-base text-[#a0a0a0] w-20 shrink-0">{meta.label}</span>
                    <div className="flex-1 h-2 bg-[#14181d] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#d8ff36] transition-all duration-500" style={{ width:`${(cnt/maxCount)*100}%` }} />
                    </div>
                    <span className="text-base font-bold text-[#f0f0f0] w-6 text-right tabular-nums">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 기록 */}
        <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] overflow-hidden">
          <p className="text-lg font-bold text-[#f0f0f0] px-5 py-4 border-b border-[#2a3139]">운동 기록</p>
          {loading ? (
            <p className="text-base text-[#6a6a6a] text-center py-8 animate-pulse">불러오는 중</p>
          ) : sessions.length === 0 ? (
            <p className="text-base text-[#6a6a6a] text-center py-8">운동 기록이 없어요</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#2a3139]">
              {sessions.slice(0, 20).map(s => {
                const meta = EX[s.exercise_type] ?? { label: s.exercise_type };
                const known = !!EX[s.exercise_type];
                return (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="w-9 h-9 rounded-lg bg-[#23291a] text-[#d8ff36] flex items-center justify-center shrink-0">
                      {known ? <ExerciseIcon type={s.exercise_type as ExerciseType} size={20} /> : <RunIcon size={20} />}
                    </span>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-[#f0f0f0]">{meta.label}</p>
                      <p className="text-sm text-[#a0a0a0]">{s.sets_completed}세트 · {fmt(s.duration_sec)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm text-[#a0a0a0]">
                        {new Date(s.started_at).toLocaleDateString('ko-KR', { month:'short', day:'numeric' })}
                      </p>
                      <p className="text-xs text-[#6a6a6a] tabular-nums">
                        {new Date(s.started_at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12: false })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
