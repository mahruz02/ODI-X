CREATE OR REPLACE FUNCTION public.record_audit_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  record_data jsonb;
  org_id uuid;
  entity_id text;
BEGIN
  record_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  org_id := NULLIF(record_data->>'organization_id', '')::uuid;
  entity_id := record_data->>'id';

  INSERT INTO public.audit_events (actor_id, organization_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(), org_id, TG_OP, TG_TABLE_NAME, entity_id,
    jsonb_build_object('source', 'database_trigger')
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS audit_organizations ON public.organizations;
CREATE TRIGGER audit_organizations AFTER INSERT OR UPDATE OR DELETE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

DROP TRIGGER IF EXISTS audit_responses ON public.responses;
CREATE TRIGGER audit_responses AFTER INSERT OR UPDATE OR DELETE ON public.responses
FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

DROP TRIGGER IF EXISTS audit_respondent_links ON public.respondent_links;
CREATE TRIGGER audit_respondent_links AFTER INSERT OR UPDATE OR DELETE ON public.respondent_links
FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

DROP TRIGGER IF EXISTS audit_fgd_notes ON public.fgd_notes;
CREATE TRIGGER audit_fgd_notes AFTER INSERT OR UPDATE OR DELETE ON public.fgd_notes
FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

DROP TRIGGER IF EXISTS audit_interview_notes ON public.interview_notes;
CREATE TRIGGER audit_interview_notes AFTER INSERT OR UPDATE OR DELETE ON public.interview_notes
FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

DROP TRIGGER IF EXISTS audit_document_reviews ON public.document_reviews;
CREATE TRIGGER audit_document_reviews AFTER INSERT OR UPDATE OR DELETE ON public.document_reviews
FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

DROP TRIGGER IF EXISTS audit_quantitative_metrics ON public.quantitative_metrics;
CREATE TRIGGER audit_quantitative_metrics AFTER INSERT OR UPDATE OR DELETE ON public.quantitative_metrics
FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

DROP TRIGGER IF EXISTS audit_ai_dimension_insights ON public.ai_dimension_insights;
CREATE TRIGGER audit_ai_dimension_insights AFTER INSERT OR UPDATE OR DELETE ON public.ai_dimension_insights
FOR EACH ROW EXECUTE FUNCTION public.record_audit_event();

REVOKE UPDATE, DELETE ON public.audit_events FROM authenticated;
