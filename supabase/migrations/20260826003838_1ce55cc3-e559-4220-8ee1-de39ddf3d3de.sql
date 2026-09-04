-- 1. Proyek diagnosis per organisasi BMT
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  started_on date not null default current_date,
  status text not null default 'berjalan',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
grant select on public.organizations to anon;
alter table public.organizations enable row level security;
create policy orgs_public_read on public.organizations for select to anon, authenticated using (true);
create policy orgs_admin_write on public.organizations for all to authenticated using (true) with check (true);

-- 2. Migrasi data demo: tiap cabang lama menjadi satu organisasi BMT
insert into public.organizations (id, name, code)
select b.id,
       case b.code when 'PST' then 'BMT Amanah Sejahtera'
                   when 'TMR' then 'BMT Barokah Insani'
                   else 'BMT Mitra Ummat' end,
       lower(b.code) || '-' || substr(replace(b.id::text,'-',''), 1, 6)
from public.branches b;

alter table public.responses rename column branch_id to organization_id;
alter table public.fgd_notes rename column branch_id to organization_id;
alter table public.interview_notes rename column branch_id to organization_id;
alter table public.document_reviews rename column branch_id to organization_id;

alter table public.responses drop constraint responses_branch_id_fkey,
  add constraint responses_org_fkey foreign key (organization_id) references public.organizations(id) on delete cascade;
alter table public.fgd_notes drop constraint fgd_notes_branch_id_fkey,
  add constraint fgd_notes_org_fkey foreign key (organization_id) references public.organizations(id) on delete cascade;
alter table public.interview_notes drop constraint interview_notes_branch_id_fkey,
  add constraint interview_notes_org_fkey foreign key (organization_id) references public.organizations(id) on delete cascade;
alter table public.document_reviews drop constraint document_reviews_branch_id_fkey,
  add constraint document_reviews_org_fkey foreign key (organization_id) references public.organizations(id) on delete cascade;

drop view if exists public.dimension_scores;
drop view if exists public.dimension_comments;
drop view if exists public.triangulation_cells;
drop table public.branches;

-- 3. View agregat per organisasi (hanya untuk admin terautentikasi)
create view public.dimension_scores
with (security_invoker = off) as
select r.organization_id, o.name as organization_name, r.dimension::int as dimension, r.role,
       round(avg(r.score)::numeric, 2) as avg_score,
       count(distinct r.respondent_id) as respondents
from public.responses r
join public.organizations o on o.id = r.organization_id
group by 1,2,3,4;
grant select on public.dimension_scores to authenticated;

create view public.dimension_comments
with (security_invoker = off) as
select r.organization_id, o.name as organization_name, r.dimension::int as dimension, r.role, r.comment
from public.responses r
join public.organizations o on o.id = r.organization_id
where r.comment is not null and length(trim(r.comment)) > 0;
grant select on public.dimension_comments to authenticated;

create view public.triangulation_cells
with (security_invoker = off) as
select r.organization_id, r.dimension::int as dimension, r.role as source, count(distinct r.respondent_id) as n
from public.responses r group by 1,2,3
union all
select f.organization_id, f.dimension::int, 'fgd', count(*) from public.fgd_notes f group by 1,2
union all
select i.organization_id, i.dimension::int, 'wawancara', count(*) from public.interview_notes i group by 1,2
union all
select d.organization_id, d.dimension::int, 'dokumen', count(*) from public.document_reviews d group by 1,2;
grant select on public.triangulation_cells to authenticated;

create view public.organization_progress
with (security_invoker = off) as
select o.id as organization_id, r.role, count(distinct r.respondent_id) as respondents
from public.organizations o left join public.responses r on r.organization_id = o.id
group by 1,2;
grant select on public.organization_progress to authenticated;