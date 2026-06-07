'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type SessionRow = {
  id: string;
  user_id: string;
  exercise_type: string;
  sets_completed: number;
  duration_sec: number;
  started_at: string;
  users?: { name: string; facility_id: string };
};

type UserRow = {
  id: string;
  name: string;
  birth_year: number;
};

type DashboardData = {
  todaySessions: SessionRow[];
  todayUsers: number;
  todaySets: number;
  breakdown: Record<string, number>;
  users: UserRow[];
};

const EX_META: Record<string, { label: string; emoji: string; color: string }> = {
  squat:   { label: '스쿼트',    emoji: '🦵', color: 'bg-orange-400' },
  calf:    { label: '종아리',    emoji: '🦶', color: 'bg-emerald-400' },
  push:    { label: '팔 운동',  emoji: '💪', color: 'bg-blue-400' },
  balance: { label: '균형 운동', emoji: '⚖️', color: 'bg-violet-400' },
};

const MOCK_DATA: DashboardData = {
  todaySessions: [
    { id:'1', user_id:'a', exercise_type:'squat',   sets_completed:3, duration_sec:62, started_at: new Date(Date.now()-600000).toISOString(), users:{ name:'김영숙', facility_id:'' } },
    { id:'2', user_id:'b', exercise_type:'balance', sets_completed:2, duration_sec:44, started_at: new Date(Date.now()-1200000).toISOString(), users:{ name:'이철수', facility_id:'' } },
    { id:'3', user_id:'c', exercise_type:'calf',    sets_completed:3, duration_sec:68, started_at: new Date(Date.now()-2400000).toISOString(), users:{ name:'박순자', facility_id:'' } },
    { id:'4', user_id:'d', exercise_type:'push',    sets_completed:3, duration_sec:55, started_at: new Date(Date.now()-3600000).toISOString(), users:{ name:'최민자', facility_id:'' } },
  ],
  todayUsers: 4, todaySets: 11,
  breakdown: { squat: 8, calf: 6, push: 5, balance: 4 },
  users: [
    { id:'a', name:'김영숙', birth_year:1950 },
    { id:'b', name:'이철수', birth_year:1948 },
    { id:'c', name:'박순자', birth_year:1953 },
    { id:'d', name:'최민자', birth_year:1956 },
    { id:'e', name:'정동호', birth_year:1944 },
    { id:'f', name:'강선희', birth_year:1951 },
  ],
};

const today = new Date().toLocaleDateString('ko-KR', {
  year:'numeric', month:'long', day:'numeric', weekday:'long',
});

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'today' | 'users'>('today');
  const [data, setData]       = useState<DashboardData>(MOCK_DATA);
  const [facilityName, setFacilityName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const facStr = localStorage.getItem('wm_facility');
    if (facStr) {
      const fac = JSON.parse(facStr);
      setFacilityName(fac.name ?? '');
      fetch(`/api/dashboard?facilityId=${fac.id}`)
        .then(r => r.json())
        .then(d => { if (d.todaySessions !== undefined) setData(d); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const breakdown = Object.entries(EX_META).map(([key, meta]) => ({
    key, ...meta, count: data.breakdown[key] ?? 0,
  }));
  const maxCount = Math.max(...breakdown.map(e => e.count), 1);

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12: false });
  }

  function logout() {
    ['wm_role','wm_user','wm_facility','wm_onboarded','wm_name','wm_goal'].forEach(k => localStorage.removeItem(k));
    router.push('/login');
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-300 text-lg">{today}</p>
            <h1 className="text-4xl font-black text-white mt-1">관리자 대시보드</h1>
            <p className="text-gray-400 text-xl mt-0.5">{facilityName || '행복노인복지관'}</p>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">🏢</span>
          </div>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="px-5 pt-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'오늘 이용자', value: data.todayUsers,           unit:'명',   color:'text-blue-600',   bg:'bg-blue-50' },
            { label:'오늘 운동',  value: data.todaySessions.length,  unit:'회',   color:'text-orange-600', bg:'bg-orange-50' },
            { label:'총 세트',   value: data.todaySets,             unit:'세트', color:'text-green-600',  bg:'bg-green-50' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-4xl font-black ${c.color}`}>{loading ? '…' : c.value}</p>
              <p className={`text-base ${c.color} opacity-70`}>{c.unit}</p>
              <p className="text-base text-gray-500 mt-1 leading-tight">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 탭 */}
      <div className="px-5 mt-5 flex gap-2">
        {(['today','users'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 min-h-[52px] rounded-xl text-2xl font-bold transition-all
              ${tab === t ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-200'}`}>
            {t === 'today' ? '📊 오늘 현황' : '👥 이용자'}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 px-5 mt-5 pb-8 overflow-y-auto flex flex-col gap-5">

        {tab === 'today' && (
          <>
            {/* 종목별 분포 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-2xl font-black text-gray-800 mb-4">운동 종목별 현황</p>
              <div className="flex flex-col gap-3">
                {breakdown.map(ex => (
                  <div key={ex.key} className="flex items-center gap-3">
                    <span className="text-2xl w-8">{ex.emoji}</span>
                    <span className="text-xl text-gray-600 w-20 shrink-0">{ex.label}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${ex.color} rounded-full transition-all duration-500`}
                           style={{ width: `${(ex.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="text-xl font-bold text-gray-700 w-8 text-right">{ex.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 세션 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-2xl font-black text-gray-800 mb-4">최근 운동 기록</p>
              {data.todaySessions.length === 0 ? (
                <p className="text-xl text-gray-400 text-center py-6">오늘 운동 기록이 없어요</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100">
                  {data.todaySessions.slice(0, 8).map(s => {
                    const meta = EX_META[s.exercise_type] ?? { emoji:'🏃', label: s.exercise_type };
                    return (
                      <div key={s.id} className="flex items-center gap-4 py-3">
                        <span className="text-3xl">{meta.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-2xl font-bold text-gray-900">{s.users?.name ?? '이용자'}</p>
                          <p className="text-lg text-gray-500">{meta.label} · {s.sets_completed}세트</p>
                        </div>
                        <p className="text-xl text-gray-400 shrink-0">{fmtTime(s.started_at)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-2xl font-black text-gray-800">이용자 목록</p>
              <span className="text-xl text-gray-400">총 {data.users.length}명</span>
            </div>
            {data.users.length === 0 ? (
              <p className="text-xl text-gray-400 text-center py-6">등록된 이용자가 없어요</p>
            ) : (
              <div className="flex flex-col divide-y divide-gray-100">
                {data.users.map(u => {
                  const age = new Date().getFullYear() - u.birth_year;
                  const exercisedToday = data.todaySessions.some(s => s.user_id === u.id);
                  return (
                    <div key={u.id} className="flex items-center gap-4 py-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-2xl font-black text-blue-600">{u.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-2xl font-bold text-gray-900">{u.name}</p>
                        <p className="text-lg text-gray-400">{age}세</p>
                      </div>
                      <span className={`text-lg px-3 py-1 rounded-full font-semibold ${
                        exercisedToday ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {exercisedToday ? '오늘 운동' : '미운동'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 하단 */}
      <div className="px-5 pb-10 pt-2 bg-gray-50 border-t border-gray-200">
        <button onClick={logout}
          className="w-full min-h-[60px] rounded-2xl border-2 border-gray-300 bg-white text-2xl font-semibold text-gray-500 active:scale-95 transition-transform">
          로그아웃
        </button>
      </div>
    </main>
  );
}
