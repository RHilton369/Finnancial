const { prisma } = require('../config/database');

/**
 * Inicializa o perfil de um novo usuário com dados padrão (categorias e conta inicial).
 * Garante que o usuário comece com uma estrutura financeira básica funcional.
 * 
 * @param {string} userId - ID do usuário recém-criado.
 * @returns {Promise<void>}
 */
async function seedUserData(userId) {
  // Categorias padrão sugeridas para novos usuários
  const categories = [
    { user_id: userId, name: 'Moradia',       type: 'expense', color: '#378ADD', icon: 'home', is_default: 1 },
    { user_id: userId, name: 'Alimentacao',   type: 'expense', color: '#1D9E75', icon: 'utensils', is_default: 1 },
    { user_id: userId, name: 'Transporte',    type: 'expense', color: '#D85A30', icon: 'car', is_default: 1 },
    { user_id: userId, name: 'Saude',         type: 'expense', color: '#7F77DD', icon: 'heart', is_default: 1 },
    { user_id: userId, name: 'Lazer',         type: 'expense', color: '#EF9F27', icon: 'smile', is_default: 1 },
    { user_id: userId, name: 'Educacao',      type: 'expense', color: '#E24B4A', icon: 'book', is_default: 1 },
    { user_id: userId, name: 'Vestuario',     type: 'expense', color: '#D4537E', icon: 'shirt', is_default: 1 },
    { user_id: userId, name: 'Assinaturas',   type: 'expense', color: '#BA7517', icon: 'repeat', is_default: 1 },
    { user_id: userId, name: 'Investimentos', type: 'expense', color: '#639922', icon: 'trending-up', is_default: 1 },
    { user_id: userId, name: 'Outros',        type: 'expense', color: '#888780', icon: 'tag', is_default: 1 },
    { user_id: userId, name: 'Salario',       type: 'income',  color: '#1D9E75', icon: 'briefcase', is_default: 1 },
    { user_id: userId, name: 'Renda Extra',   type: 'income',  color: '#7F77DD', icon: 'plus-circle', is_default: 1 }
  ];

  // Criação em lote das categorias
  await prisma.categories.createMany({
    data: categories
  });

  // Criação da conta 'Carteira' padrão
  await prisma.accounts.create({
    data: {
      user_id: userId,
      name: 'Carteira',
      type: 'cash',
      balance: 0,
      color: '#378ADD',
      icon: 'wallet',
      is_active: 1
    }
  });
}

module.exports = { seedUserData };
