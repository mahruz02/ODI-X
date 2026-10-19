GRANT SELECT ON public.respondent_links TO anon, authenticated;

DROP POLICY IF EXISTS links_public_token_read ON public.respondent_links;
CREATE POLICY links_public_token_read
  ON public.respondent_links
  FOR SELECT
  TO anon, authenticated
  USING (status <> 'completed' AND (expires_at IS NULL OR expires_at > now()));
