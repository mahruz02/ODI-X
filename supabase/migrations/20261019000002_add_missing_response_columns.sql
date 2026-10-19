ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS is_na boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS evidence_text text,
  ADD COLUMN IF NOT EXISTS conflict_text text;

NOTIFY pgrst, 'reload schema';
