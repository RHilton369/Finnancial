const { z } = require('zod');

/**
 * Esquema de validação para atualização do perfil do usuário.
 * Permite atualização parcial de nome e renda mensal.
 */
const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
    monthly_income: z.number().min(0, 'Renda não pode ser negativa').optional(),
    gemini_api_key: z.string().trim().optional().nullable(),
  })
});

module.exports = {
  updateUserSchema,
};
