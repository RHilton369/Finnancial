import { z } from "zod";

// --- Schemas de Transação ---

export const updateTransactionSchema = z.object({
  description: z.string().min(1).max(255).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
  categoryId: z.string().uuid().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// --- Schemas de Categoria ---

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser hexadecimal (#RRGGBB)")
    .optional()
    .default("#3b82f6"),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser hexadecimal (#RRGGBB)")
    .optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// --- Schemas de Limite de Orçamento ---

export const createLimitSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().positive(),
  period: z.enum(["MONTHLY", "WEEKLY"]).optional().default("MONTHLY"),
});

export type CreateLimitInput = z.infer<typeof createLimitSchema>;
