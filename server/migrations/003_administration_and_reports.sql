ALTER TABLE circles ADD COLUMN IF NOT EXISTS circle_type TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE circles ADD COLUMN IF NOT EXISTS meeting_days SMALLINT[] NOT NULL DEFAULT ARRAY[6,0]::SMALLINT[];
ALTER TABLE circles ADD COLUMN IF NOT EXISTS notes TEXT;
UPDATE circles SET circle_type = 'prestige' WHERE name ILIKE '%برستيج%';
DO $$ BEGIN
  ALTER TABLE circles ADD CONSTRAINT circles_type_check CHECK (circle_type IN ('regular', 'prestige'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE students ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE students ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS joined_at DATE;
UPDATE students SET status = CASE WHEN active THEN 'active' ELSE 'discontinued' END
WHERE status IS NULL OR status = 'active';
DO $$ BEGIN
  ALTER TABLE students ADD CONSTRAINT students_status_check CHECK (status IN ('active', 'discontinued', 'suspended', 'graduated'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
UPDATE attendance_sessions ats SET recorded_by = source.recorded_by
FROM (
  SELECT session_id, MIN(recorded_by::text)::uuid AS recorded_by
  FROM attendance_records WHERE recorded_by IS NOT NULL GROUP BY session_id
) source WHERE source.session_id = ats.id AND ats.recorded_by IS NULL;

CREATE INDEX IF NOT EXISTS students_status_idx ON students(status, circle_id);
CREATE INDEX IF NOT EXISTS attendance_sessions_approval_idx ON attendance_sessions(approved_at, session_date DESC);
