const { z } = require('zod');

/**
 * Esquema de validação para criação de um novo investimento.
 */
const createInvestmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Nome do investimento é obrigatório').max(100, 'Nome muito longo'),
    type: z.enum(['fixed_income', 'variable_income', 'cripto', 'others'], {
      errorMap: () => ({ message: 'Tipo de investimento inválido' })
    }),
    ticker: z.string().trim().toUpperCase().max(10).optional().nullable(),
    quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a zero').optional().nullable(),
    institution: z.string().trim().min(1, 'Instituição financeira é obrigatória').max(100, 'Nome da instituição muito longo'),
    invested_amount: z.number().min(0, 'Valor investido deve ser maior ou igual a zero'),
    current_amount: z.number().min(0, 'Valor atual deve ser maior ou igual a zero').optional(),
    purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de compra deve estar no formato AAAA-MM-DD')
  })
});

const updateInvestmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    type: z.enum(['fixed_income', 'variable_income', 'cripto', 'others']).optional(),
    ticker: z.string().trim().toUpperCase().max(10).optional().nullable(),
    quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a zero').optional().nullable(),
    institution: z.string().trim().min(1).max(100).optional(),
    invested_amount: z.number().min(0, 'Valor investido deve ser maior ou igual a zero').optional(),
    current_amount: z.number().min(0, 'Valor atual deve ser maior ou igual a zero').optional(),
    purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de compra inválida').optional()
  })
});

/**
 * Esquema de validação para registro de aporte ou atualização de cotação de mercado.
 */
const addValuationSchema = z.object({
  body: z.object({
    invested_val: z.number().min(0, 'Valor investido adicional não pode ser negativo').optional(),
    current_val: z.number().min(0, 'O valor atual de mercado não pode ser negativo'),
    date: z.string().regex(/^\d{4}-\d{2}$/, 'O mês de referência deve estar no formato AAAA-MM').optional()
  })
});

module.exports = {
  createInvestmentSchema,
  updateInvestmentSchema,
  addValuationSchema
};
