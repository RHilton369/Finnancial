/**
 * Utilitário para validar se uma string é um ObjectId válido do MongoDB.
 * @param {string|any} id 
 * @returns {boolean}
 */
const isValidMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id));

const { prisma } = require('../config/database');

/**
 * Busca um usuário por seu ID único.
 * 
 * @param {string} id - ID do usuário.
 * @returns {Promise<Object|null>}
 */
async function findById(id) { 
  if (!isValidMongoId(id)) return null;
  return await prisma.users.findUnique({ where: { id } });
}

/**
 * Busca um usuário pelo endereço de e-mail (case-insensitive).
 * 
 * @param {string} email 
 * @returns {Promise<Object|null>}
 */
async function findByEmail(email) {
  return await prisma.users.findUnique({ where: { email: email.toLowerCase() } });
}

/**
 * Cria um novo registro de usuário no sistema.
 * 
 * @param {Object} data 
 * @param {string} data.name 
 * @param {string} data.email 
 * @param {string} data.passwordHash 
 * @param {number} [data.monthlyIncome=0] 
 * @returns {Promise<Object>} O usuário criado.
 */
async function create({ name, email, passwordHash, monthlyIncome = 0 }) {
  return await prisma.users.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      monthly_income: monthlyIncome,
    }
  });
}

/**
 * Atualiza os metadados do perfil do usuário.
 * 
 * @param {string} id 
 * @param {Object} data - Campos a serem atualizados.
 * @returns {Promise<Object>} O usuário atualizado.
 */
async function update(id, data) { 
  if (!isValidMongoId(id)) return null;
  
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.monthly_income !== undefined) updateData.monthly_income = data.monthly_income;
  if (data.password_hash !== undefined) updateData.password_hash = data.password_hash;
  if (data.email !== undefined) updateData.email = data.email.toLowerCase();
  if (data.gemini_api_key !== undefined) {
    updateData.gemini_api_key = data.gemini_api_key.trim() === '' ? null : data.gemini_api_key.trim();
  }

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = new Date().toISOString();
    return await prisma.users.update({
      where: { id },
      data: updateData
    });
  }
  
  return await findById(id);
}

module.exports = { findById, findByEmail, create, update };
