const { z } = require('zod');

const today = new Date().toISOString().split('T')[0];

const createTransactionSchema = z.object({
  body: z.object({
    account_id: z.string(),
    category_id: z.string().nullable().optional(),
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z.number().positive('Valor deve ser maior que zero').max(999999.99, 'Valor máximo excedido'),
    description: z.string().trim().min(1, 'Descrição é obrigatória').max(200, 'Descrição muito longa'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
      .refine(d => d <= today, 'Data não pode ser futura'),
    notes: z.string().max(500, 'Notas muito longas').optional().nullable(),
    recurring_id: z.string().optional().nullable(),
    from_account_id: z.string().optional(),
    to_account_id: z.string().optional()
  })
});

const updateTransactionSchema = z.object({
  body: z.object({
    account_id: z.string().optional(),
    category_id: z.string().nullable().optional(),
    type: z.enum(['income', 'expense', 'transfer']).optional(),
    amount: z.number().positive('Valor deve ser maior que zero').max(999999.99).optional(),
    description: z.string().trim().min(1).max(200).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes: z.string().max(500).nullable().optional(),
    from_account_id: z.string().optional(),
    to_account_id: z.string().optional()
  })
});

module.exports = { createTransactionSchema, updateTransactionSchema };
