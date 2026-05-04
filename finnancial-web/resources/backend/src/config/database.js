const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');

// Quando empacotado via pkg, o Prisma não encontra o query engine dentro do snapshot virtual.
// Apontamos manualmente para o binário nativo que fica ao lado do servidor-interno.exe.
if (process.pkg) {
  const enginePath = require('path').join(
    require('path').dirname(process.execPath),
    'query_engine-windows.dll.node'
  );
  process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
}

const prisma = new PrismaClient();
function initDatabase() {
  logger.info('Prisma ORM inicializado.');
  return prisma;
}

function getDb() {
  return prisma;
}

module.exports = { initDatabase, getDb, prisma };
