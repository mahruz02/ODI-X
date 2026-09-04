import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createPublicClient,
  createProject,
  deleteQualitativeEntry,
  deleteProject,
  deleteRespondent,
  deleteResponsesByRole,
  fetchRespondents,
  fetchQualitative,
  saveDocumentReview,
  saveFgdNote,
  saveInterviewNote,
  fetchDashboardData,
  fetchProjects,
  fetchTriangulationData,
  updateProjectStatus,
} from "./diagnosis.server";

export const listProjects = createServerFn({ method: "GET" })
  .handler(() => fetchProjects(createPublicClient()));

export const addProject = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        name: z.string().min(2).max(160),
        startedOn: z.string().max(20).optional(),
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
        dimension: z.number().int().min(1).max(10),
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
        dimension: z.number().int().min(1).max(10),
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
        dimension: z.number().int().min(1).max(10),
        docType: z.string().min(2).max(160),
        docStatus: z.enum(["ada", "sebagian", "tidak ada"]),
        score: z.number().int().min(1).max(5).optional(),
        notes: z.string().max(4000).optional(),
      })
      .parse(data),
  )
  .handler(({ data }) => saveDocumentReview(createPublicClient(), data));

export const removeQualitativeEntry = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        table: z.enum(["fgd_notes", "interview_notes", "document_reviews"]),
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
        role: z.enum(["pengurus", "manajemen", "karyawan"]),
      })
      .parse(data),
  )
  .handler(({ data }) => deleteResponsesByRole(createPublicClient(), data));
