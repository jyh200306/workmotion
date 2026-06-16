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
    <main className="min-h-screen bg-[#f2f4f6] flex flex-col">

      {/* 헤더 */}
      <div className="bg-[#202632] px-6 pt-14 pb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[#6b7684] text-xl mb-5 active:opacity-60 transition-opacity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          대시보드
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{userName ? userName[0] : '?'}</span>
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-white">{userName || '이용자'}</h1>
            <p className="text-[#6b7684] text-lg mt-0.5">운동 기록</p>
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
            <div key={c.label} className="bg-white rounded-2xl border border-[#e5e8eb] p-4 text-center">
              <p className="text-[28px] font-bold text-[#0064ff]">{loading ? '·' : c.value}</p>
              <p className="text-sm text-[#b0b8c1]">{c.unit}</p>
              <p className="text-sm text-[#6b7684] mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* 4주 달력 */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-5">
          <p className="text-xl font-bold text-[#202632] mb-4">최근 4주</p>
          <div className="flex gap-1 mb-2">
            {['일','월','화','수','목','금','토'].map(d => (
              <p key={d} className="flex-1 text-center text-sm text-[#b0b8c1] font-medium">{d}</p>
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
                      done ? 'bg-[#0064ff] text-white'
                           : isToday ? 'border-2 border-[#0064ff] text-[#0064ff]'
                           : 'bg-[#f2f4f6] text-[#b0b8c1]'
                    }`}>
                      {done ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
          <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-5">
            <p className="text-xl font-bold text-[#202632] mb-4">종목별 현황</p>
            <div className="flex flex-col gap-4">
              {Object.entries(breakdown).sort((a,b) => b[1]-a[1]).map(([key, cnt]) => {
                const meta = EX[key] ?? { label: key };
                const known = !!EX[key];
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-7 text-[#0064ff] shrink-0">{known ? <ExerciseIcon type={key as ExerciseType} size={22} /> : <RunIcon size={22} />}</span>
                    <span className="text-xl text-[#6b7684] w-20 shrink-0">{meta.label}</span>
                    <div className="flex-1 h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#0064ff] transition-all duration-500" style={{ width:`${(cnt/maxCount)*100}%` }} />
                    </div>
                    <span className="text-lg font-bold text-[#202632] w-6 text-right">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 기록 */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden">
          <p className="text-xl font-bold text-[#202632] px-5 py-4 border-b border-[#f2f4f6]">운동 기록</p>
          {loading ? (
            <p className="text-xl text-[#b0b8c1] text-center py-8 animate-pulse">불러오는 중</p>
          ) : sessions.length === 0 ? (
            <p className="text-xl text-[#b0b8c1] text-center py-8">운동 기록이 없어요</p>
          ) : (
            <div className="flex flex-col divide-y divide-[#f2f4f6]">
              {sessions.slice(0, 20).map(s => {
                const meta = EX[s.exercise_type] ?? { label: s.exercise_type };
                const known = !!EX[s.exercise_type];
                return (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="w-9 h-9 rounded-lg bg-[#ebf3ff] text-[#0064ff] flex items-center justify-center shrink-0">
                      {known ? <ExerciseIcon type={s.exercise_type as ExerciseType} size={20} /> : <RunIcon size={20} />}
                    </span>
                    <div className="flex-1">
                      <p className="text-2xl font-semibold text-[#202632]">{meta.label}</p>
                      <p className="text-lg text-[#6b7684]">{s.sets_completed}세트 · {fmt(s.duration_sec)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg text-[#6b7684]">
                        {new Date(s.started_at).toLocaleDateString('ko-KR', { month:'short', day:'numeric' })}
                      </p>
                      <p className="text-base text-[#b0b8c1]">
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
