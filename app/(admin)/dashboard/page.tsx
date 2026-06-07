'use client';

import { useState, useEffect, useCallback } from 'react';
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
  pin?: string;
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

const today = new Date().toLocaleDateString('ko-KR', {
  year:'numeric', month:'long', day:'numeric', weekday:'long',
});

// ── 이용자 등록 모달 ──────────────────────────────────────
function RegisterModal({
  facilityId,
  onClose,
  onSuccess,
}: {
  facilityId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name,      setName]      = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [pin,       setPin]       = useState('');
  const [pinKeys,   setPinKeys]   = useState<string[]>([]);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','←'];

  function handlePinKey(key: string) {
    if (key === '←') {
      const next = pinKeys.slice(0, -1);
      setPinKeys(next); setPin(next.join(''));
      return;
    }
    if (key === '' || pinKeys.length >= 4) return;
    const next = [...pinKeys, key];
    setPinKeys(next); setPin(next.join(''));
  }

  async function submit() {
    if (!name.trim()) { setError('이름을 입력해 주세요'); return; }
    if (pin.length !== 4) { setError('PIN 4자리를 입력해 주세요'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId,
          name: name.trim(),
          birthYear: birthYear ? parseInt(birthYear) : null,
          pin,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '등록 실패'); return; }
      onSuccess();
    } catch {
      setError('네트워크 오류. 다시 시도해 주세요');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* 모달 헤더 */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-5 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">이용자 등록</h2>
          <button onClick={onClose} className="text-white/60 text-3xl active:scale-90 transition-transform">✕</button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-5">

          {/* 이름 */}
          <div>
            <label className="text-xl font-bold text-gray-700 mb-2 block">이름 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-2xl focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* 생년 */}
          <div>
            <label className="text-xl font-bold text-gray-700 mb-2 block">출생년도 <span className="text-gray-400 text-lg font-normal">(선택)</span></label>
            <input
              type="number"
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              placeholder="1950"
              min={1920} max={2010}
              className="w-full border-2 border-gray-200 rounded-2xl px-5 py-4 text-2xl focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="text-xl font-bold text-gray-700 mb-2 block">PIN 4자리 <span className="text-red-500">*</span></label>
            <div className="flex gap-3 mb-3 justify-center">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                  i < pinKeys.length ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-300'
                }`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {KEYS.map((key, i) => (
                <button key={i} onClick={() => handlePinKey(key)}
                  disabled={key === ''}
                  className={`min-h-[56px] rounded-xl text-2xl font-bold transition-all active:scale-90
                    ${key === '' ? 'invisible' : ''}
                    ${key === '←' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                  {key}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-xl text-center bg-red-50 rounded-xl py-3">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full min-h-[68px] rounded-2xl bg-blue-600 text-white text-2xl font-black
                       active:scale-95 transition-transform shadow-md disabled:opacity-40">
            {loading ? '등록 중...' : '이용자 등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 이용자 삭제 확인 모달 ─────────────────────────────────
function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
}: {
  user: UserRow;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6"
         onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm flex flex-col items-center gap-5">
        <span className="text-6xl">⚠️</span>
        <p className="text-2xl font-black text-gray-900 text-center">{user.name}님을<br/>삭제하시겠습니까?</p>
        <p className="text-xl text-gray-500 text-center">운동 기록도 함께 삭제됩니다</p>
        <div className="flex gap-3 w-full">
          <button onClick={onClose} className="flex-1 min-h-[60px] rounded-2xl border-2 border-gray-200 text-xl font-bold text-gray-600 active:scale-95 transition-transform">
            취소
          </button>
          <button onClick={onConfirm} className="flex-1 min-h-[60px] rounded-2xl bg-red-500 text-white text-xl font-bold active:scale-95 transition-transform">
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 대시보드 ─────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [tab,          setTab]          = useState<'today' | 'users'>('today');
  const [data,         setData]         = useState<DashboardData>(MOCK_DATA);
  const [facilityId,   setFacilityId]   = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [loading,      setLoading]      = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const loadData = useCallback(async (facId: string) => {
    try {
      const res = await fetch(`/api/dashboard?facilityId=${facId}`);
      const d   = await res.json();
      if (d.todaySessions !== undefined) setData(d);
    } catch { /* fallback to mock */ }
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

  async function handleDeleteUser(user: UserRow) {
    try {
      await fetch(`/api/users?userId=${user.id}`, { method: 'DELETE' });
    } catch { /* ignore */ }
    setDeleteTarget(null);
    if (facilityId) loadData(facilityId);
  }

  function handleRegisterSuccess() {
    setShowRegister(false);
    if (facilityId) loadData(facilityId);
  }

  function logout() {
    ['wm_role','wm_user','wm_facility','wm_onboarded','wm_name','wm_goal'].forEach(k => localStorage.removeItem(k));
    router.push('/login');
  }

  const breakdown = Object.entries(EX_META).map(([key, meta]) => ({
    key, ...meta, count: data.breakdown[key] ?? 0,
  }));
  const maxCount = Math.max(...breakdown.map(e => e.count), 1);

  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit', hour12: false });
  }

  return (
    <>
      {showRegister && facilityId && (
        <RegisterModal
          facilityId={facilityId}
          onClose={() => setShowRegister(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDeleteUser(deleteTarget)}
        />
      )}

      <main className="min-h-screen bg-gray-50 flex flex-col">

        {/* 헤더 */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 pt-12 pb-6">
          <div className="flex items-center justify-between">
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
              { label:'오늘 이용자', value: data.todayUsers,          unit:'명',   color:'text-blue-600',   bg:'bg-blue-50'   },
              { label:'오늘 운동',  value: data.todaySessions.length, unit:'회',   color:'text-orange-600', bg:'bg-orange-50' },
              { label:'총 세트',   value: data.todaySets,            unit:'세트', color:'text-green-600',  bg:'bg-green-50'  },
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
                  <div className="flex flex-col items-center py-8 gap-3">
                    <span className="text-5xl">📋</span>
                    <p className="text-xl text-gray-400">오늘 운동 기록이 없어요</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-100">
                    {data.todaySessions.slice(0, 10).map(s => {
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
            <>
              {/* 이용자 등록 버튼 */}
              <button
                onClick={() => setShowRegister(true)}
                className="w-full min-h-[68px] rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700
                           text-white text-2xl font-black active:scale-95 transition-transform shadow-md
                           flex items-center justify-center gap-3">
                <span className="text-3xl">+</span> 이용자 등록
              </button>

              {/* 이용자 목록 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-2xl font-black text-gray-800">이용자 목록</p>
                  <span className="text-xl text-gray-400">총 {data.users.length}명</span>
                </div>
                {data.users.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-3">
                    <span className="text-5xl">👤</span>
                    <p className="text-xl text-gray-400">등록된 이용자가 없어요</p>
                    <p className="text-lg text-gray-300">위 버튼으로 이용자를 등록해 주세요</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-100">
                    {data.users.map(u => {
                      const age = u.birth_year ? new Date().getFullYear() - u.birth_year : null;
                      const exercisedToday = data.todaySessions.some(s => s.user_id === u.id);
                      return (
                        <div key={u.id} className="flex items-center gap-4 py-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <span className="text-2xl font-black text-blue-600">{u.name[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-2xl font-bold text-gray-900">{u.name}</p>
                              {u.pin && (
                                <span className="text-base bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg font-mono">
                                  PIN: {u.pin}
                                </span>
                              )}
                            </div>
                            <p className="text-lg text-gray-400">{age ? `${age}세` : '나이 미입력'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className={`text-base px-3 py-1 rounded-full font-semibold ${
                              exercisedToday ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {exercisedToday ? '오늘 운동' : '미운동'}
                            </span>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="text-base text-red-400 active:scale-90 transition-transform px-1">
                              삭제
                            </button>
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

        {/* 하단 */}
        <div className="px-5 pb-10 pt-2 bg-gray-50 border-t border-gray-200">
          <button onClick={logout}
            className="w-full min-h-[60px] rounded-2xl border-2 border-gray-300 bg-white text-2xl font-semibold text-gray-500 active:scale-95 transition-transform">
            로그아웃
          </button>
        </div>
      </main>
    </>
  );
}
