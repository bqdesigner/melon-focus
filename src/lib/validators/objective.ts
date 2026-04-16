import { z } from "zod";

export const createObjectiveSchema = z.object({
  title: z.string().min(1, "Titulo obrigatorio").max(200),
  description: z.string().max(2000).optional(),
  targetHours: z.number().positive().optional(),
  targetSessions: z.number().int().positive().optional(),
  deadline: z.string().datetime().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor invalida")
    .optional(),
  tagIds: z.array(z.string()).optional(),
});

export const updateObjectiveSchema = createObjectiveSchema
  .partial()
  .extend({
    status: z.enum(["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).optional(),
  });

export type CreateObjectiveInput = z.infer<typeof createObjectiveSchema>;
export type UpdateObjectiveInput = z.infer<typeof updateObjectiveSchema>;
