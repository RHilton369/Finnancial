const Account = require('../models/Account');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Dispara o recálculo de saldos de todas as contas do usuário.
 */
const recalculateBalances = asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  logger.info({ userId }, 'Iniciando recálculo manual de saldos');
  await Account.recalculateAll(userId);
  
  res.json({ 
    success: true,
    message: 'Saldos recalculados com sucesso', 
    recalculated: true 
  });
});

/**
 * Recalcula saldo de uma conta específica baseado no histórico de transações
 * Útil para verificar consistência quando o saldo atual não reflete as transações
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const recalculateAccount = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { accountId } = req.params;
  
  const { prisma } = require('../config/database');
  
  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.accounts.findUnique({ where: { id: accountId } });
    if (!account || account.user_id !== userId) {
      throw new AppError('Conta não encontrada', 404, 'NOT_FOUND');
    }

    const transactions = await tx.transactions.findMany({
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
    await tx.accounts.update({
      where: { id: accountId },
      data: { balance: newBalance, updated_at: new Date().toISOString() }
    });

    return { saldoAnterior, newBalance };
  });
  
  logger.info({ userId, accountId, ...result }, 'Saldo da conta recalculado com transação');
  res.json({ 
    message: 'Recálculo concluído', 
    accountId, 
    saldoAnterior: result.saldoAnterior, 
    novoSaldo: result.newBalance,
    ajuste: result.newBalance - result.saldoAnterior 
  });
});

/**
 * Ajusta o saldo inicial de uma conta para que o saldo atual coincida com um valor alvo.
 * Útil quando o usuário quer "corrigir" o saldo sem criar transações artificiais.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const adjustBalance = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { accountId, targetBalance } = req.body;

  if (targetBalance === undefined || isNaN(targetBalance)) {
    throw new AppError('O saldo alvo é obrigatório e deve ser um número', 400, 'VALIDATION_ERROR');
  }

  const { prisma } = require('../config/database');
  
  const result = await prisma.$transaction(async (tx) => {
    const account = await tx.accounts.findUnique({ where: { id: accountId } });
    if (!account || account.user_id !== userId) {
      throw new AppError('Conta não encontrada', 404, 'NOT_FOUND');
    }

    // 1. Calcular o somatório atual de transações
    const transactions = await tx.transactions.findMany({
      where: {
        OR: [{ account_id: accountId }, { to_account_id: accountId }]
      }
    });

    let sumTransactions = 0;
    transactions.forEach(t => {
      if (t.type === 'income' && t.account_id === accountId) sumTransactions += t.amount;
      else if (t.type === 'expense' && t.account_id === accountId) sumTransactions -= t.amount;
      else if (t.type === 'transfer') {
        if (t.account_id === accountId) sumTransactions -= t.amount;
        if (t.to_account_id === accountId) sumTransactions += t.amount;
      }
    });

    // 2. Novo Saldo Inicial = Saldo Alvo - Somatório das Transações
    const newInitialBalance = targetBalance - sumTransactions;
    const oldInitialBalance = account.initial_balance || 0;

    await tx.accounts.update({
      where: { id: accountId },
      data: { 
        initial_balance: newInitialBalance,
        balance: targetBalance,
        updated_at: new Date().toISOString() 
      }
    });

    return { oldInitialBalance, newInitialBalance };
  });

  logger.info({ 
    userId, accountId, 
    ...result, 
    targetBalance 
  }, 'Saldo inicial ajustado manualmente via transação');

  res.json({ 
    message: 'Saldo ajustado com sucesso', 
    accountId, 
    targetBalance, 
    newInitialBalance: result.newInitialBalance,
    adjustment: result.newInitialBalance - result.oldInitialBalance
  });
});

/**
 * Verifica se os saldos de todas as contas estão consistentes com o histórico de transações.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const checkConsistency = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const accounts = await Account.findAllByUser(userId);
  const { prisma } = require('../config/database');
  
  const inconsistencias = [];
  
  for (const acc of accounts) {
    const transactions = await prisma.transactions.findMany({
      where: {
        OR: [{ account_id: acc.id }, { to_account_id: acc.id }]
      }
    });

    let expectedBalance = acc.initial_balance || 0;
    transactions.forEach(t => {
      if (t.type === 'income' && t.account_id === acc.id) expectedBalance += t.amount;
      else if (t.type === 'expense' && t.account_id === acc.id) expectedBalance -= t.amount;
      else if (t.type === 'transfer') {
        if (t.account_id === acc.id) expectedBalance -= t.amount;
        if (t.to_account_id === acc.id) expectedBalance += t.amount;
      }
    });

    // Comparação com tolerância para erros de ponto flutuante (centavos)
    const diff = Math.abs(acc.balance - expectedBalance);
    if (diff > 0.001) {
      inconsistencias.push({
        accountId: acc.id,
        accountName: acc.name,
        saldoAtual: acc.balance,
        saldoEsperado: expectedBalance,
        diferenca: acc.balance - expectedBalance
      });
    }
  }

  res.json({
    success: true,
    dadosConsistentes: inconsistencias.length === 0,
    contasVerificadas: accounts.length,
    inconsistencias
  });
});

module.exports = { recalculateBalances, recalculateAccount, adjustBalance, checkConsistency };
