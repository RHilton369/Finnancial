import type { FastifyInstance } from "fastify";
import { logger } from "../utils/logger";
import { extractFinancialData } from "../services/openai";
import { sendWhatsAppMessage } from "../services/whatsapp";
import { prisma } from "../utils/prisma";

/** Cache de deduplicação — evita processar a mesma mensagem duas vezes */
const processedMessages = new Set<string>();

/** Adapta payloads de diferentes provedores (Evolution API v2, Twilio) para formato interno */
const parseWebhookPayload = (body: any) => {
  if (body?.data?.message) {
    const message = body.data.message;
    const text =
      message.conversation ||
      message.extendedTextMessage?.text ||
      message.imageMessage?.caption ||
      "";
    const from = body.data.key?.remoteJid?.split("@")[0] || "";
    const isImage = !!message.imageMessage;
    return { text, from, isImage, instance: body.instance };
  }

  if (body?.Body && body?.From) {
    return {
      text: body.Body,
      from: body.From.replace("whatsapp:", ""),
      isImage: false,
      instance: null,
    };
  }

  return null;
};

/** Busca a imagem em Base64 na Evolution API para processamento via Vision */
const getMediaBase64 = async (
  instance: string,
  messageKeyId: string
): Promise<string | null> => {
  const apiUrl = process.env.EVOLUTION_API_URL || "http://localhost:8080";
  const apiKey = process.env.EVOLUTION_API_KEY;

  try {
    const response = await fetch(
      `${apiUrl}/chat/getBase64FromMediaMessage/${instance}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey || "",
        },
        body: JSON.stringify({ message: { key: { id: messageKeyId } } }),
      }
    );
    const data = (await response.json()) as { base64?: string };
    return data.base64 || null;
  } catch (error) {
    logger.error({ msg: "Erro ao buscar base64 da mídia", error });
    return null;
  }
};

export async function webhookRoutes(server: FastifyInstance) {
  server.post("/webhook", async (request, reply) => {
    const body = request.body as Record<string, unknown>;
    const messageId =
      (body?.data as any)?.key?.id || (request.id as string);
    const allowedNumbers = (process.env.ALLOWED_NUMBERS || "").split(",");

    if (processedMessages.has(messageId)) {
      logger.info({
        msg: "Mensagem duplicada ignorada",
        messageId,
        traceId: request.id,
      });
      return reply.status(200).send({ success: true, duplicated: true });
    }

    const payload = parseWebhookPayload(request.body);

    if (!payload || !payload.from) {
      logger.warn({
        msg: "Payload de webhook não reconhecido",
        traceId: request.id,
      });
      return reply
        .status(400)
        .send({ error: "Payload inválido ou não suportado." });
    }

    const { text, from, isImage, instance } = payload;

    if (!allowedNumbers.includes(from)) {
      logger.warn({
        msg: "Tentativa de registro por número não autorizado",
        from,
        traceId: request.id,
      });
      return reply
        .status(403)
        .send({ error: "Número não autorizado para registros." });
    }

    processedMessages.add(messageId);
    setTimeout(() => processedMessages.delete(messageId), 5 * 60 * 1000);

    logger.info({
      msg: isImage
        ? "Iniciando processamento de IMAGEM via IA"
        : "Iniciando processamento de MENSAGEM via IA",
      from,
      traceId: request.id,
    });

    try {
      let base64Image: string | undefined;
      if (isImage && instance) {
        base64Image =
          (await getMediaBase64(instance, messageId)) ?? undefined;
      }

      const financeData = await extractFinancialData(text, base64Image);

      let user = await prisma.user.findUnique({ where: { phone: from } });
      if (!user) {
        user = await prisma.user.create({
          data: { phone: from, name: "Usuário via WhatsApp" },
        });
      }

      let category = await prisma.category.findUnique({
        where: { name_userId: { name: financeData.categoria, userId: user.id } },
      });
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: financeData.categoria,
            userId: user.id,
            color: "#3b82f6",
          },
        });
      }

      const transaction = await prisma.transaction.create({
        data: {
          amount: financeData.valor,
          type: financeData.tipo === "receita" ? "INCOME" : "EXPENSE",
          description: financeData.descricao,
          categoryId: category.id,
          userId: user.id,
        },
      });

      const confirmationMsg = `✅ Registro Confirmado!\n\nTipo: ${financeData.tipo}\nValor: R$ ${financeData.valor.toFixed(2)}\nCategoria: ${financeData.categoria}\nDescrição: ${financeData.descricao}\n\nGestão FinanZen.`;

      await prisma.messageLog.create({
        data: {
          from,
          text: text || (isImage ? "[Imagem]" : ""),
          response: confirmationMsg,
          isImage,
          status: "PROCESSED",
          userId: user.id,
        },
      });

      await sendWhatsAppMessage(from, confirmationMsg);
      return reply
        .status(200)
        .send({ success: true, financeData, transactionId: transaction.id });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";

      logger.error({
        msg: "Falha na pipeline do Webhook",
        error: errorMessage,
        traceId: request.id,
      });

      // Registra falha no log — nunca silenciar exceções
      try {
        await prisma.messageLog.create({
          data: {
            from,
            text: text || (isImage ? "[Imagem]" : ""),
            response: "Falha no processamento",
            isImage,
            status: "FAILED",
          },
        });
      } catch (logError) {
        logger.error({
          msg: "Falha ao registrar log de erro",
          error: logError instanceof Error ? logError.message : "Desconhecido",
          traceId: request.id,
        });
      }

      await sendWhatsAppMessage(
        from,
        "Desculpe, não consegui compreender sua mensagem. Pode tentar novamente informando o valor e o que foi?"
      );
      return reply
        .status(500)
        .send({ error: "Falha ao processar mensagem" });
    }
  });
}
