const { prisma } = require('../config/database');
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
 * Atualiza o saldo das contas envolvidas em uma transação atômica.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { account_id, category_id, type, amount, description, date, notes, recurring_id, from_account_id, to_account_id } = req.body;

  const result = await prisma.$transaction(async (tx) => {
    // Caso especial: Transferência entre contas
    if (type === 'transfer') {
      const fromId = from_account_id || account_id;
      const toId = to_account_id;

      if (!fromId || !toId) {
        throw new AppError('Transferências exigem conta de origem e destino', 400, 'VALIDATION_ERROR');
      }

      const fromAccount = await Account.findById(fromId);
      const toAccount = await Account.findById(toId);

      if (!fromAccount || fromAccount.user_id !== userId) throw new AppError('Conta origem não encontrada', 403);
      if (!toAccount || toAccount.user_id !== userId) throw new AppError('Conta destino não encontrada', 403);

      await Account.updateBalance(fromId, -amount, tx);
      await Account.updateBalance(toId, amount, tx);

      return await Transaction.create({
        userId, accountId: fromId, toAccountId: toId, categoryId: null, type, amount,
        description, date, notes: notes || null, recurringId: recurring_id || null
      }, tx);
    }

    // Transação Comum: Receita ou Despesa
    const account = await Account.findById(account_id);
    if (!account || account.user_id !== userId) throw new AppError('Conta não encontrada', 403);

    if (category_id) {
      const cat = await Category.findById(category_id);
      if (!cat || cat.user_id !== userId) throw new AppError('Categoria não encontrada', 403);
    }

    const delta = type === 'income' ? amount : -amount;
    await Account.updateBalance(account_id, delta, tx);

    return await Transaction.create({
      userId, accountId: account_id, categoryId: category_id || null, type, amount,
      description, date, notes, recurringId: recurring_id || null
    }, tx);
  });

  logger.info({ userId, txId: result.id }, 'Transação registrada com sucesso (Atomic)');
  res.status(201).json(result);
});

/**
 * Atualiza uma transação existente de forma atômica.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const txId = req.params.id;

  const original = await Transaction.findById(txId);
  if (!original || original.user_id !== userId) throw new AppError('Transação não encontrada', 404);

  const updatedTx = await prisma.$transaction(async (tx) => {
    // 1. Reverte o efeito do saldo original
    if (original.type === 'transfer') {
      await Account.updateBalance(original.account_id, original.amount, tx);
      if (original.to_account_id) await Account.updateBalance(original.to_account_id, -original.amount, tx);
    } else {
      await Account.updateBalance(original.account_id, original.type === 'income' ? -original.amount : original.amount, tx);
    }

    // 2. Determina novos valores
    const { amount, type, account_id, to_account_id } = req.body;
    const newAmount = amount !== undefined ? amount : original.amount;
    const newType = type !== undefined ? type : original.type;
    const newAccountId = account_id !== undefined ? account_id : original.account_id;
    const newToAccountId = to_account_id !== undefined ? to_account_id : original.to_account_id;

    // 3. Aplica o novo efeito financeiro
    if (newType === 'transfer') {
      if (!newToAccountId) throw new AppError('Conta destino obrigatória para transferência', 400);
      await Account.updateBalance(newAccountId, -newAmount, tx);
      await Account.updateBalance(newToAccountId, newAmount, tx);
    } else {
      const delta = newType === 'income' ? newAmount : -newAmount;
      await Account.updateBalance(newAccountId, delta, tx);
    }

    return await Transaction.update(txId, req.body, tx);
  });

  logger.info({ userId, txId }, 'Transação atualizada (Atomic Transaction)');
  res.json(updatedTx);
});

/**
 * Remove uma transação de forma atômica.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const txId = req.params.id;

  const original = await Transaction.findById(txId);
  if (!original || original.user_id !== userId) throw new AppError('Transação não encontrada', 404);

  await prisma.$transaction(async (tx) => {
    if (original.type === 'transfer') {
      await Account.updateBalance(original.account_id, original.amount, tx);
      if (original.to_account_id) await Account.updateBalance(original.to_account_id, -original.amount, tx);
    } else {
      const delta = original.type === 'income' ? -original.amount : original.amount;
      await Account.updateBalance(original.account_id, delta, tx);
    }

    await Transaction.remove(txId, tx);
  });

  logger.info({ userId, txId }, 'Transação removida (Atomic Transaction)');
  res.status(204).send();
});

module.exports = { list, create, update, remove };
