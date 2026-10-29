// Definisi 12 dimensi diagnosis dan kuesioner berlapis sesuai Kerangka Utama ODI-X.
// Prespektif: Leadership / Pengurus, Manager / Manajemen, Employee / Karyawan, Stakeholder.

export type Role = "pengurus" | "manajemen" | "karyawan" | "stakeholder";
export type SystemRole = "admin" | "hr";

export const ROLE_LABELS: Record<Role, string> = {
  pengurus: "Leadership / Pengurus",
  manajemen: "Manager / Manajemen",
  karyawan: "Employee / Karyawan",
  stakeholder: "Stakeholder / Mitra",
};

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  admin: "Admin",
  hr: "HR",
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
    name: "Lingkungan Eksternal",
    short: "Eksternal",
    description: "Adaptasi terhadap perubahan regulasi, pasar, persaingan, dan tren makro.",
    critical: false,
    evidencePrompt:
      "Sebutkan contoh perubahan regulasi atau persaingan pasar terbaru yang paling mempengaruhi operasional Anda.",
    conflictPrompt:
      "Apa perbedaan pandangan utama antara pimpinan dan staf terkait ancaman eksternal yang dihadapi?",
    questions: {
      pengurus: [
              "Lembaga memahami regulasi terbaru yang berlaku bagi BMT/KSPPS.",
              "Lembaga rutin memantau perkembangan pesaing dan lembaga sejenis.",
              "Kebutuhan dan harapan anggota dipahami seluruh unsur lembaga.",
              "Lembaga cepat menyesuaikan diri saat kondisi ekonomi atau kebijakan berubah.",
              "Hubungan dengan regulator, pemerintah, dan perhimpunan terjaga baik."
      ],
      manajemen: [
              "Lembaga memahami regulasi terbaru yang berlaku bagi BMT/KSPPS.",
              "Lembaga rutin memantau perkembangan pesaing dan lembaga sejenis.",
              "Kebutuhan dan harapan anggota dipahami seluruh unsur lembaga.",
              "Lembaga cepat menyesuaikan diri saat kondisi ekonomi atau kebijakan berubah.",
              "Hubungan dengan regulator, pemerintah, dan perhimpunan terjaga baik."
      ],
      karyawan: [
              "Lembaga memahami regulasi terbaru yang berlaku bagi BMT/KSPPS.",
              "Lembaga rutin memantau perkembangan pesaing dan lembaga sejenis.",
              "Kebutuhan dan harapan anggota dipahami seluruh unsur lembaga.",
              "Lembaga cepat menyesuaikan diri saat kondisi ekonomi atau kebijakan berubah.",
              "Hubungan dengan regulator, pemerintah, dan perhimpunan terjaga baik."
      ],
      stakeholder: [
              "Lembaga memahami regulasi terbaru yang berlaku bagi BMT/KSPPS.",
              "Lembaga rutin memantau perkembangan pesaing dan lembaga sejenis.",
              "Kebutuhan dan harapan anggota dipahami seluruh unsur lembaga.",
              "Lembaga cepat menyesuaikan diri saat kondisi ekonomi atau kebijakan berubah.",
              "Hubungan dengan regulator, pemerintah, dan perhimpunan terjaga baik."
      ],
    },
  },
  {
    id: 2,
    name: "Visi, Misi & Strategi",
    short: "Strategi",
    description: "Kejelasan visi-misi, target terukur, dan pemahaman arah di semua level.",
    critical: false,
    evidencePrompt:
      "Apakah target unit/cabang Anda tertulis dalam KPI tahunan dan pernah disosialisasikan secara formal?",
    conflictPrompt:
      "Kenapa pemahaman sasaran strategis di tingkat staf berbeda dengan arah yang dimaksudkan Pengurus?",
    questions: {
      pengurus: [
              "Saya memahami visi dan misi lembaga.",
              "Rencana strategis dan program kerja tersusun jelas dan tertulis.",
              "Target tahunan diturunkan jelas sampai ke unit dan individu.",
              "Strategi lembaga realistis sesuai kemampuan sumber daya.",
              "Capaian strategi dievaluasi secara berkala."
      ],
      manajemen: [
              "Saya memahami visi dan misi lembaga.",
              "Rencana strategis dan program kerja tersusun jelas dan tertulis.",
              "Target tahunan diturunkan jelas sampai ke unit dan individu.",
              "Strategi lembaga realistis sesuai kemampuan sumber daya.",
              "Capaian strategi dievaluasi secara berkala."
      ],
      karyawan: [
              "Saya memahami visi dan misi lembaga.",
              "Rencana strategis dan program kerja tersusun jelas dan tertulis.",
              "Target tahunan diturunkan jelas sampai ke unit dan individu.",
              "Strategi lembaga realistis sesuai kemampuan sumber daya.",
              "Capaian strategi dievaluasi secara berkala."
      ],
      stakeholder: [
              "Saya memahami visi dan misi lembaga.",
              "Rencana strategis dan program kerja tersusun jelas dan tertulis.",
              "Target tahunan diturunkan jelas sampai ke unit dan individu.",
              "Strategi lembaga realistis sesuai kemampuan sumber daya.",
              "Capaian strategi dievaluasi secara berkala."
      ],
    },
  },
  {
    id: 3,
    name: "Kepemimpinan",
    short: "Kepemimpinan",
    description: "Gaya kepemimpinan, independensi pengawasan, dan ketepatan keputusan.",
    critical: true,
    evidencePrompt:
      "Berikan contoh keputusan strategis terbaru dan jelaskan bagaimana proses pembahasannya berlangsung.",
    conflictPrompt:
      "Jelaskan hambatan atau keraguan utama yang dirasakan staf saat ingin menyampaikan kritik kepada pimpinan.",
    questions: {
      pengurus: [
              "Pimpinan memberi arahan yang jelas.",
              "Pimpinan menjadi teladan dalam sikap dan integritas.",
              "Pimpinan terbuka terhadap masukan dan kritik.",
              "Keputusan pimpinan adil dan tidak pilih kasih.",
              "Pimpinan membimbing dan mengembangkan bawahannya."
      ],
      manajemen: [
              "Pimpinan memberi arahan yang jelas.",
              "Pimpinan menjadi teladan dalam sikap dan integritas.",
              "Pimpinan terbuka terhadap masukan dan kritik.",
              "Keputusan pimpinan adil dan tidak pilih kasih.",
              "Pimpinan membimbing dan mengembangkan bawahannya."
      ],
      karyawan: [
              "Pimpinan memberi arahan yang jelas.",
              "Pimpinan menjadi teladan dalam sikap dan integritas.",
              "Pimpinan terbuka terhadap masukan dan kritik.",
              "Keputusan pimpinan adil dan tidak pilih kasih.",
              "Pimpinan membimbing dan mengembangkan bawahannya."
      ],
      stakeholder: [
              "Pimpinan memberi arahan yang jelas.",
              "Pimpinan menjadi teladan dalam sikap dan integritas.",
              "Pimpinan terbuka terhadap masukan dan kritik.",
              "Keputusan pimpinan adil dan tidak pilih kasih.",
              "Pimpinan membimbing dan mengembangkan bawahannya."
      ],
    },
  },
  {
    id: 4,
    name: "Budaya Organisasi",
    short: "Struktur",
    description: "Kejelasan wewenang, job description, rentang kendali, dan efisiensi hirarki.",
    critical: false,
    evidencePrompt:
      "Apakah Anda memiliki dokumen uraian tugas (jobdesc) tertulis yang sesuai dengan tugas harian saat ini?",
    conflictPrompt:
      "Di bagian mana terjadi tumpang tindih wewenang atau instruksi yang saling bertentangan antaratasan?",
    questions: {
      pengurus: [
              "Nilai-nilai lembaga dipraktikkan sehari-hari, bukan sekadar slogan.",
              "Suasana kekeluargaan terjaga tanpa mengurangi profesionalisme.",
              "Disiplin dan etika kerja ditegakkan konsisten pada semua orang.",
              "Kesalahan dijadikan bahan belajar, bukan mencari kambing hitam.",
              "Saya bangga menjadi bagian dari lembaga ini."
      ],
      manajemen: [
              "Nilai-nilai lembaga dipraktikkan sehari-hari, bukan sekadar slogan.",
              "Suasana kekeluargaan terjaga tanpa mengurangi profesionalisme.",
              "Disiplin dan etika kerja ditegakkan konsisten pada semua orang.",
              "Kesalahan dijadikan bahan belajar, bukan mencari kambing hitam.",
              "Saya bangga menjadi bagian dari lembaga ini."
      ],
      karyawan: [
              "Nilai-nilai lembaga dipraktikkan sehari-hari, bukan sekadar slogan.",
              "Suasana kekeluargaan terjaga tanpa mengurangi profesionalisme.",
              "Disiplin dan etika kerja ditegakkan konsisten pada semua orang.",
              "Kesalahan dijadikan bahan belajar, bukan mencari kambing hitam.",
              "Saya bangga menjadi bagian dari lembaga ini."
      ],
      stakeholder: [
              "Nilai-nilai lembaga dipraktikkan sehari-hari, bukan sekadar slogan.",
              "Suasana kekeluargaan terjaga tanpa mengurangi profesionalisme.",
              "Disiplin dan etika kerja ditegakkan konsisten pada semua orang.",
              "Kesalahan dijadikan bahan belajar, bukan mencari kambing hitam.",
              "Saya bangga menjadi bagian dari lembaga ini."
      ],
    },
  },
  {
    id: 5,
    name: "Struktur Organisasi",
    short: "Budaya",
    description: "Penerapan nilai organisasi, integritas amanah, dan iklim kerja.",
    critical: true,
    evidencePrompt:
      "Sebutkan tindakan nyata pimpinan atau rekan kerja yang mencerminkan penegakan etika dan amanah.",
    conflictPrompt:
      "Apakah ada ketimpangan perlakuan atau pelanggaran etika yang terbiarkan tanpa sanksi yang adil?",
    questions: {
      pengurus: [
              "Struktur organisasi jelas dan dipahami semua pihak.",
              "Peran pengurus, pengelola, dan karyawan terbagi jelas, tanpa tumpang tindih.",
              "Jobdesk saya tertulis dan sesuai pekerjaan sebenarnya.",
              "Jalur koordinasi dan pelaporan antar level berjalan jelas.",
              "Beban kerja antar posisi terbagi wajar."
      ],
      manajemen: [
              "Struktur organisasi jelas dan dipahami semua pihak.",
              "Peran pengurus, pengelola, dan karyawan terbagi jelas, tanpa tumpang tindih.",
              "Jobdesk saya tertulis dan sesuai pekerjaan sebenarnya.",
              "Jalur koordinasi dan pelaporan antar level berjalan jelas.",
              "Beban kerja antar posisi terbagi wajar."
      ],
      karyawan: [
              "Struktur organisasi jelas dan dipahami semua pihak.",
              "Peran pengurus, pengelola, dan karyawan terbagi jelas, tanpa tumpang tindih.",
              "Jobdesk saya tertulis dan sesuai pekerjaan sebenarnya.",
              "Jalur koordinasi dan pelaporan antar level berjalan jelas.",
              "Beban kerja antar posisi terbagi wajar."
      ],
      stakeholder: [
              "Struktur organisasi jelas dan dipahami semua pihak.",
              "Peran pengurus, pengelola, dan karyawan terbagi jelas, tanpa tumpang tindih.",
              "Jobdesk saya tertulis dan sesuai pekerjaan sebenarnya.",
              "Jalur koordinasi dan pelaporan antar level berjalan jelas.",
              "Beban kerja antar posisi terbagi wajar."
      ],
    },
  },
  {
    id: 6,
    name: "Praktik Manajemen",
    short: "SDM",
    description: "Rekrutmen, pemetaan talenta, pelatihan, dan pengembangan kapabilitas.",
    critical: false,
    evidencePrompt:
      "Pelatihan atau bimbingan apa saja yang telah Anda terima dalam 12 bulan terakhir untuk menunjang tugas?",
    conflictPrompt:
      "Mengapa program pelatihan yang ada dirasakan belum menjawab kebutuhan riil pekerjaan di lapangan?",
    questions: {
      pengurus: [
              "Rencana kerja dibuat dan dikomunikasikan sebelum dilaksanakan.",
              "Keputusan penting didasarkan pada data.",
              "Pengawasan dan evaluasi kerja berjalan rutin.",
              "Rapat efektif dan menghasilkan tindak lanjut.",
              "Masalah diselesaikan tuntas dan tidak berulang."
      ],
      manajemen: [
              "Rencana kerja dibuat dan dikomunikasikan sebelum dilaksanakan.",
              "Keputusan penting didasarkan pada data.",
              "Pengawasan dan evaluasi kerja berjalan rutin.",
              "Rapat efektif dan menghasilkan tindak lanjut.",
              "Masalah diselesaikan tuntas dan tidak berulang."
      ],
      karyawan: [
              "Rencana kerja dibuat dan dikomunikasikan sebelum dilaksanakan.",
              "Keputusan penting didasarkan pada data.",
              "Pengawasan dan evaluasi kerja berjalan rutin.",
              "Rapat efektif dan menghasilkan tindak lanjut.",
              "Masalah diselesaikan tuntas dan tidak berulang."
      ],
      stakeholder: [
              "Rencana kerja dibuat dan dikomunikasikan sebelum dilaksanakan.",
              "Keputusan penting didasarkan pada data.",
              "Pengawasan dan evaluasi kerja berjalan rutin.",
              "Rapat efektif dan menghasilkan tindak lanjut.",
              "Masalah diselesaikan tuntas dan tidak berulang."
      ],
    },
  },
  {
    id: 7,
    name: "Sistem & Prosedur",
    short: "Desain Kerja",
    description: "Keseimbangan beban kerja, fleksibilitas, dan kejelasan alur proses harian.",
    critical: false,
    evidencePrompt:
      "Berapa jam rata-rata kerja/lembur mingguan Anda, dan apakah beban tersebut terdistribusi merata?",
    conflictPrompt:
      "Apa penyebab utama penumpukan beban kerja pada unit tertentu yang berpotensi memicu kejenuhan (burnout)?",
    questions: {
      pengurus: [
              "SOP tersedia untuk pekerjaan-pekerjaan utama.",
              "SOP benar-benar dijalankan.",
              "Sistem informasi/aplikasi memadai untuk mendukung pekerjaan.",
              "Data dan laporan lembaga akurat dan tepat waktu.",
              "Pengendalian internal (kas, pembiayaan, dokumen) cukup kuat mencegah penyimpangan."
      ],
      manajemen: [
              "SOP tersedia untuk pekerjaan-pekerjaan utama.",
              "SOP benar-benar dijalankan.",
              "Sistem informasi/aplikasi memadai untuk mendukung pekerjaan.",
              "Data dan laporan lembaga akurat dan tepat waktu.",
              "Pengendalian internal (kas, pembiayaan, dokumen) cukup kuat mencegah penyimpangan."
      ],
      karyawan: [
              "SOP tersedia untuk pekerjaan-pekerjaan utama.",
              "SOP benar-benar dijalankan.",
              "Sistem informasi/aplikasi memadai untuk mendukung pekerjaan.",
              "Data dan laporan lembaga akurat dan tepat waktu.",
              "Pengendalian internal (kas, pembiayaan, dokumen) cukup kuat mencegah penyimpangan."
      ],
      stakeholder: [
              "SOP tersedia untuk pekerjaan-pekerjaan utama.",
              "SOP benar-benar dijalankan.",
              "Sistem informasi/aplikasi memadai untuk mendukung pekerjaan.",
              "Data dan laporan lembaga akurat dan tepat waktu.",
              "Pengendalian internal (kas, pembiayaan, dokumen) cukup kuat mencegah penyimpangan."
      ],
    },
  },
  {
    id: 8,
    name: "Kepatuhan Syariah & Tata Kelola",
    short: "Kolaborasi",
    description: "Kerja sama antar cabang/unit, penyelesaian konflik, dan sinergi tim.",
    critical: true,
    evidencePrompt:
      "Ceritakan pengalaman kerja sama antar unit/cabang yang berjalan paling sukses atau paling menguji sinergi.",
    conflictPrompt:
      "Apa masalah utama yang memicu gesekan atau sekat silogisme antardepartemen saat koordinasi?",
    questions: {
      pengurus: [
              "Produk dan akad sesuai prinsip syariah.",
              "DPS berperan aktif dalam pengawasan.",
              "Pengurus menjalankan fungsi pengawasan secara nyata, bukan formalitas.",
              "Informasi keuangan dan kebijakan disampaikan transparan.",
              "Pelanggaran aturan ditindak tanpa memandang jabatan."
      ],
      manajemen: [
              "Produk dan akad sesuai prinsip syariah.",
              "DPS berperan aktif dalam pengawasan.",
              "Pengurus menjalankan fungsi pengawasan secara nyata, bukan formalitas.",
              "Informasi keuangan dan kebijakan disampaikan transparan.",
              "Pelanggaran aturan ditindak tanpa memandang jabatan."
      ],
      karyawan: [
              "Produk dan akad sesuai prinsip syariah.",
              "DPS berperan aktif dalam pengawasan.",
              "Pengurus menjalankan fungsi pengawasan secara nyata, bukan formalitas.",
              "Informasi keuangan dan kebijakan disampaikan transparan.",
              "Pelanggaran aturan ditindak tanpa memandang jabatan."
      ],
      stakeholder: [
              "Produk dan akad sesuai prinsip syariah.",
              "DPS berperan aktif dalam pengawasan.",
              "Pengurus menjalankan fungsi pengawasan secara nyata, bukan formalitas.",
              "Informasi keuangan dan kebijakan disampaikan transparan.",
              "Pelanggaran aturan ditindak tanpa memandang jabatan."
      ],
    },
  },
  {
    id: 9,
    name: "Iklim Kerja",
    short: "Teknologi",
    description: "Ketersediaan SOP mutakhir, otomatisasi sistem core, dan keandalan IT.",
    critical: false,
    evidencePrompt:
      "Aplikasi atau fitur sistem IT apa yang paling membantu kerja harian Anda dan seberapa sering terjadi kendala?",
    conflictPrompt:
      "Proses operasional mana yang masih manual atau terhambat SOP usang yang belum disesuaikan?",
    questions: {
      pengurus: [
              "Komunikasi antar bagian terbuka dan lancar.",
              "Kerja sama tim berjalan baik.",
              "Konflik diselesaikan secara sehat.",
              "Saya merasa aman menyampaikan pendapat yang berbeda.",
              "Saya puas dengan suasana kerja sehari-hari."
      ],
      manajemen: [
              "Komunikasi antar bagian terbuka dan lancar.",
              "Kerja sama tim berjalan baik.",
              "Konflik diselesaikan secara sehat.",
              "Saya merasa aman menyampaikan pendapat yang berbeda.",
              "Saya puas dengan suasana kerja sehari-hari."
      ],
      karyawan: [
              "Komunikasi antar bagian terbuka dan lancar.",
              "Kerja sama tim berjalan baik.",
              "Konflik diselesaikan secara sehat.",
              "Saya merasa aman menyampaikan pendapat yang berbeda.",
              "Saya puas dengan suasana kerja sehari-hari."
      ],
      stakeholder: [
              "Komunikasi antar bagian terbuka dan lancar.",
              "Kerja sama tim berjalan baik.",
              "Konflik diselesaikan secara sehat.",
              "Saya merasa aman menyampaikan pendapat yang berbeda.",
              "Saya puas dengan suasana kerja sehari-hari."
      ],
    },
  },
  {
    id: 10,
    name: "Kompetensi SDI",
    short: "Kinerja",
    description: "Keadilan kompensasi, transparansi KPI, insentif, dan apresiasi.",
    critical: true,
    evidencePrompt:
      "Bagaimana kriteria insentif dan kenaikan tingkat dihitung serta diumumkan di unit Anda?",
    conflictPrompt:
      "Jelaskan persepsi ketidakadilan terkait pemberian insentif, kompensasi, atau penilaian kinerja di tempat kerja.",
    questions: {
      pengurus: [
              "Kemampuan karyawan sesuai tuntutan tugas.",
              "Rekrutmen dan penempatan didasarkan pada kompetensi.",
              "Pelatihan yang diberikan sesuai kebutuhan kerja.",
              "Pengurus dan manajer berkompeten untuk perannya.",
              "Ada rencana pengembangan SDI dan kaderisasi yang jelas."
      ],
      manajemen: [
              "Kemampuan karyawan sesuai tuntutan tugas.",
              "Rekrutmen dan penempatan didasarkan pada kompetensi.",
              "Pelatihan yang diberikan sesuai kebutuhan kerja.",
              "Pengurus dan manajer berkompeten untuk perannya.",
              "Ada rencana pengembangan SDI dan kaderisasi yang jelas."
      ],
      karyawan: [
              "Kemampuan karyawan sesuai tuntutan tugas.",
              "Rekrutmen dan penempatan didasarkan pada kompetensi.",
              "Pelatihan yang diberikan sesuai kebutuhan kerja.",
              "Pengurus dan manajer berkompeten untuk perannya.",
              "Ada rencana pengembangan SDI dan kaderisasi yang jelas."
      ],
      stakeholder: [
              "Kemampuan karyawan sesuai tuntutan tugas.",
              "Rekrutmen dan penempatan didasarkan pada kompetensi.",
              "Pelatihan yang diberikan sesuai kebutuhan kerja.",
              "Pengurus dan manajer berkompeten untuk perannya.",
              "Ada rencana pengembangan SDI dan kaderisasi yang jelas."
      ],
    },
  },
  {
    id: 11,
    name: "Motivasi & Kebutuhan Individu",
    short: "Risiko",
    description: "Pengendalian internal, NPF/NPL, audit, kepatuhan regulasi & syariah.",
    critical: false,
    evidencePrompt:
      "Dokumen laporan NPF, hasil audit internal, atau rekomendasi DPS terbaru apa yang pernah ditindaklanjuti?",
    conflictPrompt:
      "Apa kelemahan prosedur kontrol atau kepatuhan yang berpotensi menimbulkan risiko keuangan/operasional?",
    questions: {
      pengurus: [
              "Gaji dan tunjangan sepadan dengan beban kerja.",
              "Jenjang karier jelas dan terbuka.",
              "Prestasi dihargai secara nyata.",
              "Saya mendapat kesempatan untuk berkembang.",
              "Saya bersemangat dan terlibat dalam pekerjaan."
      ],
      manajemen: [
              "Gaji dan tunjangan sepadan dengan beban kerja.",
              "Jenjang karier jelas dan terbuka.",
              "Prestasi dihargai secara nyata.",
              "Saya mendapat kesempatan untuk berkembang.",
              "Saya bersemangat dan terlibat dalam pekerjaan."
      ],
      karyawan: [
              "Gaji dan tunjangan sepadan dengan beban kerja.",
              "Jenjang karier jelas dan terbuka.",
              "Prestasi dihargai secara nyata.",
              "Saya mendapat kesempatan untuk berkembang.",
              "Saya bersemangat dan terlibat dalam pekerjaan."
      ],
      stakeholder: [
              "Gaji dan tunjangan sepadan dengan beban kerja.",
              "Jenjang karier jelas dan terbuka.",
              "Prestasi dihargai secara nyata.",
              "Saya mendapat kesempatan untuk berkembang.",
              "Saya bersemangat dan terlibat dalam pekerjaan."
      ],
    },
  },
  {
    id: 12,
    name: "Kinerja",
    short: "Stakeholder",
    description: "Kepuasan anggota/nasabah, komplain, dampak sosial, dan penanganan masukan.",
    critical: false,
    evidencePrompt:
      "Bagaimana alur dan kecepatan penanganan keluhan anggota/mitra diselesaikan hingga tuntas?",
    conflictPrompt:
      "Apa komplain atau ketidakpuasan yang paling sering disampaikan oleh pihak luar atau anggota?",
    questions: {
      pengurus: [
              "Target kerja saya/unit saya tercapai.",
              "Penilaian kinerja (KPI) objektif dan dipahami.",
              "Hasil penilaian ditindaklanjuti dengan reward atau pembinaan.",
              "Kesehatan keuangan lembaga terjaga (likuiditas, kualitas pembiayaan).",
              "Kualitas layanan kepada anggota terus meningkat."
      ],
      manajemen: [
              "Target kerja saya/unit saya tercapai.",
              "Penilaian kinerja (KPI) objektif dan dipahami.",
              "Hasil penilaian ditindaklanjuti dengan reward atau pembinaan.",
              "Kesehatan keuangan lembaga terjaga (likuiditas, kualitas pembiayaan).",
              "Kualitas layanan kepada anggota terus meningkat."
      ],
      karyawan: [
              "Target kerja saya/unit saya tercapai.",
              "Penilaian kinerja (KPI) objektif dan dipahami.",
              "Hasil penilaian ditindaklanjuti dengan reward atau pembinaan.",
              "Kesehatan keuangan lembaga terjaga (likuiditas, kualitas pembiayaan).",
              "Kualitas layanan kepada anggota terus meningkat."
      ],
      stakeholder: [
              "Target kerja saya/unit saya tercapai.",
              "Penilaian kinerja (KPI) objektif dan dipahami.",
              "Hasil penilaian ditindaklanjuti dengan reward atau pembinaan.",
              "Kesehatan keuangan lembaga terjaga (likuiditas, kualitas pembiayaan).",
              "Kualitas layanan kepada anggota terus meningkat."
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

export const HORIZONS = ["0-90 hari", "3-6 bulan", "6-12 bulan", "1-3 tahun"] as const;
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
  1: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "pendukung",
    stakeholder: "utama",
    fgd: "pendukung",
    wawancara: "utama",
    dokumen: "utama",
  },
  2: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "pendukung",
    stakeholder: "pendukung",
    fgd: "pendukung",
    wawancara: "utama",
    dokumen: "utama",
  },
  3: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "pendukung",
    fgd: "utama",
    wawancara: "utama",
    dokumen: "pendukung",
  },
  4: {
    pengurus: "pendukung",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "pendukung",
    fgd: "pendukung",
    wawancara: "utama",
    dokumen: "utama",
  },
  5: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "utama",
    fgd: "utama",
    wawancara: "utama",
    dokumen: "pendukung",
  },
  6: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "pendukung",
    fgd: "pendukung",
    wawancara: "utama",
    dokumen: "utama",
  },
  7: {
    pengurus: "pendukung",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "pendukung",
    fgd: "pendukung",
    wawancara: "pendukung",
    dokumen: "utama",
  },
  8: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "pendukung",
    fgd: "utama",
    wawancara: "pendukung",
    dokumen: null,
  },
  9: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "utama",
    fgd: "pendukung",
    wawancara: "pendukung",
    dokumen: "utama",
  },
  10: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "pendukung",
    fgd: "utama",
    wawancara: "pendukung",
    dokumen: "utama",
  },
  11: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "pendukung",
    stakeholder: "pendukung",
    fgd: "pendukung",
    wawancara: "utama",
    dokumen: "utama",
  },
  12: {
    pengurus: "utama",
    manajemen: "utama",
    karyawan: "utama",
    stakeholder: "utama",
    fgd: "utama",
    wawancara: "utama",
    dokumen: "utama",
  },
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
