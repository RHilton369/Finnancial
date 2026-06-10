/**
 * ============================================================================
 * ZENTRIQ API - LOGGER ESTRUTURADO
 * ============================================================================
 * Utiliza a biblioteca 'pino' para fornecer logs em formato JSON, facilitando
 * a observabilidade e monitoramento. Em ambiente de desenvolvimento, utiliza
 * 'pino-pretty' para melhor legibilidade no terminal.
 * 
 * Regra Global: Nunca utilizar console.log() puro.
 */

const pino = require('pino');

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  // Nível de log (DEBUG, INFO, WARN, ERROR)
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  
  // Metadados básicos omitidos em dev para reduzir ruído
  base: isDev ? undefined : { 
    env: process.env.NODE_ENV,
    app: 'zentriq-api'
  },
  
  // Configuração de transporte (Pretty Print em dev)
  transport: isDev ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  
  // Formatadores personalizados se necessário
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  
  // Timestamp em formato ISO
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;
