ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS surah_name TEXT;
ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS from_ref TEXT;
ALTER TABLE quran_records ADD COLUMN IF NOT EXISTS to_ref TEXT;

UPDATE quran_records
SET surah_name = content_text
WHERE surah_name IS NULL
  AND content_text IS NOT NULL
  AND followup_type <> 'not_heard';
