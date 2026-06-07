import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const facilityId = req.nextUrl.searchParams.get('facilityId');
  if (!facilityId) return NextResponse.json({ error: 'facilityId 필요' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, name, birth_year, pin, created_at')
    .eq('facility_id', facilityId)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { facilityId, name, birthYear, pin } = body;

  if (!facilityId || !name || !pin) {
    return NextResponse.json({ error: '필수 값 누락 (facilityId, name, pin)' }, { status: 400 });
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN은 4자리 숫자여야 합니다' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 같은 시설 내 PIN 중복 확인
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('facility_id', facilityId)
    .eq('pin', pin)
    .single();

  if (existing) {
    return NextResponse.json({ error: '이미 사용 중인 PIN입니다' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('users')
    .insert({ facility_id: facilityId, name, birth_year: birthYear ?? null, pin })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ user: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId 필요' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('users').delete().eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
