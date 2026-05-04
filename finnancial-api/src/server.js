/**
 * ============================================================================
 * FINNANCIAL API - ARQUIVO PRINCIPAL DO SERVIDOR (ENTRY POINT)
 * ============================================================================
 * Este arquivo é responsável por inicializar toda a aplicação backend.
 * Ele configura o servidor Express, os middlewares de segurança (Helmet, Cors),
 * carrega as variáveis de ambiente e gerencia o ciclo de vida do Prisma ORM.
 */

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');

// Carrega as variáveis definidas no .env na raiz do projeto
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

// Fallback de segurança para variáveis de ambiente (para funcionamento portátil via pkg)
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "mongodb+srv://rhtontab:G2817Wxy@rhilton.kanuxgl.mongodb.net/finnancial_db";
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "finnancial_secret_key_123_fallback";
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = "finnancial_refresh_key_456_fallback";
}

const logger = require('./utils/logger');
const { initDatabase, prisma } = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Configuração de caminhos para o motor do Prisma em modo portátil/instalado
if (process.pkg || process.resourcesPath) {
  const exeDir = path.dirname(process.execPath);
  const resourcesPath = process.resourcesPath || path.join(exeDir, 'resources');
  
  // Lista de possíveis caminhos para o motor do Prisma
  const possiblePaths = [
    path.join(resourcesPath, 'backend', 'query_engine-windows.dll.node'),
    path.join(exeDir, 'query_engine-windows.dll.node'),
    path.join(exeDir, 'backend', 'query_engine-windows.dll.node'),
    path.join(process.cwd(), 'query_engine-windows.dll.node')
  ];

  const fs = require('fs');
  let foundPath = possiblePaths.find(p => fs.existsSync(p));

  if (foundPath) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = foundPath;
    process.env.PRISMA_SCHEMA_ENGINE_BINARY = foundPath;
    logger.info(`Motor do Prisma localizado em: ${foundPath}`);
  } else {
    logger.warn('Aviso: Motor do Prisma não localizado nos caminhos esperados. O Prisma tentará o padrão.');
  }
}

/**
 * Função assíncrona principal que orquestra a inicialização da API.
 * Configura middlewares de segurança, rotas e tratamento de erros.
 * 
 * @returns {Promise<void>}
 */
async function main() {
  try {
    // 1. Inicializa a conexão com o banco de dados via Prisma
    await initDatabase();

    // 2. Cria a instância da aplicação Express
    const app = express();

    // 3. MIDDLEWARES DE SEGURANÇA E UTILITÁRIOS
    // Helmet: Adiciona cabeçalhos HTTP de proteção
    app.use(helmet());
    
    // Cors: Controle de acesso dinâmico para permitir file:// do Electron
    app.use(cors({
      origin: (origin, callback) => {
        callback(null, true);
      },
      credentials: true
    }));

    // Middleware de Log customizado (Pino) com Trace ID
    app.use((req, res, next) => {
      req.id = req.headers['x-request-id'] || crypto.randomUUID();
      res.setHeader('X-Request-Id', req.id);

      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info({
          trace_id: req.id,
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip
        }, 'Requisição processada');
      });
      next();
    });
    
    // Habilita conversão automática do corpo(body) da requisição para JSON
    app.use(express.json());

    // 4. ROTAS
    app.use('/api', routes);

    // 5. TRATAMENTO DE ERROS
    app.use(errorHandler);

    // 6. INICIALIZAÇÃO DO SERVIDOR (LISTEN)
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Finnancial API rodando em http://localhost:${PORT}`);
      logger.info(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

    // 7. GRACEFUL SHUTDOWN (Desligamento Gracioso)
    const shutdown = async (signal) => {
      logger.info(`\n⏳ Sinal ${signal} recebido. Encerrando servidor com segurança...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('✅ Banco de dados desconectado. Servidor encerrado.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (err) {
    logger.error({ err }, '❌ Erro fatal ao iniciar servidor');
    process.exit(1);
  }
}

// Invocação da função principal
main();
