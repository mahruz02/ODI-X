-- allow deleting/updating responses through the app
DROP POLICY IF EXISTS responses_insert_only_public ON public.responses;
DROP POLICY IF EXISTS responses_open_read ON public.responses;
CREATE POLICY responses_open_all ON public.responses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responses TO anon, authenticated;
GRANT ALL ON public.responses TO service_role;

-- cascade org deletion
ALTER TABLE public.responses DROP CONSTRAINT IF EXISTS responses_org_fkey;
ALTER TABLE public.responses ADD CONSTRAINT responses_org_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.fgd_notes DROP CONSTRAINT IF EXISTS fgd_notes_org_fkey;
ALTER TABLE public.fgd_notes ADD CONSTRAINT fgd_notes_org_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.interview_notes DROP CONSTRAINT IF EXISTS interview_notes_org_fkey;
ALTER TABLE public.interview_notes ADD CONSTRAINT interview_notes_org_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.document_reviews DROP CONSTRAINT IF EXISTS document_reviews_org_fkey;
ALTER TABLE public.document_reviews ADD CONSTRAINT document_reviews_org_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;