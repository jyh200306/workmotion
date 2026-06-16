import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const facilityId = req.nextUrl.searchParams.get('facilityId');

  const supabase = createAdminClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 오늘 세션 (이용자 이름 join)
  const { data: todaySessions } = await supabase
    .from('sessions')
    .select('*, users!inner(name, facility_id)')
    .gte('started_at', todayStart.toISOString())
    .order('started_at', { ascending: false });

  const sessions = (todaySessions ?? []).filter((s: any) =>
    !facilityId || s.users?.facility_id === facilityId
  );

  // 이용자 목록
  const { data: users } = await supabase
    .from('users')
    .select('id, name, birth_year')
    .eq(facilityId ? 'facility_id' : 'id', facilityId || 'skip')
    .order('name');

  // 운동 종목별 집계
  const breakdown: Record<string, number> = { squat: 0, deadlift: 0, lunge: 0, hip_hinge: 0 };
  sessions.forEach((s: any) => { breakdown[s.exercise_type] = (breakdown[s.exercise_type] ?? 0) + 1; });

  const uniqueUsers = new Set(sessions.map((s: any) => s.user_id)).size;

  return NextResponse.json({
    todaySessions: sessions,
    todayUsers:    uniqueUsers,
    todaySets:     sessions.reduce((a: number, s: any) => a + (s.sets_completed ?? 0), 0),
    breakdown,
    users: users ?? [],
  });
}
