import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { pin } = await req.json();

  if (!pin || typeof pin !== 'string' || pin.length !== 4) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 관리자 PIN 확인
  const { data: facility } = await supabase
    .from('facilities')
    .select('id, name, region')
    .eq('admin_pin', pin)
    .maybeSingle();

  if (facility) {
    return NextResponse.json({ role: 'admin', facility });
  }

  // 이용자 PIN 확인
  const { data: user } = await supabase
    .from('users')
    .select('id, name, birth_year, facility_id')
    .eq('pin', pin)
    .maybeSingle();

  if (user) {
    return NextResponse.json({ role: 'user', user });
  }

  return NextResponse.json({ error: 'PIN을 찾을 수 없습니다' }, { status: 401 });
}
