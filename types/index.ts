export type Facility = {
  id: string;
  name: string;
  region: string;
  admin_email: string;
  created_at: string;
};

export type User = {
  id: string;
  facility_id: string;
  name: string;
  birth_year: number;
  pin: string; // bcrypt 해시
  created_at: string;
};

export type Session = {
  id: string;
  user_id: string;
  exercise_type: 'squat' | 'calf' | 'push' | 'balance';
  sets_completed: number;
  duration_sec: number;
  comment_emoji: string | null;
  started_at: string;
  ended_at: string | null;
};

export type ExerciseType = Session['exercise_type'];

export type ExercisePhase = 'ready' | 'active' | 'rest';
