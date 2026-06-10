/**
 * Middleware utilitário para capturar exceções em rotas assíncronas do Express.
 * Evita o uso repetitivo de blocos try/catch e repassa erros para o logger global.
 * 
 * @param {Function} fn - Função assíncrona da rota.
 * @returns {Function} Função middleware do Express.
 */
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
