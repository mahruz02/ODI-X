import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createPublicClient,
  createProject,
  createRespondentLink,
  deleteQualitativeEntry,
  deleteProject,
  deleteRespondent,
  deleteResponsesByRole,
  fetchRespondents,
  fetchRespondentLinks,
  fetchQualitative,
  saveDocumentReview,
  saveFgdNote,
  saveInterviewNote,
  saveQuantitativeMetric,
  fetchDashboardData,
  fetchProjects,
  fetchTriangulationData,
  updateProjectStatus,
  seedAdminAccounts,
} from "./diagnosis.server";

export const seedDefaultAdmin = createServerFn({ method: "POST" })
  .handler(() => seedAdminAccounts());

export const listProjects = createServerFn({ method: "GET" })
  .handler(() => fetchProjects(createPublicClient()));

export const listRespondentLinks = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) => fetchRespondentLinks(createPublicClient(), data.id));

export const addRespondentLink = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        perspective: z.enum(["pengurus", "manajemen", "karyawan", "stakeholder"]),
        respondentName: z.string().max(120).optional(),
        respondentEmail: z.string().max(160).optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => createRespondentLink(createPublicClient(), data));

export const addProject = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        name: z.string().min(2).max(160),
        startedOn: z.string().max(20).optional(),
        sector: z.string().max(160).optional(),
        employeeCount: z.number().int().min(1).optional(),
        mainProducts: z.string().max(500).optional(),
        strengths: z.string().max(1000).optional(),
        challenges: z.string().max(1000).optional(),
        priorities12m: z.string().max(1000).optional(),
        instrument: z.string().max(160).optional(),
        scheduledEnd: z.string().max(20).optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => createProject(createPublicClient(), data));

export const setProjectStatus = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["berjalan", "selesai"]),
      })
      .parse(data),
  )
  .handler(({ data }) => updateProjectStatus(createPublicClient(), data));

export const getDashboardData = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) => fetchDashboardData(createPublicClient(), data.id));

export const getTriangulationData = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) =>
    fetchTriangulationData(createPublicClient(), data.id),
  );

export const getQualitativeData = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) => fetchQualitative(createPublicClient(), data.id));

export const addFgdNote = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        dimension: z.number().int().min(1).max(12),
        facilitator: z.string().max(120).optional(),
        themes: z.string().max(4000).optional(),
        quotes: z.string().max(4000).optional(),
        consensus: z.number().int().min(1).max(5).optional(),
        status: z.enum(["draft", "final"]),
      })
      .parse(data),
  )
  .handler(({ data }) => saveFgdNote(createPublicClient(), data));

export const addInterviewNote = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        dimension: z.number().int().min(1).max(12),
        informantRole: z.string().max(120).optional(),
        findings: z.string().max(4000).optional(),
        status: z.enum(["draft", "final"]),
      })
      .parse(data),
  )
  .handler(({ data }) => saveInterviewNote(createPublicClient(), data));

export const addDocumentReview = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        dimension: z.number().int().min(1).max(12),
        docType: z.string().min(2).max(160),
        docStatus: z.enum(["mutakhir", "usang", "tidak_ada", "ada", "sebagian", "tidak ada"]),
        score: z.number().int().min(1).max(5).optional(),
        confidenceLevel: z.enum(["tipis", "cukup", "kuat"]).optional(),
        notes: z.string().max(4000).optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => saveDocumentReview(createPublicClient(), data));

export const addQuantitativeMetric = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        dimension: z.number().int().min(1).max(12),
        metricName: z.string().min(2).max(160),
        targetVal: z.string().max(100).optional(),
        actualVal: z.string().max(100).optional(),
        unit: z.string().max(50).optional(),
        period: z.string().max(100).optional(),
        dataSource: z.string().max(160).optional(),
        confidenceLevel: z.enum(["tipis", "cukup", "kuat"]).optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => saveQuantitativeMetric(createPublicClient(), data));

export const removeQualitativeEntry = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        table: z.enum(["fgd_notes", "interview_notes", "document_reviews", "quantitative_metrics"]),
        id: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(({ data }) =>
    deleteQualitativeEntry(createPublicClient(), data),
  );

export const removeProject = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) => deleteProject(createPublicClient(), data.id));

export const getRespondents = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(({ data }) => fetchRespondents(createPublicClient(), data.id));

export const removeRespondent = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        respondentId: z.string().min(1).max(80),
      })
      .parse(data),
  )
  .handler(({ data }) => deleteRespondent(createPublicClient(), data));

export const removeResponsesByRole = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        organizationId: z.string().uuid(),
        role: z.enum(["pengurus", "manajemen", "karyawan", "stakeholder"]),
      })
      .parse(data),
  )
  .handler(({ data }) => deleteResponsesByRole(createPublicClient(), data));
