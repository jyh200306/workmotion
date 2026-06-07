'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type SessionRow = {
  id: string;
  exercise_type: 'squat' | 'calf' | 'push' | 'balance';
  sets_completed: number;
  duration_sec: number;
  started_at: string;
};

const EXERCISE_LABEL: Record<string, { name: string; emoji: string; color: string }> = {
  squat:   { name: '스쿼트',    emoji: '🦵', color: 'bg-orange-100 text-orange-700' },
  calf:    { name: '종아리 운동', emoji: '🦶', color: 'bg-emerald-100 text-emerald-700' },
  push:    { name: '팔 운동',   emoji: '💪', color: 'bg-blue-100 text-blue-700' },
  balance: { name: '균형 운동',  emoji: '⚖️', color: 'bg-violet-100 text-violet-700' },
};

const MOCK: SessionRow[] = [
  { id:'1', exercise_type:'squat',   sets_completed:3, duration_sec:62, started_at: new Date(Date.now()-3600000).toISOString() },
  { id:'2', exercise_type:'balance', sets_completed:2, duration_sec:44, started_at: new Date(Date.now()-7200000).toISOString() },
  { id:'3', exercise_type:'calf',    sets_completed:3, duration_sec:68, started_at: new Date(Date.now()-86400000).toISOString() },
  { id:'4', exercise_type:'push',    sets_completed:3, duration_sec:55, started_at: new Date(Date.now()-172800000).toISOString() },
];

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function dateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'short' });
}

function groupByDate(list: SessionRow[]) {
  const map = new Map<string, SessionRow[]>();
  list.forEach(s => {
    const d = s.started_at.slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(s);
  });
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>(MOCK);
  const [loading,  setLoading]  = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('wm_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name ?? '');
      fetch(`/api/sessions?userId=${user.id}`)
        .then(r => r.json())
        .then(d => { if (d.sessions?.length) setSessions(d.sessions); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const groups     = groupByDate(sessions);
  const totalSets  = sessions.reduce((a, s) => a + s.sets_completed, 0);
  const activeDays = new Set(sessions.map(s => s.started_at.slice(0, 10))).size;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* 헤더 */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.push('/exercise')} className="text-2xl text-gray-400 active:scale-90 transition-transform">←</button>
          <div>
            <h1 className="text-4xl font-black text-gray-900">운동 기록</h1>
            {userName && <p className="text-xl text-gray-500 mt-0.5">{userName}님의 기록</p>}
          </div>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'총 운동',  value: sessions.length, unit:'회'   },
            { label:'총 세트',  value: totalSets,        unit:'세트' },
            { label:'운동 일수', value: activeDays,       unit:'일'   },
          ].map(c => (
            <div key={c.label} className="bg-blue-50 rounded-2xl p-4 text-center">
              <p className="text-4xl font-black text-blue-700">{c.value}</p>
              <p className="text-base text-blue-500">{c.unit}</p>
              <p className="text-base text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 리스트 */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-6 overflow-y-auto">
        {loading ? (
          <p className="text-center text-2xl text-gray-400 mt-10 animate-pulse">불러오는 중...</p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 gap-4">
            <span className="text-8xl">🏃</span>
            <p className="text-2xl text-gray-400">아직 운동 기록이 없어요</p>
          </div>
        ) : groups.map(([date, items]) => (
          <div key={date}>
            <p className="text-xl font-bold text-gray-400 mb-3 px-1">{dateLabel(items[0].started_at)}</p>
            <div className="flex flex-col gap-3">
              {items.map(s => {
                const ex = EXERCISE_LABEL[s.exercise_type];
                return (
                  <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4">
                    <span className="text-4xl">{ex.emoji}</span>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-gray-900">{ex.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-base px-2.5 py-0.5 rounded-full font-semibold ${ex.color}`}>{s.sets_completed}세트</span>
                        <span className="text-lg text-gray-400">{fmt(s.duration_sec)}</span>
                      </div>
                    </div>
                    <span className="text-2xl text-green-500">✓</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 */}
      <div className="px-5 pb-10 pt-2">
        <button onClick={() => router.push('/exercise')} className="w-full min-h-[68px] rounded-2xl bg-blue-600 text-white text-2xl font-bold active:scale-95 transition-transform shadow-md">
          운동 하러 가기
        </button>
      </div>
    </main>
  );
}
