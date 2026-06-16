-- WorkMotion 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 기관 테이블 ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS facilities (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  region      TEXT DEFAULT '',
  admin_email TEXT DEFAULT '',
  admin_pin   TEXT NOT NULL DEFAULT '9999',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 이용자 테이블 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  birth_year  INTEGER,
  pin         TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 운동 세션 테이블 ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_type   TEXT CHECK (exercise_type IN ('squat','deadlift','lunge','hip_hinge')) NOT NULL,
  sets_completed  INTEGER DEFAULT 0,
  duration_sec    INTEGER DEFAULT 0,
  comment_emoji   TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);

-- ── RLS 활성화 ────────────────────────────────────────
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions   ENABLE ROW LEVEL SECURITY;

-- 서비스 롤은 모든 접근 허용 (API 라우트에서 service role key 사용)
CREATE POLICY "service_all_facilities" ON facilities FOR ALL USING (true);
CREATE POLICY "service_all_users"      ON users      FOR ALL USING (true);
CREATE POLICY "service_all_sessions"   ON sessions   FOR ALL USING (true);
