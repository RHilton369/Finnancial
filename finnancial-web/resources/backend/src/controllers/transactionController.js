const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const logger = require('../utils/logger');

/**
 * Lista as transações do usuário com filtros e paginação.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();
  const type = req.query.type || 'all';
  const categoryId = req.query.category_id ? req.query.category_id : null;
  const accountId = req.query.account_id ? req.query.account_id : null;
  const search = req.query.search || null;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const sort = req.query.sort || 'date_desc';

  const result = await Transaction.findAll({ userId, month, year, type, categoryId, accountId, search, page, limit, sort });
  res.json(result);
});

/**
 * Cria uma nova transação (Receita, Despesa ou Transferência).
 * Valida a existência e posse das contas e categorias.
 * Atualiza o saldo das contas envolvidas.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se os dados forem inválidos ou contas/categorias não pertencerem ao usuário.
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { account_id, category_id, type, amount, description, date, notes, recurring_id, from_account_id, to_account_id } = req.body;

  // Caso especial: Transferência entre contas
  if (type === 'transfer') {
    if (!from_account_id || !to_account_id) {
      throw new AppError('Transferências exigem from_account_id e to_account_id', 400, 'VALIDATION_ERROR');
    }

    const fromAccount = await Account.findById(from_account_id);
    const toAccount = await Account.findById(to_account_id);

    if (!fromAccount || fromAccount.user_id !== userId) {
      logger.warn({ userId, from_account_id }, 'Tentativa de transferência: Conta origem inválida');
      throw new AppError('Conta origem não encontrada', 403, 'FORBIDDEN');
    }
    if (!toAccount || toAccount.user_id !== userId) {
      logger.warn({ userId, to_account_id }, 'Tentativa de transferência: Conta destino inválida');
      throw new AppError('Conta destino não encontrada', 403, 'FORBIDDEN');
    }

    // Atualiza saldos (Débito e Crédito)
    await Account.updateBalance(from_account_id, -amount);
    await Account.updateBalance(to_account_id, amount);

    const tx = await Transaction.create({
      userId, accountId: from_account_id, categoryId: null, type, amount,
      description, date, notes: notes || null, recurringId: recurring_id || null
    });

    logger.info({ userId, amount }, 'Transferência realizada com sucesso');
    return res.status(201).json(tx);
  }

  // Transação Comum: Receita ou Despesa
  const account = await Account.findById(account_id);
  if (!account || account.user_id !== userId) {
    logger.warn({ userId, account_id }, 'Tentativa de registro: Conta inválida');
    throw new AppError('Conta não encontrada', 403, 'FORBIDDEN');
  }

  if (category_id) {
    const cat = await Category.findById(category_id);
    if (!cat || cat.user_id !== userId) {
      logger.warn({ userId, category_id }, 'Tentativa de registro: Categoria inválida');
      throw new AppError('Categoria não encontrada', 403, 'FORBIDDEN');
    }
  }

  // Atualiza saldo da conta singular
  const delta = type === 'income' ? amount : -amount;
  await Account.updateBalance(account_id, delta);

  const tx = await Transaction.create({
    userId, accountId: account_id, categoryId: category_id || null, type, amount,
    description, date, notes, recurringId: recurring_id || null
  });

  logger.info({ userId, txId: tx.id }, 'Transação registrada com sucesso');
  res.status(201).json(tx);
});

/**
 * Atualiza uma transação existente.
 * Reverte o efeito financeiro anterior no saldo da conta e aplica o novo.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se a transação ou contas/categorias forem inválidas.
 */
const update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const txId = req.params.id;

  const original = await Transaction.findById(txId);
  if (!original || original.user_id !== userId) {
    throw new AppError('Transação não encontrada', 404, 'NOT_FOUND');
  }

  const { amount, type, account_id, category_id } = req.body;

  // 1. Reverte o efeito do saldo original
  const origAmount = original.amount;
  const origType = original.type;
  const origAccountId = original.account_id;

  if (origType !== 'transfer') {
    await Account.updateBalance(origAccountId, origType === 'income' ? -origAmount : origAmount);
  }

  // 2. Determina novos valores (ou mantém originais se omitidos)
  const newAmount = amount !== undefined ? amount : origAmount;
  const newType = type !== undefined ? type : origType;
  const newAccountId = account_id !== undefined ? account_id : origAccountId;

  // Valida nova conta se trocada
  if (account_id !== undefined) {
    const newAcc = await Account.findById(newAccountId);
    if (!newAcc || newAcc.user_id !== userId) throw new AppError('Conta não encontrada', 403, 'FORBIDDEN');
  }

  // Valida nova categoria se trocada
  if (category_id !== undefined && category_id !== null) {
    const cat = await Category.findById(category_id);
    if (!cat || cat.user_id !== userId) throw new AppError('Categoria não encontrada', 403, 'FORBIDDEN');
  }

  // 3. Aplica o novo efeito financeiro
  if (newType !== 'transfer') {
    const delta = newType === 'income' ? newAmount : -newAmount;
    await Account.updateBalance(newAccountId, delta);
  }

  const tx = await Transaction.update(txId, req.body);
  logger.info({ userId, txId }, 'Transação atualizada e saldos recalculados');
  res.json(tx);
});

/**
 * Remove uma transação.
 * Reverte o saldo da conta antes da exclusão.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const txId = req.params.id;

  const original = await Transaction.findById(txId);
  if (!original || original.user_id !== userId) {
    throw new AppError('Transação não encontrada', 404, 'NOT_FOUND');
  }

  // Reverte saldo antes de deletar
  const delta = original.type === 'income' ? -original.amount : original.amount;
  await Account.updateBalance(original.account_id, delta);

  await Transaction.remove(txId);
  logger.info({ userId, txId }, 'Transação removida e saldo revertido');
  res.status(204).send();
});

module.exports = { list, create, update, remove };
