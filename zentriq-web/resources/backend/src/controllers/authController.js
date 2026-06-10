const bcrypt = require('bcryptjs');
const { signToken, signRefresh, verifyRefresh } = require('../config/jwt');
const { prisma } = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const { seedUserData } = require('../utils/seeds');
const logger = require('../utils/logger');

/**
 * Registra um novo usuário no sistema.
 * Realiza o hash da senha, cria o usuário, inicializa dados padrão (seed)
 * e gera tokens de acesso.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se o email já estiver cadastrado.
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, monthly_income } = req.body;

  const existing = await User.findByEmail(email);
  if (existing) {
    logger.warn({ email }, 'Tentativa de registro com email já existente');
    throw new AppError('Email já cadastrado', 409, 'EMAIL_EXISTS');
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash: hash, monthlyIncome: monthly_income || 0 });

  // Seed default data (categorias, contas padrão, etc)
  await seedUserData(user.id);
  logger.info({ userId: user.id }, 'Novo usuário registrado e dados semeados');

  const userRecord = await User.findById(user.id);
  const access_token = signToken(user.id);
  const refresh_token = signRefresh(user.id);

  // Expiração em 7 dias para o refresh token
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await prisma.refresh_tokens.create({
    data: {
      user_id: user.id,
      token: refresh_token,
      expires_at: expiresAt
    }
  });

  res.status(201).json({
    user: { id: userRecord.id, name: userRecord.name, email: userRecord.email },
    access_token,
    refresh_token
  });
});

/**
 * Realiza a autenticação do usuário.
 * Verifica as credenciais e retorna tokens de login.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se as credenciais forem inválidas.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    logger.warn({ email }, 'Tentativa de login: Usuário não encontrado');
    throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    logger.warn({ email }, 'Tentativa de login: Senha incorreta');
    throw new AppError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
  }

  // Limpa tokens antigos antes de criar novo login
  await prisma.refresh_tokens.deleteMany({
    where: { user_id: user.id }
  });

  const access_token = signToken(user.id);
  const refresh_token = signRefresh(user.id);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await prisma.refresh_tokens.create({
    data: {
      user_id: user.id,
      token: refresh_token,
      expires_at: expiresAt
    }
  });

  logger.info({ userId: user.id }, 'Usuário autenticado com sucesso');

  res.status(200).json({
    user: { id: user.id, name: user.name, email: user.email, monthly_income: user.monthly_income },
    access_token,
    refresh_token
  });
});

/**
 * Atualiza o access_token utilizando um refresh_token válido.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @throws {AppError} Se o token for inválido ou estiver expirado.
 */
const refresh = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  const tokenObj = await prisma.refresh_tokens.findUnique({
    where: { token: refresh_token }
  });

  if (!tokenObj) {
    logger.warn('Refresh token não encontrado no banco');
    throw new AppError('Token inválido', 401, 'INVALID_TOKEN');
  }

  if (new Date(tokenObj.expires_at) < new Date()) {
    await prisma.refresh_tokens.delete({ where: { id: tokenObj.id } });
    logger.warn({ userId: tokenObj.user_id }, 'Refresh token expirado');
    throw new AppError('Token expirado', 401, 'INVALID_TOKEN');
  }

  // Validação da assinatura JWT
  verifyRefresh(refresh_token);

  const access_token = signToken(tokenObj.user_id);
  logger.debug({ userId: tokenObj.user_id }, 'Access token renovado');

  res.status(200).json({ access_token });
});

/**
 * Encerra a sessão do usuário removendo o refresh token do banco.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const logout = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  
  try {
    const deleted = await prisma.refresh_tokens.delete({
      where: { token: refresh_token }
    });
    logger.info({ userId: deleted.user_id }, 'Usuário deslogado');
  } catch (err) {
    // Silencioso caso o token já não exista
    logger.debug('Logout solicitado para token inexistente');
  }
  
  res.status(204).send();
});

module.exports = { register, login, refresh, logout };
