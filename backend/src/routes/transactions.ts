import type { FastifyInstance } from "fastify";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { updateTransactionSchema } from "../schemas";

export async function transactionRoutes(server: FastifyInstance) {
  server.delete("/transactions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.transaction.delete({ where: { id } });
      logger.info({ msg: "Transação excluída com sucesso", id, traceId: request.id });
      return reply.status(200).send({ success: true });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao excluir transação", id, error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: "Falha ao excluir transação" });
    }
  });

  server.patch("/transactions/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    // Sanitização via Zod antes de tocar no banco
    const parsed = updateTransactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Validação falhou",
        details: parsed.error.errors,
      });
    }

    const { description, amount, type, date, categoryId } = parsed.data;

    try {
      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          description,
          amount,
          type,
          date: date ? new Date(date) : undefined,
          categoryId,
        },
      });

      logger.info({ msg: "Transação atualizada com sucesso", id, traceId: request.id });
      return reply.status(200).send({ success: true, transaction: updated });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao atualizar transação", id, error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: "Falha ao atualizar transação" });
    }
  });
}
