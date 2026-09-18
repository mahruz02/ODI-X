import {
  DIMENSIONS,
  ROLE_LABELS,
  dimensionsForRole,
  gapLevel,
} from "../src/lib/questionnaire.js";
import {
  buildDimensionSummaries,
  computeCompositeIndices,
  buildRecommendations,
} from "../src/lib/report.js";
import {
  buildEvidenceMap,
  computeConfidence,
  evidenceFor,
} from "../src/lib/confidence.js";
import { buildPriorities, topPriorities } from "../src/lib/priority.js";

console.log("=== MEMULAI PENGETESAN SELURUH FUNGSI ODI-X ===");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  passed++;
  console.log(`✓ PASS: ${message}`);
}

// 1. Tes Instrument & Questionnaire Config
assert(DIMENSIONS.length === 12, "Harus ada 12 domain kesehatan organisasi");
assert(Object.keys(ROLE_LABELS).length === 4, "Harus ada 4 prespektif peran");

for (const role of ["pengurus", "manajemen", "karyawan", "stakeholder"]) {
  const dims = dimensionsForRole(role);
  assert(dims.length > 0, `Peran ${role} harus memiliki daftar pertanyaan domain`);
}

// 2. Tes Calculation Engine: Dimension Summaries & Composite Indices
const mockScores = [];
for (let d = 1; d <= 12; d++) {
  mockScores.push(
    { organization_id: "test", organization_name: "Test Org", dimension: d, role: "pengurus", avg_score: 4.2, respondents: 5 },
    { organization_id: "test", organization_name: "Test Org", dimension: d, role: "manajemen", avg_score: 3.8, respondents: 8 },
    { organization_id: "test", organization_name: "Test Org", dimension: d, role: "karyawan", avg_score: 3.0, respondents: 20 },
    { organization_id: "test", organization_name: "Test Org", dimension: d, role: "stakeholder", avg_score: 3.9, respondents: 10 }
  );
}

const summaries = buildDimensionSummaries(mockScores);
assert(summaries.length === 12, "buildDimensionSummaries menghasilkan 12 summary domain");
assert(Number(summaries[0].gap.toFixed(1)) === 1.2, "Hitung deviasi gap persepsi max - min (4.2 - 3.0 = 1.2)");
assert(summaries[0].level === "high", "Gap >= 1.2 dikategorikan 'high'");

const indices = computeCompositeIndices(summaries);
assert(indices.healthIndex > 0 && indices.healthIndex <= 100, "Health Index dalam skala 0..100");
assert(indices.alignmentIndex > 0 && indices.alignmentIndex <= 100, "Alignment Index dalam skala 0..100");
assert(indices.adaptabilityIndex > 0 && indices.adaptabilityIndex <= 100, "Adaptability Index dalam skala 0..100");
assert(indices.maturityLevel >= 1 && indices.maturityLevel <= 5, "Maturity Level bernilai 1 s.d. 5");

// 3. Tes Evidence & Confidence Engine
const mockEvidenceMap = buildEvidenceMap({
  scores: mockScores,
  fgd: [{ dimension: 1, quotes: "Ada masalah komunikasi" }],
  interviews: [{ dimension: 1, findings: "Temuan wawancara" }],
  documents: [{ dimension: 1, doc_type: "SOP" }],
});

const ev1 = evidenceFor(mockEvidenceMap, 1);
assert(ev1.fgd === 1 && ev1.interviews === 1 && ev1.documents === 1, "Evidence map menghitung bukti kualitatif domain 1");

const conf1 = computeConfidence(ev1);
assert(conf1.level === "kuat" && conf1.methods === 4, "3 sumber kualitatif + kuantitatif = Confidence Level 'kuat'");

// 4. Tes Priority Engine
const priorities = buildPriorities(summaries, (dimId) => computeConfidence(evidenceFor(mockEvidenceMap, dimId)));
assert(priorities.length === 12, "buildPriorities menghasilkan skor prioritas 12 domain");
assert(priorities[0].score > 0, "Skor prioritas bernilai positif");

const top3 = topPriorities(priorities, 3);
assert(top3.length === 3, "topPriorities mengembalikan 3 prioritas teratas");

// 5. Tes Recommendation Engine
const recs = buildRecommendations(summaries);
assert(recs.length === 12, "buildRecommendations membuat rekomendasi untuk 12 domain");
assert(recs[0].horizon && recs[0].actions.length > 0, "Rekomendasi memiliki horizon dan tindakan aksi");

console.log(`\n========================================`);
console.log(`SEMUA FUNGSI LULUS UJI (${passed}/${total} assertions)`);
console.log(`========================================`);
