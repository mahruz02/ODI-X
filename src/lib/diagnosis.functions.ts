import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchOrganizationByCode, insertResponses } from "./diagnosis.server";

export const getOrganizationByCode = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ code: z.string().max(80) }).parse(data))
  .handler(({ data }) => fetchOrganizationByCode(data.code));

const submitSchema = z.object({
  code: z.string().max(80),
  role: z.enum(["pengurus", "manajemen", "karyawan"]),
  name: z.string().max(120).optional(),
  tenure: z.string().max(40).optional(),
  answers: z
    .array(
      z.object({
        dimension: z.number().int().min(1).max(10),
        questionId: z.string().max(40),
        score: z.number().int().min(1).max(5),
        comment: z.string().max(2000).optional(),
      }),
    )
    .min(1),
});

export const submitResponses = createServerFn({ method: "POST" })
  .inputValidator((data) => submitSchema.parse(data))
  .handler(({ data }) => insertResponses(data));
