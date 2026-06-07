'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── 목 데이터 (Supabase 연동 전) ──────────────────────
const STATS = {
  todayUsers:    12,
  todaySets:     87,
  todaySessions: 28,
  weekUsers:     54,
};

const EXERCISE_BREAKDOWN = [
  { type: '스쿼트',    emoji: '🦵', count: 32, color: 'bg-orange-400' },
  { type: '종아리',    emoji: '🦶', count: 24, color: 'bg-emerald-400' },
  { type: '팔 운동',  emoji: '💪', count: 18, color: 'bg-blue-400' },
  { type: '균형 운동', emoji: '⚖️', count: 13, color: 'bg-violet-400' },
];
const maxCount = Math.max(...EXERCISE_BREAKDOWN.map(e => e.count));

const RECENT_SESSIONS = [
  { id: 1,  name: '김영숙', type: '스쿼트',    emoji: '🦵', sets: 3, time: '10:32' },
  { id: 2,  name: '이철수', type: '균형 운동', emoji: '⚖️', sets: 2, time: '10:18' },
  { id: 3,  name: '박순자', type: '종아리',    emoji: '🦶', sets: 3, time: '09:55' },
  { id: 4,  name: '최민자', type: '팔 운동',  emoji: '💪', sets: 3, time: '09:40' },
  { id: 5,  name: '정동호', type: '스쿼트',    emoji: '🦵', sets: 3, time: '09:22' },
  { id: 6,  name: '강선희', type: '균형 운동', emoji: '⚖️', sets: 3, time: '09:08' },
];

const today = new Date().toLocaleDateString('ko-KR', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
});

export default function DashboardPage() {
  const router  = useRouter();
  const [tab, setTab] = useState<'today' | 'users'>('today');

  const USERS = [
    { id: 1, name: '김영숙', birth: 1950, sessions: 24, lastDate: '오늘' },
    { id: 2, name: '이철수', birth: 1948, sessions: 18, lastDate: '오늘' },
    { id: 3, name: '박순자', birth: 1953, sessions: 31, lastDate: '오늘' },
    { id: 4, name: '최민자', birth: 1956, sessions: 12, lastDate: '어제' },
    { id: 5, name: '정동호', birth: 1944, sessions:  9, lastDate: '어제' },
    { id: 6, name: '강선희', birth: 1951, sessions: 22, lastDate: '오늘' },
    { id: 7, name: '윤복순', birth: 1958, sessions:  5, lastDate: '3일 전' },
  ];

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── 헤더 ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-300 text-lg">{today}</p>
            <h1 className="text-4xl font-black text-white mt-1">관리자 대시보드</h1>
            <p className="text-gray-400 text-xl mt-0.5">행복노인복지관</p>
          </div>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <span className="text-4xl">🏢</span>
          </div>
        </div>
      </div>

      {/* ── 오늘 요약 카드 ─────────────────────────── */}
      <div className="px-5 -mt-1 pt-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '오늘 이용자', value: STATS.todayUsers, unit: '명',  color: 'text-blue-600',   bg: 'bg-blue-50'   },
            { label: '오늘 운동',  value: STATS.todaySessions, unit: '회', color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: '총 세트',   value: STATS.todaySets,  unit: '세트', color: 'text-green-600',  bg: 'bg-green-50'  },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-2xl p-4 text-center`}>
              <p className={`text-4xl font-black ${c.color}`}>{c.value}</p>
              <p className={`text-base ${c.color} opacity-70`}>{c.unit}</p>
              <p className="text-base text-gray-500 mt-1 leading-tight">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 탭 ──────────────────────────────────────── */}
      <div className="px-5 mt-5 flex gap-2">
        {(['today', 'users'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 min-h-[52px] rounded-xl text-2xl font-bold transition-all
              ${tab === t
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white text-gray-400 border border-gray-200'
              }`}
          >
            {t === 'today' ? '📊 오늘 현황' : '👥 이용자'}
          </button>
        ))}
      </div>

      {/* ── 탭 콘텐츠 ───────────────────────────────── */}
      <div className="flex-1 px-5 mt-5 pb-8 overflow-y-auto flex flex-col gap-5">

        {tab === 'today' && (
          <>
            {/* 운동 종목별 분포 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-2xl font-black text-gray-800 mb-4">운동 종목별 현황</p>
              <div className="flex flex-col gap-3">
                {EXERCISE_BREAKDOWN.map(ex => (
                  <div key={ex.type} className="flex items-center gap-3">
                    <span className="text-2xl w-8">{ex.emoji}</span>
                    <span className="text-xl text-gray-600 w-20 shrink-0">{ex.type}</span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${ex.color} rounded-full transition-all duration-500`}
                        style={{ width: `${(ex.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xl font-bold text-gray-700 w-8 text-right">{ex.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 운동 세션 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <p className="text-2xl font-black text-gray-800 mb-4">최근 운동 기록</p>
              <div className="flex flex-col divide-y divide-gray-100">
                {RECENT_SESSIONS.map(s => (
                  <div key={s.id} className="flex items-center gap-4 py-3">
                    <span className="text-3xl">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-gray-900">{s.name}</p>
                      <p className="text-lg text-gray-500">{s.type} · {s.sets}세트</p>
                    </div>
                    <p className="text-xl text-gray-400 shrink-0">{s.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-2xl font-black text-gray-800">이용자 목록</p>
              <span className="text-xl text-gray-400">총 {USERS.length}명</span>
            </div>
            <div className="flex flex-col divide-y divide-gray-100">
              {USERS.map(u => (
                <div key={u.id} className="flex items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-blue-600">
                      {u.name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-gray-900">{u.name}</p>
                    <p className="text-lg text-gray-400">
                      {new Date().getFullYear() - u.birth}세 · 누적 {u.sessions}회
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-lg px-3 py-1 rounded-full font-semibold ${
                      u.lastDate === '오늘'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {u.lastDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 하단 버튼 ───────────────────────────────── */}
      <div className="px-5 pb-10 pt-2 bg-gray-50 border-t border-gray-200">
        <button
          onClick={() => router.push('/login')}
          className="w-full min-h-[60px] rounded-2xl border-2 border-gray-300 bg-white
                     text-2xl font-semibold text-gray-500 active:scale-95 transition-transform"
        >
          로그아웃
        </button>
      </div>
    </main>
  );
}
