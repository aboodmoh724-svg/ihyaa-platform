CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (LOWER(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users (phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  source_key TEXT UNIQUE,
  teacher_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  circle_type TEXT NOT NULL DEFAULT 'regular' CHECK (circle_type IN ('regular', 'prestige')),
  meeting_days SMALLINT[] NOT NULL DEFAULT ARRAY[6,0]::SMALLINT[],
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE RESTRICT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'discontinued', 'suspended', 'graduated')),
  admin_notes TEXT,
  joined_at DATE,
  source_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(circle_id, normalized_name)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY,
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  title TEXT,
  note TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(circle_id, session_date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'traveling')),
  note TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'platform',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

CREATE TABLE IF NOT EXISTS quran_records (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  entry_text TEXT NOT NULL,
  followup_type TEXT NOT NULL DEFAULT 'recitation' CHECK (followup_type IN ('recitation', 'new_memorization', 'revision', 'not_heard')),
  content_text TEXT,
  surah_name TEXT,
  from_ref TEXT,
  to_ref TEXT,
  performance TEXT CHECK (performance IS NULL OR performance IN ('excellent', 'good', 'needs_followup')),
  teacher_note TEXT,
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'google-sheet-import',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, session_date)
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS student_transfer_history (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  from_circle_id UUID REFERENCES circles(id) ON DELETE SET NULL,
  to_circle_id UUID REFERENCES circles(id) ON DELETE SET NULL,
  transferred_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_circle_id IS NULL OR to_circle_id IS NULL OR from_circle_id <> to_circle_id)
);

CREATE INDEX IF NOT EXISTS students_circle_idx ON students(circle_id) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS attendance_sessions_date_idx ON attendance_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS attendance_records_student_idx ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS user_sessions_expiry_idx ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS student_transfer_history_student_idx ON student_transfer_history(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS student_transfer_history_created_idx ON student_transfer_history(created_at DESC);
