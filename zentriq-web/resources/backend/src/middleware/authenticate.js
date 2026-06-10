const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Middleware para autenticação via JWT (JSON Web Token).
 * Valida o cabeçalho Authorization e extrai o sub do payload para anexar ao request.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @throws {AppError} Se o token estiver ausente, inválido ou expirado.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    logger.warn({ path: req.path }, 'Tentativa de acesso sem token');
    return next(new AppError('Token não fornecido', 401, 'NO_TOKEN'));
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Anexa o ID do usuário ao objeto de requisição para uso posterior
    req.userId = payload.sub;
    next();
  } catch (e) {
    logger.warn({ err: e.message, path: req.path }, 'Falha na validação do token');
    next(new AppError('Token inválido ou expirado', 401, 'INVALID_TOKEN'));
  }
}

module.exports = authenticate;
