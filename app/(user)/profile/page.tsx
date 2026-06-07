'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type UserData = { id: string; name: string; birth_year?: number; facility_id?: string };
type SessionRow = { exercise_type: string; sets_completed: number; started_at: string };

const EX_META: Record<string, { label: string; emoji: string }> = {
  squat:   { label: '스쿼트',    emoji: '🦵' },
  calf:    { label: '종아리 운동', emoji: '🦶' },
  push:    { label: '팔 운동',   emoji: '💪' },
  balance: { label: '균형 운동',  emoji: '⚖️' },
};

const GOAL_LABELS: Record<string, { text: string; emoji: string }> = {
  health:  { text: '건강 유지',  emoji: '💚' },
  balance: { text: '균형 향상',  emoji: '⚖️' },
  strong:  { text: '근력 강화',  emoji: '💪' },
};

function weekDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [user,     setUser]     = useState<UserData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [goal,     setGoal]     = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('wm_user');
    const savedGoal = localStorage.getItem('wm_goal') ?? '';
    setGoal(savedGoal);

    if (!userStr) { setLoading(false); return; }
    const u: UserData = JSON.parse(userStr);
    setUser(u);

    fetch(`/api/sessions?userId=${u.id}`)
      .then(r => r.json())
      .then(d => { if (d.sessions) setSessions(d.sessions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    ['wm_role','wm_user','wm_facility','wm_onboarded','wm_name','wm_goal'].forEach(k => localStorage.removeItem(k));
    router.push('/login');
  }

  const week      = weekDates();
  const weekDone  = new Set(sessions.map(s => s.started_at.slice(0, 10)));
  const streak    = (() => {
    let count = 0;
    const today = new Date().toISOString().slice(0, 10);
    let cur = new Date(today);
    while (weekDone.has(cur.toISOString().slice(0, 10))) {
      count++;
      cur.setDate(cur.getDate() - 1);
    }
    return count;
  })();

  const totalSets = sessions.reduce((a, s) => a + s.sets_completed, 0);
  const favEx     = (() => {
    const cnt: Record<string, number> = {};
    sessions.forEach(s => { cnt[s.exercise_type] = (cnt[s.exercise_type] ?? 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  })();

  const age = user?.birth_year ? new Date().getFullYear() - user.birth_year : null;
  const goalMeta = GOAL_LABELS[goal];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* 헤더 */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push('/exercise')} className="text-white/70 text-2xl active:scale-90 transition-transform">← 뒤로</button>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-5xl font-black text-white">
              {user?.name?.[0] ?? '?'}
            </span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">{user?.name ?? '이용자'}님</h1>
            {age && <p className="text-xl text-blue-200 mt-0.5">{age}세</p>}
            {goalMeta && (
              <div className="mt-2 bg-white/20 rounded-xl px-3 py-1 inline-flex items-center gap-1.5">
                <span className="text-lg">{goalMeta.emoji}</span>
                <span className="text-lg text-white font-semibold">{goalMeta.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col gap-5 overflow-y-auto">

        {/* 이번 주 달력 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-2xl font-black text-gray-800 mb-4">이번 주 운동</p>
          <div className="flex justify-between gap-1">
            {week.map((d, i) => {
              const done = weekDone.has(d);
              const isToday = d === new Date().toISOString().slice(0, 10);
              const dayLabel = ['일','월','화','수','목','금','토'][new Date(d + 'T12:00:00').getDay()];
              return (
                <div key={d} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                    {dayLabel}
                  </span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                    done
                      ? 'bg-blue-500 text-white shadow-md'
                      : isToday
                        ? 'border-2 border-blue-400 text-gray-300'
                        : 'bg-gray-100 text-gray-300'
                  }`}>
                    {done ? '✓' : '·'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 스탯 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '연속 운동', value: streak,           unit:'일',  emoji:'🔥', color:'text-orange-600', bg:'bg-orange-50' },
            { label: '총 운동',  value: sessions.length,  unit:'회',  emoji:'🏃', color:'text-blue-600',   bg:'bg-blue-50'   },
            { label: '총 세트',  value: totalSets,        unit:'세트', emoji:'💪', color:'text-green-600',  bg:'bg-green-50'  },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-2xl p-4 text-center`}>
              <span className="text-2xl">{c.emoji}</span>
              <p className={`text-3xl font-black ${c.color} mt-1`}>{loading ? '…' : c.value}</p>
              <p className={`text-base ${c.color} opacity-70`}>{c.unit}</p>
              <p className="text-sm text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* 좋아하는 운동 */}
        {favEx && EX_META[favEx] && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <span className="text-5xl">{EX_META[favEx].emoji}</span>
            <div>
              <p className="text-xl text-gray-500 font-medium">가장 많이 한 운동</p>
              <p className="text-3xl font-black text-gray-900">{EX_META[favEx].label}</p>
            </div>
          </div>
        )}

        {/* 최근 기록 미리보기 */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-2xl font-black text-gray-800">최근 기록</p>
              <button onClick={() => router.push('/history')}
                className="text-xl text-blue-500 font-semibold active:scale-95 transition-transform">
                전체 보기 →
              </button>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {sessions.slice(0, 3).map(s => {
                const meta = EX_META[s.exercise_type] ?? { emoji:'🏃', label: s.exercise_type };
                return (
                  <div key={s.started_at + s.exercise_type} className="flex items-center gap-4 py-3">
                    <span className="text-3xl">{meta.emoji}</span>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-gray-900">{meta.label}</p>
                      <p className="text-lg text-gray-500">{s.sets_completed}세트 완료</p>
                    </div>
                    <p className="text-lg text-gray-400">
                      {new Date(s.started_at).toLocaleDateString('ko-KR', { month:'short', day:'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 로그아웃 */}
        <button onClick={logout}
          className="w-full min-h-[60px] rounded-2xl border-2 border-gray-200 bg-white text-2xl font-semibold text-gray-400 active:scale-95 transition-transform">
          로그아웃
        </button>
      </div>
    </main>
  );
}
