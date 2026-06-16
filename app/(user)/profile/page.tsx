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
    <main className="min-h-screen bg-[#f2f4f6] flex flex-col">

      {/* 헤더 */}
      <div className="bg-white px-6 pt-14 pb-6">
        <button onClick={() => router.push('/exercise')} className="flex items-center gap-1.5 text-xl text-[#6b7684] mb-5 active:opacity-60 transition-opacity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          돌아가기
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#ebf3ff] flex items-center justify-center">
            <span className="text-2xl font-bold text-[#0064ff]">{user?.name?.[0] ?? 'M'}</span>
          </div>
          <div>
            <h1 className="text-[26px] font-bold text-[#202632]">{user?.name ?? '이용자'}님</h1>
            <div className="flex items-center gap-2 mt-1">
              {age && <p className="text-lg text-[#6b7684]">{age}세</p>}
              {goal && (
                <>
                  {age && <span className="text-[#b0b8c1]">·</span>}
                  <p className="text-lg text-[#6b7684]">{GOAL_LABELS[goal] ?? goal}</p>
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
            <div key={c.label} className="bg-white rounded-2xl border border-[#e5e8eb] p-4 text-center">
              <c.Icon size={24} className="mx-auto mb-1.5 text-[#0064ff]" />
              <p className="text-2xl font-bold text-[#202632]">{c.value}</p>
              <p className="text-sm text-[#b0b8c1] mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* 이번 주 */}
        <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-5">
          <p className="text-xl font-bold text-[#202632] mb-4">이번 주 운동</p>
          <div className="flex gap-1.5">
            {week.map((d, i) => {
              const done    = weekDone.has(d);
              const isToday = d === new Date().toISOString().slice(0, 10);
              const label   = ['일','월','화','수','목','금','토'][new Date(d + 'T12:00:00').getDay()];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <p className={`text-sm font-medium ${isToday ? 'text-[#0064ff]' : 'text-[#b0b8c1]'}`}>{label}</p>
                  <div className={`w-full aspect-square rounded-xl flex items-center justify-center ${
                    done ? 'bg-[#0064ff]' : isToday ? 'border-2 border-[#0064ff]' : 'bg-[#f2f4f6]'
                  }`}>
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
          <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#ebf3ff] text-[#0064ff]">
              <ExerciseIcon type={favEx as ExerciseType} size={26} />
            </div>
            <div>
              <p className="text-lg text-[#6b7684]">가장 많이 한 운동</p>
              <p className="text-2xl font-bold text-[#202632]">{EX[favEx].name}</p>
            </div>
          </div>
        )}

        {/* 최근 기록 */}
        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f4f6]">
              <p className="text-xl font-bold text-[#202632]">최근 기록</p>
              <button onClick={() => router.push('/history')} className="text-lg text-[#0064ff] font-semibold active:opacity-60 transition-opacity">
                전체 보기
              </button>
            </div>
            {sessions.slice(0, 3).map((s, idx) => {
              const ex = EX[s.exercise_type] ?? { name: s.exercise_type };
              const known = !!EX[s.exercise_type];
              return (
                <div key={s.started_at + idx} className={`flex items-center gap-4 px-5 py-4 ${idx !== Math.min(sessions.length, 3) - 1 ? 'border-b border-[#f2f4f6]' : ''}`}>
                  <span className="w-9 h-9 rounded-lg bg-[#ebf3ff] text-[#0064ff] flex items-center justify-center shrink-0">
                    {known ? <ExerciseIcon type={s.exercise_type as ExerciseType} size={20} /> : <RunIcon size={20} />}
                  </span>
                  <div className="flex-1">
                    <p className="text-2xl font-semibold text-[#202632]">{ex.name}</p>
                    <p className="text-lg text-[#6b7684]">{s.sets_completed}세트</p>
                  </div>
                  <p className="text-lg text-[#b0b8c1]">
                    {new Date(s.started_at).toLocaleDateString('ko-KR', { month:'short', day:'numeric' })}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* 로그아웃 */}
        <button onClick={logout}
          className="w-full min-h-[56px] rounded-2xl bg-white border border-[#e5e8eb] text-xl font-semibold text-[#6b7684] active:scale-95 transition-transform mt-2">
          로그아웃
        </button>
      </div>
    </main>
  );
}
