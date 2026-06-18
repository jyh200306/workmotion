'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseType } from '@/types';
import { ExerciseIcon, FlameIcon, RunIcon, StackIcon } from '@/components/Icon';

type UserData = { id: string; name: string; birth_year?: number };
type SessionRow = { exercise_type: string; sets_completed: number; started_at: string };

const EX: Record<string, { name: string }> = {
  squat:     { name: '스쿼트' },
  deadlift:  { name: '데드리프트' },
  lunge:     { name: '런지' },
  hip_hinge: { name: '힙힌지' },
};

const GOAL_LABELS: Record<string, string> = {
  strength: '근력 강화', balance: '균형 향상', health: '건강 유지',
};

function weekDates() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const [user,     setUser]     = useState<UserData | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [goal,     setGoal]     = useState('');

  useEffect(() => {
    setGoal(localStorage.getItem('wm_goal') ?? '');
    try {
      const u: UserData = JSON.parse(localStorage.getItem('wm_user') ?? '{}');
      setUser(u);
      if (u.id) {
        fetch(`/api/sessions?userId=${u.id}`)
          .then(r => r.json())
          .then(d => { if (d.sessions) setSessions(d.sessions); })
          .catch(() => {});
      }
    } catch { /**/ }
  }, []);

  function logout() {
    ['wm_role','wm_user','wm_facility','wm_onboarded','wm_name','wm_goal'].forEach(k => localStorage.removeItem(k));
    router.push('/login');
  }

  const week      = weekDates();
  const weekDone  = new Set(sessions.map(s => s.started_at.slice(0, 10)));
  const totalSets = sessions.reduce((a, s) => a + s.sets_completed, 0);
  const age       = user?.birth_year ? new Date().getFullYear() - user.birth_year : null;

  const streak = (() => {
    let count = 0;
    const d   = new Date();
    while (weekDone.has(d.toISOString().slice(0, 10))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const favEx = (() => {
    const cnt: Record<string, number> = {};
    sessions.forEach(s => { cnt[s.exercise_type] = (cnt[s.exercise_type] ?? 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  })();

  return (
    <main className="min-h-screen bg-[#14181d] flex flex-col">

      {/* 헤더 */}
      <div className="bg-[#1a2026] px-6 pt-14 pb-6">
        <button onClick={() => router.push('/exercise')} className="flex items-center gap-1.5 text-base text-[#a0a0a0] mb-5 active:opacity-60 transition-opacity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          돌아가기
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#23291a] flex items-center justify-center">
            <span className="text-2xl font-bold text-[#d8ff36]">{user?.name?.[0] ?? 'M'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f0f0f0] tracking-tight">{user?.name ?? '이용자'}님</h1>
            <div className="flex items-center gap-2 mt-1">
              {age && <p className="text-base text-[#a0a0a0]">{age}세</p>}
              {goal && (
                <>
                  {age && <span className="text-[#6a6a6a]">·</span>}
                  <p className="text-base text-[#a0a0a0]">{GOAL_LABELS[goal] ?? goal}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-5 py-5 flex flex-col gap-4 overflow-y-auto">

        {/* 스탯 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:'연속 운동', value:`${streak}일`,          Icon: FlameIcon },
            { label:'총 운동',  value:`${sessions.length}회`, Icon: RunIcon },
            { label:'총 세트',  value:`${totalSets}세트`,     Icon: StackIcon },
          ].map(c => (
            <div key={c.label} className="bg-[#1a2026] rounded-2xl border border-[#2a3139] p-4 text-center">
              <c.Icon size={22} className="mx-auto mb-1.5 text-[#d8ff36]" />
              <p className="text-xl font-bold text-[#f0f0f0] tabular-nums">{c.value}</p>
              <p className="text-xs text-[#6a6a6a] mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* 이번 주 */}
        <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] px-5 py-5">
          <p className="text-lg font-bold text-[#f0f0f0] mb-4">이번 주 운동</p>
          <div className="flex gap-1.5">
            {week.map((d, i) => {
              const done    = weekDone.has(d);
              const isToday = d === new Date().toISOString().slice(0, 10);
              const label   = ['일','월','화','수','목','금','토'][new Date(d + 'T12:00:00').getDay()];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <p className={`text-sm font-medium ${isToday ? 'text-[#d8ff36]' : 'text-[#6a6a6a]'}`}>{label}</p>
                  <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${
                    done ? 'bg-[#d8ff36]' : isToday ? 'border-2 border-[#d8ff36]' : 'bg-[#2a3139]'
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

        {/* 선호 운동 */}
        {favEx && EX[favEx] && (
          <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#23291a] text-[#d8ff36]">
              <ExerciseIcon type={favEx as ExerciseType} size={26} />
            </div>
            <div>
              <p className="text-sm text-[#a0a0a0]">가장 많이 한 운동</p>
              <p className="text-lg font-bold text-[#f0f0f0]">{EX[favEx].name}</p>
            </div>
          </div>
        )}

        {/* 최근 기록 */}
        {sessions.length > 0 && (
          <div className="bg-[#1a2026] rounded-2xl border border-[#2a3139] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a3139]">
              <p className="text-lg font-bold text-[#f0f0f0]">최근 기록</p>
              <button onClick={() => router.push('/history')} className="text-sm text-[#d8ff36] font-semibold active:opacity-60 transition-opacity">
                전체 보기
              </button>
            </div>
            {sessions.slice(0, 3).map((s, idx) => {
              const ex = EX[s.exercise_type] ?? { name: s.exercise_type };
              const known = !!EX[s.exercise_type];
              return (
                <div key={s.started_at + idx} className={`flex items-center gap-4 px-5 py-4 ${idx !== Math.min(sessions.length, 3) - 1 ? 'border-b border-[#2a3139]' : ''}`}>
                  <span className="w-9 h-9 rounded-lg bg-[#23291a] text-[#d8ff36] flex items-center justify-center shrink-0">
                    {known ? <ExerciseIcon type={s.exercise_type as ExerciseType} size={20} /> : <RunIcon size={20} />}
                  </span>
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-[#f0f0f0]">{ex.name}</p>
                    <p className="text-sm text-[#a0a0a0]">{s.sets_completed}세트</p>
                  </div>
                  <p className="text-sm text-[#6a6a6a]">
                    {new Date(s.started_at).toLocaleDateString('ko-KR', { month:'short', day:'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 로그아웃 */}
        <button onClick={logout}
          className="w-full min-h-[52px] rounded-2xl bg-[#1a2026] border border-[#2a3139] text-base font-semibold text-[#a0a0a0] active:scale-95 transition-transform mt-2">
          로그아웃
        </button>
      </div>
    </main>
  );
}
