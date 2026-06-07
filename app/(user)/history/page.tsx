'use client';

import { useRouter } from 'next/navigation';

// 목 데이터 (Supabase 연동 전)
const MOCK_HISTORY = [
  { id: 1, date: '2026-06-07', type: 'squat',   name: '스쿼트',    emoji: '🦵', sets: 3, duration: 62 },
  { id: 2, date: '2026-06-07', type: 'balance', name: '균형 운동', emoji: '⚖️', sets: 2, duration: 44 },
  { id: 3, date: '2026-06-06', type: 'calf',    name: '종아리 운동', emoji: '🦶', sets: 3, duration: 68 },
  { id: 4, date: '2026-06-05', type: 'push',    name: '팔 운동',   emoji: '💪', sets: 3, duration: 55 },
  { id: 5, date: '2026-06-05', type: 'squat',   name: '스쿼트',    emoji: '🦵', sets: 3, duration: 61 },
  { id: 6, date: '2026-06-03', type: 'balance', name: '균형 운동', emoji: '⚖️', sets: 3, duration: 70 },
];

const TYPE_COLOR: Record<string, string> = {
  squat:   'bg-orange-100 text-orange-700',
  calf:    'bg-emerald-100 text-emerald-700',
  push:    'bg-blue-100 text-blue-700',
  balance: 'bg-violet-100 text-violet-700',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function groupByDate(list: typeof MOCK_HISTORY) {
  const map = new Map<string, typeof MOCK_HISTORY>();
  for (const item of list) {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date)!.push(item);
  }
  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

export default function HistoryPage() {
  const router = useRouter();
  const groups = groupByDate(MOCK_HISTORY);
  const totalSessions = MOCK_HISTORY.length;
  const totalSets = MOCK_HISTORY.reduce((s, h) => s + h.sets, 0);
  const activeDays = new Set(MOCK_HISTORY.map(h => h.date)).size;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white px-6 pt-12 pb-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.push('/exercise')}
            className="text-2xl text-gray-400 active:scale-90 transition-transform"
          >
            ←
          </button>
          <h1 className="text-4xl font-black text-gray-900">운동 기록</h1>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '총 운동', value: totalSessions, unit: '회' },
            { label: '총 세트', value: totalSets,     unit: '세트' },
            { label: '운동 일수', value: activeDays,   unit: '일' },
          ].map(item => (
            <div key={item.label} className="bg-blue-50 rounded-2xl p-4 text-center">
              <p className="text-4xl font-black text-blue-700">{item.value}</p>
              <p className="text-base text-blue-500 mt-0.5">{item.unit}</p>
              <p className="text-base text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 기록 리스트 */}
      <div className="flex-1 px-5 py-6 flex flex-col gap-6 overflow-y-auto">
        {groups.map(([date, items]) => (
          <div key={date}>
            <p className="text-xl font-bold text-gray-500 mb-3 px-1">{formatDate(date)}</p>
            <div className="flex flex-col gap-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gray-50 text-4xl shrink-0">
                    {item.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-base px-2.5 py-0.5 rounded-full font-semibold ${TYPE_COLOR[item.type]}`}>
                        {item.sets}세트
                      </span>
                      <span className="text-lg text-gray-400">{formatDuration(item.duration)}</span>
                    </div>
                  </div>
                  <span className="text-3xl">✓</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 바닥 버튼 */}
      <div className="px-5 pb-10 pt-2 bg-gray-50">
        <button
          onClick={() => router.push('/exercise')}
          className="w-full min-h-[68px] rounded-2xl bg-blue-600 text-white
                     text-2xl font-bold active:scale-95 transition-transform shadow-md"
        >
          운동 하러 가기
        </button>
      </div>
    </main>
  );
}
