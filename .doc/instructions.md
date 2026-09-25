# INSTRUCTIONS.md — ODI-X (Organizational Diagnosis Index - eXpanded)

> Spec final pengembangan platform ODI-X. Basis: `ODI-X_Kerangka_Flowchart.xlsx`.
> Perubahan dari dokumen awal: RBAC disederhanakan (dashboard hanya Admin & Asesor,
> peserta hanya link tanpa login), alur ditambah status/tracking, dashboard dilengkapi
> grafik & tabel performa, dan gaya visual mengacu pada assessmentindonesia.com.

---

## 1. KONTEKS & TUJUAN

ODI-X adalah platform diagnosis kesehatan organisasi berbasis triangulasi data:
persepsi multi-perspektif (Pengurus, Manajemen, Karyawan, Mitra/Stakeholder),
data kuantitatif objektif, dan bukti dokumen. Bukan survei kepuasan — setiap
temuan wajib bisa ditelusuri ke buktinya (_traceable_) dan diberi _confidence level_.

**Pilar:**

1. Triangulasi 4 perspektif responden vs data objektif
2. 12 Domain kesehatan organisasi (eksternal → operasional)
3. Deteksi gap persepsi antar level (bukan dirata-ratakan begitu saja)
4. Bukti & keyakinan (Tipis/Cukup/Kuat) di setiap temuan
5. Roadmap aksi: 7 arah rekomendasi x 4 horizon waktu

---

## 2. PERAN & HAK AKSES (RBAC)

Disederhanakan menjadi **3 role login** + **1 akses tanpa login**. Dashboard
**hanya** untuk Admin & Asesor — Leadership/Peserta tidak punya akun.

| Role                 | Login                  | Scope                  | Hak Akses                                                                                                                                                                       |
| -------------------- | ---------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `super_admin`        | Ya                     | Semua tenant           | Kelola semua organisasi, template kuesioner master, konfigurasi bobot/formula global, lihat semua proyek                                                                        |
| `org_admin`          | Ya                     | 1 organisasi           | Setup profil organisasi, buat/kelola proyek diagnosis, undang & kelola responden (generate link), akses penuh dashboard & laporan, export PDF, bagikan laporan publik read-only |
| `analyst` (Asesor)   | Ya                     | Proyek yang ditugaskan | Input FGD/wawancara/telaah dokumen/data kuantitatif, lihat dashboard & matriks triangulasi, edit catatan insight — tidak bisa kelola user/organisasi                            |
| Peserta (Respondent) | **Tidak**              | 1 pengisian            | Buka `/isi/{token}` → isi kuesioner sesuai perspektifnya → submit. Tidak melihat dashboard, tidak melihat hasil, tidak butuh akun                                               |
| _Leadership_         | — dihapus sebagai role | —                      | Menerima **laporan jadi** (PDF terlampir atau link publik sekali-pakai read-only) dari Org Admin. Bukan akun sistem.                                                            |

**Kenapa dipangkas:** Leadership sebagai role terpisah menambah kompleksitas auth
tanpa nilai tambah — kebutuhan mereka (baca laporan) terpenuhi lewat distribusi
laporan biasa. Peserta memakai token per-link (bukan akun) supaya proses
pengisian _frictionless_ dan sistem tetap bisa melacak siapa yang belum mengisi
tanpa memaksa mereka membuat akun.

**Row Level Security (Supabase):**

- `user_profiles.role` gate akses tabel operasional (organizations, projects, dst) via RLS policy standar (`auth.uid()` join `organization_id`).
- Tabel `responses` diakses oleh peserta lewat **service-role Server Action** yang memvalidasi token terhadap `respondent_links.token`, bukan lewat sesi auth Supabase — peserta tidak pernah punya `auth.uid()`.

---

## 3. ALUR SISTEM (REVISI)

Alur asli linear 5 tahap. Ditambah: status proyek eksplisit, tracking progres
responden, dan reminder — supaya Admin/Asesor tahu kapan data cukup untuk dianalisis.

```
[1] SETUP ORGANISASI & PROYEK  (Org Admin)
    Profil organisasi → Buat proyek diagnosis → status: DRAFT
    Tentukan target responden per perspektif → generate token link
    → status proyek: AKTIF

[2] PENGISIAN KUESIONER  (Peserta, tanpa login)
    Buka /isi/{token} → 12 domain, skala 1-5 + N/A, autosave per jawaban
    Progress responden ter-track real time di dashboard Admin/Asesor
    Reminder otomatis untuk token yang belum submit (opsional, via email)

[3] INPUT DATA KUALITATIF & OBJEKTIF  (Asesor)
    Data kuantitatif (target vs actual), upload dokumen + confidence level,
    catatan FGD, catatan wawancara — paralel dengan tahap 2, tidak harus menunggu

    ↳ ketika semua/cukup responden submit → status proyek: PENGUMPULAN SELESAI

[4] PENGOLAHAN & ANALISIS  (sistem otomatis + Asesor review)
    Triangulasi (agreement vs disagreement) → skoring 0-100 per domain
    → Index komposit (Health/Alignment/Adaptability/Maturity/Risk)
    → Priority ranking → klasifikasi 7 arah rekomendasi
    → status proyek: DIANALISIS (Asesor bisa edit insight sebelum finalisasi)

[5] LAPORAN & DISTRIBUSI  (Org Admin)
    Dashboard eksekutif, laporan per audiens, roadmap 4 horizon
    Export PDF / share link publik read-only untuk Leadership/eksternal
    → status proyek: SELESAI
```

---

## 4. 12 DOMAIN DIAGNOSIS

1. Konteks Eksternal — regulasi, pasar, kompetitor, tren makro
2. Strategi & Arah — kejelasan visi-misi, target terukur
3. Kepemimpinan & Tata Kelola — transparansi, independensi pengawasan
4. Struktur Organisasi — job desc, wewenang (DoA), efisiensi hirarki
5. Budaya & Etika — nilai organisasi, integritas, iklim kerja
6. SDM & Kompetensi — talenta, pelatihan, karir
7. Desain Pekerjaan — beban kerja, alur kerja, burnout
8. Tim & Kolaborasi — kerja lintas unit, konflik, sinergi
9. Proses & Teknologi — SOP, otomatisasi, keandalan sistem IT
10. Manajemen Kinerja — KPI, kompensasi, apresiasi
11. Risiko & Kontrol — kontrol internal, NPF/NPL, audit, kepatuhan
12. Pengalaman Stakeholder — kepuasan anggota, komplain, dampak sosial

---

## 5. FORMULASI MATEMATIKA

### 5.1 Skor domain per perspektif

$$S_{d,r} = \frac{\bar{X}_{d,r} - 1}{4} \times 100$$

### 5.2 Gap persepsi

$$\Delta_d = \max_r(S_{d,r}) - \min_r(S_{d,r})$$
Gap Tinggi (_Critical Alignment Issue_) jika $\Delta_d \ge 30$.

### 5.3 Health Index

$$HI = \frac{1}{12}\sum_{d=1}^{12} S_d$$

### 5.4 Alignment Index

$$AI = \max\left(0, 100 - \frac{\bar{\Delta}}{1.6}\times 100\right)$$

### 5.5 Adaptability Index

$$ADI = \text{avg}(S_1, S_2, S_9, S_{12})$$

### 5.6 Maturity Level

| Level                         | Syarat                      |
| ----------------------------- | --------------------------- |
| 5 — Teroptimasi               | $HI \ge 85$ dan $AI \ge 80$ |
| 4 — Terkelola & Terukur       | $HI \ge 70$ dan $AI \ge 70$ |
| 3 — Terdefinisi & Terstruktur | $HI \ge 55$ dan $AI \ge 60$ |
| 2 — Terulang & Parsial        | $HI \ge 40$                 |
| 1 — Reaktif & Informal        | $HI < 40$                   |

### 5.7 Priority Score

$$P_d = (U_d \times 0.35) + (I_d \times 0.30) + (R_d \times 0.20) - ((1-C_d)\times 0.15)$$

- $U_d$ = urgency dari $\Delta_d$ · $I_d$ = bobot dampak domain
- $R_d$ = bobot risiko (Kepatuhan/Keuangan 1.0, SDM 0.8, Operasional 0.5)
- $C_d$ = confidence (Tipis 0.3, Cukup 0.65, Kuat 1.0)

### 5.8 Risk Exposure (baru, mengisi index yang belum punya formula)

$$RE = \frac{1}{|D_r|}\sum_{d \in D_r} (100 - S_d) \times R_d, \quad D_r = \{4,9,11\}$$
Rata-rata tertimbang skor domain risiko-tinggi (Struktur, Proses & Teknologi,
Risiko & Kontrol) — dibalik (100 - S) karena semakin rendah skor domain,
semakin tinggi eksposur risiko.

---

## 6. ARSITEKTUR DATABASE (Supabase Postgres)

Perubahan dari draf awal: `user_profiles.role` dipangkas ke 3 nilai,
`target_respondents` diganti `respondent_links` (token-based, bukan akun),
`responses` menyimpan `link_id` bukan `respondent_id` bebas teks.

```sql
-- Profil pengguna internal (hanya yang login)
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('super_admin','org_admin','analyst')),
  organization_id uuid references public.organizations(id),
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  sector text default 'Lembaga Keuangan Mikro Syariah / BMT',
  employee_count integer,
  main_products text,
  strengths text,
  challenges text,
  priorities_12m text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  instrument text default 'Kuesioner 12 Domain ODI-X',
  status text not null default 'draft'
    check (status in ('draft','aktif','pengumpulan_selesai','dianalisis','selesai')),
  scheduled_start date,
  scheduled_end date,
  created_at timestamptz not null default now()
);

-- Link token per responden (menggantikan akun) — inti perubahan RBAC
create table public.respondent_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  perspective text not null check (perspective in ('pengurus','manajemen','karyawan','stakeholder')),
  respondent_name text,
  respondent_email text,
  status text not null default 'invited' check (status in ('invited','in_progress','completed')),
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.respondent_links(id) on delete cascade,
  dimension smallint not null check (dimension between 1 and 12),
  question_id text not null,
  score smallint check (score between 1 and 5),
  is_na boolean default false,
  evidence_text text,
  conflict_text text,
  comment text,
  created_at timestamptz not null default now(),
  unique (link_id, question_id)
);

create table public.quantitative_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  dimension smallint not null check (dimension between 1 and 12),
  metric_name text not null,
  target_val text, actual_val text, unit text, period text, data_source text,
  confidence_level text default 'cukup' check (confidence_level in ('tipis','cukup','kuat')),
  updated_at timestamptz not null default now()
);

create table public.document_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  dimension smallint not null check (dimension between 1 and 12),
  doc_type text not null,
  doc_status text not null check (doc_status in ('mutakhir','usang','sebagian','tidak_ada')),
  confidence_level text default 'cukup' check (confidence_level in ('tipis','cukup','kuat')),
  file_url text,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.fgd_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  dimension smallint not null check (dimension between 1 and 12),
  facilitator text, themes text, quotes text,
  consensus smallint check (consensus between 1 and 5),
  status text not null default 'draft' check (status in ('draft','final')),
  updated_at timestamptz not null default now()
);

create table public.interview_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  dimension smallint not null check (dimension between 1 and 12),
  informant_role text, findings text,
  status text not null default 'draft' check (status in ('draft','final')),
  updated_at timestamptz not null default now()
);
```

**RLS ringkas:**

- Semua tabel `organization_id`/`project_id`-scoped → policy `using` cocokkan
  `user_profiles.organization_id` milik `auth.uid()` (kecuali `super_admin` bypass semua).
- `respondent_links` & `responses`: **tidak ada policy untuk `anon`/`authenticated` biasa**;
  akses peserta lewat Server Action `service_role` yang validasi `token` manual — mencegah
  peserta menebak/enumerasi data proyek lain.

---

## 7. STACK TEKNIS

- **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Chart**: Recharts (Radar, Bar, Heatmap custom, Line untuk trend)
- **Backend**: Supabase (Postgres + RLS, Auth, Storage untuk dokumen)
- **Validasi**: Zod di setiap Server Action boundary
- **PDF Export**: `@react-pdf/renderer` atau print-CSS + browser print untuk laporan
- **Deploy**: Vercel

---

## 8. HALAMAN & SPESIFIKASI UI/UX

### 8.1 Landing page (`/`)

Penjelasan 5 tahap alur, 12 domain, CTA login Admin/Asesor. Tidak ada akses publik lain.

### 8.2 Auth (`/login`)

Login email+password (Supabase Auth) — hanya untuk `super_admin`, `org_admin`, `analyst`.

### 8.3 Setup Organisasi & Proyek (`/dashboard/organisasi/[id]`)

Form profil organisasi, daftar proyek, tombol "Buat Proyek Baru", generator token
link per perspektif (dengan tombol copy & kirim email).

### 8.4 Form Peserta (`/isi/[token]`) — **tanpa login, tanpa sidebar dashboard**

Wizard 12 domain, progress bar, autosave tiap jawaban (debounce), opsi N/A,
pertanyaan evidence/konflik muncul kondisional saat skor ≤ 2. Halaman "Terima kasih"
setelah submit — token langsung nonaktif (status `completed`), tidak bisa dibuka ulang.

### 8.5 Dashboard Utama Proyek (`/dashboard/proyek/[id]`) — **Admin & Asesor**

Ini yang paling dilengkapi sesuai permintaan:

- **Scorecard 5 kartu**: Health / Alignment / Adaptability / Maturity Level / Risk Exposure, tiap kartu dengan angka besar + trend indicator (vs pengukuran sebelumnya jika ada)
- **Radar chart** 12 domain, 4 garis (per perspektif) ditumpuk, toggle show/hide per perspektif
- **Bar chart** perbandingan 12 domain (skor rata-rata vs threshold Level target)
- **Heatmap gap** — grid 12 domain x 4 perspektif, warna gradasi (hijau→kuning→merah) berdasar $\Delta_d$
- **Tabel status pengumpulan data**: per perspektif — jumlah invited/in_progress/completed, progress bar, tombol "Reminder"
- **Tabel prioritas masalah**: sortable, kolom Domain / Priority Score / Kategori (Critical-High-Medium-Low) / Confidence / link ke bukti
- **Panel evidence coverage**: indikator per domain apakah bukti kuantitatif/dokumen/FGD/wawancara sudah lengkap (proof coverage dari matriks triangulasi)

### 8.6 Matriks Triangulasi (`/dashboard/proyek/[id]/triangulasi`)

Tabel 12 domain x 7 sumber data (4 perspektif + kuantitatif + dokumen + FGD/wawancara),
cell menampilkan skor/status + ikon agreement/disagreement.

### 8.7 Input Kualitatif & Dokumen (`/dashboard/proyek/[id]/kualitatif`)

Tab: Data Kuantitatif (tabel target vs actual, form tambah baris) · Dokumen
(upload + confidence level) · FGD · Wawancara.

### 8.8 Laporan & Roadmap (`/dashboard/proyek/[id]/laporan`)

Pilih audiens (Eksekutif/Lengkap/Kepemimpinan/SDM/Risiko), preview siap cetak,
tombol export PDF & "Generate link publik read-only" (untuk dibagikan ke Leadership
tanpa akun — link kedaluwarsa otomatis 30 hari). Roadmap 4 horizon sebagai
timeline/kanban dengan checklist status per item rekomendasi, tiap item link ke
bukti pendukungnya.

### 8.9 Admin Global (`/dashboard/admin`) — **hanya `super_admin`**

Daftar semua organisasi/tenant, kelola template kuesioner master, konfigurasi bobot
formula ($I_d$, $R_d$) per domain.

---

## 9. GAYA VISUAL

Mengacu nuansa assessmentindonesia.com — kesan korporat/terpercaya, bukan playful:

- **Primer**: teal gelap `#1B5A5A` (header, nav, tombol utama)
- **Aksen**: biru cerah `#2E9BC7` (link, CTA sekunder, highlight chart)
- **Highlight**: kuning/emas `#D9A441` (dipakai tipis — badge "Critical", ikon prestasi)
- **Netral**: latar `#F7F8F9`, card putih dengan shadow lembut, teks `#1F2937`
- **Status warna**: Critical `#DC2626` · High `#EA580C` · Medium `#D9A441` · Low `#16A34A`
- **Tipografi**: Inter (UI), tabular numbers untuk angka skor
- **Layout**: card-based, radius 8-12px, whitespace lega — data-dense tapi tidak sumpek

---

## 10. HAL BARU YANG DITAMBAHKAN (tidak ada di xlsx asli)

1. **Status proyek eksplisit** (draft/aktif/.../selesai) — supaya UI tahu tahap mana yang aktif
2. **Token link per responden** menggantikan konsep "akun peserta" — sesuai keputusan RBAC
3. **Tracking progres pengumpulan** real-time + reminder — xlsx asli tidak punya mekanisme ini
4. **Risk Exposure formula** (§5.8) — index ini disebut di alur tapi rumusnya belum ada di draf awal
5. **Link laporan publik read-only sekali-pakai** — pengganti akun Leadership
6. **Evidence/proof coverage indicator** — visualisasi kelengkapan bukti per domain di dashboard

---

## 11. ROADMAP IMPLEMENTASI

1. **Fase 1** — Schema Supabase (migrasi SQL §6) + RLS policies + seed 12 domain & pertanyaan
2. **Fase 2** — Auth Admin/Asesor + halaman peserta `/isi/[token]` (autosave, validasi)
3. **Fase 3** — Workspace Asesor: setup proyek, kelola link, input kualitatif/kuantitatif
4. **Fase 4** — Engine skoring (§5) + Dashboard (radar, bar, heatmap, tabel) real-time via TanStack/Server Components
5. **Fase 5** — Generator laporan per audiens, export PDF, link publik read-only, roadmap kanban
