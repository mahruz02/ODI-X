// Definisi 10 dimensi diagnosis dan kuesioner berlapis (Pengurus / Manajemen / Karyawan).
// Pertanyaan per peran disesuaikan sudut pandangnya, tetapi tetap dalam dimensi yang sama
// sehingga skor bisa dibandingkan silang (triangulasi persepsi).

export type Role = "pengurus" | "manajemen" | "karyawan";

export const ROLE_LABELS: Record<Role, string> = {
  pengurus: "Pengurus",
  manajemen: "Manajemen",
  karyawan: "Karyawan",
};

export interface Dimension {
  id: number;
  name: string;
  short: string;
  description: string;
  /** Dimensi kritis: kolom komentar terbuka wajib diisi */
  critical: boolean;
  questions: Record<Role, string[]>;
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 1,
    name: "Arah & Strategi",
    short: "Arah",
    description: "Kejelasan visi-misi dan pemahaman arah bisnis di semua level.",
    critical: false,
    questions: {
      pengurus: [
        "Visi dan misi BMT dirumuskan dengan jelas dan masih relevan dengan kondisi saat ini.",
        "Arah strategis yang ditetapkan Pengurus tersampaikan dengan baik ke seluruh jajaran.",
        "Keputusan strategis Pengurus didukung data dan analisis yang memadai.",
      ],
      manajemen: [
        "Saya memahami dengan jelas arah dan target yang ditetapkan Pengurus untuk tahun berjalan.",
        "Pengurus memberikan arahan yang konsisten dan tidak berubah-ubah secara mendadak.",
        "Saya dilibatkan dalam perumusan rencana kerja yang menjadi tanggung jawab saya.",
      ],
      karyawan: [
        "Saya tahu apa visi dan tujuan BMT tempat saya bekerja.",
        "Saya memahami target kerja unit saya tahun ini.",
        "Atasan saya menjelaskan bagaimana pekerjaan saya berkontribusi pada tujuan BMT.",
      ],
    },
  },
  {
    id: 2,
    name: "Struktur Organisasi",
    short: "Struktur",
    description: "Kejelasan peran, rentang kendali, dan tumpang tindih wewenang.",
    critical: false,
    questions: {
      pengurus: [
        "Pembagian peran antara Pengurus, Pengawas, dan Manajemen berjalan jelas tanpa tumpang tindih.",
        "Struktur organisasi saat ini sesuai dengan beban kerja dan skala layanan BMT.",
        "Setiap posisi memiliki uraian tugas dan wewenang yang jelas.",
      ],
      manajemen: [
        "Batas wewenang saya jelas — saya tahu keputusan apa yang bisa saya ambil sendiri.",
        "Tidak ada pekerjaan yang dikerjakan dua unit sekaligus tanpa koordinasi.",
        "Jumlah bawahan yang saya tangani masih masuk akal.",
      ],
      karyawan: [
        "Saya memahami tugas dan tanggung jawab saya dengan jelas.",
        "Saya tahu kepada siapa harus melapor dan bertanya.",
        "Tugas yang saya terima tidak saling bertentangan antar atasan.",
      ],
    },
  },
  {
    id: 3,
    name: "Kepemimpinan & Pengambilan Keputusan",
    short: "Kepemimpinan",
    description: "Gaya kepemimpinan, kecepatan, dan transparansi keputusan.",
    critical: true,
    questions: {
      pengurus: [
        "Pengurus mengambil keputusan dengan cepat dan tepat waktu.",
        "Manajemen dan karyawan memahami alasan di balik keputusan yang diambil.",
        "Pengurus terbuka terhadap masukan dan kritik dari jajaran di bawahnya.",
      ],
      manajemen: [
        "Pimpinan memberi ruang bagi saya untuk menyampaikan pendapat yang berbeda.",
        "Keputusan yang menyangkut unit saya diambil dengan melibatkan saya.",
        "Alasan di balik keputusan penting selalu dijelaskan kepada kami.",
      ],
      karyawan: [
        "Atasan saya memberi contoh yang baik dalam bekerja.",
        "Saya berani menyampaikan pendapat atau keluhan kepada atasan.",
        "Keputusan yang berdampak pada pekerjaan saya diumumkan dengan jelas.",
      ],
    },
  },
  {
    id: 4,
    name: "Relasi & Komunikasi",
    short: "Relasi",
    description: "Hubungan Pengurus–Manajemen–Karyawan, konflik terpendam, arus informasi.",
    critical: true,
    questions: {
      pengurus: [
        "Hubungan kerja antara Pengurus dan Manajemen berjalan harmonis dan profesional.",
        "Informasi mengalir lancar dari Pengurus hingga karyawan lapangan.",
        "Tidak ada konflik terpendam yang mengganggu kerja organisasi.",
      ],
      manajemen: [
        "Saya dapat berkomunikasi dengan Pengurus tanpa ragu ketika ada masalah.",
        "Informasi kebijakan sampai ke unit saya dengan cepat dan utuh.",
        "Ketika ada konflik antar unit, ada mekanisme penyelesaian yang adil.",
      ],
      karyawan: [
        "Suasana kerja di unit saya nyaman dan saling mendukung.",
        "Saya mendapat informasi yang saya butuhkan untuk bekerja dengan baik.",
        "Keluhan saya ditanggapi dengan serius.",
      ],
    },
  },
  {
    id: 5,
    name: "Sistem Imbalan & Keadilan",
    short: "Imbalan",
    description: "Kompensasi, insentif, dan keadilan promosi.",
    critical: true,
    questions: {
      pengurus: [
        "Struktur kompensasi BMT sudah adil dan kompetitif dibanding lembaga sejenis.",
        "Mekanisme insentif dan promosi berjalan transparan dan berbasis kinerja.",
        "Pengurus rutin meninjau kesejahteraan karyawan.",
      ],
      manajemen: [
        "Kriteria insentif dan promosi jelas dan saya pahami.",
        "Kompensasi yang saya terima sebanding dengan tanggung jawab saya.",
        "Penilaian kinerja di BMT ini dilakukan secara objektif.",
      ],
      karyawan: [
        "Gaji dan tunjangan saya sesuai dengan beban kerja saya.",
        "Aturan insentif dijelaskan dengan jelas dan hitungannya transparan.",
        "Saya merasa diperlakukan adil dibanding rekan kerja lain.",
      ],
    },
  },
  {
    id: 6,
    name: "Sistem & Mekanisme Kerja",
    short: "Sistem",
    description: "SOP, teknologi/sistem informasi, dan efektivitas proses kerja.",
    critical: false,
    questions: {
      pengurus: [
        "SOP yang dimiliki BMT lengkap dan selalu diperbarui.",
        "Sistem informasi/teknologi yang dipakai mendukung kerja yang efektif.",
        "Proses kerja berjalan efisien tanpa duplikasi yang tidak perlu.",
      ],
      manajemen: [
        "SOP yang ada sesuai dengan praktik kerja nyata saat ini.",
        "Sistem informasi yang kami pakai andal dan mempercepat pekerjaan.",
        "Proses persetujuan tidak berbelit dan tidak menghambat layanan.",
      ],
      karyawan: [
        "Ada panduan tertulis (SOP) untuk pekerjaan utama saya.",
        "Aplikasi/sistem yang saya pakai jarang bermasalah.",
        "Cara kerja di unit saya sudah efisien.",
      ],
    },
  },
  {
    id: 7,
    name: "Tata Kelola Syariah & Kepatuhan",
    short: "Syariah",
    description: "Kepatuhan syariah, peran DPS, dan integritas amanah.",
    critical: false,
    questions: {
      pengurus: [
        "DPS menjalankan pengawasan syariah secara rutin dan independen.",
        "Seluruh produk dan akad BMT telah sesuai fatwa dan prinsip syariah.",
        "Rekomendasi DPS selalu ditindaklanjuti dengan serius.",
      ],
      manajemen: [
        "Saya memahami batasan syariah dalam produk yang saya kelola.",
        "DPS mudah dihubungi ketika kami butuh arahan operasional.",
        "Temuan pengawasan syariah selalu kami tindaklanjuti tepat waktu.",
      ],
      karyawan: [
        "Saya memahami akad-akad yang digunakan dalam transaksi dengan anggota.",
        "Pelatihan syariah yang saya terima cukup untuk menjalankan tugas.",
        "Nilai amanah benar-benar diterapkan dalam pelayanan harian.",
      ],
    },
  },
  {
    id: 8,
    name: "Kesehatan Keuangan & Manajemen Risiko",
    short: "Keuangan",
    description: "NPF, likuiditas, dan pengendalian risiko — terutama dari telaah dokumen.",
    critical: false,
    questions: {
      pengurus: [
        "Laporan keuangan bulanan disampaikan lengkap dan tepat waktu.",
        "Tingkat pembiayaan bermasalah (NPF) terkendali sesuai target.",
        "BMT memiliki mekanisme pengendalian risiko yang berjalan efektif.",
      ],
      manajemen: [
        "Saya memahami indikator kesehatan keuangan unit saya (NPF, likuiditas).",
        "Ada prosedur jelas untuk menangani pembiayaan bermasalah.",
        "Risiko operasional di unit saya teridentifikasi dan terkendali.",
      ],
      // Karyawan tidak dinilai dari persepsi pada dimensi ini — sumber utamanya telaah dokumen.
      karyawan: [],
    },
  },
  {
    id: 9,
    name: "Budaya & Nilai Kerja",
    short: "Budaya",
    description: "Budaya kerja riil versus nilai yang diklaim, dan keteladanan.",
    critical: false,
    questions: {
      pengurus: [
        "Nilai-nilai organisasi (amanah, profesional, melayani) benar-benar dipraktikkan.",
        "Pengurus memberi keteladanan dalam perilaku sehari-hari.",
        "Budaya kerja di BMT sesuai dengan nilai yang kami proklamirkan.",
      ],
      manajemen: [
        "Perilaku nyata pimpinan sesuai dengan nilai yang disampaikan.",
        "Karyawan yang berprestasi diakui dan diapresiasi.",
        "Tidak ada kesenjangan besar antara nilai di dinding dan praktik harian.",
      ],
      karyawan: [
        "Saya bangga bekerja di BMT ini.",
        "Atasan saya meneladani nilai amanah dalam keseharian.",
        "Rekan kerja saya saling membantu tanpa pamrih.",
      ],
    },
  },
  {
    id: 10,
    name: "Keterlibatan & Kesejahteraan Karyawan",
    short: "Kesejahteraan",
    description: "Motivasi, beban kerja, dan risiko kehilangan karyawan (retention).",
    critical: false,
    questions: {
      pengurus: [
        "Tingkat keterlibatan dan motivasi karyawan secara umum baik.",
        "Beban kerja karyawan terdistribusi secara wajar.",
        "Karyawan berprestasi cenderung bertahan di BMT ini.",
      ],
      manajemen: [
        "Anggota tim saya menunjukkan motivasi kerja yang baik.",
        "Beban kerja tim saya, termasuk lembur, masih dalam batas wajar.",
        "Saya jarang kehilangan anggota tim yang baik.",
      ],
      karyawan: [
        "Saya bersemangat menjalankan pekerjaan sehari-hari.",
        "Beban kerja saya masih wajar dan tidak mengganggu kehidupan pribadi.",
        "Saya berencana tetap bekerja di BMT ini dalam dua tahun ke depan.",
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

/** Ambang gap persepsi antar level (selisih maks-min skor rata-rata) */
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

/** Daftar dimensi yang diisi untuk peran tertentu (karyawan melewati dimensi Keuangan). */
export function dimensionsForRole(role: Role): Dimension[] {
  return DIMENSIONS.filter((d) => d.questions[role].length > 0);
}

/** Sumber data per dimensi pada peta triangulasi; '—' berarti memang tidak direncanakan. */
export const TRIANGULATION_PLAN: Record<number, Record<string, "utama" | "pendukung" | null>> = {
  1: { pengurus: "utama", manajemen: "utama", karyawan: "pendukung", fgd: "pendukung", wawancara: "utama", dokumen: "utama" },
  2: { pengurus: "pendukung", manajemen: "utama", karyawan: "utama", fgd: "pendukung", wawancara: "utama", dokumen: "utama" },
  3: { pengurus: "utama", manajemen: "utama", karyawan: "utama", fgd: "utama", wawancara: "utama", dokumen: null },
  4: { pengurus: "utama", manajemen: "utama", karyawan: "utama", fgd: "utama", wawancara: "pendukung", dokumen: null },
  5: { pengurus: "pendukung", manajemen: "utama", karyawan: "utama", fgd: "utama", wawancara: "pendukung", dokumen: "pendukung" },
  6: { pengurus: "pendukung", manajemen: "utama", karyawan: "utama", fgd: "pendukung", wawancara: null, dokumen: "utama" },
  7: { pengurus: "utama", manajemen: "utama", karyawan: "pendukung", fgd: null, wawancara: "utama", dokumen: "utama" },
  8: { pengurus: "utama", manajemen: "pendukung", karyawan: null, fgd: null, wawancara: "utama", dokumen: "utama" },
  9: { pengurus: "utama", manajemen: "pendukung", karyawan: "utama", fgd: "utama", wawancara: "pendukung", dokumen: null },
  10: { pengurus: "pendukung", manajemen: "utama", karyawan: "utama", fgd: "utama", wawancara: "pendukung", dokumen: null },
};

export const TRIANGULATION_SOURCES = [
  { key: "pengurus", label: "Kuesioner Pengurus" },
  { key: "manajemen", label: "Kuesioner Manajemen" },
  { key: "karyawan", label: "Kuesioner Karyawan" },
  { key: "fgd", label: "FGD" },
  { key: "wawancara", label: "Wawancara" },
  { key: "dokumen", label: "Telaah Dokumen" },
] as const;
