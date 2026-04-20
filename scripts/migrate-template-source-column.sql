-- تشغيل يدوي عند الترقية من `preview_path` + `full_path` إلى `source_path` فقط.
-- انسخ مسار المعاينة السابق كمصدر؛ إن وُجد full فقط استخدمه.

ALTER TABLE templates ADD COLUMN IF NOT EXISTS source_path character varying;

UPDATE templates
SET source_path = COALESCE(NULLIF(trim(preview_path), ''), NULLIF(trim(full_path), ''))
WHERE source_path IS NULL OR trim(source_path) = '';

ALTER TABLE templates DROP COLUMN IF EXISTS preview_path;
ALTER TABLE templates DROP COLUMN IF EXISTS full_path;

ALTER TABLE templates ALTER COLUMN source_path SET NOT NULL;
