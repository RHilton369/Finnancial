const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');
const logger = require('../utils/logger');

/**
 * Lista as categorias do usuário, opcionalmente filtradas por tipo.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const type = req.query.type || null;
  const categories = await Category.findAllByUser(userId, type);
  res.json(categories);
});

/**
 * Cria uma nova categoria personalizada.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, type, color, icon } = req.body;

  const category = await Category.create({ userId, name, type, color, icon });
  logger.info({ userId, categoryId: category.id }, 'Nova categoria criada');
  res.status(201).json(category);
});

/**
 * Atualiza os dados de uma categoria existente.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se a categoria não for encontrada ou não pertencer ao usuário.
 */
const update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const categoryId = req.params.id;

  const category = await Category.findById(categoryId);
  if (!category || category.user_id !== userId) {
    logger.warn({ userId, categoryId }, 'Tentativa de atualização: Categoria inválida');
    throw new AppError('Categoria não encontrada', 404, 'NOT_FOUND');
  }

  const updated = await Category.update(categoryId, req.body);
  logger.info({ userId, categoryId }, 'Categoria atualizada');
  res.json(updated);
});

/**
 * Remove uma categoria.
 * Só é permitido se não houver vínculos com transações.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se houver transações vinculadas à categoria.
 */
const remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const categoryId = req.params.id;

  const category = await Category.findById(categoryId);
  if (!category || category.user_id !== userId) {
    logger.warn({ userId, categoryId }, 'Tentativa de remoção: Categoria inválida');
    throw new AppError('Categoria não encontrada', 404, 'NOT_FOUND');
  }

  const txCount = await Category.countTransactions(categoryId);
  if (txCount > 0) {
    logger.warn({ userId, categoryId, txCount }, 'Remoção negada: Categoria possui transações');
    throw new AppError(`Categoria possui ${txCount} transações. Remova-as antes de excluir a categoria.`, 409, 'CATEGORY_HAS_TRANSACTIONS');
  }

  await Category.remove(categoryId);
  logger.info({ userId, categoryId }, 'Categoria removida');
  res.status(204).send();
});

module.exports = { list, create, update, remove };
