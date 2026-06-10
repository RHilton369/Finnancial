/**
 * Utilitário para validar se uma string é um ObjectId válido do MongoDB.
 * @param {string|any} id 
 * @returns {boolean}
 */
const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

const { prisma } = require('../config/database');

/**
 * Busca todas as categorias de um usuário, opcionalmente filtradas por tipo (income/expense).
 * 
 * @param {string} userId - ID do usuário.
 * @param {string|null} [type=null] - Tipo da categoria.
 * @returns {Promise<Array>} Lista de categorias ordenadas por nome.
 */
async function findAllByUser(userId, type = null) {
  const where = { user_id: userId };
  if (type) where.type = type;

  return await prisma.categories.findMany({
    where,
    orderBy: { name: 'asc' }
  });
}

/**
 * Busca uma categoria específica pelo ID.
 * 
 * @param {string} id - ID da categoria.
 * @returns {Promise<Object|null>} A categoria encontrada ou null.
 */
async function findById(id) { 
  if (!isValidMongoId(id)) return null;
  return await prisma.categories.findUnique({ where: { id } });
}

/**
 * Cria uma nova categoria customizada para o usuário.
 * 
 * @param {Object} data - Dados da categoria.
 * @returns {Promise<Object>} A categoria criada.
 */
async function create(data) {
  return await prisma.categories.create({
    data: {
      user_id: data.userId,
      name: data.name.trim(),
      type: data.type,
      color: data.color || '#94A3B8',
      icon: data.icon || 'tag',
      is_default: 0
    }
  });
}

/**
 * Atualiza os metadados de uma categoria.
 * 
 * @param {string} id - ID da categoria.
 * @param {Object} data - Campos a serem atualizados.
 * @returns {Promise<Object>} A categoria atualizada.
 */
async function update(id, data) { 
  if (!isValidMongoId(id)) return null;
  
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    return await prisma.categories.update({
      where: { id },
      data: updateData
    });
  }
  
  return await findById(id);
}

/**
 * Remove permanentemente uma categoria.
 * 
 * @param {string} id 
 */
async function remove(id) { 
  if (!isValidMongoId(id)) return;
  await prisma.categories.delete({ where: { id } });
}

/**
 * Conta quantas transações estão vinculadas a esta categoria.
 * Útil para validação antes de exclusão.
 * 
 * @param {string} categoryId 
 * @returns {Promise<number>}
 */
async function countTransactions(categoryId) {
  return await prisma.transactions.count({
    where: { category_id: categoryId }
  });
}

module.exports = { findAllByUser, findById, create, update, remove, countTransactions };
