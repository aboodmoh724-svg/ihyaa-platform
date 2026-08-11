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

CREATE INDEX IF NOT EXISTS student_transfer_history_student_idx
  ON student_transfer_history(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS student_transfer_history_created_idx
  ON student_transfer_history(created_at DESC);
