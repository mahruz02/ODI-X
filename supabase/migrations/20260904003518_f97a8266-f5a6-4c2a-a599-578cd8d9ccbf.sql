CREATE TABLE public.ai_dimension_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL,
  kind text NOT NULL DEFAULT 'insight',
  content jsonb NOT NULL,
  edited_by_asesor boolean NOT NULL DEFAULT false,
  include_in_report boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, dimension, kind)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_dimension_insights TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_dimension_insights TO authenticated;
GRANT ALL ON public.ai_dimension_insights TO service_role;

ALTER TABLE public.ai_dimension_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_insights_open_all ON public.ai_dimension_insights
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);