const { ZodError } = require('zod');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Middleware global de tratamento de erros do Express.
 * Captura erros operacionais (AppError), erros de validação (ZodError) 
 * e erros inesperados, formatando a resposta JSON e registrando logs estruturados.
 * 
 * @param {Error|AppError|ZodError} err 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
function errorHandler(err, req, res, next) {
  // Erros operacionais conhecidos
  if (err instanceof AppError) {
    logger.warn({ code: err.code, message: err.message, path: req.path }, 'Erro operacional capturado');
    return res.status(err.statusCode).json({
      error: true,
      code: err.code,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString()
    });
  }

  // Erros de validação de schema (Zod)
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    logger.warn({ details, path: req.path }, 'Falha de validação de schema');
    return res.status(400).json({
      error: true,
      code: 'VALIDATION_ERROR',
      message: 'Dados inválidos',
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Erros inesperados (Críticos)
  logger.error({ 
    message: err.message, 
    stack: err.stack, 
    path: req.path,
    method: req.method 
  }, 'Erro crítico não tratado');

  return res.status(500).json({
    error: true,
    code: 'INTERNAL_ERROR',
    message: 'Erro interno do servidor',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
