/**
 * Utilitário para validar se uma string é um ObjectId válido do MongoDB.
 * @param {string|any} id 
 * @returns {boolean}
 */
const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

const { prisma } = require('../config/database');

/**
 * Busca todas as metas de um usuário, priorizando as não concluídas.
 * 
 * @param {string} userId - ID do usuário.
 * @returns {Promise<Array>} Lista de metas.
 */
async function findAll(userId) {
  return await prisma.goals.findMany({
    where: { user_id: userId },
    orderBy: [
      { is_completed: 'asc' },
      { created_at: 'desc' }
    ]
  });
}

/**
 * Busca uma meta específica pelo ID.
 * 
 * @param {string} id - ID da meta.
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object|null>} A meta encontrada ou null.
 */
async function findById(id, client = prisma) { 
  if (!isValidMongoId(id)) return null;
  return await client.goals.findUnique({ where: { id } });
}

/**
 * Cria uma nova meta financeira (ex: Reserva de Emergência, Viagem).
 * 
 * @param {Object} data - Dados da meta.
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object>} A meta criada.
 */
async function create(data, client = prisma) {
  return await client.goals.create({
    data: {
      user_id: data.userId,
      name: data.name.trim(),
      target_amount: data.targetAmount,
      current_amount: data.currentAmount || 0,
      deadline: data.deadline ?? null,
      color: data.color || '#1D9E75',
      icon: data.icon || 'target'
    }
  });
}

/**
 * Atualiza os metadados de uma meta.
 * 
 * @param {string} id - ID da meta.
 * @param {Object} data - Campos a serem atualizados.
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object>} A meta atualizada.
 */
async function update(id, data, client = prisma) { 
  if (!isValidMongoId(id)) return null;
  
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.target_amount !== undefined) updateData.target_amount = data.targetAmount;
  if (data.current_amount !== undefined) updateData.current_amount = data.currentAmount;
  if (data.deadline !== undefined) updateData.deadline = data.deadline;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    return await client.goals.update({
      where: { id },
      data: updateData
    });
  }
  
  return await findById(id, client);
}

/**
 * Registra um aporte financeiro em uma meta.
 * Verifica automaticamente se a meta foi atingida após o depósito.
 * 
 * @param {string} id - ID da meta.
 * @param {number} amount - Valor do aporte.
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 * @returns {Promise<Object>} A meta com o saldo atualizado.
 */
async function deposit(id, amount, client = prisma) {
  const goal = await client.goals.update({
    where: { id },
    data: {
      current_amount: { increment: amount },
      updated_at: new Date().toISOString()
    }
  });

  // Marca como concluída se atingiu o objetivo
  if (goal.current_amount >= goal.target_amount && !goal.is_completed) {
    return await client.goals.update({
      where: { id },
      data: {
        is_completed: 1,
        completed_at: new Date().toISOString()
      }
    });
  }
  
  return goal;
}

/**
 * Remove permanentemente uma meta.
 * 
 * @param {string} id 
 * @param {import('@prisma/client').PrismaClient} [client] - Cliente Prisma opcional.
 */
async function remove(id, client = prisma) { 
  if (!isValidMongoId(id)) return;
  await client.goals.delete({ where: { id } });
}

module.exports = { findAll, findById, create, update, deposit, remove };
