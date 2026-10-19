ALTER TABLE public.responses
  DROP CONSTRAINT IF EXISTS responses_dimension_check,
  DROP CONSTRAINT IF EXISTS responses_score_check,
  DROP CONSTRAINT IF EXISTS responses_role_check;

ALTER TABLE public.responses
  ADD CONSTRAINT responses_dimension_check CHECK (dimension BETWEEN 1 AND 12),
  ADD CONSTRAINT responses_score_check CHECK (score BETWEEN 0 AND 5),
  ADD CONSTRAINT responses_role_check CHECK (role IN ('pengurus', 'manajemen', 'karyawan', 'stakeholder'));
