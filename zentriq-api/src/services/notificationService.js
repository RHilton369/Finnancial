const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const { getMonthRange } = require('../utils/dateHelpers');

/**
 * Varre os orçamentos e cartões do usuário para gerar alertas automáticos.
 * Pode ser chamado no login ou em um endpoint de sync.
 * @param {string} userId 
 */
const generateAutomaticAlerts = async (userId) => {
  try {
    // Limpar notificações antigas corrompidas com valor padrão inválido
    await prisma.notifications.deleteMany({
      where: {
        user_id: userId,
        OR: [
          { created_at: null },
          { created_at: "" },
          { created_at: "datetime('now')" }
        ]
      }
    });

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const { startDate, endDate } = getMonthRange(month, year);

    // 1. Verificar Orçamentos (Budgets)
    const budgets = await prisma.budgets.findMany({
      where: { user_id: userId, month, year },
      include: { categories: true }
    });

    for (const budget of budgets) {
      // Buscar gastos dessa categoria
      const txs = await prisma.transactions.findMany({
        where: {
          user_id: userId,
          category_id: budget.category_id,
          type: 'expense',
          date: { gte: startDate, lte: endDate + 'T23:59:59' }
        }
      });
      const spent = txs.reduce((acc, t) => acc + t.amount, 0);
      const limit = budget.amount_limit;
      const pct = (spent / limit) * 100;

      if (pct >= 80) {
        // Verifica se já existe uma notificação parecida gerada hoje
        const todayStr = new Date().toISOString().split('T')[0];
        const existing = await prisma.notifications.findFirst({
          where: {
            user_id: userId,
            type: 'budget_alert',
            created_at: { startsWith: todayStr },
            message: { contains: budget.categories?.name }
          }
        });

        if (!existing) {
          await prisma.notifications.create({
            data: {
              user_id: userId,
              title: pct >= 100 ? 'Orçamento Estourado!' : 'Orçamento em Risco!',
              message: `Atenção: Você já usou ${pct.toFixed(0)}% do orçamento de ${budget.categories?.name}.`,
              type: 'budget_alert',
              created_at: new Date().toISOString()
            }
          });
        }
      }
    }

    // 2. Verificar Faturas de Cartão de Crédito
    const cards = await prisma.accounts.findMany({
      where: { user_id: userId, type: 'credit' }
    });

    const currentDay = now.getDate();
    for (const card of cards) {
      if (card.due_day) {
        let diff = card.due_day - currentDay;
        // Lógica simplificada de dias até o vencimento no mês atual
        if (diff > 0 && diff <= 3) {
           const todayStr = new Date().toISOString().split('T')[0];
           const existing = await prisma.notifications.findFirst({
             where: {
               user_id: userId,
               type: 'bill_alert',
               created_at: { startsWith: todayStr },
               message: { contains: card.name }
             }
           });
           
           if (!existing) {
             await prisma.notifications.create({
               data: {
                 user_id: userId,
                 title: 'Fatura Vencendo',
                 message: `A fatura do cartão ${card.name} vence em ${diff} dia(s)!`,
                 type: 'bill_alert',
                 created_at: new Date().toISOString()
               }
             });
           }
        }
      }
    }
  } catch (err) {
    logger.error({ err, userId }, 'Erro ao gerar notificações automáticas');
  }
};

module.exports = { generateAutomaticAlerts };
