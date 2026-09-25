REVOKE ALL ON public.responses FROM anon;
REVOKE ALL ON public.fgd_notes, public.interview_notes, public.document_reviews, public.quantitative_metrics, public.ai_dimension_insights FROM anon;
REVOKE ALL ON public.organization_members, public.audit_events, public.user_profiles FROM anon;
REVOKE SELECT ON public.dimension_scores, public.dimension_comments, public.triangulation_cells, public.organization_progress FROM anon;

DROP POLICY IF EXISTS responses_public_insert ON public.responses;
CREATE POLICY responses_public_insert ON public.responses FOR INSERT TO anon, authenticated WITH CHECK (true);

REVOKE SELECT ON public.respondent_links FROM anon;
CREATE POLICY links_public_token_read ON public.respondent_links FOR SELECT TO anon USING (status <> 'completed' AND (expires_at IS NULL OR expires_at > now()));
