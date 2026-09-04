
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO anon;
GRANT SELECT, INSERT ON public.responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fgd_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_reviews TO anon;
GRANT SELECT ON public.dimension_scores TO anon;
GRANT SELECT ON public.dimension_comments TO anon;
GRANT SELECT ON public.triangulation_cells TO anon;
GRANT SELECT ON public.organization_progress TO anon;

DROP POLICY IF EXISTS orgs_admin_write ON public.organizations;
CREATE POLICY orgs_open_all ON public.organizations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS responses_admin_read ON public.responses;
CREATE POLICY responses_open_read ON public.responses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS fgd_authenticated_all ON public.fgd_notes;
CREATE POLICY fgd_open_all ON public.fgd_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS interviews_authenticated_all ON public.interview_notes;
CREATE POLICY interviews_open_all ON public.interview_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS docs_authenticated_all ON public.document_reviews;
CREATE POLICY docs_open_all ON public.document_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
