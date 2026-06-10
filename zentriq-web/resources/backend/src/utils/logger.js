/**
 * ============================================================================
 * ZENTRIQ API - LOGGER ESTRUTURADO
 * ============================================================================
 * Utiliza a biblioteca 'pino' para fornecer logs em formato JSON, facilitando
 * a observabilidade e monitoramento. Em ambiente de desenvolvimento, utiliza
 * 'pino-pretty' para melhor legibilidade no terminal.
 * 
 * Quando empacotado via pkg, o transport (pino-pretty) é desabilitado porque
 * o thread-stream utilizado internamente não funciona dentro do snapshot virtual.
 * 
 * Regra Global: Nunca utilizar console.log() puro.
 */

const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';
const isPkg = !!process.pkg;

/** @type {import('pino').LoggerOptions} */
const loggerOptions = {
  // Nível de log (DEBUG, INFO, WARN, ERROR)
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  
  // Metadados básicos omitidos em dev para reduzir ruído
  base: isDev ? undefined : { 
    env: process.env.NODE_ENV,
    app: 'zentriq-api'
  },
  
  // Formatadores personalizados se necessário
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  
  // Timestamp em formato ISO
  timestamp: pino.stdTimeFunctions.isoTime,
};

// pino-pretty usa worker threads (thread-stream), incompatível com pkg
if (isDev && !isPkg) {
  loggerOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

const logger = pino(loggerOptions);

module.exports = logger;
