const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const Recurring = require('../models/Recurring');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const logger = require('../utils/logger');

/**
 * Lista todas as assinaturas ou transações recorrentes do usuário.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const recurrences = await Recurring.findAll(userId);
  res.json(recurrences);
});

/**
 * Cria uma nova configuração de transação recorrente.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { account_id, category_id, type, amount, description, frequency, start_date, end_date, next_due_date } = req.body;

  const { prisma } = require('../config/database');

  const rec = await prisma.$transaction(async (tx) => {
    return await Recurring.create({
      userId, accountId: account_id, categoryId: category_id || null, type, amount,
      description, frequency, startDate: start_date, endDate: end_date,
      nextDueDate: next_due_date || start_date
    }, tx);
  });

  logger.info({ userId, recId: rec.id }, 'Nova recorrência configurada (Atomic)');
  res.status(201).json(rec);
});

/**
 * Atualiza os parâmetros de uma recorrência existente.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se a recorrência não for encontrada.
 */
const update = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const recId = req.params.id;

  const { prisma } = require('../config/database');

  const updated = await prisma.$transaction(async (tx) => {
    const rec = await Recurring.findById(recId, tx);
    if (!rec || rec.user_id !== userId) {
      logger.warn({ userId, recId }, 'Tentativa de atualização: Recorrência inválida');
      throw new AppError('Recorrência não encontrada', 404, 'NOT_FOUND');
    }

    return await Recurring.update(recId, { ...req.body }, tx);
  });

  logger.info({ userId, recId }, 'Recorrência atualizada (Atomic)');
  res.json(updated);
});

/**
 * Remove permanentemente uma configuração de recorrência.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const remove = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const recId = req.params.id;

  const { prisma } = require('../config/database');

  await prisma.$transaction(async (tx) => {
    const rec = await Recurring.findById(recId, tx);
    if (!rec || rec.user_id !== userId) {
      logger.warn({ userId, recId }, 'Tentativa de remoção: Recorrência inválida');
      throw new AppError('Recorrência não encontrada', 404, 'NOT_FOUND');
    }

    await Recurring.remove(recId, tx);
  });

  logger.info({ userId, recId }, 'Recorrência removida (Atomic)');
  res.status(204).send();
});

/**
 * Processa todas as recorrências agendadas para hoje.
 * Cria as transações reais e agenda a próxima data de cobrança.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const processRecurring = asyncHandler(async (req, res) => {
  const dueItems = await Recurring.findDueToday();
  const created = [];

  logger.info({ count: dueItems.length }, 'Iniciando processamento de recorrências');

  for (const item of dueItems) {
    try {
      const { prisma } = require('../config/database');
      
      // Processa cada item dentro de uma transação interativa atômica
      const result = await prisma.$transaction(async (tx) => {
        // 1. Cria a transação real a partir da recorrência
        const newTx = await Transaction.create({
          userId: item.user_id, accountId: item.account_id, categoryId: item.category_id, type: item.type, amount: item.amount,
          description: item.description, date: item.next_due_date, notes: null, recurringId: item.id
        }, tx);

        // 2. Atualiza o saldo da conta
        const delta = item.type === 'income' ? item.amount : -item.amount;
        await Account.updateBalance(item.account_id, delta, tx);

        // 3. Calcula a próxima incidência
        const nextDue = Recurring.calcNextDue(item.next_due_date, item.frequency);

        // 4. Verifica se atingiu a data final
        if (item.end_date && new Date(nextDue) > new Date(item.end_date)) {
          await Recurring.deactivate(item.id, tx);
          logger.info({ recId: item.id }, 'Recorrência finalizada por data de término');
        } else {
          await Recurring.updateNextDueDate(item.id, nextDue, tx);
        }

        return { ...item, next_due_date: nextDue };
      });

      created.push(result);
    } catch (err) {
      logger.error({ err: err.message, recId: item.id }, 'Erro ao processar item recorrente específico (Transaction Failed)');
    }
  }

  logger.info({ processed: created.length }, 'Processamento de recorrências concluído');
  res.json({ processed: created.length, transactions: created });
});

module.exports = { list, create, update, remove, processRecurring };
