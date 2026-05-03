import "dotenv/config";
import OpenAI from "openai";
import { logger } from "../utils/logger";

export interface FinancialExtractionResult {
  tipo: "receita" | "despesa";
  valor: number;
  categoria: string;
  descricao: string;
}

// Instância lazy apontando para o OpenRouter (compatível com o SDK da OpenAI)
let _client: OpenAI | null = null;
function getOpenRouterClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    logger.info({ msg: "Initializing OpenRouter Client" });
    
    _client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://finanzen.app",
        "X-Title": "FinanZen",
      },
    });
  }
  return _client;
}

export async function extractFinancialData(
  text: string,
  base64Image?: string
): Promise<FinancialExtractionResult> {
  const client = getOpenRouterClient();

  const userContent: any[] = [
    {
      type: "text",
      text: `Analise esta transação financeira. 
      Se houver uma imagem, extraia os dados do comprovante/recibo. 
      Se houver apenas texto, use o texto.
      
      Texto do usuário: "${text}"
      
      Regras estritas:
      1. Retorne APENAS um JSON válido.
      2. Chaves: "tipo" (receita/despesa), "valor" (float), "categoria" (string curta), "descricao" (resumo).
      3. Seja extremamente preciso com o valor total final.`
    }
  ];

  if (base64Image) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64Image}`
      }
    });
  }

  try {
    const response = await client.chat.completions.create({
      model: "meta-llama/llama-3.2-11b-vision-instruct", 
      messages: [
        { 
          role: "system", 
          content: "Você é um extrator de dados financeiros JSON especializado em comprovantes e mensagens de gastos. Responda APENAS com o objeto JSON puro." 
        },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim();
    logger.info({ msg: "OpenRouter Vision Response", content });

    if (!content) {
      throw new Error("Resposta vazia do modelo de IA");
    }

    // Tentar extrair o JSON usando Regex caso a IA tenha respondido com texto extra
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Não foi possível encontrar um objeto JSON na resposta da IA");
    }

    const cleanContent = jsonMatch[0];
    const parsedData = JSON.parse(cleanContent) as FinancialExtractionResult;

    // Normalizar o tipo para minúsculo
    parsedData.tipo = parsedData.tipo.toLowerCase() as "receita" | "despesa";

    return parsedData;
  } catch (error: any) {
    logger.error({
      msg: "Falha na extração de dados via Vision API",
      error: error.message,
    });
    throw error;
  }
}
