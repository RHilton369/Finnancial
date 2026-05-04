const { prisma } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { getMonthRange } = require('../utils/dateHelpers');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Gera um relatório mensal consolidado para um ano inteiro.
 * Retorna receitas, despesas, saldo e taxa de poupança para cada mês.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getMonthly = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const data = [];

  logger.debug({ userId, year }, 'Gerando relatório anual mensalizado');

  for (let month = 1; month <= 12; month++) {
    const { startDate, endDate } = getMonthRange(month, year);
    const tx = await prisma.transactions.findMany({
      where: { user_id: userId, date: { gte: startDate, lte: endDate + 'T23:59:59' } }
    });

    const income = tx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = tx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const txCount = tx.length;
    const balance = income - expense;
    const savingsRate = income > 0 ? parseFloat(((balance / income) * 100).toFixed(2)) : 0;

    data.push({
      month, label: MONTHS_PT[month - 1], income, expense, balance, savings_rate: savingsRate, transaction_count: txCount
    });
  }
  res.json(data);
});

/**
 * Retorna a evolução de gastos de uma categoria específica nos últimos meses.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se o category_id não for fornecido.
 */
const getCategoryEvolution = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const categoryId = req.query.category_id;
  const months = Math.min(parseInt(req.query.months) || 6, 12);

  if (!categoryId) {
    logger.warn({ userId }, 'Falha ao gerar relatório: category_id ausente');
    throw new AppError('category_id é obrigatório', 400, 'VALIDATION_ERROR');
  }

  const data = [];
  const now = new Date();
  let cm = now.getMonth() + 1;
  let cy = now.getFullYear();

  // Retrocede para o início do período solicitado
  for (let i = 0; i < months - 1; i++) {
    if (cm === 1) { cm = 12; cy--; } else { cm--; }
  }

  for (let i = 0; i < months; i++) {
    const { startDate, endDate } = getMonthRange(cm, cy);
    const tx = await prisma.transactions.findMany({
      where: { user_id: userId, category_id: categoryId, type: 'expense', date: { gte: startDate, lte: endDate + 'T23:59:59' } }
    });

    const total = tx.reduce((acc, t) => acc + t.amount, 0);
    data.push({ month: cm, year: cy, label: MONTHS_PT[cm - 1], total });

    if (cm === 12) { cm = 1; cy++; } else { cm++; }
  }
  res.json(data);
});

module.exports = { getMonthly, getCategoryEvolution };
