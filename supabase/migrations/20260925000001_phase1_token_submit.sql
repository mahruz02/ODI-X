CREATE OR REPLACE FUNCTION public.submit_token_responses(payload jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  link_row public.respondent_links;
  answer jsonb;
BEGIN
  SELECT * INTO link_row
  FROM public.respondent_links
  WHERE token = payload->>'token'
    AND status <> 'completed'
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid, expired, or completed respondent link';
  END IF;

  FOR answer IN SELECT * FROM jsonb_array_elements(payload->'answers') LOOP
    INSERT INTO public.responses (
      organization_id, link_id, role, respondent_id, respondent_name, tenure,
      dimension, question_id, score, is_na, evidence_text, conflict_text, comment
    ) VALUES (
      link_row.organization_id, link_row.id, link_row.perspective, link_row.id::text,
      NULLIF(payload->>'name', ''), NULLIF(payload->>'tenure', ''),
      (answer->>'dimension')::smallint, answer->>'questionId', (answer->>'score')::smallint,
      COALESCE((answer->>'isNa')::boolean, false), answer->>'evidenceText',
      answer->>'conflictText', answer->>'comment'
    );
  END LOOP;

  UPDATE public.respondent_links
  SET status = 'completed', submitted_at = now()
  WHERE id = link_row.id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_token_responses(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_token_responses(jsonb) TO anon, authenticated;

DROP POLICY IF EXISTS links_public_read_token ON public.respondent_links;
CREATE POLICY links_public_read_token ON public.respondent_links FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS responses_public_insert ON public.responses;
