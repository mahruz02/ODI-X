-- Consolidated Migration Script for Supabase Project: fwmigetbslnmqdoafrld
-- ODI-X Final Spec Alignment (.doc/instructions.md)

-- 0. User Profiles (Auth & Role Management: 3 Login Roles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'org_admin' CHECK (role IN ('super_admin','org_admin','analyst')),
  organization_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO anon, authenticated;
GRANT ALL ON public.user_profiles TO service_role;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_open_all ON public.user_profiles;
CREATE POLICY profiles_open_all ON public.user_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  started_on date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'berjalan',
  sector text DEFAULT 'Lembaga Keuangan Mikro Syariah / BMT',
  employee_count integer DEFAULT 25,
  main_products text DEFAULT 'Simpanan & Pembiayaan Syariah',
  strengths text,
  challenges text,
  priorities_12m text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO anon, authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS orgs_open_all ON public.organizations;
CREATE POLICY orgs_open_all ON public.organizations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 1b. Projects table with Explicit Status Tracking (§6 instructions.md)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  instrument text DEFAULT 'Kuesioner 12 Domain ODI-X',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','aktif','pengumpulan_selesai','dianalisis','selesai')),
  scheduled_start date DEFAULT current_date,
  scheduled_end date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS projects_open_all ON public.projects;
CREATE POLICY projects_open_all ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 1c. Respondent Links (Token-based Participant Links)
CREATE TABLE IF NOT EXISTS public.respondent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  perspective text NOT NULL CHECK (perspective IN ('pengurus','manajemen','karyawan','stakeholder')),
  respondent_name text,
  respondent_email text,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','in_progress','completed')),
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.respondent_links TO anon, authenticated;
GRANT ALL ON public.respondent_links TO service_role;
ALTER TABLE public.respondent_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS links_open_all ON public.respondent_links;
CREATE POLICY links_open_all ON public.respondent_links FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Responses table (12 Domains, 4 Perspectives)
CREATE TABLE IF NOT EXISTS public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  link_id uuid REFERENCES public.respondent_links(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('pengurus','manajemen','karyawan','stakeholder')),
  respondent_id text NOT NULL,
  respondent_name text,
  tenure text,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12),
  question_id text NOT NULL,
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  is_na boolean DEFAULT false,
  evidence_text text,
  conflict_text text,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.responses TO anon, authenticated;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS responses_open_all ON public.responses;
CREATE POLICY responses_open_all ON public.responses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Quantitative Metrics (Data Objektif)
CREATE TABLE IF NOT EXISTS public.quantitative_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12),
  metric_name text NOT NULL,
  target_val text,
  actual_val text,
  unit text,
  period text,
  data_source text,
  confidence_level text DEFAULT 'cukup' CHECK (confidence_level IN ('tipis','cukup','kuat')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quantitative_metrics TO anon, authenticated;
GRANT ALL ON public.quantitative_metrics TO service_role;
ALTER TABLE public.quantitative_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS quant_open_all ON public.quantitative_metrics;
CREATE POLICY quant_open_all ON public.quantitative_metrics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. FGD Notes table
CREATE TABLE IF NOT EXISTS public.fgd_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12),
  facilitator text,
  themes text,
  quotes text,
  consensus smallint CHECK (consensus BETWEEN 1 AND 5),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fgd_notes TO anon, authenticated;
GRANT ALL ON public.fgd_notes TO service_role;
ALTER TABLE public.fgd_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fgd_open_all ON public.fgd_notes;
CREATE POLICY fgd_open_all ON public.fgd_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Interview Notes table
CREATE TABLE IF NOT EXISTS public.interview_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12),
  informant_role text,
  findings text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_notes TO anon, authenticated;
GRANT ALL ON public.interview_notes TO service_role;
ALTER TABLE public.interview_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS interviews_open_all ON public.interview_notes;
CREATE POLICY interviews_open_all ON public.interview_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Document Reviews table
CREATE TABLE IF NOT EXISTS public.document_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL CHECK (dimension BETWEEN 1 AND 12),
  doc_type text NOT NULL,
  doc_status text NOT NULL CHECK (doc_status IN ('mutakhir','usang','tidak_ada','ada','sebagian','tidak ada')),
  score smallint CHECK (score BETWEEN 1 AND 5),
  confidence_level text DEFAULT 'cukup' CHECK (confidence_level IN ('tipis','cukup','kuat')),
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_reviews TO anon, authenticated;
GRANT ALL ON public.document_reviews TO service_role;
ALTER TABLE public.document_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS docs_open_all ON public.document_reviews;
CREATE POLICY docs_open_all ON public.document_reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. AI Dimension Insights table
CREATE TABLE IF NOT EXISTS public.ai_dimension_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dimension smallint NOT NULL,
  kind text NOT NULL DEFAULT 'insight',
  content jsonb NOT NULL,
  edited_by_asesor boolean NOT NULL DEFAULT false,
  include_in_report boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, dimension, kind)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_dimension_insights TO anon, authenticated;
GRANT ALL ON public.ai_dimension_insights TO service_role;
ALTER TABLE public.ai_dimension_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_insights_open_all ON public.ai_dimension_insights;
CREATE POLICY ai_insights_open_all ON public.ai_dimension_insights FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Views
CREATE OR REPLACE VIEW public.dimension_scores WITH (security_invoker = on) AS
SELECT r.organization_id, o.name AS organization_name, r.dimension::int AS dimension, r.role,
       round(avg(r.score)::numeric, 2) AS avg_score,
       count(DISTINCT r.respondent_id) AS respondents
FROM public.responses r
JOIN public.organizations o ON o.id = r.organization_id
WHERE r.is_na IS NOT TRUE
GROUP BY 1,2,3,4;
GRANT SELECT ON public.dimension_scores TO anon, authenticated;

CREATE OR REPLACE VIEW public.dimension_comments WITH (security_invoker = on) AS
SELECT r.organization_id, o.name AS organization_name, r.dimension::int AS dimension, r.role, r.comment
FROM public.responses r
JOIN public.organizations o ON o.id = r.organization_id
WHERE r.comment IS NOT NULL AND length(trim(r.comment)) > 0;
GRANT SELECT ON public.dimension_comments TO anon, authenticated;

CREATE OR REPLACE VIEW public.triangulation_cells WITH (security_invoker = on) AS
SELECT r.organization_id, r.dimension::int AS dimension, r.role AS source, count(DISTINCT r.respondent_id) AS n
FROM public.responses r GROUP BY 1,2,3
UNION ALL
SELECT f.organization_id, f.dimension::int, 'fgd', count(*) FROM public.fgd_notes f GROUP BY 1,2
UNION ALL
SELECT i.organization_id, i.dimension::int, 'wawancara', count(*) FROM public.interview_notes i GROUP BY 1,2
UNION ALL
SELECT d.organization_id, d.dimension::int, 'dokumen', count(*) FROM public.document_reviews d GROUP BY 1,2;
GRANT SELECT ON public.triangulation_cells TO anon, authenticated;

CREATE OR REPLACE VIEW public.organization_progress WITH (security_invoker = on) AS
SELECT o.id AS organization_id, r.role, count(DISTINCT r.respondent_id) AS respondents
FROM public.organizations o LEFT JOIN public.responses r ON r.organization_id = o.id
GROUP BY 1,2;
GRANT SELECT ON public.organization_progress TO anon, authenticated;



-- Seed Data (Default Organizations)
INSERT INTO public.organizations (id, name, code) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'BMT Amanah Sejahtera', 'pst-demo01'),
  ('a2222222-2222-2222-2222-222222222222', 'BMT Barokah Insani', 'tmr-demo02'),
  ('a3333333-3333-3333-3333-333333333333', 'BMT Mitra Ummat', 'brt-demo03')
ON CONFLICT (code) DO NOTHING;

WITH cfg AS (
  SELECT o.id AS organization_id, o.code, r.role, r.n
  FROM public.organizations o
  CROSS JOIN (VALUES ('pengurus',4),('manajemen',6),('karyawan',14)) AS r(role, n)
),
base AS (
  SELECT * FROM (VALUES
    (1,4.3,3.8,3.2),(2,3.6,3.4,3.0),(3,4.2,3.5,2.8),(4,4.0,3.2,2.6),(5,3.8,3.3,2.7),
    (6,3.5,3.2,3.1),(7,4.4,4.2,4.0),(8,3.9,3.7,null::numeric),(9,4.1,3.6,3.3),(10,3.9,3.4,2.9)
  ) AS v(dim, p, m, k)
)
INSERT INTO public.responses (organization_id, role, respondent_id, dimension, question_id, score)
SELECT cfg.organization_id, cfg.role,
       'seed-' || cfg.code || '-' || cfg.role || '-' || r.rn,
       b.dim,
       'd' || b.dim || '-' || cfg.role || '-' || q.qn,
       greatest(1, least(5,
         round(case cfg.role when 'pengurus' then b.p when 'manajemen' then b.m else b.k end)
         + ((r.rn + q.qn + b.dim) % 3) - 1
         - case when cfg.code LIKE 'brt%' and cfg.role = 'karyawan' and b.dim in (3,4,10) then 1 else 0 end
       ))::smallint
FROM cfg
CROSS JOIN LATERAL generate_series(1, cfg.n) AS r(rn)
JOIN base b ON NOT (cfg.role = 'karyawan' AND b.dim = 8)
CROSS JOIN generate_series(1,3) AS q(qn)
ON CONFLICT DO NOTHING;

INSERT INTO public.responses (organization_id, role, respondent_id, dimension, question_id, score, comment)
SELECT o.id, v.role, 'seed-note-' || v.rn, v.dim, 'd' || v.dim || '-' || v.role || '-note', v.score, v.comment
FROM public.organizations o
JOIN (VALUES
  ('pst-demo01','karyawan',1,3,2,'Keputusan sering turun tanpa penjelasan, kami di lapangan yang menghadapi anggota.'),
  ('brt-demo03','karyawan',2,4,2,'Komunikasi antara kantor cabang dan pusat terasa satu arah, usulan jarang direspons.'),
  ('brt-demo03','karyawan',3,5,2,'Kenaikan dan promosi terasa tidak transparan, kriteria tidak pernah diumumkan.'),
  ('pst-demo01','manajemen',4,6,3,'SOP ada tetapi sudah lama tidak direvisi, praktik di lapangan sudah berbeda.'),
  ('tmr-demo02','manajemen',5,4,3,'Rapat koordinasi rutin membantu, tetapi tindak lanjutnya tidak terdokumentasi.'),
  ('brt-demo03','karyawan',6,10,2,'Beban kerja akhir bulan sangat berat, lembur tidak selalu dihitung.'),
  ('pst-demo01','pengurus',7,7,5,'Alhamdulillah pengawasan syariah berjalan rutin, DPS aktif turun ke unit.'),
  ('tmr-demo02','karyawan',8,1,3,'Kami tahu visi BMT tapi tidak paham target tahun ini apa.')
) AS v(code, role, rn, dim, score, comment) ON o.code = v.code
ON CONFLICT DO NOTHING;

INSERT INTO public.fgd_notes (organization_id, dimension, facilitator, themes, quotes, consensus, status)
SELECT o.id, v.dim, v.fac, v.themes, v.quotes, v.cons, 'final'
FROM public.organizations o
JOIN (VALUES
  ('pst-demo01',3,'Tim Asesor','Gaya kepemimpinan sentralistis; keputusan cepat tetapi minim partisipasi','"Keputusan penting sering baru kami ketahui setelah diumumkan."',4),
  ('pst-demo01',6,'Tim Asesor','SOP tersedia namun pemahaman staf beragam; pelatihan tidak merata','"SOP ada, tapi yang membimbing kami sebenarnya kebiasaan senior."',3),
  ('tmr-demo02',1,'Tim Asesor','Visi dipahami lisan, tidak ada turunan target per unit','"Kami tahunya jalan saja, target tahunan tidak pernah disosialisasikan."',4),
  ('tmr-demo02',10,'Tim Asesor','Semangat kekeluargaan kuat; beban akhir bulan jadi keluhan utama','"Rasanya seperti keluarga, tapi akhir bulan semua kelelahan."',3),
  ('brt-demo03',4,'Tim Asesor','Komunikasi vertikal lemah; informasi sering terlambat sampai ke staf','"Kami sering tahu kebijakan justru dari anggota, bukan dari atasan."',5),
  ('brt-demo03',5,'Tim Asesor','Persepsi ketidakadilan insentif antar unit cukup meluas','"Unit lain insentifnya jelas, kami tidak pernah dijelaskan hitungannya."',4)
) AS v(code, dim, fac, themes, quotes, cons) ON o.code = v.code;

INSERT INTO public.interview_notes (organization_id, dimension, informant_role, findings, status)
SELECT o.id, v.dim, v.who, v.findings, 'final'
FROM public.organizations o
JOIN (VALUES
  ('pst-demo01',1,'Ketua Pengurus','Arah strategis jelas di level pengurus, tetapi diakui belum terturunkan dalam bentuk rencana kerja tertulis per unit.'),
  ('pst-demo01',8,'General Manager','NPF terkendali di bawah 5%, namun pencadangan belum konsisten mengikuti kebijakan tertulis.'),
  ('pst-demo01',7,'Ketua DPS','Pengawasan syariah rutin per kuartal; rekomendasi DPS kadang lambat ditindaklanjuti manajemen.'),
  ('brt-demo03',3,'Kepala Cabang','Kepala cabang menunggu arahan pusat untuk hampir semua keputusan; inisiatif lokal rendah karena khawatir disalahkan.'),
  ('brt-demo03',9,'Karyawan Senior','Nilai amanah sering dibicarakan, tetapi keteladanan dari pimpinan unit dinilai tidak konsisten.'),
  ('tmr-demo02',2,'Kepala Cabang','Uraian tugas tumpang tindih antara fungsi pemasaran dan penagihan pada masa sibuk.')
) AS v(code, dim, who, findings) ON o.code = v.code;

INSERT INTO public.document_reviews (organization_id, dimension, doc_type, doc_status, score, notes)
SELECT o.id, v.dim, v.doc, v.st, v.score, v.notes
FROM public.organizations o
JOIN (VALUES
  ('pst-demo01',1,'Rencana Strategis (Renstra)','mutakhir',4,'Renstra 2024-2028 ada, tetapi belum ada dokumen rencana kerja tahunan turunan.'),
  ('pst-demo01',2,'Struktur Organisasi Resmi','mutakhir',4,'Struktur terbaru hasil RAT tersedia; uraian tugas per posisi belum lengkap.'),
  ('pst-demo01',6,'Dokumen SOP','usang',2,'Sebagian besar SOP bertahun 2019, belum mengakomodasi proses digital saat ini.'),
  ('pst-demo01',7,'Laporan Pengawasan DPS','mutakhir',4,'Laporan kuartalan lengkap dua tahun melepaskan.'),
  ('pst-demo01',8,'Laporan Keuangan & NPF','mutakhir',4,'Laporan bulanan tersedia; NPF gross 3,8% per akhir bulan lalu.'),
  ('pst-demo01',8,'Laporan Audit Internal','usang',3,'Audit internal terakhir 14 bulan lalu; temuan lama belum semua tertutup.'),
  ('tmr-demo02',6,'Dokumen SOP','usang',2,'Cabang menggunakan salinan SOP pusat tanpa adendum lokal.'),
  ('tmr-demo02',8,'Laporan Keuangan Cabang','mutakhir',4,'Pelaporan cabang rutin dan tepat waktu.'),
  ('brt-demo03',2,'Struktur Organisasi Resmi','usang',3,'Struktur cabang belum diperbarui setelah dua mutasi kunci.'),
  ('brt-demo03',6,'Dokumen SOP','tidak_ada',1,'Beberapa SOP kunci (penagihan, penyelesaian bermasalah) tidak ditemukan di cabang.'),
  ('brt-demo03',8,'Laporan Keuangan Cabang','mutakhir',3,'Laporan tersedia namun rekonsiliasi kas sempat terlambat dua kali.'),
  ('brt-demo03',1,'Rencana Kerja Tahunan','tidak_ada',1,'Tidak ditemukan rencana kerja tertulis cabang untuk tahun berjalan.')
) AS v(code, dim, doc, st, score, notes) ON o.code = v.code;
