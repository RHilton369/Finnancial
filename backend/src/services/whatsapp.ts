import { logger } from "../utils/logger";

/**
 * Service mockado/abstrato para integração com o WhatsApp.
 * Futuramente, aqui irá a lógica do Axios para bater na API Oficial da Meta
 * (Graph API) ou a injeção da biblioteca Baileys.
 */

export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  try {
    // Fail fast
    if (!to || !text) {
      throw new Error("Parâmetros 'to' e 'text' são obrigatórios para envio.");
    }

    // TODO: Implementar chamada HTTP real (ex: Meta Cloud API)
    logger.info({
      msg: "Mensagem simulada enviada ao WhatsApp",
      to,
      textPreview: text.substring(0, 50),
    });

    return true;
  } catch (error: any) {
    logger.error({
      msg: "Erro ao enviar mensagem no WhatsApp",
      error: error.message,
      to,
    });
    return false;
  }
}
