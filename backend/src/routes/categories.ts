import type { FastifyInstance } from "fastify";
import { logger } from "../utils/logger";
import { prisma } from "../utils/prisma";
import { createCategorySchema, updateCategorySchema } from "../schemas";

export async function categoryRoutes(server: FastifyInstance) {
  server.get("/categories", async (request, reply) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });
      return categories;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao buscar categorias", error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: errorMessage });
    }
  });

  server.post("/categories", async (request, reply) => {
    const parsed = createCategorySchema.safeParse(request.body);
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

      const category = await prisma.category.create({
        data: {
          name: parsed.data.name,
          color: parsed.data.color,
          userId: user.id,
        },
      });

      logger.info({ msg: "Categoria criada", name: parsed.data.name, traceId: request.id });
      return category;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao criar categoria", error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: errorMessage });
    }
  });

  server.patch("/categories/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const parsed = updateCategorySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        statusCode: 400,
        error: "Validação falhou",
        details: parsed.error.errors,
      });
    }

    try {
      const updated = await prisma.category.update({
        where: { id },
        data: { name: parsed.data.name, color: parsed.data.color },
      });

      logger.info({ msg: "Categoria atualizada", id, traceId: request.id });
      return updated;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao atualizar categoria", id, error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: errorMessage });
    }
  });

  server.delete("/categories/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      await prisma.category.delete({ where: { id } });
      logger.info({ msg: "Categoria excluída", id, traceId: request.id });
      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      logger.error({ msg: "Falha ao excluir categoria", id, error: errorMessage, traceId: request.id });
      return reply.status(500).send({ error: errorMessage });
    }
  });
}
