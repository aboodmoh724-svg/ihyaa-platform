ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_records_status_check
  CHECK (status IN ('present', 'absent', 'late', 'excused', 'traveling'));

UPDATE attendance_records
SET status = 'traveling', updated_at = NOW()
WHERE status = 'absent' AND note ILIKE '%مسافر%';

UPDATE attendance_records
SET status = 'excused', updated_at = NOW()
WHERE status = 'absent' AND (note ILIKE '%اعتذر%' OR note ILIKE '%معتذر%');

UPDATE students s
SET active = FALSE, updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM attendance_records ar
  WHERE ar.student_id = s.id AND ar.note ILIKE '%منقطع%'
);

ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS session_id UUID;
ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS followup_type TEXT;
ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS performance TEXT;
ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS teacher_note TEXT;
ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS recorded_by UUID;
ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE quran_records
SET followup_type = CASE
      WHEN entry_text ILIKE '%لم يسمع%' OR entry_text IN ('-', '❌', '❌️') THEN 'not_heard'
      ELSE 'recitation'
    END,
    content_text = NULLIF(entry_text, '-'),
    updated_at = COALESCE(updated_at, created_at, NOW())
WHERE followup_type IS NULL OR content_text IS NULL;

ALTER TABLE quran_records ALTER COLUMN followup_type SET DEFAULT 'recitation';
ALTER TABLE quran_records ALTER COLUMN followup_type SET NOT NULL;
ALTER TABLE quran_records DROP CONSTRAINT IF EXISTS quran_records_followup_type_check;
ALTER TABLE quran_records
  ADD CONSTRAINT quran_records_followup_type_check
  CHECK (followup_type IN ('recitation', 'new_memorization', 'revision', 'not_heard'));
ALTER TABLE quran_records DROP CONSTRAINT IF EXISTS quran_records_performance_check;
ALTER TABLE quran_records
  ADD CONSTRAINT quran_records_performance_check
  CHECK (performance IS NULL OR performance IN ('excellent', 'good', 'needs_followup'));

ALTER TABLE quran_records DROP CONSTRAINT IF EXISTS quran_records_student_id_session_date_source_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quran_records_student_id_session_date_key'
  ) THEN
    ALTER TABLE quran_records
      ADD CONSTRAINT quran_records_student_id_session_date_key UNIQUE (student_id, session_date);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quran_records_session_id_fkey'
  ) THEN
    ALTER TABLE quran_records
      ADD CONSTRAINT quran_records_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quran_records_recorded_by_fkey'
  ) THEN
    ALTER TABLE quran_records
      ADD CONSTRAINT quran_records_recorded_by_fkey
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE quran_records qr
SET session_id = ats.id
FROM students s
JOIN attendance_sessions ats ON ats.circle_id = s.circle_id
WHERE qr.student_id = s.id
  AND ats.session_date = qr.session_date
  AND qr.session_id IS NULL;

CREATE INDEX IF NOT EXISTS quran_records_date_idx ON quran_records(session_date DESC);
CREATE INDEX IF NOT EXISTS quran_records_student_idx ON quran_records(student_id);
