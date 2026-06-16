'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ExerciseType } from '@/types';
import { ExerciseIcon, RunIcon, BuildingIcon } from '@/components/Icon';

type SessionRow = {
  id: string; user_id: string; exercise_type: string;
  sets_completed: number; duration_sec: number; started_at: string;
  users?: { name: string; facility_id: string };
};
type UserRow = { id: string; name: string; birth_year: number; pin?: string };
type DashData = {
  todaySessions: SessionRow[]; todayUsers: number; todaySets: number;
  breakdown: Record<string, number>; users: UserRow[];
};

const EX: Record<string, { label: string }> = {
  squat:   { label: '스쿼트' },
  calf:    { label: '종아리' },
  push:    { label: '팔 운동' },
  balance: { label: '균형 운동' },
};

const MOCK: DashData = {
  todaySessions: [
    { id:'1', user_id:'a', exercise_type:'squat',   sets_completed:3, duration_sec:62, started_at: new Date(Date.now()-600000).toISOString(),  users:{ name:'김영숙', facility_id:'' } },
    { id:'2', user_id:'b', exercise_type:'balance', sets_completed:2, duration_sec:44, started_at: new Date(Date.now()-1200000).toISOString(), users:{ name:'이철수', facility_id:'' } },
    { id:'3', user_id:'c', exercise_type:'calf',    sets_completed:3, duration_sec:68, started_at: new Date(Date.now()-2400000).toISOString(), users:{ name:'박순자', facility_id:'' } },
  ],
  todayUsers: 3, todaySets: 8,
  breakdown: { squat: 8, calf: 6, push: 5, balance: 4 },
  users: [
    { id:'a', name:'김영숙', birth_year:1950 },
    { id:'b', name:'이철수', birth_year:1948 },
    { id:'c', name:'박순자', birth_year:1953 },
  ],
};

const today = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });

// ── 이용자 등록 모달 ───────────────────────────────────────
function RegisterModal({ facilityId, onClose, onSuccess }: { facilityId: string; onClose: () => void; onSuccess: () => void }) {
  const [name,      setName]      = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [pin,       setPin]       = useState('');
  const [pinKeys,   setPinKeys]   = useState<string[]>([]);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','←'];

  function handlePinKey(key: string) {
    if (key === '←') { const n = pinKeys.slice(0,-1); setPinKeys(n); setPin(n.join('')); return; }
    if (key === '' || pinKeys.length >= 4) return;
    const n = [...pinKeys, key]; setPinKeys(n); setPin(n.join(''));
  }

  async function submit() {
    if (!name.trim()) { setError('이름을 입력해 주세요'); return; }
    if (pin.length !== 4) { setError('PIN 4자리를 입력해 주세요'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ facilityId, name: name.trim(), birthYear: birthYear ? parseInt(birthYear) : null, pin }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '등록 실패'); return; }
      onSuccess();
    } catch { setError('네트워크 오류'); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f2f4f6]">
          <h2 className="text-2xl font-bold text-[#202632]">이용자 등록</h2>
          <button onClick={onClose} aria-label="닫기" className="text-[#6b7684] active:opacity-60 w-10 h-10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-5">
          <div>
            <label className="text-lg font-semibold text-[#6b7684] mb-2 block">이름 <span className="text-[#0064ff]">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동"
              className="w-full border-b-2 border-[#e5e8eb] bg-transparent text-2xl font-semibold text-[#202632] py-2 placeholder-[#b0b8c1] focus:outline-none focus:border-[#0064ff] transition-colors" />
          </div>

          <div>
            <label className="text-lg font-semibold text-[#6b7684] mb-2 block">출생년도 <span className="text-[#b0b8c1] font-normal text-base">(선택)</span></label>
            <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)} placeholder="1950" min={1920} max={2010}
              className="w-full border-b-2 border-[#e5e8eb] bg-transparent text-2xl font-semibold text-[#202632] py-2 placeholder-[#b0b8c1] focus:outline-none focus:border-[#0064ff] transition-colors" />
          </div>

          <div>
            <label className="text-lg font-semibold text-[#6b7684] mb-3 block">PIN 4자리 <span className="text-[#0064ff]">*</span></label>
            <div className="flex gap-3 mb-4 justify-center">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < pinKeys.length ? 'bg-[#0064ff]' : 'bg-[#e5e8eb]'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {KEYS.map((key, i) => (
                <button key={i} onClick={() => handlePinKey(key)} disabled={key === ''}
                  className={`min-h-[52px] rounded-xl text-2xl font-semibold transition-all active:scale-90
                    ${key === '' ? 'invisible' : key === '←' ? 'bg-[#f2f4f6] text-[#6b7684] text-xl' : 'bg-[#f2f4f6] text-[#202632]'}`}>
                  {key}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-lg text-[#202632] bg-[#f2f4f6] rounded-xl py-3 text-center">{error}</p>}

          <button onClick={submit} disabled={loading}
            className="w-full min-h-[60px] rounded-2xl bg-[#0064ff] text-white text-xl font-bold active:scale-95 transition-transform disabled:opacity-40">
            {loading ? '등록 중' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ user, onClose, onConfirm }: { user: UserRow; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm flex flex-col items-center gap-5">
        <p className="text-2xl font-bold text-[#202632] text-center">{user.name}님의 정보를<br/>삭제할까요?</p>
        <p className="text-xl text-[#6b7684] text-center">운동 기록도 함께 삭제됩니다</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 min-h-[56px] rounded-2xl bg-[#f2f4f6] text-xl font-semibold text-[#6b7684] active:scale-95 transition-transform">취소</button>
          <button onClick={onConfirm} className="flex-1 min-h-[56px] rounded-2xl bg-[#202632] text-white text-xl font-semibold active:scale-95 transition-transform">삭제</button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [tab,          setTab]          = useState<'today' | 'users'>('today');
  const [data,         setData]         = useState<DashData>(MOCK);
  const [facilityId,   setFacilityId]   = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [loading,      setLoading]      = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const loadData = useCallback(async (facId: string) => {
    try {
      const d = await fetch(`/api/dashboard?facilityId=${facId}`).then(r => r.json());
      if (d.todaySessions !== undefined) setData(d);
    } catch { /**/ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const facStr = localStorage.getItem('wm_facility');
    if (facStr) {
      const fac = JSON.parse(facStr);
      setFacilityId(fac.id ?? '');
      setFacilityName(fac.name ?? '');
      loadData(fac.id);
    } else {
      setLoading(false);
    }
  }, [loadData]);

  async function handleDeleteUser(u: UserRow) {
    try { await fetch(`/api/users?userId=${u.id}`, { method: 'DELETE' }); } catch { /**/ }
    setDeleteTarget(null);
    if (facilityId) loadData(facilityId);
  }

  function logout() {
    ['wm_role','wm_user','wm_facility','wm_onboarded','wm_name','wm_goal'].forEach(k => localStorage.removeItem(k));
    router.push('/login');
  }

  const breakdown = Object.entries(EX).map(([key, meta]) => ({ key, ...meta, count: data.breakdown[key] ?? 0 }));
  const maxCount  = Math.max(...breakdown.map(e => e.count), 1);

  return (
    <>
      {showRegister && facilityId && (
        <RegisterModal facilityId={facilityId} onClose={() => setShowRegister(false)} onSuccess={() => { setShowRegister(false); if (facilityId) loadData(facilityId); }} />
      )}
      {deleteTarget && (
        <DeleteModal user={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => handleDeleteUser(deleteTarget)} />
      )}

      <main className="min-h-screen bg-[#f2f4f6] flex flex-col">

        {/* 헤더 */}
        <div className="bg-[#202632] px-6 pt-14 pb-6">
          <p className="text-[#6b7684] text-lg mb-1">{today}</p>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[26px] font-bold text-white">관리자</h1>
              <p className="text-[#6b7684] text-xl mt-0.5">{facilityName || '행복노인복지관'}</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
              <BuildingIcon size={24} />
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="px-5 -mt-1 pt-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'오늘 이용자', value: data.todayUsers,          unit:'명' },
              { label:'오늘 운동',  value: data.todaySessions.length, unit:'회' },
              { label:'총 세트',   value: data.todaySets,            unit:'세트' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-2xl border border-[#e5e8eb] p-4 text-center">
                <p className="text-[28px] font-bold text-[#0064ff]">{loading ? '·' : c.value}</p>
                <p className="text-base text-[#b0b8c1]">{c.unit}</p>
                <p className="text-sm text-[#6b7684] mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 탭 */}
        <div className="px-5 mt-4 flex gap-2">
          {(['today','users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 min-h-[48px] rounded-2xl text-xl font-semibold transition-all
                ${tab === t ? 'bg-[#202632] text-white' : 'bg-white border border-[#e5e8eb] text-[#6b7684]'}`}>
              {t === 'today' ? '오늘 현황' : '이용자'}
            </button>
          ))}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 px-5 mt-4 pb-8 overflow-y-auto flex flex-col gap-4">

          {tab === 'today' && (
            <>
              <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-5">
                <p className="text-xl font-bold text-[#202632] mb-5">운동 종목별 현황</p>
                <div className="flex flex-col gap-4">
                  {breakdown.map(ex => (
                    <div key={ex.key} className="flex items-center gap-3">
                      <span className="w-7 text-[#0064ff] shrink-0"><ExerciseIcon type={ex.key as ExerciseType} size={22} /></span>
                      <span className="text-xl text-[#6b7684] w-20 shrink-0">{ex.label}</span>
                      <div className="flex-1 h-2 bg-[#f2f4f6] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#0064ff] transition-all duration-500" style={{ width: `${(ex.count / maxCount) * 100}%` }} />
                      </div>
                      <span className="text-lg font-bold text-[#202632] w-6 text-right">{ex.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e5e8eb] px-5 py-5">
                <p className="text-xl font-bold text-[#202632] mb-4">오늘 운동 기록</p>
                {data.todaySessions.length === 0 ? (
                  <p className="text-xl text-[#b0b8c1] text-center py-6">오늘 운동 기록이 없어요</p>
                ) : (
                  <div className="flex flex-col divide-y divide-[#f2f4f6]">
                    {data.todaySessions.slice(0, 10).map(s => {
                      const meta = EX[s.exercise_type] ?? { label: s.exercise_type };
                      const known = !!EX[s.exercise_type];
                      return (
                        <div key={s.id} className="flex items-center gap-4 py-3.5">
                          <span className="w-9 h-9 rounded-lg bg-[#ebf3ff] text-[#0064ff] flex items-center justify-center shrink-0">
                            {known ? <ExerciseIcon type={s.exercise_type as ExerciseType} size={20} /> : <RunIcon size={20} />}
                          </span>
                          <div className="flex-1">
                            <p className="text-2xl font-semibold text-[#202632]">{s.users?.name ?? '이용자'}</p>
                            <p className="text-lg text-[#6b7684]">{meta.label} · {s.sets_completed}세트</p>
                          </div>
                          <p className="text-lg text-[#b0b8c1]">
                            {new Date(s.started_at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12: false })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'users' && (
            <>
              <button onClick={() => setShowRegister(true)}
                className="w-full min-h-[56px] rounded-2xl bg-[#0064ff] text-white text-xl font-bold active:scale-95 transition-transform flex items-center justify-center gap-2">
                <span className="text-2xl font-light">+</span> 이용자 등록
              </button>

              <div className="bg-white rounded-2xl border border-[#e5e8eb] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#f2f4f6]">
                  <p className="text-xl font-bold text-[#202632]">이용자 목록</p>
                  <span className="text-lg text-[#b0b8c1]">{data.users.length}명</span>
                </div>
                {data.users.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-3">
                    <p className="text-xl text-[#b0b8c1]">등록된 이용자가 없어요</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-[#f2f4f6]">
                    {data.users.map(u => {
                      const age = u.birth_year ? new Date().getFullYear() - u.birth_year : null;
                      const exercisedToday = data.todaySessions.some(s => s.user_id === u.id);
                      return (
                        <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                          <button
                            onClick={() => { sessionStorage.setItem(`wm_admin_user_${u.id}`, JSON.stringify({ name: u.name })); router.push(`/dashboard/users/${u.id}`); }}
                            className="w-11 h-11 rounded-full bg-[#ebf3ff] flex items-center justify-center shrink-0 active:opacity-70 transition-opacity">
                            <span className="text-lg font-bold text-[#0064ff]">{u.name[0]}</span>
                          </button>
                          <button
                            onClick={() => { sessionStorage.setItem(`wm_admin_user_${u.id}`, JSON.stringify({ name: u.name })); router.push(`/dashboard/users/${u.id}`); }}
                            className="flex-1 min-w-0 text-left active:opacity-70 transition-opacity">
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-semibold text-[#202632]">{u.name}</p>
                              {u.pin && <span className="text-sm bg-[#f2f4f6] text-[#6b7684] px-2 py-0.5 rounded-lg font-mono">PIN {u.pin}</span>}
                            </div>
                            <p className="text-lg text-[#b0b8c1] mt-0.5">{age ? `${age}세` : '나이 미입력'}</p>
                          </button>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-sm px-2.5 py-1 rounded-full font-semibold ${exercisedToday ? 'bg-[#ebf3ff] text-[#0064ff]' : 'bg-[#f2f4f6] text-[#b0b8c1]'}`}>
                              {exercisedToday ? '완료' : '미운동'}
                            </span>
                            <button onClick={() => setDeleteTarget(u)} className="text-lg text-[#6b7684] active:opacity-60 px-1">삭제</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 로그아웃 */}
        <div className="px-5 pb-12 pt-2 border-t border-[#e5e8eb] bg-[#f2f4f6]">
          <button onClick={logout} className="w-full min-h-[56px] rounded-2xl bg-white border border-[#e5e8eb] text-xl font-semibold text-[#6b7684] active:scale-95 transition-transform">
            로그아웃
          </button>
        </div>
      </main>
    </>
  );
}
