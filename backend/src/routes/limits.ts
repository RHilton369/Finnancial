import type { FastifyInstance } from "fastify";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { createLimitSchema } from "../schemas";

export async function limitRoutes(server: FastifyInstance) {
  // --- Limites de Orçamento ---

  server.get("/limits", async (request, reply) => {
    try {
      const limits = await prisma.budgetLimit.findMany({
        include: { category: true },
      });
      return limits;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao buscar limites", error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: errorMessage });
    }
  });

  server.post("/limits", async (request, reply) => {
    const parsed = createLimitSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Validação falhou",
        details: parsed.error.errors,
      });
    }

    try {
      const user = await prisma.user.findFirst();
      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      const limit = await prisma.budgetLimit.upsert({
        where: {
          categoryId_userId: {
            categoryId: parsed.data.categoryId,
            userId: user.id,
          },
        },
        update: {
          amount: parsed.data.amount,
          period: parsed.data.period,
        },
        create: {
          amount: parsed.data.amount,
          period: parsed.data.period,
          categoryId: parsed.data.categoryId,
          userId: user.id,
        },
      });

      logger.info({ msg: "Limite configurado", categoryId: parsed.data.categoryId, traceId: request.id });
      return limit;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao salvar limite", error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: errorMessage });
    }
  });

  server.delete("/limits/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.budgetLimit.delete({ where: { id } });
      logger.info({ msg: "Limite removido", id, traceId: request.id });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao excluir limite", id, error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: errorMessage });
    }
  });

  // --- Logs de Mensagens ---

  server.get("/message-logs", async (request, reply) => {
    try {
      const logs = await prisma.messageLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return logs;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao buscar logs", error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: errorMessage });
    }
  });
}
