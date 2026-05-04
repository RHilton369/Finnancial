const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Atualiza o perfil do usuário logado.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, monthly_income } = req.body;
  
  // Log de auditoria para depuração profissional
  logger.debug({ userId, payload: req.body }, 'Iniciando atualização de perfil');

  // Garante que o valor seja numérico ou nulo para evitar erros no Prisma/MongoDB
  const cleanIncome = (monthly_income === null || isNaN(monthly_income)) ? 0 : parseFloat(monthly_income);

  logger.info({ userId, name, cleanIncome }, 'Solicitação de atualização de perfil');

  try {
    const updatedUser = await User.update(userId, {
      name: name?.trim(),
      monthly_income: cleanIncome
    });

    if (!updatedUser) {
      throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
    }

    logger.info({ userId }, 'Perfil atualizado com sucesso');

    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      monthly_income: updatedUser.monthly_income
    });
  } catch (error) {
    logger.error({ err: error.message, userId }, 'Erro ao atualizar perfil no banco de dados');
    throw error;
  }
});


module.exports = {
  updateProfile
};
