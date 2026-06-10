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
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object|null>} A conta encontrada ou null.
 */
async function findById(id, client = prisma) { 
  if (!isValidMongoId(id)) return null;
  return await client.accounts.findUnique({ where: { id } });
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
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional para transações.
 * @returns {Promise<Object>} A conta criada.
 */
async function create(data, client = prisma) {
  return await client.accounts.create({
    data: {
      user_id: data.userId,
      name: data.name.trim(),
      type: data.type,
      balance: data.balance || 0,
      initial_balance: data.balance || 0,
      color: data.color || '#378ADD',
      icon: data.icon || 'wallet',
      credit_limit: data.credit_limit !== undefined ? data.credit_limit : null,
      closing_day: data.closing_day !== undefined ? data.closing_day : null,
      due_day: data.due_day !== undefined ? data.due_day : null,
    }
  });
}

/**
 * Atualiza os metadados de uma conta.
 * 
 * @param {string} id - ID da conta.
 * @param {Object} data - Campos a serem atualizados.
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object>} A conta atualizada.
 */
async function update(id, data, client = prisma) { 
  if (!isValidMongoId(id)) return null;
  
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.type !== undefined) updateData.type = data.type;
  if (data.balance !== undefined) updateData.balance = data.balance;
  if (data.initial_balance !== undefined) updateData.initial_balance = data.initial_balance;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.credit_limit !== undefined) updateData.credit_limit = data.credit_limit;
  if (data.closing_day !== undefined) updateData.closing_day = data.closing_day;
  if (data.due_day !== undefined) updateData.due_day = data.due_day;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    return await client.accounts.update({
      where: { id },
      data: updateData
    });
  }
  
  return await findById(id, client);
}

/**
 * Incrementa ou decrementa o saldo de uma conta de forma atômica.
 * 
 * @param {string} accountId - ID da conta.
 * @param {number} delta - Valor a ser somado ao saldo (pode ser negativo).
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object>} A conta com o saldo atualizado.
 */
async function updateBalance(accountId, delta, client = prisma) {
  return await client.accounts.update({
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
 * Recalcula o saldo de todas as contas do usuário baseando-se no histórico de transações.
 * 
 * @param {string} userId 
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 */
async function recalculateAll(userId, client = prisma) {
  const logger = require('../utils/logger');
  const accounts = await client.accounts.findMany({
    where: { user_id: userId }
  });
  
  logger.info({ userId, count: accounts.length }, 'Iniciando recálculo para usuário');

  for (const acc of accounts) {
    try {
      const transactions = await client.transactions.findMany({
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
          if (t.account_id === acc.id) newBalance -= t.amount; // Saída
          if (t.to_account_id === acc.id) newBalance += t.amount; // Entrada
        }
      });

      await client.accounts.update({
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
