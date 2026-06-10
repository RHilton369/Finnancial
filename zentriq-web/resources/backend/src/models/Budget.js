/**
 * Utilitário para validar se uma string é um ObjectId válido do MongoDB.
 * @param {string|any} id 
 * @returns {boolean}
 */
const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

const { prisma } = require('../config/database');

/**
 * Busca todos os orçamentos de um usuário para um determinado mês e ano,
 * enriquecendo-os com o total gasto em tempo real e percentual de uso.
 * 
 * @param {string} userId - ID do usuário.
 * @param {number} month - Mês (1-12).
 * @param {number} year - Ano (ex: 2026).
 * @returns {Promise<Array>} Lista de orçamentos enriquecidos.
 */
async function findAllByMonth(userId, month, year) {
  const dStart = new Date(year, month - 1, 1).toISOString();
  const dEnd = new Date(year, month, 0, 23, 59, 59).toISOString();

  // 1. Busca as definições de orçamento
  const budgets = await prisma.budgets.findMany({
    where: { 
      user_id: userId,
      month: parseInt(month),
      year: parseInt(year)
    },
    include: { categories: true }
  });

  // 2. Para cada orçamento, calcula o montante já gasto no período
  const results = [];
  for (const b of budgets) {
    const aggregate = await prisma.transactions.aggregate({
      _sum: { amount: true },
      where: {
        user_id: userId,
        type: 'expense',
        category_id: b.category_id,
        date: { gte: dStart.slice(0, 10), lte: dEnd.slice(0, 10) + 'T23:59:59' }
      }
    });

    const spent = aggregate._sum.amount || 0;
    const used_pct = b.amount_limit > 0 ? Number((spent / b.amount_limit * 100).toFixed(1)) : 0;

    results.push({
      ...b,
      name: b.categories.name,
      color: b.categories.color,
      icon: b.categories.icon,
      spent,
      used_pct
    });
  }

  // Ordena por percentual de uso (maiores gastos primeiro)
  return results.sort((a, b) => b.used_pct - a.used_pct);
}

/**
 * Busca a definição de orçamento para uma categoria específica em um período.
 * 
 * @param {string} userId 
 * @param {string} categoryId 
 * @param {number} month 
 * @param {number} year 
 * @returns {Promise<Object|null>} A definição de orçamento se existir.
 */
async function findByCategory(userId, categoryId, month, year) {
  return await prisma.budgets.findFirst({
    where: {
      user_id: userId,
      category_id: categoryId,
      month: parseInt(month),
      year: parseInt(year)
    }
  });
}

/**
 * Busca um orçamento pelo ID.
 * 
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
async function findById(id) { 
  if (!isValidMongoId(id)) return null;
  return await prisma.budgets.findUnique({ where: { id } });
}

/**
 * Cria uma nova definição de orçamento.
 * 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
async function create(data) {
  return await prisma.budgets.create({
    data: {
      user_id: data.userId,
      category_id: data.categoryId,
      amount_limit: data.amountLimit,
      month: parseInt(data.month),
      year: parseInt(data.year)
    }
  });
}

/**
 * Atualiza os valores de um orçamento.
 * 
 * @param {string} id 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
async function update(id, data) { 
  if (!isValidMongoId(id)) return null;
  
  const updateData = {};
  if (data.amount_limit !== undefined) updateData.amount_limit = data.amount_limit;
  if (data.category_id !== undefined) updateData.category_id = data.category_id;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    return await prisma.budgets.update({
      where: { id },
      data: updateData
    });
  }
  
  return await findById(id);
}

/**
 * Remove uma definição de orçamento.
 * 
 * @param {string} id 
 */
async function remove(id) { 
  if (!isValidMongoId(id)) return;
  await prisma.budgets.delete({ where: { id } });
}

module.exports = { findAllByMonth, findByCategory, create, update, remove, findById };
