const { prisma } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { generateChatResponse } = require('../services/chatService');

/**
 * Retorna o histórico de conversas do usuário (últimas 50 mensagens).
 */
const list = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const messages = await prisma.chat_messages.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
    take: 50
  });

  res.json(messages);
});

/**
 * Recebe a pergunta do usuário, processa e retorna a resposta do assistente.
 */
const sendMessage = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new AppError('A mensagem é obrigatória e deve ser um texto válido.', 400, 'INVALID_MESSAGE');
  }

  const cleanMessage = message.trim();

  // 1. Salvar a mensagem do usuário no banco
  const userMsg = await prisma.chat_messages.create({
    data: {
      user_id: userId,
      sender: 'user',
      text: cleanMessage,
      created_at: new Date().toISOString()
    }
  });

  // 2. Obter a resposta do assistente (motor offline ou Gemini)
  const assistantReply = await generateChatResponse(userId, cleanMessage);

  // 3. Salvar a resposta do assistente no banco
  const assistantMsg = await prisma.chat_messages.create({
    data: {
      user_id: userId,
      sender: 'assistant',
      text: assistantReply,
      created_at: new Date().toISOString()
    }
  });

  res.status(201).json({
    userMessage: userMsg,
    assistantMessage: assistantMsg
  });
});

/**
 * Apaga permanentemente todo o histórico de mensagens do chat do usuário.
 */
const clear = asyncHandler(async (req, res) => {
  const userId = req.userId;

  await prisma.chat_messages.deleteMany({
    where: { user_id: userId }
  });

  res.status(204).send();
});

module.exports = {
  list,
  sendMessage,
  clear
};
