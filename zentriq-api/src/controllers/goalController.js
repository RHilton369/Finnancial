const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Goal = require('../models/Goal');
const logger = require('../utils/logger');

/**
 * Lista as metas financeiras do usuário, calculando progresso e estimativas.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const goals = await Goal.findAll(userId);

  const enriched = goals.map(g => {
    // Cálculo do percentual de progresso
    const progressPct = g.target_amount > 0 ? parseFloat((g.current_amount / g.target_amount * 100).toFixed(2)) : 0;

    let monthlyNeeded = 0;
    let daysRemaining = null;

    if (g.deadline) {
      const deadline = new Date(g.deadline);
      const now = new Date();
      const diffTime = deadline - now;
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // Cálculo de quanto poupar por mês para atingir a meta no prazo
      const monthsRemaining = Math.max(1, daysRemaining / 30);
      monthlyNeeded = parseFloat(((g.target_amount - g.current_amount) / monthsRemaining).toFixed(2));
    }

    return {
      ...g,
      progress_pct: progressPct,
      monthly_needed: monthlyNeeded,
      days_remaining: daysRemaining
    };
  });

  res.json(enriched);
});

/**
 * Cria uma nova meta financeira.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, target_amount, current_amount, deadline, color, icon } = req.body;

  const { prisma } = require('../config/database');

  const goal = await prisma.$transaction(async (tx) => {
    return await Goal.create({ userId, name, targetAmount: target_amount, currentAmount: current_amount || 0, deadline, color, icon }, tx);
  });

  logger.info({ userId, goalId: goal.id }, 'Nova meta financeira criada (Atomic)');
  res.status(201).json(goal);
});

/**
 * Atualiza os dados de uma meta.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se a meta não for encontrada.
 */
const update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const goalId = req.params.id;

  const { prisma } = require('../config/database');

  const updated = await prisma.$transaction(async (tx) => {
    const goal = await Goal.findById(goalId, tx);
    if (!goal || goal.user_id !== userId) {
      logger.warn({ userId, goalId }, 'Tentativa de atualização: Meta inválida');
      throw new AppError('Meta não encontrada', 404, 'NOT_FOUND');
    }

    return await Goal.update(goalId, req.body, tx);
  });

  logger.info({ userId, goalId }, 'Meta financeira atualizada (Atomic)');
  res.json(updated);
});

/**
 * Realiza um aporte direto em uma meta financeira.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se a meta não for encontrada.
 */
const deposit = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const goalId = req.params.id;
  const { amount } = req.body;

  const { prisma } = require('../config/database');
  
  const updated = await prisma.$transaction(async (tx) => {
    const goal = await Goal.findById(goalId, tx);
    if (!goal || goal.user_id !== userId) {
      logger.warn({ userId, goalId }, 'Tentativa de aporte: Meta inválida');
      throw new AppError('Meta não encontrada', 404, 'NOT_FOUND');
    }

    return await Goal.deposit(goalId, amount, tx);
  });

  logger.info({ userId, goalId, amount }, 'Aporte realizado na meta (Atomic)');
  res.json(updated);
});

/**
 * Remove uma meta do sistema.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se a meta não for encontrada.
 */
const remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const goalId = req.params.id;

  const { prisma } = require('../config/database');

  await prisma.$transaction(async (tx) => {
    const goal = await Goal.findById(goalId, tx);
    if (!goal || goal.user_id !== userId) {
      logger.warn({ userId, goalId }, 'Tentativa de remoção: Meta inválida');
      throw new AppError('Meta não encontrada', 404, 'NOT_FOUND');
    }

    await Goal.remove(goalId, tx);
  });

  logger.info({ userId, goalId }, 'Meta financeira removida (Atomic)');
  res.status(204).send();
});

module.exports = { list, create, update, deposit, remove };
