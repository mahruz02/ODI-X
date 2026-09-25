CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'hr',
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;

CREATE TABLE IF NOT EXISTS public.respondent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  perspective text NOT NULL CHECK (perspective IN ('pengurus', 'manajemen', 'karyawan', 'stakeholder')),
  respondent_name text,
  respondent_email text,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'in_progress', 'completed')),
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.respondent_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.respondent_links TO authenticated;
GRANT ALL ON public.respondent_links TO service_role;
ALTER TABLE public.respondent_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organization_members (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('org_admin', 'hr', 'auditor', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.organization_members TO authenticated;
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.organization_members, public.audit_events TO service_role;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(target_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_platform_admin() OR EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = target_org AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND organization_id = target_org AND role IN ('hr', 'org_admin', 'auditor', 'viewer')
  );
$$;

DROP POLICY IF EXISTS orgs_open_all ON public.organizations;
DROP POLICY IF EXISTS orgs_public_read ON public.organizations;
CREATE POLICY organizations_public_read ON public.organizations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY organizations_member_write ON public.organizations FOR UPDATE TO authenticated USING (public.is_org_member(id)) WITH CHECK (public.is_org_member(id));
CREATE POLICY organizations_admin_insert ON public.organizations FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin());
CREATE POLICY organizations_admin_delete ON public.organizations FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS responses_open_all ON public.responses;
DROP POLICY IF EXISTS responses_open_read ON public.responses;
DROP POLICY IF EXISTS responses_admin_read ON public.responses;
CREATE POLICY responses_public_insert ON public.responses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY responses_member_read ON public.responses FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY responses_member_update ON public.responses FOR UPDATE TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY responses_admin_delete ON public.responses FOR DELETE TO authenticated USING (public.is_platform_admin());

DROP POLICY IF EXISTS links_open_all ON public.respondent_links;
CREATE POLICY links_public_read_token ON public.respondent_links FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY links_member_write ON public.respondent_links FOR INSERT TO authenticated WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY links_member_update ON public.respondent_links FOR UPDATE TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));
CREATE POLICY links_admin_delete ON public.respondent_links FOR DELETE TO authenticated USING (public.is_platform_admin());

CREATE POLICY organization_members_self_read ON public.organization_members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY organization_members_admin_write ON public.organization_members FOR ALL TO authenticated USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY audit_events_member_read ON public.audit_events FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY audit_events_member_insert ON public.audit_events FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() AND public.is_org_member(organization_id));
