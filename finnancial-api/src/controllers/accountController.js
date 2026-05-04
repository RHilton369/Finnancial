const { prisma } = require('../config/database');
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

  const account = await prisma.$transaction(async (tx) => {
    return await Account.create({ userId, name, type, balance, color, icon }, tx);
  });

  logger.info({ userId, accountId: account.id }, 'Nova conta criada (Atomic)');
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

  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.accounts.findUnique({ where: { id: accountId } });
    if (!account || account.user_id !== userId) {
      logger.warn({ userId, accountId }, 'Tentativa de atualização: Conta inválida');
      throw new AppError('Conta não encontrada', 404, 'NOT_FOUND');
    }

    const updateData = { ...req.body };
    
    // Se o saldo for enviado, tratamos como atualização do Saldo Inicial (Base)
    if (updateData.balance !== undefined) {
      updateData.initial_balance = parseFloat(updateData.balance);
    }

    const updated = await Account.update(accountId, updateData, tx);
    
    // Se o saldo inicial mudou, recalculamos para garantir que transações 
    // existentes sejam aplicadas sobre o novo valor base.
    if (updateData.balance !== undefined) {
      await Account.recalculateAll(userId, tx);
    }

    return updated;
  });

  logger.info({ userId, accountId }, 'Conta atualizada e saldos recalculados (Atomic)');
  res.json(result);
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

  await prisma.$transaction(async (tx) => {
    const account = await Account.findById(accountId, tx);
    if (!account || account.user_id !== userId) {
      logger.warn({ userId, accountId }, 'Tentativa de remoção: Conta inválida');
      throw new AppError('Conta não encontrada', 404, 'NOT_FOUND');
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    // Contar transações dentro da mesma transação, se possível, caso contrário o método padrão usa prisma.
    // O Prisma client dentro do tx precisa ser passado para countTransactions se ele suportar, mas 
    // countTransactions não foi atualizado para aceitar tx em accountController ainda?
    // Wait, eu não adicionei `tx` ao countTransactions no Account.js, deixe-me adicionar ou apenas usar o original.
    // Vamos usar a contagem via tx diretamente.
    const txCount = await tx.transactions.count({
      where: {
        account_id: accountId,
        date: { startsWith: new Date(year, month - 1, 1).toISOString().slice(0, 7) }
      }
    });

    if (txCount > 0) {
      logger.warn({ userId, accountId, txCount }, 'Remoção negada: Conta possui transações');
      throw new AppError('Conta possui transações no mês atual', 409, 'ACCOUNT_HAS_TRANSACTIONS');
    }

    await Account.update(accountId, { is_active: 0 }, tx);
  });

  logger.info({ userId, accountId }, 'Conta desativada (Atomic)');
  res.status(204).send();
});

module.exports = { list, create, update, remove };
