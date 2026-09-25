CREATE TABLE IF NOT EXISTS public.quantitative_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12), metric_name text NOT NULL,
  target_val text, actual_val text, unit text, period text, data_source text,
  confidence_level text DEFAULT 'cukup', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.fgd_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12), facilitator text, themes text, quotes text,
  consensus smallint, status text NOT NULL DEFAULT 'draft', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.interview_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12), informant_role text, findings text,
  status text NOT NULL DEFAULT 'draft', updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.document_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12), doc_type text NOT NULL, doc_status text NOT NULL,
  score smallint, confidence_level text DEFAULT 'cukup', notes text, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ai_dimension_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL, kind text NOT NULL DEFAULT 'insight', content jsonb NOT NULL DEFAULT '{}'::jsonb,
  edited_by_asesor boolean NOT NULL DEFAULT false, include_in_report boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE (organization_id, dimension, kind)
);

ALTER TABLE public.quantitative_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fgd_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_dimension_insights ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quantitative_metrics, public.fgd_notes, public.interview_notes, public.document_reviews, public.ai_dimension_insights TO authenticated;
GRANT ALL ON public.quantitative_metrics, public.fgd_notes, public.interview_notes, public.document_reviews, public.ai_dimension_insights TO service_role;

DROP POLICY IF EXISTS quant_open_all ON public.quantitative_metrics;
CREATE POLICY quant_member_read ON public.quantitative_metrics FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY quant_member_write ON public.quantitative_metrics FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS fgd_open_all ON public.fgd_notes;
CREATE POLICY fgd_member_read ON public.fgd_notes FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY fgd_member_write ON public.fgd_notes FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS interviews_open_all ON public.interview_notes;
CREATE POLICY interviews_member_read ON public.interview_notes FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY interviews_member_write ON public.interview_notes FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS docs_open_all ON public.document_reviews;
CREATE POLICY docs_member_read ON public.document_reviews FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY docs_member_write ON public.document_reviews FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

DROP POLICY IF EXISTS ai_insights_open_all ON public.ai_dimension_insights;
CREATE POLICY ai_insights_member_read ON public.ai_dimension_insights FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY ai_insights_member_write ON public.ai_dimension_insights FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

REVOKE ALL ON public.quantitative_metrics, public.fgd_notes, public.interview_notes, public.document_reviews, public.ai_dimension_insights FROM anon;
