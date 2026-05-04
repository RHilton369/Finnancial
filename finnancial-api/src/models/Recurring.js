/**
 * Utilitário para validar se uma string é um ObjectId válido do MongoDB.
 * @param {string|any} id 
 * @returns {boolean}
 */
const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

const { prisma } = require('../config/database');

/**
 * Lista todas as transações recorrentes configuradas por um usuário.
 * 
 * @param {string} userId - ID do usuário.
 * @returns {Promise<Array>} Lista de recorrências.
 */
async function findAll(userId) {
  return await prisma.recurring_transactions.findMany({
    where: { user_id: userId },
    orderBy: { next_due_date: 'asc' }
  });
}

/**
 * Alias para findAll(userId).
 * @param {string} userId 
 */
async function findByUserId(userId) {
  return await findAll(userId);
}

/**
 * Busca uma configuração de recorrência específica pelo ID.
 * 
 * @param {string} id - ID da recorrência.
 * @param {import('@prisma/client').PrismaClient} [client]
 * @returns {Promise<Object|null>} A recorrência encontrada ou null.
 */
async function findById(id, client = prisma) { 
  if (!isValidMongoId(id)) return null;
  return await client.recurring_transactions.findUnique({ where: { id } });
}

/**
 * Busca as próximas recorrências que vencerão em um intervalo de dias.
 * 
 * @param {string} userId - ID do usuário.
 * @param {number} [daysAhead=7] - Janela de dias para busca.
 * @returns {Promise<Array>} Resumo das próximas contas.
 */
async function findUpcoming(userId, daysAhead = 7) {
  const todayDate = new Date().toISOString().slice(0, 10);
  const future = new Date();
  future.setDate(future.getDate() + parseInt(daysAhead));
  const futureDate = future.toISOString().slice(0, 10);

  const data = await prisma.recurring_transactions.findMany({
    where: {
      user_id: userId,
      is_active: 1,
      next_due_date: { gte: todayDate, lte: futureDate }
    },
    orderBy: { next_due_date: 'asc' },
    take: 5,
    include: { categories: true }
  });
  
  return data.map(r => ({
    ...r,
    category_name: r.categories?.name,
    category_color: r.categories?.color,
    category_icon: r.categories?.icon
  }));
}

/**
 * Busca todas as recorrências ativas que venceram (data <= hoje).
 * Utilizado pelo processador de tarefas agendadas.
 * 
 * @returns {Promise<Array>} Itens que precisam ser processados.
 */
async function findDueToday() {
  const todayDate = new Date().toISOString().slice(0, 10);

  const data = await prisma.recurring_transactions.findMany({
    where: {
      is_active: 1,
      next_due_date: { lte: todayDate }
    },
    include: { categories: true }
  });

  return data.map(r => ({
    ...r,
    category_name: r.categories?.name,
    category_color: r.categories?.color,
    category_icon: r.categories?.icon
  }));
}

/**
 * Cria uma nova configuração de transação automática (assinaturas, aluguel, etc).
 * 
 * @param {Object} data - Dados da recorrência.
 * @param {import('@prisma/client').PrismaClient} [client]
 * @returns {Promise<Object>} A recorrência criada.
 */
async function create(data, client = prisma) {
  return await client.recurring_transactions.create({
    data: {
      user_id: data.userId,
      account_id: data.accountId,
      category_id: data.categoryId ? data.categoryId : null,
      type: data.type,
      amount: data.amount,
      description: data.description.trim(),
      frequency: data.frequency,
      start_date: data.startDate,
      end_date: data.endDate ?? null,
      next_due_date: data.nextDueDate || data.startDate
    }
  });
}

/**
 * Atualiza a data do próximo vencimento de uma recorrência após o processamento.
 * 
 * @param {string} id 
 * @param {string} nextDueDate - String no formato YYYY-MM-DD.
 * @param {import('@prisma/client').PrismaClient} [client]
 */
async function updateNextDueDate(id, nextDueDate, client = prisma) {
  await client.recurring_transactions.update({
    where: { id },
    data: {
      next_due_date: nextDueDate,
      updated_at: new Date().toISOString()
    }
  });
}

/**
 * Desativa uma recorrência (ex: assinatura cancelada ou prazo final atingido).
 * 
 * @param {string} id 
 * @param {import('@prisma/client').PrismaClient} [client]
 */
async function deactivate(id, client = prisma) {
  await client.recurring_transactions.update({
    where: { id },
    data: {
      is_active: 0,
      updated_at: new Date().toISOString()
    }
  });
}

/**
 * Atualiza os parâmetros de uma configuração de recorrência.
 * 
 * @param {string} id 
 * @param {Object} data 
 * @param {import('@prisma/client').PrismaClient} [client]
 * @returns {Promise<Object>}
 */
async function update(id, data, client = prisma) { 
  if (!isValidMongoId(id)) return null;
  
  const updateData = {};
  if (data.account_id !== undefined) updateData.account_id = data.account_id;
  if (data.category_id !== undefined) updateData.category_id = data.categoryId ? data.categoryId : null;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.frequency !== undefined) updateData.frequency = data.frequency;
  if (data.start_date !== undefined) updateData.start_date = data.startDate;
  if (data.end_date !== undefined) updateData.end_date = data.endDate ?? null;
  if (data.next_due_date !== undefined) updateData.next_due_date = data.nextDueDate;
  if (data.is_active !== undefined) updateData.is_active = data.isActive;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    await client.recurring_transactions.update({
      where: { id },
      data: updateData
    });
  }
  
  return await findById(id, client);
}

/**
 * Remove permanentemente uma configuração de recorrência.
 * 
 * @param {string} id 
 * @param {import('@prisma/client').PrismaClient} [client]
 */
async function remove(id, client = prisma) { 
  if (!isValidMongoId(id)) return;
  await client.recurring_transactions.delete({ where: { id } });
}

/**
 * Calcula a próxima data de vencimento com base na frequência.
 * 
 * @param {string} currentDate - Data atual em formato ISO ou YYYY-MM-DD.
 * @param {string} frequency - 'daily', 'weekly', 'monthly', 'yearly'.
 * @returns {string} Próxima data no formato YYYY-MM-DD.
 */
function calcNextDue(currentDate, frequency) {
  const d = new Date(currentDate);
  if (frequency === 'daily')   d.setDate(d.getDate() + 1);
  if (frequency === 'weekly')  d.setDate(d.getDate() + 7);
  if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  if (frequency === 'yearly')  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

module.exports = {
  findAll, findById, findByUserId, findUpcoming, findDueToday,
  create, update, updateNextDueDate, deactivate, remove, calcNextDue
};
