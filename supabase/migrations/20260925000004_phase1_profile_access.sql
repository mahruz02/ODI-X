DROP POLICY IF EXISTS profiles_self_read ON public.user_profiles;
CREATE POLICY profiles_self_read ON public.user_profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_platform_admin());
