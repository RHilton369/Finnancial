const { z } = require('zod');

const createGoalSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
    target_amount: z.number().positive('Valor alvo deve ser positivo'),
    current_amount: z.number().gte(0).optional().default(0),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#1D9E75'),
    icon: z.string().max(50).optional().default('target')
  })
});

const updateGoalSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    target_amount: z.number().positive().optional(),
    current_amount: z.number().gte(0).optional(),
    deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().max(50).optional()
  })
});

const depositSchema = z.object({
  body: z.object({
    amount: z.number().positive('Valor do depósito deve ser positivo')
  })
});

module.exports = { createGoalSchema, updateGoalSchema, depositSchema };
