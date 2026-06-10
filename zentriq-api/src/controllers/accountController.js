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
  const { name, type, balance, color, icon, credit_limit, closing_day, due_day } = req.body;

  const account = await prisma.$transaction(async (tx) => {
    return await Account.create({ 
      userId, name, type, balance, color, icon,
      credit_limit: type === 'credit' ? credit_limit : null,
      closing_day: type === 'credit' ? closing_day : null,
      due_day: type === 'credit' ? due_day : null
    }, tx);
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

/**
 * Retorna as transações da fatura atual do cartão de crédito.
 * Baseado no dia de fechamento, calcula o intervalo de datas da fatura aberta.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getInvoice = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const accountId = req.params.id;

  const account = await prisma.accounts.findUnique({ where: { id: accountId } });
  if (!account || account.user_id !== userId) {
    throw new AppError('Conta não encontrada', 404, 'NOT_FOUND');
  }
  
  if (account.type !== 'credit') {
    throw new AppError('Esta conta não é de crédito', 400, 'INVALID_TYPE');
  }

  const closingDay = account.closing_day || 1;
  const now = new Date();
  
  // Lógica simples de período da fatura
  // Se o dia atual for menor que o closingDay, a fatura em aberto engloba
  // o fechamento do mês passado até ontem, mas pra simplificar pegamos o mês exato
  let currentMonth = now.getMonth() + 1;
  let currentYear = now.getFullYear();
  
  if (now.getDate() >= closingDay) {
    // Fatura deste mês já fechou, fatura atual é a do mês que vem
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }

  const startDateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(closingDay).padStart(2, '0')}`;
  
  // O fim é o dia anterior ao closingDay
  const end = new Date(currentYear, currentMonth - 1, closingDay - 1);
  const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}T23:59:59`;

  const transactions = await prisma.transactions.findMany({
    where: {
      user_id: userId,
      account_id: accountId,
      date: {
        gte: startDateStr,
        lte: endDateStr
      }
    },
    include: { categories: true },
    orderBy: { date: 'desc' }
  });

  // Para calcular o total exato da fatura, somamos o saldo inicial + TODAS as transações até o fechamento.
  // Isso garante que faturas anteriores não pagas (ou saldos iniciais de dívida) rolem para a fatura atual.
  const allPastTx = await prisma.transactions.findMany({
    where: {
      user_id: userId,
      OR: [ { account_id: accountId }, { to_account_id: accountId } ],
      date: { lte: endDateStr }
    }
  });

  let runningBalance = account.initial_balance || 0;
  allPastTx.forEach(t => {
    if (t.type === 'income' && t.account_id === accountId) {
      runningBalance += t.amount;
    } else if (t.type === 'expense' && t.account_id === accountId) {
      runningBalance -= t.amount;
    } else if (t.type === 'transfer') {
      if (t.account_id === accountId) runningBalance -= t.amount;
      if (t.to_account_id === accountId) runningBalance += t.amount;
    }
  });

  // Se o saldo for negativo, significa que há dívida (fatura a pagar)
  const invoiceTotal = runningBalance < 0 ? Math.abs(runningBalance) : 0;

  res.json({
    account_id: accountId,
    closing_day: account.closing_day,
    due_day: account.due_day,
    credit_limit: account.credit_limit,
    period: { start: startDateStr, end: endDateStr.split('T')[0] },
    invoiceTotal,
    transactions
  });
});

module.exports = { list, create, update, remove, getInvoice };
