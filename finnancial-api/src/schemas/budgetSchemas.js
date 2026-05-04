const { z } = require('zod');

const createBudgetSchema = z.object({
  body: z.object({
    category_id: z.string(),
    amount_limit: z.number().positive('Limite deve ser maior que zero'),
    month: z.number().int().min(1).max(12, 'Mês inválido'),
    year: z.number().int().min(2020).max(2099, 'Ano inválido')
  })
});

const updateBudgetSchema = z.object({
  body: z.object({
    amount_limit: z.number().positive('Limite deve ser maior que zero').optional(),
    category_id: z.string().optional()
  })
});

module.exports = { createBudgetSchema, updateBudgetSchema };
