import React from "react";
import { renderToString } from "react-dom/server";

import { RadarTriChart } from "../src/components/RadarTriChart";
import { KanbanRoadmap } from "../src/components/KanbanRoadmap";
import { DomainDetailModal } from "../src/components/DomainDetailModal";
import { AssessmentNavTabs } from "../src/components/AssessmentNavTabs";

console.log("=== MEMULAI PENGETESAN RENDER UI COMPONENTS ===");

let total = 0;
let passed = 0;

function assert(cond: boolean, name: string) {
  total++;
  if (!cond) {
    console.error(`❌ FAIL UI: ${name}`);
    process.exit(1);
  }
  passed++;
  console.log(`✓ PASS UI: ${name}`);
}

// 1. RadarTriChart Render
try {
  const mockRadarData = [
    { label: "Visi", pengurus: 4.2, manajemen: 3.8, karyawan: 3.1, stakeholder: 4.0 },
    { label: "Tata Kelola", pengurus: 4.0, manajemen: 3.5, karyawan: 3.0, stakeholder: 3.8 },
  ];

  const htmlRadar = renderToString(React.createElement(RadarTriChart, { data: mockRadarData }));
  assert(htmlRadar.length > 0, "RadarTriChart berhasil di-render ke HTML");
} catch (e: any) {
  console.error("RadarTriChart error:", e.message);
  assert(false, "RadarTriChart render test");
}

// 2. KanbanRoadmap Render
try {
  const mockRecs = [
    {
      dimension: 1,
      name: "Kepemimpinan & Visi",
      title: "Sosialisasi Visi Organisasi",
      direction: "Perbaiki",
      priority: "Tinggi",
      horizon: "3-6 bulan",
      pic: "Direksi Utama",
      kpi: "Keterpahaman Visi > 80%",
      target: "L4 Terkelola",
      actions: ["Roadshow cabang", "Townhall bulanan"],
      reason: "Gap persepsi staf dan pimpinan tinggi",
      evidenceTrace: "FGD + Kuesioner",
    },
  ];

  const htmlKanban = renderToString(React.createElement(KanbanRoadmap, { recommendations: mockRecs as any }));
  assert(htmlKanban.includes("Sosialisasi Visi Organisasi") && htmlKanban.includes("Direksi Utama"), "KanbanRoadmap berhasil di-render dengan data rekomendasi");
} catch (e: any) {
  console.error("KanbanRoadmap error:", e.message);
  assert(false, "KanbanRoadmap render test");
}

// 3. DomainDetailModal Render
try {
  const mockSummary = {
    id: 1,
    name: "Kepemimpinan & Visi Strategis",
    short: "Visi",
    description: "Evaluasi Visi dan Kepemimpinan",
    average: 3.75,
    gap: 1.2,
    level: "high" as const,
    roleScores: { pengurus: 4.2, manajemen: 3.8, karyawan: 3.0, stakeholder: 4.0 },
    scoreNormalized: 75,
  };

  const htmlModal = renderToString(
    React.createElement(DomainDetailModal, {
      summary: mockSummary as any,
      onClose: () => {},
      evidenceData: {
        fgdCount: 2,
        interviewCount: 3,
        docCount: 1,
        fgdQuotes: ["SOP kurang jelas"],
        interviewFindings: ["Perlu refresh pelatihan"],
        metrics: [{ name: "Target NPF", target: "< 3%", actual: "4.5%" }],
      },
    })
  );

  assert(htmlModal.includes("Kepemimpinan &amp; Visi Strategis") && htmlModal.includes("SOP kurang jelas"), "DomainDetailModal berhasil di-render dengan bukti kualitatif");
} catch (e: any) {
  console.error("DomainDetailModal error:", e.message);
  assert(false, "DomainDetailModal render test");
}

console.log(`\n========================================`);
console.log(`SEMUA KOMPONEN UI LULUS RENDER (${passed}/${total} assertions)`);
console.log(`========================================`);
