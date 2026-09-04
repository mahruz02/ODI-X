create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique
);
grant select on public.branches to anon, authenticated;
grant all on public.branches to service_role;
alter table public.branches enable row level security;
create policy "branches_public_read" on public.branches for select to anon, authenticated using (true);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  role text not null check (role in ('pengurus','manajemen','karyawan')),
  respondent_id text not null,
  respondent_name text,
  tenure text,
  dimension smallint not null check (dimension between 1 and 10),
  question_id text not null,
  score smallint not null check (score between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
grant insert on public.responses to anon, authenticated;
grant select on public.responses to authenticated;
grant all on public.responses to service_role;
alter table public.responses enable row level security;
create policy "responses_insert_only_public" on public.responses for insert to anon, authenticated with check (true);
create policy "responses_read_authenticated" on public.responses for select to authenticated using (true);

create table public.fgd_notes (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  dimension smallint not null check (dimension between 1 and 10),
  facilitator text,
  themes text,
  quotes text,
  consensus smallint check (consensus between 1 and 5),
  status text not null default 'draft' check (status in ('draft','final')),
  updated_at timestamptz not null default now()
);
grant all on public.fgd_notes to authenticated;
grant all on public.fgd_notes to service_role;
alter table public.fgd_notes enable row level security;
create policy "fgd_authenticated_all" on public.fgd_notes for all to authenticated using (true) with check (true);

create table public.interview_notes (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  dimension smallint not null check (dimension between 1 and 10),
  informant_role text,
  findings text,
  status text not null default 'draft' check (status in ('draft','final')),
  updated_at timestamptz not null default now()
);
grant all on public.interview_notes to authenticated;
grant all on public.interview_notes to service_role;
alter table public.interview_notes enable row level security;
create policy "interviews_authenticated_all" on public.interview_notes for all to authenticated using (true) with check (true);

create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id),
  dimension smallint not null check (dimension between 1 and 10),
  doc_type text not null,
  doc_status text not null check (doc_status in ('mutakhir','usang','tidak_ada')),
  score smallint check (score between 1 and 5),
  notes text,
  updated_at timestamptz not null default now()
);
grant all on public.document_reviews to authenticated;
grant all on public.document_reviews to service_role;
alter table public.document_reviews enable row level security;
create policy "docs_authenticated_all" on public.document_reviews for all to authenticated using (true) with check (true);

create view public.dimension_scores as
select r.branch_id, b.name as branch_name, r.dimension::int as dimension, r.role,
       round(avg(r.score)::numeric, 2) as avg_score,
       count(distinct r.respondent_id) as respondents
from public.responses r
join public.branches b on b.id = r.branch_id
group by 1,2,3,4;
grant select on public.dimension_scores to anon, authenticated;

create view public.dimension_comments as
select r.branch_id, b.name as branch_name, r.dimension::int as dimension, r.role, r.comment
from public.responses r
join public.branches b on b.id = r.branch_id
where r.comment is not null and length(trim(r.comment)) > 0;
grant select on public.dimension_comments to anon, authenticated;

create view public.triangulation_cells as
select r.branch_id, r.dimension::int as dimension, r.role as source, count(distinct r.respondent_id) as n
from public.responses r group by 1,2,3
union all
select f.branch_id, f.dimension::int, 'fgd', count(*) from public.fgd_notes f group by 1,2
union all
select i.branch_id, i.dimension::int, 'wawancara', count(*) from public.interview_notes i group by 1,2
union all
select d.branch_id, d.dimension::int, 'dokumen', count(*) from public.document_reviews d group by 1,2;
grant select on public.triangulation_cells to anon, authenticated;

insert into public.branches (name, code) values
  ('Kantor Pusat', 'PST'),
  ('Cabang Timur', 'TMR'),
  ('Cabang Barat', 'BRT');

with cfg as (
  select b.id as branch_id, b.code, r.role, r.n
  from public.branches b
  cross join (values ('pengurus',4),('manajemen',6),('karyawan',14)) as r(role, n)
),
base as (
  select * from (values
    (1,4.3,3.8,3.2),(2,3.6,3.4,3.0),(3,4.2,3.5,2.8),(4,4.0,3.2,2.6),(5,3.8,3.3,2.7),
    (6,3.5,3.2,3.1),(7,4.4,4.2,4.0),(8,3.9,3.7,null::numeric),(9,4.1,3.6,3.3),(10,3.9,3.4,2.9)
  ) as v(dim, p, m, k)
)
insert into public.responses (branch_id, role, respondent_id, dimension, question_id, score)
select cfg.branch_id, cfg.role,
       'seed-' || cfg.code || '-' || cfg.role || '-' || r.rn,
       b.dim,
       'd' || b.dim || '-' || cfg.role || '-' || q.qn,
       greatest(1, least(5,
         round(case cfg.role when 'pengurus' then b.p when 'manajemen' then b.m else b.k end)
         + ((r.rn + q.qn + b.dim) % 3) - 1
         - case when cfg.code = 'BRT' and cfg.role = 'karyawan' and b.dim in (3,4,10) then 1 else 0 end
       ))::smallint
from cfg
cross join lateral generate_series(1, cfg.n) as r(rn)
join base b on not (cfg.role = 'karyawan' and b.dim = 8)
cross join generate_series(1,3) as q(qn);

insert into public.responses (branch_id, role, respondent_id, dimension, question_id, score, comment)
select b.id, v.role, 'seed-note-' || v.rn, v.dim, 'd' || v.dim || '-' || v.role || '-note', v.score, v.comment
from public.branches b
join (values
  ('PST','karyawan',1,3,2,'Keputusan sering turun tanpa penjelasan, kami di lapangan yang menghadapi anggota.'),
  ('BRT','karyawan',2,4,2,'Komunikasi antara kantor cabang dan pusat terasa satu arah, usulan jarang direspons.'),
  ('BRT','karyawan',3,5,2,'Kenaikan dan promosi terasa tidak transparan, kriteria tidak pernah diumumkan.'),
  ('PST','manajemen',4,6,3,'SOP ada tetapi sudah lama tidak direvisi, praktik di lapangan sudah berbeda.'),
  ('TMR','manajemen',5,4,3,'Rapat koordinasi rutin membantu, tetapi tindak lanjutnya tidak terdokumentasi.'),
  ('BRT','karyawan',6,10,2,'Beban kerja akhir bulan sangat berat, lembur tidak selalu dihitung.'),
  ('PST','pengurus',7,7,5,'Alhamdulillah pengawasan syariah berjalan rutin, DPS aktif turun ke unit.'),
  ('TMR','karyawan',8,1,3,'Kami tahu visi BMT tapi tidak paham target tahun ini apa.')
) as v(code, role, rn, dim, score, comment) on b.code = v.code;

insert into public.fgd_notes (branch_id, dimension, facilitator, themes, quotes, consensus, status)
select b.id, v.dim, v.fac, v.themes, v.quotes, v.cons, 'final'
from public.branches b
join (values
  ('PST',3,'Tim Asesor','Gaya kepemimpinan sentralistis; keputusan cepat tetapi minim partisipasi','"Keputusan penting sering baru kami ketahui setelah diumumkan."',4),
  ('PST',6,'Tim Asesor','SOP tersedia namun pemahaman staf beragam; pelatihan tidak merata','"SOP ada, tapi yang membimbing kami sebenarnya kebiasaan senior."',3),
  ('TMR',1,'Tim Asesor','Visi dipahami lisan, tidak ada turunan target per unit','"Kami tahunya jalan saja, target tahunan tidak pernah disosialisasikan."',4),
  ('TMR',10,'Tim Asesor','Semangat kekeluargaan kuat; beban akhir bulan jadi keluhan utama','"Rasanya seperti keluarga, tapi akhir bulan semua kelelahan."',3),
  ('BRT',4,'Tim Asesor','Komunikasi vertikal lemah; informasi sering terlambat sampai ke staf','"Kami sering tahu kebijakan justru dari anggota, bukan dari atasan."',5),
  ('BRT',5,'Tim Asesor','Persepsi ketidakadilan insentif antar unit cukup meluas','"Unit lain insentifnya jelas, kami tidak pernah dijelaskan hitungannya."',4)
) as v(code, dim, fac, themes, quotes, cons) on b.code = v.code;

insert into public.interview_notes (branch_id, dimension, informant_role, findings, status)
select b.id, v.dim, v.who, v.findings, 'final'
from public.branches b
join (values
  ('PST',1,'Ketua Pengurus','Arah strategis jelas di level pengurus, tetapi diakui belum terturunkan dalam bentuk rencana kerja tertulis per unit.'),
  ('PST',8,'General Manager','NPF terkendali di bawah 5%, namun pencadangan belum konsisten mengikuti kebijakan tertulis.'),
  ('PST',7,'Ketua DPS','Pengawasan syariah rutin per kuartal; rekomendasi DPS kadang lambat ditindaklanjuti manajemen.'),
  ('BRT',3,'Kepala Cabang','Kepala cabang menunggu arahan pusat untuk hampir semua keputusan; inisiatif lokal rendah karena khawatir disalahkan.'),
  ('BRT',9,'Karyawan Senior','Nilai amanah sering dibicarakan, tetapi keteladanan dari pimpinan unit dinilai tidak konsisten.'),
  ('TMR',2,'Kepala Cabang','Uraian tugas tumpang tindih antara fungsi pemasaran dan penagihan pada masa sibuk.')
) as v(code, dim, who, findings) on b.code = v.code;

insert into public.document_reviews (branch_id, dimension, doc_type, doc_status, score, notes)
select b.id, v.dim, v.doc, v.st, v.score, v.notes
from public.branches b
join (values
  ('PST',1,'Rencana Strategis (Renstra)','mutakhir',4,'Renstra 2024-2028 ada, tetapi belum ada dokumen rencana kerja tahunan turunan.'),
  ('PST',2,'Struktur Organisasi Resmi','mutakhir',4,'Struktur terbaru hasil RAT tersedia; uraian tugas per posisi belum lengkap.'),
  ('PST',6,'Dokumen SOP','usang',2,'Sebagian besar SOP bertahun 2019, belum mengakomodasi proses digital saat ini.'),
  ('PST',7,'Laporan Pengawasan DPS','mutakhir',4,'Laporan kuartalan lengkap dua tahun terakhir.'),
  ('PST',8,'Laporan Keuangan & NPF','mutakhir',4,'Laporan bulanan tersedia; NPF gross 3,8% per akhir bulan lalu.'),
  ('PST',8,'Laporan Audit Internal','usang',3,'Audit internal terakhir 14 bulan lalu; temuan lama belum semua tertutup.'),
  ('TMR',6,'Dokumen SOP','usang',2,'Cabang menggunakan salinan SOP pusat tanpa adendum lokal.'),
  ('TMR',8,'Laporan Keuangan Cabang','mutakhir',4,'Pelaporan cabang rutin dan tepat waktu.'),
  ('BRT',2,'Struktur Organisasi Resmi','usang',3,'Struktur cabang belum diperbarui setelah dua mutasi kunci.'),
  ('BRT',6,'Dokumen SOP','tidak_ada',1,'Beberapa SOP kunci (penagihan, penyelesaian bermasalah) tidak ditemukan di cabang.'),
  ('BRT',8,'Laporan Keuangan Cabang','mutakhir',3,'Laporan tersedia namun rekonsiliasi kas sempat terlambat dua kali.'),
  ('BRT',1,'Rencana Kerja Tahunan','tidak_ada',1,'Tidak ditemukan rencana kerja tertulis cabang untuk tahun berjalan.')
) as v(code, dim, doc, st, score, notes) on b.code = v.code;