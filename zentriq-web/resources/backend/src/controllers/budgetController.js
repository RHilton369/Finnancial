const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const logger = require('../utils/logger');

/**
 * Lista todos os orçamentos definidos para um determinado mês/ano.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();

  const budgets = await Budget.findAllByMonth(userId, month, year);
  res.json(budgets);
});

/**
 * Define um novo teto de gastos (orçamento) para uma categoria.
 * Valida se a categoria pertence ao usuário e se já não existe orçamento para o período.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se o orçamento já existir, categoria for inválida ou for do tipo 'income'.
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { category_id, amount_limit, month, year } = req.body;

  // Verifica se já existe orçamento para este combo categoria/mês/ano
  const existing = await Budget.findByCategory(userId, category_id, month, year);
  if (existing) {
    logger.warn({ userId, category_id, month, year }, 'Tentativa de criar orçamento duplicado');
    throw new AppError('Orçamento já existe para esta categoria', 409, 'BUDGET_EXISTS');
  }

  // Validação de posse e tipo da categoria
  const cat = await Category.findById(category_id);
  if (!cat || cat.user_id !== userId) {
    logger.warn({ userId, category_id }, 'Tentativa de criar orçamento: Categoria inválida');
    throw new AppError('Categoria não encontrada', 404, 'NOT_FOUND');
  }

  if (cat.type === 'income') {
    logger.warn({ userId, category_id }, 'Tentativa de criar orçamento para categoria de receita');
    throw new AppError('Orçamento só pode ser criado para categorias de despesa', 400, 'VALIDATION_ERROR');
  }

  const budget = await Budget.create({ userId, categoryId: category_id, amountLimit: amount_limit, month, year });
  logger.info({ userId, budgetId: budget.id }, 'Novo orçamento definido');
  res.status(201).json(budget);
});

/**
 * Atualiza o limite de um orçamento existente.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se o orçamento não for encontrado.
 */
const update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const budgetId = req.params.id;

  const budget = await Budget.findById(budgetId);
  if (!budget || budget.user_id !== userId) {
    logger.warn({ userId, budgetId }, 'Tentativa de atualização: Orçamento inválido');
    throw new AppError('Orçamento não encontrado', 404, 'NOT_FOUND');
  }

  const updated = await Budget.update(budgetId, req.body);
  logger.info({ userId, budgetId }, 'Orçamento atualizado');
  res.json(updated);
});

/**
 * Remove a definição de um orçamento.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const budgetId = req.params.id;

  const budget = await Budget.findById(budgetId);
  if (!budget || budget.user_id !== userId) {
    logger.warn({ userId, budgetId }, 'Tentativa de remoção: Orçamento inválido');
    throw new AppError('Orçamento não encontrado', 404, 'NOT_FOUND');
  }

  await Budget.remove(budgetId);
  logger.info({ userId, budgetId }, 'Orçamento removido');
  res.status(204).send();
});

module.exports = { list, create, update, remove };
