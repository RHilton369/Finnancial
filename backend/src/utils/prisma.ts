import { PrismaClient } from "@prisma/client";
import "dotenv/config";

// Usamos o PrismaClient nativo sem adaptadores para máxima estabilidade e performance de memória.
// O pool de conexões é gerenciado internamente pelo Prisma através da DATABASE_URL.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});
