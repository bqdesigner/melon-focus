import { z } from "zod";

export const createFocusConfigSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio").max(100),
  methodology: z.enum(["POMODORO", "DEEP_WORK", "FLOWTIME", "CUSTOM"]),
  focusDuration: z.number().int().min(1).max(240),
  shortBreakDuration: z.number().int().min(1).max(60),
  longBreakDuration: z.number().int().min(1).max(60).optional(),
  sessionsBeforeLongBreak: z.number().int().min(1).max(20).optional(),
  autoStartBreak: z.boolean().optional(),
  autoStartFocus: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  soundType: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const updateFocusConfigSchema = createFocusConfigSchema.partial();

export type CreateFocusConfigInput = z.infer<typeof createFocusConfigSchema>;
export type UpdateFocusConfigInput = z.infer<typeof updateFocusConfigSchema>;
