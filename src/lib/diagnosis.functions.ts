import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchLinkByToken, fetchOrganizationByCode, insertResponses, submitResponsesWithToken } from "./diagnosis.server";

export const getOrganizationByCode = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ code: z.string().max(80) }).parse(data))
  .handler(({ data }) => fetchOrganizationByCode(data.code));

export const getLinkByToken = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ token: z.string().max(100) }).parse(data))
  .handler(({ data }) => fetchLinkByToken(data.token));

const submitSchema = z.object({
  code: z.string().max(80),
  role: z.enum(["pengurus", "manajemen", "karyawan", "stakeholder"]),
  name: z.string().max(120).optional(),
  tenure: z.string().max(40).optional(),
  answers: z
    .array(
      z.object({
        dimension: z.number().int().min(1).max(12),
        questionId: z.string().max(40),
        score: z.number().int().min(1).max(5),
        isNa: z.boolean().optional(),
        evidenceText: z.string().max(2000).optional(),
        conflictText: z.string().max(2000).optional(),
        comment: z.string().max(2000).optional(),
      }),
    )
    .min(1),
});

export const submitResponses = createServerFn({ method: "POST" })
  .inputValidator((data) => submitSchema.parse(data))
  .handler(({ data }) => insertResponses(data));

const submitTokenSchema = z.object({
  token: z.string().max(100),
  name: z.string().max(120).optional(),
  tenure: z.string().max(40).optional(),
  answers: z
    .array(
      z.object({
        dimension: z.number().int().min(1).max(12),
        questionId: z.string().max(40),
        score: z.number().int().min(1).max(5),
        isNa: z.boolean().optional(),
        evidenceText: z.string().max(2000).optional(),
        conflictText: z.string().max(2000).optional(),
        comment: z.string().max(2000).optional(),
      }),
    )
    .min(1),
});

export const submitTokenResponses = createServerFn({ method: "POST" })
  .inputValidator((data) => submitTokenSchema.parse(data))
  .handler(({ data }) => submitResponsesWithToken(data));
