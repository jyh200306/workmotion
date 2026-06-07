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

const EX: Record<string, { name: string; emoji: string; dot: string }> = {
  squat:   { name: '스쿼트',    emoji: '🦵', dot: '#ff6b00' },
  calf:    { name: '종아리 운동', emoji: '🦶', dot: '#00b900' },
  push:    { name: '팔 운동',   emoji: '💪', dot: '#0064ff' },
  balance: { name: '균형 운동',  emoji: '⚖️', dot: '#7c3aed' },
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
    <main className="min-h-screen bg-[#f2f4f6] flex flex-col">

      {/* 헤더 */}
      <div className="bg-white px-6 pt-14 pb-6">
        <button onClick={() => router.push('/exercise')} className="flex items-center gap-1.5 text-xl text-[#6b7684] mb-5 active:opacity-60 transition-opacity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          돌아가기
        </button>
        <h1 className="text-[28px] font-bold text-[#202632]">운동 기록</h1>
        {userName && <p className="text-xl text-[#6b7684] mt-1">{userName}님의 기록</p>}

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {[
            { label:'총 운동', value: sessions.length, unit:'회'   },
            { label:'총 세트', value: totalSets,        unit:'세트' },
            { label:'운동 일수', value: activeDays,      unit:'일'  },
          ].map(c => (
            <div key={c.label} className="bg-[#f2f4f6] rounded-2xl p-4 text-center">
              <p className="text-[32px] font-bold text-[#0064ff]">{c.value}</p>
              <p className="text-base text-[#6b7684] mt-0.5">{c.unit}</p>
              <p className="text-sm text-[#b0b8c1] mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 기록 목록 */}
      <div className="flex-1 px-5 py-5 flex flex-col gap-5 overflow-y-auto">
        {loading ? (
          <p className="text-center text-xl text-[#b0b8c1] mt-10 animate-pulse">불러오는 중</p>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 gap-4">
            <div className="w-20 h-20 bg-[#f2f4f6] rounded-full flex items-center justify-center">
              <span className="text-4xl">🏃</span>
            </div>
            <p className="text-2xl text-[#6b7684]">아직 운동 기록이 없어요</p>
          </div>
        ) : groups.map(([date, items]) => (
          <div key={date}>
            <p className="text-lg font-semibold text-[#6b7684] mb-2 px-1">{dateLabel(items[0].started_at)}</p>
            <div className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden">
              {items.map((s, idx) => {
                const ex = EX[s.exercise_type];
                return (
                  <div key={s.id} className={`flex items-center gap-4 px-5 py-4 ${idx !== items.length - 1 ? 'border-b border-[#f2f4f6]' : ''}`}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ex.dot + '18' }}>
                      <span className="text-2xl">{ex.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-semibold text-[#202632]">{ex.name}</p>
                      <p className="text-lg text-[#6b7684] mt-0.5">{s.sets_completed}세트 · {fmt(s.duration_sec)}</p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#00b900] shrink-0">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 */}
      <div className="px-5 pb-12 pt-2">
        <button onClick={() => router.push('/exercise')}
          className="w-full min-h-[60px] rounded-2xl bg-[#0064ff] text-white text-2xl font-bold active:scale-95 transition-transform">
          운동 하러 가기
        </button>
      </div>
    </main>
  );
}
