const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Account = require('../models/Account');
const logger = require('../utils/logger');

/**
 * Lista todas as contas ativas do usuário.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const accounts = await Account.findAllByUser(userId);
  res.json(accounts);
});

/**
 * Cria uma nova conta financeira.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, type, balance, color, icon } = req.body;

  const account = await Account.create({ userId, name, type, balance, color, icon });
  logger.info({ userId, accountId: account.id }, 'Nova conta criada');
  res.status(201).json(account);
}); 

/**
 * Atualiza os metadados de uma conta.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se a conta não existir ou não pertencer ao usuário.
 */
const update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const accountId = req.params.id;

  const account = await Account.findById(accountId);
  if (!account || account.user_id !== userId) {
    logger.warn({ userId, accountId }, 'Tentativa de atualização: Conta inválida');
    throw new AppError('Conta não encontrada', 404, 'NOT_FOUND');
  }

  const updated = await Account.update(accountId, req.body);
  logger.info({ userId, accountId }, 'Conta atualizada');
  res.json(updated);
});

/**
 * Desativa uma conta.
 * A desativação só é permitida se não houver transações no mês atual.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se a conta tiver transações ativas.
 */
const remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const accountId = req.params.id;

  const account = await Account.findById(accountId);
  if (!account || account.user_id !== userId) {
    logger.warn({ userId, accountId }, 'Tentativa de remoção: Conta inválida');
    throw new AppError('Conta não encontrada', 404, 'NOT_FOUND');
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const txCount = await Account.countTransactions(accountId, month, year);

  if (txCount > 0) {
    logger.warn({ userId, accountId, txCount }, 'Remoção negada: Conta possui transações');
    throw new AppError('Conta possui transações no mês atual', 409, 'ACCOUNT_HAS_TRANSACTIONS');
  }

  await Account.update(accountId, { is_active: 0 });
  logger.info({ userId, accountId }, 'Conta desativada');
  res.status(204).send();
});

module.exports = { list, create, update, remove };
