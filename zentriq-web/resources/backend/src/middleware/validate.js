const AppError = require('../utils/AppError');
const { ZodError } = require('zod');

/**
 * Middleware utilitário para validação de esquemas de dados utilizando a biblioteca Zod.
 * Valida o objeto de requisição (body, params, query) contra o schema fornecido.
 * 
 * @param {import('zod').ZodSchema} schema - Schema de validação Zod.
 * @returns {Function} Middleware do Express.
 * @throws {AppError} Se a validação do Zod falhar.
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return next(new AppError('Dados inválidos', 400, 'VALIDATION_ERROR', details));
      }
      next(err);
    }
  };
}

module.exports = validate;
