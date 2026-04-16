import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(100),
  email: z.string().email("Email invalido"),
  password: z
    .string()
    .min(8, "Senha deve ter no minimo 8 caracteres")
    .max(100)
    .regex(/[A-Z]/, "Senha deve ter ao menos uma letra maiuscula")
    .regex(/[0-9]/, "Senha deve ter ao menos um numero"),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "Senha obrigatoria"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
