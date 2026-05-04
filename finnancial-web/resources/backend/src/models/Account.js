/**
 * Utilitário para validar se uma string é um ObjectId válido do MongoDB.
 * @param {string|any} id 
 * @returns {boolean}
 */
const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

const { prisma } = require('../config/database');

/**
 * Busca todas as contas associadas a um usuário.
 * 
 * @param {string} userId - ID do usuário.
 * @returns {Promise<Array>} Lista de contas.
 */
async function findAllByUser(userId) {
  return await prisma.accounts.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Busca uma conta específica pelo ID.
 * 
 * @param {string} id - ID da conta.
 * @returns {Promise<Object|null>} A conta encontrada ou null.
 */
async function findById(id) { 
  if (!isValidMongoId(id)) return null;
  return await prisma.accounts.findUnique({ where: { id } });
}

/**
 * Cria uma nova conta financeira.
 * 
 * @param {Object} data - Dados da conta.
 * @param {string} data.userId
 * @param {string} data.name
 * @param {string} data.type
 * @param {number} [data.balance=0]
 * @param {string} [data.color]
 * @param {string} [data.icon]
 * @returns {Promise<Object>} A conta criada.
 */
async function create(data) {
  return await prisma.accounts.create({
    data: {
      user_id: data.userId,
      name: data.name.trim(),
      type: data.type,
      balance: data.balance || 0,
      color: data.color || '#378ADD',
      icon: data.icon || 'wallet',
    }
  });}

/**
 * Atualiza os metadados de uma conta.
 * 
 * @param {string} id - ID da conta.
 * @param {Object} data - Campos a serem atualizados.
 * @returns {Promise<Object>} A conta atualizada.
 */
async function update(id, data) { 
  if (!isValidMongoId(id)) return null;
  
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.type !== undefined) updateData.type = data.type;
  if (data.balance !== undefined) updateData.balance = data.balance;
  if (data.initial_balance !== undefined) updateData.initial_balance = data.initial_balance;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    return await prisma.accounts.update({
      where: { id },
      data: updateData
    });
  }
  
  return await findById(id);
}

/**
 * Incrementa ou decrementa o saldo de uma conta de forma atômica.
 * 
 * @param {string} accountId - ID da conta.
 * @param {number} delta - Valor a ser somado ao saldo (pode ser negativo).
 * @returns {Promise<Object>} A conta com o saldo atualizado.
 */
async function updateBalance(accountId, delta) {
  return await prisma.accounts.update({
    where: { id: accountId },
    data: {
      balance: {
        increment: delta
      },
      updated_at: new Date().toISOString()
    }
  });
}

/**
 * Conta quantas transações uma conta possui em um determinado período (mês/ano).
 * 
 * @param {string} accountId 
 * @param {number} month 
 * @param {number} year 
 * @returns {Promise<number>} Quantidade de transações.
 */
async function countTransactions(accountId, month, year) {
  const d = new Date(year, month - 1, 1).toISOString().slice(0, 7); // Ex: "2026-04"
  return await prisma.transactions.count({
    where: {
      account_id: accountId,
      date: { startsWith: d }
    }
  });
}

/**
 * Recalcula saldos de todas as contas do usuário baseado no histórico de transações
 * Garante integridade dos dados quando saldos não refletem transações realizadas
 * @param {string} userId 
 */
async function recalculateAll(userId) {
  const accounts = await prisma.accounts.findMany({
    where: { user_id: userId }
  });
  
  const logger = require('../utils/logger');
  
  for (const acc of accounts) {
    try {
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
      
      logger.debug({ accountId: acc.id, newBalance }, 'Saldo recalculado para conta');
    } catch (err) {
      logger.error({ accountId: acc.id, err: err.message }, 'Erro ao recalcular conta específica');
      throw err;
    }
  }
}

module.exports = { findAllByUser, findById, create, update, updateBalance, countTransactions, recalculateAll };
