const { prisma } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Sincroniza as cotações dos investimentos de renda variável (Ações e FIIs) de um usuário
 * através da API Brapi, atualizando seus valores atuais e gerando registros no histórico mensal.
 * 
 * @param {string} userId - ID do usuário proprietário dos investimentos.
 * @returns {Promise<{ success: boolean, updatedCount: number, message: string }>}
 */
const syncQuotesForUser = async (userId) => {
  const token = process.env.BRAPI_TOKEN;

  try {
    // 1. Buscar investimentos de Renda Variável com Ticker preenchido
    const userInvestments = await prisma.investments.findMany({
      where: {
        user_id: userId,
        type: 'variable_income',
        ticker: { not: null }
      }
    });

    // Filtra para garantir que não temos strings vazias no ticker
    const activeInvestments = userInvestments.filter(inv => inv.ticker && inv.ticker.trim() !== '');

    if (activeInvestments.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        message: 'Nenhum ativo de renda variável com ticker cadastrado para sincronizar.'
      };
    }

    // 2. Extrair e sanitizar a lista de tickers únicos (ex: PETR4,VALE3)
    const uniqueTickers = [...new Set(activeInvestments.map(inv => inv.ticker.trim().toUpperCase()))];
    
    // A API Brapi permite a consulta gratuita e sem token de 4 ativos específicos para testes de integração
    const freeTestTickers = ['PETR4', 'MGLU3', 'VALE3', 'ITUB4'];
    const requiresToken = uniqueTickers.some(ticker => !freeTestTickers.includes(ticker));

    if (requiresToken && !token) {
      logger.warn({ userId }, 'Tentativa de sincronizar cotações sem BRAPI_TOKEN configurado no .env para ativos fora do plano de teste');
      return {
        success: false,
        updatedCount: 0,
        message: 'Chave de API (BRAPI_TOKEN) não configurada no servidor. Cadastre uma chave gratuita no arquivo .env para obter cotações automáticas.'
      };
    }

    logger.info({ userId, tickers: uniqueTickers }, 'Iniciando chamadas individuais para a API Brapi para consulta de cotações');

    const priceMap = {};
    let errorStatus = null;

    // O plano gratuito da Brapi limita as requisições a no máximo 1 ativo por chamada URL.
    // Portanto, realizamos chamadas individuais paralelas para cada ativo na carteira do usuário.
    const fetchPromises = uniqueTickers.map(async (ticker) => {
      try {
        const url = token 
          ? `https://brapi.dev/api/quote/${ticker}?token=${token}`
          : `https://brapi.dev/api/quote/${ticker}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          logger.error({ userId, ticker, status: response.status }, 'Falha na resposta da API Brapi para o ativo individual');
          errorStatus = response.status;
          return;
        }

        const data = await response.json();
        
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const result = data.results[0];
          if (result.symbol && result.regularMarketPrice !== undefined) {
            priceMap[result.symbol.toUpperCase()] = result.regularMarketPrice;
          }
        }
      } catch (err) {
        logger.error({ userId, ticker, err }, 'Erro ao buscar cotação de ativo individual da Brapi');
      }
    });

    await Promise.all(fetchPromises);

    // Se nenhuma cotação foi recuperada e um erro de status HTTP ocorreu em todas as chamadas, retornamos o erro para a interface
    if (Object.keys(priceMap).length === 0 && errorStatus) {
      return {
        success: false,
        updatedCount: 0,
        message: `A API de cotações retornou um erro (Status: ${errorStatus}). Verifique a validade do seu token.`
      };
    }


    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    let updatedCount = 0;

    // 4. Iniciar Transação Interativa do Prisma para garantir atomicidade
    await prisma.$transaction(async (tx) => {
      for (const investment of activeInvestments) {
        const tickerUpper = investment.ticker.trim().toUpperCase();
        const price = priceMap[tickerUpper];

        if (price === undefined || price === null) {
          logger.warn({ userId, ticker: investment.ticker }, 'Preço de cotação não encontrado no retorno da API Brapi');
          continue;
        }

        // Se a quantidade de cotas/ações for nula ou indefinida (ativos legados sem quantidade cadastrada),
        // estimamos a quantidade dividindo o valor total investido pelo preço unitário atual do ativo.
        // Isso impede que o saldo consolidado desabe para o valor de uma única cota.
        const quantity = investment.quantity !== null && investment.quantity !== undefined && investment.quantity > 0
          ? investment.quantity
          : (investment.invested_amount / price);

        const newCurrentAmount = price * quantity;

        // Atualizar o valor total de mercado atualizado no banco
        await tx.investments.update({
          where: { id: investment.id },
          data: {
            current_amount: newCurrentAmount,
            updated_at: today.toISOString()
          }
        });

        // Gravar ou atualizar o snapshot do mês corrente no histórico de rentabilidade do ativo
        const existingHistory = await tx.investment_history.findFirst({
          where: {
            investment_id: investment.id,
            date: currentMonthStr
          }
        });

        if (existingHistory) {
          await tx.investment_history.update({
            where: { id: existingHistory.id },
            data: {
              invested_val: investment.invested_amount,
              current_val: newCurrentAmount,
              created_at: today.toISOString() // Mantém atualizado
            }
          });
        } else {
          await tx.investment_history.create({
            data: {
              user_id: userId,
              investment_id: investment.id,
              date: currentMonthStr,
              invested_val: investment.invested_amount,
              current_val: newCurrentAmount,
              created_at: today.toISOString()
            }
          });
        }

        updatedCount++;
      }
    });

    logger.info({ userId, updatedCount }, 'Sincronização de cotações concluída com sucesso');

    return {
      success: true,
      updatedCount,
      message: `Cotações atualizadas com sucesso para ${updatedCount} ativos.`
    };
  } catch (err) {
    logger.error({ err, userId }, 'Erro crítico durante a sincronização de cotações na API Brapi');
    return {
      success: false,
      updatedCount: 0,
      message: 'Ocorreu um erro interno ao sincronizar os preços com o mercado.'
    };
  }
};

module.exports = {
  syncQuotesForUser
};
