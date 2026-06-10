const { z } = require('zod');

const createAccountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
    type: z.enum(['checking', 'savings', 'cash', 'credit', 'investment']),
    balance: z.number().optional().default(0),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#378ADD'),
    icon: z.string().max(50).optional().default('wallet')
  })
});

const updateAccountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    type: z.enum(['checking', 'savings', 'cash', 'credit', 'investment']).optional(),
    balance: z.number().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().max(50).optional(),
    is_active: z.number().int().min(0).max(1).optional()
  })
});

module.exports = { createAccountSchema, updateAccountSchema };
