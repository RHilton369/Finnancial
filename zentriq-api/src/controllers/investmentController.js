const { prisma } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { syncQuotesForUser } = require('../services/investmentService');

/**
 * Retorna todos os investimentos do usuário e o balanço consolidado da carteira.
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const listInvestments = await prisma.investments.findMany({
    where: { user_id: userId },
    orderBy: { purchase_date: 'desc' }
  });

  // Calcular consolidados da carteira
  let totalInvested = 0;
  let totalCurrent = 0;

  for (const inv of listInvestments) {
    totalInvested += inv.invested_amount;
    totalCurrent += inv.current_amount;
  }

  const profit = totalCurrent - totalInvested;
  const roi = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  res.json({
    summary: {
      total_invested: totalInvested,
      total_current: totalCurrent,
      profit: profit,
      roi: roi
    },
    investments: listInvestments
  });
});

/**
 * Cria um novo investimento e inicia o histórico mensal correspondente.
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { name, type, ticker, quantity, institution, invested_amount, current_amount, purchase_date } = req.body;

  const finalCurrent = current_amount !== undefined ? current_amount : invested_amount;
  const dateObj = new Date(purchase_date);
  const purchaseMonthStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

  const newInvestment = await prisma.$transaction(async (tx) => {
    // 1. Criar o ativo
    const inv = await tx.investments.create({
      data: {
        user_id: userId,
        name: name.trim(),
        type,
        ticker: ticker ? ticker.trim().toUpperCase() : null,
        quantity: quantity !== undefined && quantity !== null ? parseFloat(quantity) : null,
        institution: institution.trim(),
        invested_amount,
        current_amount: finalCurrent,
        purchase_date,
        created_at: new Date().toISOString()
      }
    });

    // 2. Criar o primeiro registro de histórico para o mês da compra
    await tx.investment_history.create({
      data: {
        user_id: userId,
        investment_id: inv.id,
        date: purchaseMonthStr,
        invested_val: invested_amount,
        current_val: finalCurrent,
        created_at: new Date().toISOString()
      }
    });

    return inv;
  });

  res.status(201).json(newInvestment);
});

const update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { name, type, ticker, quantity, institution, invested_amount, current_amount, purchase_date } = req.body;

  const investment = await prisma.investments.findUnique({ where: { id } });
  if (!investment || investment.user_id !== userId) {
    throw new AppError('Investimento não encontrado', 404, 'NOT_FOUND');
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name.trim();
  if (type !== undefined) updateData.type = type;
  if (ticker !== undefined) updateData.ticker = ticker ? ticker.trim().toUpperCase() : null;
  if (quantity !== undefined) updateData.quantity = quantity !== null ? parseFloat(quantity) : null;
  if (institution !== undefined) updateData.institution = institution.trim();
  if (purchase_date !== undefined) updateData.purchase_date = purchase_date;
  if (invested_amount !== undefined) updateData.invested_amount = invested_amount;
  if (current_amount !== undefined) updateData.current_amount = current_amount;

  updateData.updated_at = new Date().toISOString();

  const updated = await prisma.$transaction(async (tx) => {
    const inv = await tx.investments.update({
      where: { id },
      data: updateData
    });

    // Se o valor investido, valor atual ou a data de compra mudou, atualiza o histórico inicial para manter consistência
    if (invested_amount !== undefined || current_amount !== undefined || purchase_date !== undefined) {
      const firstHistory = await tx.investment_history.findFirst({
        where: { investment_id: id },
        orderBy: { date: 'asc' }
      });

      if (firstHistory) {
        const historyUpdate = {};
        if (invested_amount !== undefined) {
          historyUpdate.invested_val = invested_amount;
          if (firstHistory.current_val === firstHistory.invested_val) {
            historyUpdate.current_val = current_amount !== undefined ? current_amount : invested_amount;
          }
        }
        if (current_amount !== undefined) {
          historyUpdate.current_val = current_amount;
        }
        if (purchase_date !== undefined) {
          const dateObj = new Date(purchase_date);
          historyUpdate.date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        }

        await tx.investment_history.update({
          where: { id: firstHistory.id },
          data: historyUpdate
        });
      }
    }

    return inv;
  });

  res.json(updated);
});

/**
 * Exclui permanentemente um investimento e seu histórico em cascata.
 */
const remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  const investment = await prisma.investments.findUnique({ where: { id } });
  if (!investment || investment.user_id !== userId) {
    throw new AppError('Investimento não encontrado', 404, 'NOT_FOUND');
  }

  // Deletar usando transação do Prisma para garantir integridade física
  await prisma.$transaction(async (tx) => {
    // Apagar o histórico primeiro (Cascade manual caso o Prisma exija no Mongo, embora tenhamos configurado no schema)
    await tx.investment_history.deleteMany({ where: { investment_id: id } });
    await tx.investments.delete({ where: { id } });
  });

  res.status(204).send();
});

/**
 * Adiciona uma valorização manual ou aporte adicional ao ativo.
 */
const addValuation = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { invested_val = 0, current_val, date } = req.body;

  const investment = await prisma.investments.findUnique({ where: { id } });
  if (!investment || investment.user_id !== userId) {
    throw new AppError('Investimento não encontrado', 404, 'NOT_FOUND');
  }

  const today = new Date();
  const currentMonthStr = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Atualizar saldo no investimento
    const newInvested = investment.invested_amount + invested_val;
    const inv = await tx.investments.update({
      where: { id },
      data: {
        invested_amount: newInvested,
        current_amount: current_val,
        updated_at: today.toISOString()
      }
    });

    // 2. Salvar snapshot mensal no histórico
    const existingHistory = await tx.investment_history.findFirst({
      where: {
        investment_id: id,
        date: currentMonthStr
      }
    });

    if (existingHistory) {
      await tx.investment_history.update({
        where: { id: existingHistory.id },
        data: {
          invested_val: newInvested,
          current_val: current_val,
          created_at: today.toISOString()
        }
      });
    } else {
      await tx.investment_history.create({
        data: {
          user_id: userId,
          investment_id: id,
          date: currentMonthStr,
          invested_val: newInvested,
          current_val: current_val,
          created_at: today.toISOString()
        }
      });
    }

    return inv;
  });

  res.json(updated);
});

/**
 * Aciona o microsserviço de sincronização de cotações automáticas da Brapi.
 */
const syncQuotes = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const result = await syncQuotesForUser(userId);
  if (!result.success) {
    throw new AppError(result.message, 400, 'QUOTE_SYNC_ERROR');
  }
  res.json(result);
});

/**
 * Retorna o histórico consolidado mensal de saldo investido vs. saldo atual de toda a carteira.
 */
const getHistory = asyncHandler(async (req, res) => {
  const userId = req.userId;

  // Buscar todos os registros do histórico do usuário
  const histories = await prisma.investment_history.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' }
  });

  // Agrupar e somar por mês
  const monthlyTotals = {};

  for (const h of histories) {
    if (!monthlyTotals[h.date]) {
      monthlyTotals[h.date] = {
        date: h.date, // Formato "YYYY-MM"
        invested: 0,
        current: 0
      };
    }
    monthlyTotals[h.date].invested += h.invested_val;
    monthlyTotals[h.date].current += h.current_val;
  }

  // Converter para array ordenado
  const sortedHistory = Object.values(monthlyTotals).sort((a, b) => a.date.localeCompare(b.date));

  res.json(sortedHistory);
});

module.exports = {
  list,
  create,
  update,
  remove,
  addValuation,
  syncQuotes,
  getHistory
};
