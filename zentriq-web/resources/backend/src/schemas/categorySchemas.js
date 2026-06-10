const { z } = require('zod');

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Nome é obrigatório').max(50, 'Nome muito longo'),
    type: z.enum(['income', 'expense']),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional().default('#888780'),
    icon: z.string().max(50).optional().default('tag')
  })
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    icon: z.string().max(50).optional()
  })
});

module.exports = { createCategorySchema, updateCategorySchema };
