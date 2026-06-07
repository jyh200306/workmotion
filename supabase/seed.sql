-- 테스트 데이터 (Supabase SQL Editor에서 schema.sql 실행 후 실행)

-- 기관 삽입
INSERT INTO facilities (id, name, region, admin_pin) VALUES
  ('00000000-0000-0000-0000-000000000001', '행복노인복지관', '서울시 강남구', '9999')
ON CONFLICT (id) DO NOTHING;

-- 이용자 삽입 (PIN: 1234, 5678, 1111, 2222)
INSERT INTO users (facility_id, name, birth_year, pin) VALUES
  ('00000000-0000-0000-0000-000000000001', '김영숙', 1950, '1234'),
  ('00000000-0000-0000-0000-000000000001', '이철수', 1948, '5678'),
  ('00000000-0000-0000-0000-000000000001', '박순자', 1953, '1111'),
  ('00000000-0000-0000-0000-000000000001', '최민자', 1956, '2222'),
  ('00000000-0000-0000-0000-000000000001', '정동호', 1944, '3333'),
  ('00000000-0000-0000-0000-000000000001', '강선희', 1951, '4444')
ON CONFLICT DO NOTHING;

-- 샘플 운동 세션 (최근 7일)
INSERT INTO sessions (user_id, exercise_type, sets_completed, duration_sec, started_at, ended_at)
SELECT
  u.id,
  ex,
  3,
  FLOOR(RANDOM() * 40 + 50),
  NOW() - INTERVAL '1 hour' * FLOOR(RANDOM() * 72),
  NOW() - INTERVAL '1 hour' * FLOOR(RANDOM() * 72) + INTERVAL '5 minutes'
FROM users u
CROSS JOIN UNNEST(ARRAY['squat','calf','push','balance']::TEXT[]) AS ex
WHERE u.facility_id = '00000000-0000-0000-0000-000000000001'
LIMIT 24;
