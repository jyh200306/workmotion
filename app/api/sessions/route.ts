import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId 필요' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, exerciseType, setsCompleted, durationSec } = body;

  if (!userId || !exerciseType) {
    return NextResponse.json({ error: '필수 값 누락' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id:        userId,
      exercise_type:  exerciseType,
      sets_completed: setsCompleted ?? 0,
      duration_sec:   durationSec  ?? 0,
      ended_at:       new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data }, { status: 201 });
}
