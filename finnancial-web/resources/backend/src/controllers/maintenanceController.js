const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const Account = require('../models/Account');

/**
 * Recalcula saldo de uma conta específica baseado no histórico de transações
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const recalculateAccount = asyncHandler(async (req, res) => {
  const { accountId } = req.params;
  const userId = req.body.userId || req.userId;
  
  const account = await Account.findById(accountId);
  if (!account || account.user_id !== userId) {
    logger.warn({ userId, accountId }, 'Recálculo negado: Conta inválida');
    throw new AppError('Conta não encontrada', 404, 'NOT_FOUND');
  }
  
  const transactions = await prisma.transactions.findMany({
    where: {
      OR: [
        { account_id: accountId },
        { to_account_id: accountId }
      ]
    }
  });
  
  let newBalance = account.initial_balance || 0;
  transactions.forEach(t => {
    if (t.type === 'income' && t.account_id === accountId) {
      newBalance += t.amount;
    } else if (t.type === 'expense' && t.account_id === accountId) {
      newBalance -= t.amount;
    } else if (t.type === 'transfer') {
      if (t.account_id === accountId) newBalance -= t.amount;
      if (t.to_account_id === accountId) newBalance += t.amount;
    }
  });
  
  const saldoAnterior = account.balance;
  await prisma.accounts.update({
    where: { id: accountId },
    data: { balance: newBalance, updated_at: new Date().toISOString() }
  });
  
  logger.info({ userId, accountId, saldoAnterior, newBalance }, 'Saldo da conta recalculado');
  res.json({ 
    success: true,
    message: 'Recálculo concluído', 
    accountId, 
    saldoAnterior, 
    novoSaldo: newBalance,
    ajuste: newBalance - saldoAnterior 
  });
});

/**
 * Recalcula todas as contas do usuário
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const recalculateAll = asyncHandler(async (req, res) => {
  const userId = req.userId || req.body.userId;
  
  const accounts = await prisma.accounts.findMany({
    where: { user_id: userId }
  });
  
  for (const acc of accounts) {
    const transactions = await prisma.transactions.findMany({
      where: {
        OR: [
          { account_id: acc.id },
          { to_account_id: acc.id }
        ]
      }
    });
    
    let newBalance = acc.initial_balance || 0;
    transactions.forEach(t => {
      if (t.type === 'income' && t.account_id === acc.id) {
        newBalance += t.amount;
      } else if (t.type === 'expense' && t.account_id === acc.id) {
        newBalance -= t.amount;
      } else if (t.type === 'transfer') {
        if (t.account_id === acc.id) newBalance -= t.amount;
        if (t.to_account_id === acc.id) newBalance += t.amount;
      }
    });
    
    await prisma.accounts.update({
      where: { id: acc.id },
      data: { balance: newBalance, updated_at: new Date().toISOString() }
    });
  }
  
  logger.info({ userId }, 'Recálculo de todas as contas realizado');
  res.json({ success: true, message: 'Recálculo concluído', recalculated: true, totalAccounts: accounts.length });
});

/**
 * Verifica consistência dos saldos (comparação saldo atual vs transações)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const checkConsistency = asyncHandler(async (req, res) => {
  const userId = req.userId || req.body.userId;
  
  const accounts = await prisma.accounts.findMany({
    where: { user_id: userId }
  });
  
  const inconsistencies = [];
  
  for (const acc of accounts) {
    const transactions = await prisma.transactions.findMany({
      where: {
        OR: [
          { account_id: acc.id },
          { to_account_id: acc.id }
        ]
      }
    });
    
    let calculatedBalance = acc.initial_balance || 0;
    transactions.forEach(t => {
      if (t.type === 'income' && t.account_id === acc.id) {
        calculatedBalance += t.amount;
      } else if (t.type === 'expense' && t.account_id === acc.id) {
        calculatedBalance -= t.amount;
      } else if (t.type === 'transfer') {
        if (t.account_id === acc.id) calculatedBalance -= t.amount;
        if (t.to_account_id === acc.id) calculatedBalance += t.amount;
      }
    });
    
    if (Math.abs(calculatedBalance - (acc.balance || 0)) > 0.01) {
      inconsistencies.push({
        accountId: acc.id,
        accountName: acc.name,
        saldoAtual: acc.balance || 0,
        saldoCalculado: calculatedBalance,
        diferenca: calculatedBalance - (acc.balance || 0),
        transacoesCount: transactions.length
      });
    }
  }
  
  res.json({ 
    success: true,
    contasVerificadas: accounts.length,
    inconsistencias: inconsistencies,
    dadosConsistentes: inconsistencies.length === 0
  });
});

module.exports = { recalculateAccount, recalculateAll, checkConsistency };