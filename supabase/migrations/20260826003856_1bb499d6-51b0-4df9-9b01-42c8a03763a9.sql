grant select on public.responses to authenticated;
create policy responses_admin_read on public.responses for select to authenticated using (true);
alter view public.dimension_scores set (security_invoker = on);
alter view public.dimension_comments set (security_invoker = on);
alter view public.triangulation_cells set (security_invoker = on);
alter view public.organization_progress set (security_invoker = on);