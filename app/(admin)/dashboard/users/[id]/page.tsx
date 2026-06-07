'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Session = {
  id: string;
  exercise_type: string;
  sets_completed: number;
  duration_sec: number;
  started_at: string;
};

const EX_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  squat:   { label: '스쿼트',    emoji: '🦵', color: 'text-orange-600', bg: 'bg-orange-100' },
  calf:    { label: '종아리',    emoji: '🦶', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  push:    { label: '팔 운동',  emoji: '💪', color: 'text-blue-600',   bg: 'bg-blue-100' },
  balance: { label: '균형',     emoji: '⚖️', color: 'text-violet-600', bg: 'bg-violet-100' },
};

function weekDates() {
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
    // 이름은 대시보드 state에서 넘어오기 어려우므로 sessions에서 유추
    fetch(`/api/sessions?userId=${id}`)
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 이름은 URL state 또는 sessionStorage에서
    const cached = sessionStorage.getItem(`wm_admin_user_${id}`);
    if (cached) setUserName(JSON.parse(cached).name ?? '');
  }, [id]);

  const doneDates  = new Set(sessions.map(s => s.started_at.slice(0, 10)));
  const totalSets  = sessions.reduce((a, s) => a + s.sets_completed, 0);
  const activeDays = new Set(sessions.map(s => s.started_at.slice(0, 10))).size;

  // 운동 종목별 집계
  const breakdown: Record<string, number> = {};
  sessions.forEach(s => { breakdown[s.exercise_type] = (breakdown[s.exercise_type] ?? 0) + 1; });
  const maxCount = Math.max(...Object.values(breakdown), 1);

  // 4주 달력
  const days28 = weekDates();
  const weeks  = Array.from({ length: 4 }, (_, w) => days28.slice(w * 7, w * 7 + 7));

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 pt-12 pb-6">
        <button onClick={() => router.back()} className="text-white/60 text-xl mb-4 active:scale-90 transition-transform inline-block">
          ← 대시보드
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-4xl font-black text-white">{userName ? userName[0] : '?'}</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">{userName || '이용자'} 님</h1>
            <p className="text-gray-400 text-xl mt-0.5">운동 상세 기록</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5 overflow-y-auto">

        {/* 요약 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'총 운동',  value: sessions.length, unit:'회',   color:'text-blue-600',   bg:'bg-blue-50' },
            { label:'총 세트',  value: totalSets,        unit:'세트', color:'text-green-600',  bg:'bg-green-50' },
            { label:'운동 일수', value: activeDays,       unit:'일',  color:'text-orange-600', bg:'bg-orange-50' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-4xl font-black ${c.color}`}>{loading ? '…' : c.value}</p>
              <p className={`text-sm ${c.color} opacity-70`}>{c.unit}</p>
              <p className="text-sm text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* 4주 달력 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-2xl font-black text-gray-800 mb-4">최근 4주 운동 달력</p>
          <div className="flex gap-1 mb-2">
            {['일','월','화','수','목','금','토'].map(d => (
              <p key={d} className="flex-1 text-center text-lg text-gray-400 font-medium">{d}</p>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex gap-1">
                {week.map((date, di) => {
                  const done    = doneDates.has(date);
                  const isToday = date === new Date().toISOString().slice(0, 10);
                  return (
                    <div key={di} className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-lg font-bold transition-all ${
                      done
                        ? 'bg-blue-500 text-white shadow-sm'
                        : isToday
                          ? 'border-2 border-blue-400 text-blue-400'
                          : 'bg-gray-50 text-gray-300'
                    }`}>
                      {done ? '✓' : new Date(date + 'T12:00:00').getDate()}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* 종목별 분포 */}
        {Object.keys(breakdown).length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-black text-gray-800 mb-4">운동 종목 현황</p>
            <div className="flex flex-col gap-3">
              {Object.entries(breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([key, cnt]) => {
                  const meta = EX_META[key] ?? { emoji:'🏃', label: key, color:'text-gray-600', bg:'bg-gray-100' };
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-2xl w-8">{meta.emoji}</span>
                      <span className="text-xl text-gray-600 w-20 shrink-0">{meta.label}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${meta.bg}`}
                             style={{ width: `${(cnt / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-xl font-bold text-gray-700 w-8 text-right">{cnt}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 최근 세션 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-2xl font-black text-gray-800 mb-4">최근 운동 기록</p>
          {loading ? (
            <p className="text-xl text-gray-400 text-center py-6 animate-pulse">불러오는 중...</p>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <span className="text-5xl">📋</span>
              <p className="text-xl text-gray-400">운동 기록이 없어요</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {sessions.slice(0, 20).map(s => {
                const meta = EX_META[s.exercise_type] ?? { emoji:'🏃', label: s.exercise_type, color:'text-gray-600', bg:'bg-gray-100' };
                return (
                  <div key={s.id} className="flex items-center gap-4 py-3">
                    <span className="text-3xl">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-gray-900">{meta.label}</p>
                      <p className="text-lg text-gray-500">{s.sets_completed}세트 · {fmt(s.duration_sec)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg text-gray-400">
                        {new Date(s.started_at).toLocaleDateString('ko-KR', { month:'short', day:'numeric' })}
                      </p>
                      <p className="text-base text-gray-300">
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
