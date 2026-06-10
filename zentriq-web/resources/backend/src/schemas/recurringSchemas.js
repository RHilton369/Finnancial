const { z } = require('zod');

const createRecurringSchema = z.object({
  body: z.object({
    account_id: z.string(),
    category_id: z.string().nullable().optional(),
    type: z.enum(['income', 'expense']),
    amount: z.number().positive().max(999999.99),
    description: z.string().trim().min(1).max(200),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  })
});

const updateRecurringSchema = z.object({
  body: z.object({
    account_id: z.string().optional(),
    category_id: z.string().nullable().optional(),
    type: z.enum(['income', 'expense']).optional(),
    amount: z.number().positive().max(999999.99).optional(),
    description: z.string().trim().min(1).max(200).optional(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    is_active: z.number().int().min(0).max(1).optional()
  })
});

module.exports = { createRecurringSchema, updateRecurringSchema };
