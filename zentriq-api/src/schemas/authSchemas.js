const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
    email: z.string().email('Email inválido').transform(v => v.toLowerCase()),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    monthly_income: z.number().gte(0, 'Renda mensal deve ser maior ou igual a zero').optional().default(0)
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido').transform(v => v.toLowerCase()),
    password: z.string().min(1, 'Senha é obrigatória')
  })
});

const refreshSchema = z.object({
  body: z.object({
    refresh_token: z.string().min(1, 'Refresh token é obrigatório')
  })
});

module.exports = { registerSchema, loginSchema, refreshSchema };
