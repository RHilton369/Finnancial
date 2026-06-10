/**
 * Classe customizada para tratamento de erros operacionais da aplicação.
 * Permite capturar falhas conhecidas com códigos semânticos e status HTTP.
 */
class AppError extends Error {
  /**
   * @param {string} message - Mensagem amigável do erro.
   * @param {number} statusCode - Código de status HTTP (ex: 400, 404, 500).
   * @param {string} code - Código interno de erro para o frontend (ex: 'NOT_FOUND').
   * @param {Array} [details=[]] - Detalhes adicionais (erros de validação, etc).
   */
  constructor(message, statusCode, code, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = AppError;
