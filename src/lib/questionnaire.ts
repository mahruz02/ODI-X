// Definisi 12 dimensi diagnosis dan kuesioner berlapis sesuai Kerangka Utama ODI-X.
// Prespektif: Leadership / Pengurus, Manager / Manajemen, Employee / Karyawan, Stakeholder.

export type Role = "pengurus" | "manajemen" | "karyawan" | "stakeholder";
export type SystemRole = "super_admin" | "org_admin" | "analyst";

export const ROLE_LABELS: Record<Role, string> = {
  pengurus: "Leadership / Pengurus",
  manajemen: "Manager / Manajemen",
  karyawan: "Employee / Karyawan",
  stakeholder: "Stakeholder / Mitra",
};

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  analyst: "Analyst (Asesor)",
};

export interface Dimension {
  id: number;
  name: string;
  short: string;
  description: string;
  critical: boolean;
  evidencePrompt?: string;
  conflictPrompt?: string;
  questions: Record<Role, string[]>;
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 1,
    name: "Konteks Eksternal",
    short: "Eksternal",
    description: "Adaptasi terhadap perubahan regulasi, pasar, persaingan, dan tren makro.",
    critical: false,
    evidencePrompt: "Sebutkan contoh perubahan regulasi atau persaingan pasar terbaru yang paling mempengaruhi operasional Anda.",
    conflictPrompt: "Apa perbedaan pandangan utama antara pimpinan dan staf terkait ancaman eksternal yang dihadapi?",
    questions: {
      pengurus: [
        "Organisasi rutin memantau dan merespons perubahan regulasi dan industri.",
        "Peluang dan ancaman pasar eksternal dipetakan dengan cermat dalam perencanaan.",
      ],
      manajemen: [
        "Perubahan regulasi/pasar eksternal diantisipasi secara cepat dalam operasional.",
        "Kompetitor dan tren baru dipantau untuk menjaga daya saing layanan.",
      ],
      karyawan: [
        "Saya mendapat informasi mengenai perubahan aturan atau kondisi pasar yang mempengaruhi kerja.",
        "Layanan tempat saya bekerja cepat beradaptasi dengan kebutuhan anggota/nasabah saat ini.",
      ],
      stakeholder: [
        "Organisasi dinilai reponsif terhadap regulasi dan perkembangan lingkungan eksternal.",
        "Inovasi layanan organisasi relevan dengan kebutuhan masyarakat saat ini.",
      ],
    },
  },
  {
    id: 2,
    name: "Strategi & Arah",
    short: "Strategi",
    description: "Kejelasan visi-misi, target terukur, dan pemahaman arah di semua level.",
    critical: false,
    evidencePrompt: "Apakah target unit/cabang Anda tertulis dalam KPI tahunan dan pernah disosialisasikan secara formal?",
    conflictPrompt: "Kenapa pemahaman sasaran strategis di tingkat staf berbeda dengan arah yang dimaksudkan Pengurus?",
    questions: {
      pengurus: [
        "Visi, misi, dan sasaran strategis jangka panjang dirumuskan secara terukur.",
        "Rencana strategis diturunkan menjadi Indikator Kinerja Utama (KPI) yang jelas.",
      ],
      manajemen: [
        "Saya memahami target strategis unit saya dan bagaimana mencapainya.",
        "Pengurus memberikan arahan strategis yang konsisten dan fokus.",
      ],
      karyawan: [
        "Saya tahu visi dan sasaran utama organisasi tahun ini.",
        "Pekerjaan harian saya berkontribusi langsung pada target organisasi.",
      ],
      stakeholder: [
        "Organisasi memiliki fokus dan arah pengembangan bisnis yang jelas.",
        "Komitmen organisasi terhadap misi sosial dan bisnis berjalan seimbang.",
      ],
    },
  },
  {
    id: 3,
    name: "Kepemimpinan & Tata Kelola",
    short: "Kepemimpinan",
    description: "Gaya kepemimpinan, independensi pengawasan, dan ketepatan keputusan.",
    critical: true,
    evidencePrompt: "Berikan contoh keputusan strategis terbaru dan jelaskan bagaimana proses pembahasannya berlangsung.",
    conflictPrompt: "Jelaskan hambatan atau keraguan utama yang dirasakan staf saat ingin menyampaikan kritik kepada pimpinan.",
    questions: {
      pengurus: [
        "Pengurus dan Pengawas menjalankan tata kelola yang transparan dan akuntabel.",
        "Keputusan penting diambil secara tepat waktu berdasar data yang memadai.",
      ],
      manajemen: [
        "Pimpinan memberi ruang diskusi dan terbuka terhadap kritik/masukan.",
        "Arahan kepemimpinan memperjelas prioritas kerja dan tidak membingungkan.",
      ],
      karyawan: [
        "Atasan memberi teladan yang baik dan kejelasan dalam bertindak.",
        "Saya merasa aman menyampaikan pendapat kepada pimpinan.",
      ],
      stakeholder: [
        "Tata kelola dan pengawasan organisasi berjalan independen dan profesional.",
        "Kepemimpinan organisasi dipercaya oleh mitra dan anggota.",
      ],
    },
  },
  {
    id: 4,
    name: "Struktur Organisasi",
    short: "Struktur",
    description: "Kejelasan wewenang, job description, rentang kendali, dan efisiensi hirarki.",
    critical: false,
    evidencePrompt: "Apakah Anda memiliki dokumen uraian tugas (jobdesc) tertulis yang sesuai dengan tugas harian saat ini?",
    conflictPrompt: "Di bagian mana terjadi tumpang tindih wewenang atau instruksi yang saling bertentangan antaratasan?",
    questions: {
      pengurus: [
        "Struktur organisasi efektif menunjang pencapaian sasaran tanpa hambatan hirarki.",
        "Pembagian peran antara organs pengurus, pengawas, dan direksi/manajemen tegas.",
      ],
      manajemen: [
        "Batas wewenang pengambilan keputusan di unit saya terdefinisi jelas.",
        "Tidak ada tumpang tindih fungsi atau koordinasi yang berbelit antar departemen.",
      ],
      karyawan: [
        "Rincian tugas (jobdesc) saya jelas dan sesuai praktek harian.",
        "Saya tahu persis garis pelaporan dan koordinasi pekerjaan saya.",
      ],
      stakeholder: [
        "Struktur organisasi mempermudah alur komunikasi dan kerja sama luar.",
        "Penanggung jawab layanan/unit mudah dihubungi dan berwenang mengambil keputusan.",
      ],
    },
  },
  {
    id: 5,
    name: "Budaya & Etika",
    short: "Budaya",
    description: "Penerapan nilai organisasi, integritas amanah, dan iklim kerja.",
    critical: true,
    evidencePrompt: "Sebutkan tindakan nyata pimpinan atau rekan kerja yang mencerminkan penegakan etika dan amanah.",
    conflictPrompt: "Apakah ada ketimpangan perlakuan atau pelanggaran etika yang terbiarkan tanpa sanksi yang adil?",
    questions: {
      pengurus: [
        "Nilai-nilai syariah dan etika organisasi benar-benar menjadi panduan perilaku.",
        "Terdapat penegakan etika dan integritas yang konsisten di semua lini.",
      ],
      manajemen: [
        "Praktik harian di unit selaras dengan nilai-nilai yang dipromosikan.",
        "Pelanggaran etika ditindak secara adil tanpa tebang pilih.",
      ],
      karyawan: [
        "Budaya saling menghargai dan amanah terasa dalam lingkungan kerja harian.",
        "Saya bangga dengan standar etika dan reputasi tempat saya bekerja.",
      ],
      stakeholder: [
        "Organisasi konsisten menjaga integritas, etika, dan nilai syariah dalam bertransaksi.",
        "Citra dan budaya pelayanan organisasi dirasakan positif oleh pihak luar.",
      ],
    },
  },
  {
    id: 6,
    name: "SDM & Kompetensi",
    short: "SDM",
    description: "Rekrutmen, pemetaan talenta, pelatihan, dan pengembangan kapabilitas.",
    critical: false,
    evidencePrompt: "Pelatihan atau bimbingan apa saja yang telah Anda terima dalam 12 bulan terakhir untuk menunjang tugas?",
    conflictPrompt: "Mengapa program pelatihan yang ada dirasakan belum menjawab kebutuhan riil pekerjaan di lapangan?",
    questions: {
      pengurus: [
        "Organisasi memiliki strategi perencanaan dan pemetaan talenta SDM berkelanjutan.",
        "Alokasi anggaran pelatihan dan pengembangan kompetensi SDM memadai.",
      ],
      manajemen: [
        "Anggota tim saya memiliki kompetensi yang cukup untuk menjalankan tugas.",
        "Program pelatihan yang diberikan sesuai dengan kebutuhan peningkatan kerja.",
      ],
      karyawan: [
        "Saya mendapatkan pelatihan/bimbingan yang dibutuhkan untuk mengembangkan ketrampilan.",
        "Peluang karir dan pengembangan diri terbuka secara transparan.",
      ],
      stakeholder: [
        "Staf organisasi kompeten, terampil, dan menguasai bidang tugasnya.",
        "Interaksi dengan staf menunjukkan profesionalisme yang tinggi.",
      ],
    },
  },
  {
    id: 7,
    name: "Desain Pekerjaan",
    short: "Desain Kerja",
    description: "Keseimbangan beban kerja, fleksibilitas, dan kejelasan alur proses harian.",
    critical: false,
    evidencePrompt: "Berapa jam rata-rata kerja/lembur mingguan Anda, dan apakah beban tersebut terdistribusi merata?",
    conflictPrompt: "Apa penyebab utama penumpukan beban kerja pada unit tertentu yang berpotensi memicu kejenuhan (burnout)?",
    questions: {
      pengurus: [
        "Beban kerja antar unit terdistribusi secara seimbang dan proporsional.",
        "Desain pekerjaan dirancang efisien serta meminimalisir risiko burnout.",
      ],
      manajemen: [
        "Beban kerja tim harian realistis dan dapat diselesaikan pada jam kerja.",
        "Target individu dan unit ditetapkan rasional berdasar kapasitas.",
      ],
      karyawan: [
        "Beban kerja saya wajar dan saya dapat menjaga keseimbangan hidup-kerja.",
        "Fasilitas dan perlengkapan kerja memadai untuk menyelesaikan tugas.",
      ],
      stakeholder: [
        "Proses pelayanan tidak tampak membebani petugas hingga menurunkan mutu.",
        "Waktu respons dan penyelesaian pekerjaan relatif terukur.",
      ],
    },
  },
  {
    id: 8,
    name: "Tim & Kolaborasi",
    short: "Kolaborasi",
    description: "Kerja sama antar cabang/unit, penyelesaian konflik, dan sinergi tim.",
    critical: true,
    evidencePrompt: "Ceritakan pengalaman kerja sama antar unit/cabang yang berjalan paling sukses atau paling menguji sinergi.",
    conflictPrompt: "Apa masalah utama yang memicu gesekan atau sekat silogisme antardepartemen saat koordinasi?",
    questions: {
      pengurus: [
        "Sinergi dan kolaborasi antar unit/cabang berjalan tanpa sekat silogisme.",
        "Konflik antar fungsi diselesaikan secara konstruktif.",
      ],
      manajemen: [
        "Kerja sama antar tim/departemen berjalan lancar dan saling mendukung.",
        "Informasi penting dibagikan secara terbuka antar unit kerja.",
      ],
      karyawan: [
        "Rekan kerja di unit saya kooperatif dan siap membantu saat dibutuhkan.",
        "Suasana tim mendukung pencapaian hasil bersama.",
      ],
      stakeholder: [
        "Organisasi menunjukkan kekompakan dan koordinasi yang solid saat melayani mitra.",
        "Tim organisasi cepat merespons kebutuhan kolaborasi eksternal.",
      ],
    },
  },
  {
    id: 9,
    name: "Proses & Teknologi",
    short: "Teknologi",
    description: "Ketersediaan SOP mutakhir, otomatisasi sistem core, dan keandalan IT.",
    critical: false,
    evidencePrompt: "Aplikasi atau fitur sistem IT apa yang paling membantu kerja harian Anda dan seberapa sering terjadi kendala?",
    conflictPrompt: "Proses operasional mana yang masih manual atau terhambat SOP usang yang belum disesuaikan?",
    questions: {
      pengurus: [
        "Teknologi informasi dan sistem operasional investasi utama yang mendukung percepatan bisnis.",
        "SOP dan digitalisasi proses terus dimutakhirkan.",
      ],
      manajemen: [
        "Sistem IT dan aplikasi yang digunakan andal dan jarang mengalami kendala.",
        "SOP kerja relevan dengan operasional aktual saat ini.",
      ],
      karyawan: [
        "Sistem/aplikasi kerja mempermudah penyelesaian tugas saya sehari-hari.",
        "Panduan operasional (SOP) jelas dan mudah diakses.",
      ],
      stakeholder: [
        "Teknologi dan layanan digital organisasi mudah digunakan dan aman.",
        "Kecepatan transaksi dan pemrosesan didukung IT yang handal.",
      ],
    },
  },
  {
    id: 10,
    name: "Manajemen Kinerja",
    short: "Kinerja",
    description: "Keadilan kompensasi, transparansi KPI, insentif, dan apresiasi.",
    critical: true,
    evidencePrompt: "Bagaimana kriteria insentif dan kenaikan tingkat dihitung serta diumumkan di unit Anda?",
    conflictPrompt: "Jelaskan persepsi ketidakadilan terkait pemberian insentif, kompensasi, atau penilaian kinerja di tempat kerja.",
    questions: {
      pengurus: [
        "Sistem manajemen kinerja objektif, berbasis data, dan terhubung dengan remunerasi.",
        "Kompensasi dan benefit kompetitif dibanding standar industri.",
      ],
      manajemen: [
        "Penilaian kinerja bawahan dilakukan secara adil dan transparan.",
        "Insentif dan reward diberikan sesuai dengan capaian kinerja riil.",
      ],
      karyawan: [
        "Gaji dan insentif yang saya terima adil dibanding beban tanggung jawab.",
        "Aturan kenaikan tingkat/promosi dijelaskan secara transparan.",
      ],
      stakeholder: [
        "Standar mutu layanan organisasi terjaga konsistensinya.",
        "Capaian indikator kinerja organisasi tampak terus meningkat.",
      ],
    },
  },
  {
    id: 11,
    name: "Risiko & Kontrol",
    short: "Risiko",
    description: "Pengendalian internal, NPF/NPL, audit, kepatuhan regulasi & syariah.",
    critical: false,
    evidencePrompt: "Dokumen laporan NPF, hasil audit internal, atau rekomendasi DPS terbaru apa yang pernah ditindaklanjuti?",
    conflictPrompt: "Apa kelemahan prosedur kontrol atau kepatuhan yang berpotensi menimbulkan risiko keuangan/operasional?",
    questions: {
      pengurus: [
        "Sistem pengendalian internal dan manajemen risiko berjalan efektif.",
        "Rekomendasi audit dan DPS selalu ditindaklanjuti secara disiplin.",
      ],
      manajemen: [
        "Risiko operasional dan pembiayaan teridentifikasi serta termonitor ketat.",
        "Mekanisme kontrol dan persetujuan mencegah penyimpangan tanpa menghambat.",
      ],
      karyawan: [
        "Saya memahami batas kepatuhan dan prosedur keamanan transaksi.",
        "Temuan pemeriksaan diperbaiki dengan cepat.",
      ],
      stakeholder: [
        "Organisasi dinilai memiliki tingkat keamanan keuangan dan kehati-hatian yang tinggi.",
        "Kepatuhan syariah dan hukum terjamin secara konsisten.",
      ],
    },
  },
  {
    id: 12,
    name: "Pengalaman Stakeholder",
    short: "Stakeholder",
    description: "Kepuasan anggota/nasabah, komplain, dampak sosial, dan penanganan masukan.",
    critical: false,
    evidencePrompt: "Bagaimana alur dan kecepatan penanganan keluhan anggota/mitra diselesaikan hingga tuntas?",
    conflictPrompt: "Apa komplain atau ketidakpuasan yang paling sering disampaikan oleh pihak luar atau anggota?",
    questions: {
      pengurus: [
        "Tingkat kepuasan anggota dan dampak sosial organisasi diukur secara berskala.",
        "Umpan balik dari stakeholder utama menjadi bahan evaluasi kebijakan.",
      ],
      manajemen: [
        "Komplain dari anggota/nasabah ditangani secara cepat dan ada prosedur penyelesaiannya.",
        "Kualitas hubungan dengan mitra strategis dijaga berkelanjutan.",
      ],
      karyawan: [
        "Saya berupaya memberikan pengalaman pelayanan terbaik bagi anggota.",
        "Keluhan atau masalah anggota cepat dibantu oleh atasan/unit terkait.",
      ],
      stakeholder: [
        "Saya puas dengan mutu layanan, komunikasi, dan manfaat kerja sama dengan organisasi ini.",
        "Organisasi memberikan dampak nyata bagi pengembangan ekonomi masyarakat.",
      ],
    },
  },
];

export const LIKERT = [
  { value: 1, label: "Sangat Tidak Setuju", shortLabel: "STS" },
  { value: 2, label: "Tidak Setuju", shortLabel: "TS" },
  { value: 3, label: "Ragu-ragu", shortLabel: "RG" },
  { value: 4, label: "Setuju", shortLabel: "S" },
  { value: 5, label: "Sangat Setuju", shortLabel: "SS" },
] as const;

export const ACTION_DIRECTIONS = [
  "Pertahankan",
  "Perbaiki",
  "Bangun",
  "Transformasi",
  "Kurangi",
  "Hentikan",
  "Eksplorasi",
] as const;
export type ActionDirection = (typeof ACTION_DIRECTIONS)[number];

export const HORIZONS = [
  "0-90 hari",
  "3-6 bulan",
  "6-12 bulan",
  "1-3 tahun",
] as const;
export type Horizon = (typeof HORIZONS)[number];

export const GAP_THRESHOLDS = { high: 1.2, mid: 0.7 } as const;
export type GapLevel = "high" | "mid" | "low";

export function gapLevel(gap: number): GapLevel {
  if (gap >= GAP_THRESHOLDS.high) return "high";
  if (gap >= GAP_THRESHOLDS.mid) return "mid";
  return "low";
}

export const GAP_LABELS: Record<GapLevel, string> = {
  high: "Gap Tinggi — Gali Lebih Dalam",
  mid: "Gap Sedang — Perlu Perhatian",
  low: "Persepsi Selaras",
};

export function dimensionsForRole(role: Role): Dimension[] {
  return DIMENSIONS.filter((d) => d.questions[role] && d.questions[role].length > 0);
}

export const TRIANGULATION_PLAN: Record<number, Record<string, "utama" | "pendukung" | null>> = {
  1: { pengurus: "utama", manajemen: "utama", karyawan: "pendukung", stakeholder: "utama", fgd: "pendukung", wawancara: "utama", dokumen: "utama" },
  2: { pengurus: "utama", manajemen: "utama", karyawan: "pendukung", stakeholder: "pendukung", fgd: "pendukung", wawancara: "utama", dokumen: "utama" },
  3: { pengurus: "utama", manajemen: "utama", karyawan: "utama", stakeholder: "pendukung", fgd: "utama", wawancara: "utama", dokumen: "pendukung" },
  4: { pengurus: "pendukung", manajemen: "utama", karyawan: "utama", stakeholder: "pendukung", fgd: "pendukung", wawancara: "utama", dokumen: "utama" },
  5: { pengurus: "utama", manajemen: "utama", karyawan: "utama", stakeholder: "utama", fgd: "utama", wawancara: "utama", dokumen: "pendukung" },
  6: { pengurus: "utama", manajemen: "utama", karyawan: "utama", stakeholder: "pendukung", fgd: "pendukung", wawancara: "utama", dokumen: "utama" },
  7: { pengurus: "pendukung", manajemen: "utama", karyawan: "utama", stakeholder: "pendukung", fgd: "pendukung", wawancara: "pendukung", dokumen: "utama" },
  8: { pengurus: "utama", manajemen: "utama", karyawan: "utama", stakeholder: "pendukung", fgd: "utama", wawancara: "pendukung", dokumen: null },
  9: { pengurus: "utama", manajemen: "utama", karyawan: "utama", stakeholder: "utama", fgd: "pendukung", wawancara: "pendukung", dokumen: "utama" },
  10: { pengurus: "utama", manajemen: "utama", karyawan: "utama", stakeholder: "pendukung", fgd: "utama", wawancara: "pendukung", dokumen: "utama" },
  11: { pengurus: "utama", manajemen: "utama", karyawan: "pendukung", stakeholder: "pendukung", fgd: "pendukung", wawancara: "utama", dokumen: "utama" },
  12: { pengurus: "utama", manajemen: "utama", karyawan: "utama", stakeholder: "utama", fgd: "utama", wawancara: "utama", dokumen: "utama" },
};

export const TRIANGULATION_SOURCES = [
  { key: "pengurus", label: "Leadership / Pengurus" },
  { key: "manajemen", label: "Manager / Manajemen" },
  { key: "karyawan", label: "Employee / Karyawan" },
  { key: "stakeholder", label: "Stakeholder / Mitra" },
  { key: "fgd", label: "FGD" },
  { key: "wawancara", label: "Wawancara" },
  { key: "dokumen", label: "Telaah Dokumen / Quantitative Data" },
] as const;

