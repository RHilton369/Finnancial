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

/**
 * Exporta todas as transações do usuário em formato CSV para download.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const exportTransactionsCSV = asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  const transactions = await prisma.transactions.findMany({
    where: { user_id: userId },
    include: { categories: true, accounts: true },
    orderBy: { date: 'desc' }
  });

  logger.info({ userId, count: transactions.length }, 'Iniciando exportação de CSV');

  // Cabeçalho BOM para Excel reconhecer caracteres PT-BR
  let csv = '\uFEFFDate;Description;Category;Account;Type;Amount;Notes\n';
  
  transactions.forEach(t => {
    const date = t.date;
    const desc = `"${t.description.replace(/"/g, '""')}"`;
    const cat = `"${(t.categories?.name || 'Sem Categoria').replace(/"/g, '""')}"`;
    const acc = `"${(t.accounts?.name || 'Sem Conta').replace(/"/g, '""')}"`;
    const type = t.type === 'income' ? 'Receita' : (t.type === 'expense' ? 'Despesa' : 'Transferência');
    const amount = t.amount.toString().replace('.', ','); // Formato decimal PT-BR
    const notes = t.notes ? `"${t.notes.replace(/"/g, '""')}"` : '""';

    csv += `${date};${desc};${cat};${acc};${type};${amount};${notes}\n`;
  });

  const fileName = `zentriq_export_${new Date().toISOString().split('T')[0]}.csv`;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
  res.status(200).send(csv);
});

/**
 * Gera os dados imersivos de Fechamento do Mês (Wrapped).
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getWrappedReport = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  logger.debug({ userId, month, year }, 'Gerando Fechamento do Mês (Wrapped)');

  const { startDate, endDate } = getMonthRange(month, year);
  
  // Buscar transações do mês atual
  const currentMonthTx = await prisma.transactions.findMany({
    where: { user_id: userId, date: { gte: startDate, lte: endDate + 'T23:59:59' } },
    include: { categories: true }
  });

  const income = currentMonthTx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = currentMonthTx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = income - expense;
  const savingRate = income > 0 ? parseFloat(((balance / income) * 100).toFixed(2)) : 0;

  // Encontrar a categoria vilã
  const expenseByCategory = {};
  currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
    const catName = t.categories?.name || 'Sem Categoria';
    expenseByCategory[catName] = (expenseByCategory[catName] || 0) + t.amount;
  });

  let topCategory = null;
  let maxExpense = 0;
  for (const [cat, amt] of Object.entries(expenseByCategory)) {
    if (amt > maxExpense) {
      maxExpense = amt;
      topCategory = cat;
    }
  }

  // Buscar transações do mês ANTERIOR para comparação
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear--;
  }
  const prevRange = getMonthRange(prevMonth, prevYear);
  const prevMonthTx = await prisma.transactions.findMany({
    where: { user_id: userId, type: 'expense', date: { gte: prevRange.startDate, lte: prevRange.endDate + 'T23:59:59' } }
  });

  const prevExpense = prevMonthTx.reduce((acc, t) => acc + t.amount, 0);
  const expenseDiff = expense - prevExpense;

  res.json({
    month,
    year,
    monthLabel: MONTHS_PT[month - 1],
    income,
    expense,
    balance,
    savingRate,
    topCategory: topCategory ? { name: topCategory, amount: maxExpense } : null,
    prevExpense,
    expenseDiff
  });
});

module.exports = { getMonthly, getCategoryEvolution, exportTransactionsCSV, getWrappedReport };
