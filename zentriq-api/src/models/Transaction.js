/**
 * Utilitário para validar se uma string é um ObjectId válido do MongoDB.
 * @param {string|any} id 
 * @returns {boolean}
 */
const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

/**
 * ============================================================================
 * ZENTRIQ API - MODELO DE TRANSAÇÕES
 * ============================================================================
 * Camada de Acesso a Dados (DAL) para operações de transações financeiras.
 * Concentra lógicas de filtros complexos, paginação e resumos estatísticos.
 */
const { prisma } = require('../config/database');
const { getMonthRange } = require('../utils/dateHelpers');

/**
 * Busca transações com filtros avançados, paginação e consolidação de totais.
 * 
 * @param {Object} params - Parâmetros de busca.
 * @param {string} params.userId
 * @param {number} params.month
 * @param {number} params.year
 * @param {string} [params.type] - 'income', 'expense', 'transfer' ou 'all'.
 * @param {string} [params.categoryId]
 * @param {string} [params.accountId]
 * @param {string} [params.search] - Termo de busca em descrição/notas.
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @param {string} [params.sort='date_desc']
 * @returns {Promise<Object>} Dados paginados e resumo financeiro do período.
 */
async function findAll({ userId, month, year, type, categoryId, accountId, search, page = 1, limit = 20, sort = 'date_desc' }) {
  const { startDate, endDate } = getMonthRange(month, year);

  const where = {
    user_id: userId,
    date: { gte: startDate, lte: endDate + 'T23:59:59' }
  };

  // Aplicação de filtros condicionais
  if (type && type !== 'all') where.type = type;
  if (categoryId) where.category_id = categoryId;
  if (accountId) where.account_id = accountId;
  
  if (search) {
    where.OR = [
      { description: { contains: search } },
      { notes: { contains: search } }
    ];
  }

  // Mapeamento de ordenação
  const sortMap = {
    'date_desc': [{ date: 'desc' }, { created_at: 'desc' }],
    'date_asc': [{ date: 'asc' }, { created_at: 'asc' }],
    'amount_desc': [{ amount: 'desc' }],
    'amount_asc': [{ amount: 'asc' }],
  };
  const orderBy = sortMap[sort] || sortMap['date_desc'];

  const skip = (page - 1) * limit;

  // Busca total de registros para paginação
  const total = await prisma.transactions.count({ where });

  // Busca registros do banco com joins (include)
  const data = await prisma.transactions.findMany({
    where,
    orderBy,
    skip,
    take: parseInt(limit),
    include: {
      categories: true,
      accounts: true
    }
  });

  // Mapeamento para formato amigável ao frontend
  const mappedData = data.map(t => ({
    ...t,
    category_name: t.categories?.name,
    category_color: t.categories?.color,
    category_icon: t.categories?.icon,
    account_name: t.accounts?.name,
    account_color: t.accounts?.color
  }));

  // Agregações de totais em paralelo (otimização de performance)
  const [incomeAggr, expenseAggr] = await Promise.all([
    prisma.transactions.aggregate({
      _sum: { amount: true },
      where: { ...where, type: 'income' }
    }),
    prisma.transactions.aggregate({
      _sum: { amount: true },
      where: { ...where, type: 'expense' }
    })
  ]);

  const totalIncome = incomeAggr._sum.amount || 0;
  const totalExpense = expenseAggr._sum.amount || 0;

  return {
    data: mappedData,
    pagination: { 
      total, 
      page: parseInt(page), 
      limit: parseInt(limit), 
      totalPages: Math.ceil(total / limit) 
    },
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: total
    }
  };
}

/**
 * Busca uma transação específica pelo ID, incluindo detalhes de conta/categoria.
 * 
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
async function findById(id) { 
  if (!isValidMongoId(id)) return null;
  
  const t = await prisma.transactions.findUnique({
    where: { id },
    include: { categories: true, accounts: true }
  });
  
  if (!t) return null;
  
  return {
    ...t,
    category_name: t.categories?.name,
    category_color: t.categories?.color,
    category_icon: t.categories?.icon,
    account_name: t.accounts?.name,
    account_color: t.accounts?.color
  };
}

/**
 * Cria uma nova transação.
 * 
 * @param {Object} data - Dados da transação.
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object>}
 */
async function create(data, client = prisma) {
  return await client.transactions.create({
    data: {
      user_id: data.userId,
      account_id: data.accountId,
      category_id: data.categoryId ? data.categoryId : null,
      type: data.type,
      amount: data.amount,
      description: data.description.trim(),
      date: data.date,
      recurring_id: data.recurringId ? data.recurringId : null,
      to_account_id: data.toAccountId ? data.toAccountId : null,
      notes: data.notes ?? null
    }
  });
}

/**
 * Atualiza os dados de uma transação.
 * 
 * @param {string} id 
 * @param {Object} data 
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object>}
 */
async function update(id, data, client = prisma) { 
  if (!isValidMongoId(id)) return null;
  
  const updateData = {};
  if (data.account_id !== undefined) updateData.account_id = data.account_id;
  if (data.category_id !== undefined) updateData.category_id = data.category_id ? data.category_id : null;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.date !== undefined) updateData.date = data.date;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.recurring_id !== undefined) updateData.recurring_id = data.recurring_id ? data.recurring_id : null;
  if (data.to_account_id !== undefined) updateData.to_account_id = data.to_account_id ? data.to_account_id : null;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    await client.transactions.update({
      where: { id },
      data: updateData
    });
  }
  
  return await findById(id);
}

/**
 * Remove permanentemente uma transação.
 * 
 * @param {string} id 
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 */
async function remove(id, client = prisma) { 
  if (!isValidMongoId(id)) return;
  await client.transactions.delete({ where: { id } });
}

/**
 * Busca transações por período para relatórios rápidos.
 * 
 * @param {string} userId 
 * @param {string} startDate 
 * @param {string} endDate 
 * @returns {Promise<Array>}
 */
async function findByCategoryAndDateRange(userId, startDate, endDate) {
  return await prisma.transactions.findMany({
    where: {
      user_id: userId,
      date: { gte: startDate, lte: endDate + 'T23:59:59' }
    }
  });
}

module.exports = {
  findAll, findById, create, update, remove,
  findByCategoryAndDateRange
};
