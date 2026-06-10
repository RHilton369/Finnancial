const logger = require('../utils/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
function initDatabase() {
  logger.info('Prisma ORM inicializado.');
  return prisma;
}

function getDb() {
  return prisma;
}

module.exports = { initDatabase, getDb, prisma };
