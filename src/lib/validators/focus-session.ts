import { z } from "zod";

export const startSessionSchema = z.object({
  focusConfigId: z.string().min(1),
  objectiveId: z.string().optional(),
});

export const finishSessionSchema = z.object({
  notes: z.string().max(5000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type FinishSessionInput = z.infer<typeof finishSessionSchema>;
