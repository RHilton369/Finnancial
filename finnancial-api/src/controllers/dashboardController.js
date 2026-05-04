const { prisma } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { getMonthRange, getPreviousMonth, calcDeltaPct } = require('../utils/dateHelpers');
const logger = require('../utils/logger');

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Retorna um resumo consolidado do dashboard para um mês específico.
 * Inclui: total de receitas/despesas, saldo, taxa de poupança, variação vs mês anterior,
 * categorias principais, alertas de orçamento, contas próximas e tendências.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getSummary = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();

  logger.debug({ userId, month, year }, 'Gerando resumo do dashboard');

  const { startDate, endDate } = getMonthRange(month, year);
  const prev = getPreviousMonth(month, year);
  const { startDate: prevStart, endDate: prevEnd } = getMonthRange(prev.month, prev.year);

  // Busca transações do mês atual
  const txCurrent = await prisma.transactions.findMany({
    where: { user_id: userId, date: { gte: startDate, lte: endDate + 'T23:59:59' } },
    include: { categories: true }
  });

  const totalIncome = txCurrent.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = txCurrent.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const transactionCount = txCurrent.length;
  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? parseFloat(((balance / totalIncome) * 100).toFixed(2)) : 0;

  // Busca transações do mês anterior para comparativo
  const txPrev = await prisma.transactions.findMany({
    where: { user_id: userId, date: { gte: prevStart, lte: prevEnd + 'T23:59:59' } }
  });
  const prevIncome = txPrev.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const prevExpense = txPrev.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  
  const incomeDelta = calcDeltaPct(totalIncome, prevIncome);
  const expenseDelta = calcDeltaPct(totalExpense, prevExpense);

  // Categorias Principais (Maiores Gastos)
  const expenseMap = {};
  txCurrent.filter(t => t.type === 'expense' && t.category_id).forEach(t => {
    if (!expenseMap[t.category_id]) {
      expenseMap[t.category_id] = { id: t.category_id, name: t.categories?.name, color: t.categories?.color, icon: t.categories?.icon, total: 0 };
    }
    expenseMap[t.category_id].total += t.amount;
  });
  let topCategories = Object.values(expenseMap).sort((a,b) => b.total - a.total).slice(0, 5);
  topCategories = topCategories.map(c => ({
    ...c,
    percentage: totalExpense > 0 ? parseFloat((c.total / totalExpense * 100).toFixed(2)) : 0
  }));

  // Alertas de Orçamento (Gastos acima de 70% do limite)
  const budgets = await prisma.budgets.findMany({
    where: { user_id: userId, month, year },
    include: { categories: true }
  });
  
  const budgetAlerts = [];
  budgets.forEach(b => {
    const spent = txCurrent.filter(t => t.type === 'expense' && t.category_id === b.category_id)
                           .reduce((acc, t) => acc + t.amount, 0);
    const amount_limit = b.amount_limit || 0;
    const usedPct = amount_limit > 0 ? parseFloat((spent / amount_limit * 100).toFixed(1)) : 0;
    
    if (amount_limit > 0 && usedPct >= 70) {
      budgetAlerts.push({
        id: b.id,
        amount_limit,
        name: b.categories?.name,
        color: b.categories?.color,
        icon: b.categories?.icon,
        spent,
        usedPct,
        status: usedPct >= 100 ? 'danger' : 'warning'
      });
    }
  });
  budgetAlerts.sort((a,b) => b.usedPct - a.usedPct);

  // Próximas Contas (Próximos 7 dias)
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);
  const upcomingRows = await prisma.recurring_transactions.findMany({
    where: { 
      user_id: userId, 
      is_active: 1,
      next_due_date: {
        gte: now.toISOString().slice(0, 10),
        lte: next7Days.toISOString().slice(0, 10)
      }
    },
    include: { categories: true },
    orderBy: { next_due_date: 'asc' },
    take: 5
  });

  const upcomingBills = upcomingRows.map(r => {
    let dueDate = new Date(r.next_due_date);
    let today = new Date();
    let diff = Math.ceil((dueDate - today)/(1000*60*60*24));
    return {
      ...r,
      category_name: r.categories?.name,
      category_color: r.categories?.color,
      category_icon: r.categories?.icon,
      daysUntil: diff
    };
  });

  // Tendência dos últimos 6 meses
  const monthlyTrend = [];
  let cm = month;
  let cy = year;
  
  // Descobre a data de início do 6º mês anterior
  let startCm = cm;
  let startCy = cy;
  for(let i=0; i<5; i++) {
    const pm = getPreviousMonth(startCm, startCy); 
    startCm = pm.month; 
    startCy = pm.year;
  }
  const { startDate: trendStart } = getMonthRange(startCm, startCy);
  
  const trendTx = await prisma.transactions.findMany({
    where: { user_id: userId, date: { gte: trendStart, lte: endDate + 'T23:59:59' } }
  });

  for (let i=0; i<6; i++) {
    const r = getMonthRange(cm, cy);
    const tx = trendTx.filter(t => t.date >= r.startDate && t.date <= r.endDate + 'T23:59:59');
    
    const iT = tx.filter(t => t.type === 'income').reduce((acc,t)=> acc + t.amount, 0);
    const eT = tx.filter(t => t.type === 'expense').reduce((acc,t)=> acc + t.amount, 0);
    monthlyTrend.push({
      month: cm, year: cy, label: MONTHS_SHORT[cm-1], income: iT, expense: eT, balance: iT - eT
    });
    const pm = getPreviousMonth(cm, cy); cm = pm.month; cy = pm.year;
  }
  monthlyTrend.reverse();

  res.json({
    period: { month, year, label: `${MONTHS_PT[month - 1]} ${year}` },
    summary: { totalIncome, totalExpense, balance, savingsRate, transactionCount },
    vsLastMonth: {
      income: { value: prevIncome, delta: incomeDelta, direction: incomeDelta >= 0 ? 'up' : 'down' },
      expense: { value: prevExpense, delta: expenseDelta, direction: expenseDelta >= 0 ? 'up' : 'down' }
    },
    topCategories,
    budgetAlerts,
    upcomingBills,
    monthlyTrend
  });
});

/**
 * Retorna os dados de fluxo de caixa (receita vs despesa) dos últimos meses.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCashflow = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const months = Math.min(parseInt(req.query.months) || 6, 12);
  const now = new Date();
  const data = [];
  let cm = now.getMonth() + 1;
  let cy = now.getFullYear();

  for (let i = 0; i < months - 1; i++) {
    const p = getPreviousMonth(cm, cy); cm = p.month; cy = p.year;
  }
  
  const { startDate: cfStart } = getMonthRange(cm, cy);
  const { endDate: cfEnd } = getMonthRange(now.getMonth() + 1, now.getFullYear());
  
  const allTx = await prisma.transactions.findMany({
    where: { user_id: userId, date: { gte: cfStart, lte: cfEnd + 'T23:59:59' } }
  });

  for (let i = 0; i < months; i++) {
    const r = getMonthRange(cm, cy);
    const tx = allTx.filter(t => t.date >= r.startDate && t.date <= r.endDate + 'T23:59:59');
    
    const income = tx.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = tx.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    data.push({
      month: cm, year: cy, label: MONTHS_SHORT[cm - 1], income, expense, net: income - expense
    });
    cm++;
    if(cm > 12) { cm = 1; cy++; }
  }
  res.json(data);
});

/**
 * Retorna o detalhamento de gastos agrupados por categoria para um mês.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getByCategory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();
  const { startDate, endDate } = getMonthRange(month, year);

  const categories = await prisma.categories.findMany({ where: { user_id: userId, type: 'expense' } });
  const tx = await prisma.transactions.findMany({ 
    where: { user_id: userId, type: 'expense', date: { gte: startDate, lte: endDate + 'T23:59:59' } } 
  });
  const budgets = await prisma.budgets.findMany({ where: { user_id: userId, month, year } });

  const catsMap = {};
  categories.forEach(c => {
    catsMap[c.id] = { ...c, total: 0, transaction_count: 0, budget_limit: null };
  });

  let totalExpense = 0;
  tx.forEach(t => {
    if(t.category_id && catsMap[t.category_id]) {
      catsMap[t.category_id].total += t.amount;
      catsMap[t.category_id].transaction_count += 1;
      totalExpense += t.amount;
    }
  });

  budgets.forEach(b => {
    if(catsMap[b.category_id]) {
      catsMap[b.category_id].budget_limit = b.amount_limit;
    }
  });

  const result = Object.values(catsMap).sort((a,b) => b.total - a.total).map(c => {
    const percentage = totalExpense > 0 ? parseFloat((c.total / totalExpense * 100).toFixed(2)) : 0;
    const budget_used_pct = c.budget_limit ? parseFloat((c.total / c.budget_limit * 100).toFixed(1)) : null;
    return { ...c, percentage, budget_used_pct };
  });

  res.json(result);
});

/**
 * Retorna o histórico de gastos diários do mês para gráfico de linha.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getDailySpending = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const now = new Date();
  const month = parseInt(req.query.month) || now.getMonth() + 1;
  const year = parseInt(req.query.year) || now.getFullYear();
  const lastDay = new Date(year, month, 0).getDate();
  const { startDate, endDate } = getMonthRange(month, year);

  const tx = await prisma.transactions.findMany({
    where: { user_id: userId, type: 'expense', date: { gte: startDate, lte: endDate + 'T23:59:59' } }
  });

  const spendMap = {};
  tx.forEach(t => {
    const day = parseInt(t.date.slice(8, 10)); // YYYY-MM-DD
    spendMap[day] = (spendMap[day] || 0) + t.amount;
  });

  const data = [];
  for (let d = 1; d <= lastDay; d++) {
    data.push({ day: d, total: spendMap[d] || 0 });
  }

  res.json(data);
});

module.exports = { getSummary, getCashflow, getByCategory, getDailySpending };
