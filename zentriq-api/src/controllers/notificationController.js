const { prisma } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { generateAutomaticAlerts } = require('../services/notificationService');

/**
 * Lista as notificações do usuário, ordenadas das mais recentes para as mais antigas.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const notifications = await prisma.notifications.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: 20 // Limita as últimas 20 para não pesar
  });
  res.json(notifications);
});

/**
 * Marca uma notificação como lida.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const id = req.params.id;

  const notification = await prisma.notifications.findUnique({ where: { id } });
  if (!notification || notification.user_id !== userId) {
    throw new AppError('Notificação não encontrada', 404, 'NOT_FOUND');
  }

  const updated = await prisma.notifications.update({
    where: { id },
    data: { is_read: 1 }
  });

  res.json(updated);
});

/**
 * Marca todas as notificações como lidas.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId;
  await prisma.notifications.updateMany({
    where: { user_id: userId, is_read: 0 },
    data: { is_read: 1 }
  });
  res.status(204).send();
});

/**
 * Roda o motor de sync para gerar alertas automáticos.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const sync = asyncHandler(async (req, res) => {
  const userId = req.userId;
  await generateAutomaticAlerts(userId);
  res.status(200).json({ message: 'Sync concluído' });
});

module.exports = { list, markAsRead, markAllAsRead, sync };
