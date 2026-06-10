const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const { getMonthRange } = require('../utils/dateHelpers');

/**
 * Formata valores para Moeda Brasileira (R$)
 * @param {number} val 
 * @returns {string}
 */
const formatBRL = (val) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

/**
 * Processador de comandos financeiros offline.
 * Utiliza buscas no banco via Prisma para responder comandos de texto estruturados básicos.
 * 
 * @param {string} userId 
 * @param {string} text 
 * @returns {Promise<string|null>} Resposta do comando offline ou null se não bater com nenhum comando.
 */
const processOfflineCommands = async (userId, text) => {
  const cleanText = text.trim().toLowerCase();

  // 1. Comando: SALDO / CONTAS
  if (/\b(saldo|saldos|contas|carteira|dinheiro)\b/i.test(cleanText)) {
    const activeAccounts = await prisma.accounts.findMany({
      where: { user_id: userId, is_active: 1 }
    });

    if (activeAccounts.length === 0) {
      return 'Você não possui nenhuma conta cadastrada e ativa no momento.';
    }

    let total = 0;
    let md = '### 🏦 Seus Saldos Atuais\n\n| Conta | Tipo | Saldo |\n| :--- | :--- | :--- |\n';
    
    const accountTypes = {
      checking: 'Corrente',
      savings: 'Poupança',
      cash: 'Dinheiro',
      credit: 'Crédito',
      investment: 'Investimentos'
    };

    for (const acc of activeAccounts) {
      const balance = acc.balance || 0;
      md += `| ${acc.name} | ${accountTypes[acc.type] || acc.type} | **${formatBRL(balance)}** |\n`;
      total += balance;
    }

    md += `\n**Saldo Líquido Consolidado:** \`${formatBRL(total)}\``;
    return md;
  }

  // 2. Comando: GASTOS POR CATEGORIA
  const expenseMatch = cleanText.match(/\b(?:quanto|gastos?|gastei|gasto)\s+com\s+(.+)/i);
  if (expenseMatch) {
    const categoryQuery = expenseMatch[1].trim();
    
    // Buscar categoria correspondente
    const category = await prisma.categories.findFirst({
      where: {
        user_id: userId,
        name: { contains: categoryQuery, mode: 'insensitive' }
      }
    });

    if (!category) {
      return `Não encontrei nenhuma categoria cadastrada chamada "${categoryQuery}".`;
    }

    const today = new Date();
    const { startDate, endDate } = getMonthRange(today.getMonth() + 1, today.getFullYear());

    // Buscar despesas desse mês na categoria
    const txs = await prisma.transactions.findMany({
      where: {
        user_id: userId,
        category_id: category.id,
        type: 'expense',
        date: { gte: startDate, lte: endDate + 'T23:59:59' }
      }
    });

    const total = txs.reduce((sum, t) => sum + t.amount, 0);

    return `Neste mês você gastou um total de **${formatBRL(total)}** na categoria **${category.name}** (${txs.length} transações).`;
  }

  // 3. Comando: METAS
  if (/\b(meta|metas|objetivo|objetivos)\b/i.test(cleanText)) {
    const goals = await prisma.goals.findMany({
      where: { user_id: userId }
    });

    if (goals.length === 0) {
      return 'Você não possui nenhuma meta financeira cadastrada no momento.';
    }

    let md = '### 🎯 Suas Metas Ativas\n\n| Meta | Alvo | Atual | Progresso |\n| :--- | :--- | :--- | :--- |\n';
    
    for (const g of goals) {
      const current = g.current_amount || 0;
      const target = g.target_amount;
      const pct = target > 0 ? (current / target) * 100 : 0;
      const status = g.is_completed === 1 ? '✅ Concluída' : `${pct.toFixed(0)}%`;
      md += `| ${g.name} | ${formatBRL(target)} | ${formatBRL(current)} | **${status}** |\n`;
    }

    return md;
  }

  // 4. Comando: ORÇAMENTOS
  if (/\b(orçamento|orçamentos|limite|limites)\b/i.test(cleanText)) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const { startDate, endDate } = getMonthRange(month, year);

    const budgets = await prisma.budgets.findMany({
      where: { user_id: userId, month, year },
      include: { categories: true }
    });

    if (budgets.length === 0) {
      return 'Você não possui nenhum orçamento configurado para o mês atual.';
    }

    let md = '### 📊 Seus Orçamentos Mensais\n\n| Categoria | Limite | Gasto | Consumido |\n| :--- | :--- | :--- | :--- |\n';

    for (const b of budgets) {
      const txs = await prisma.transactions.findMany({
        where: {
          user_id: userId,
          category_id: b.category_id,
          type: 'expense',
          date: { gte: startDate, lte: endDate + 'T23:59:59' }
        }
      });

      const spent = txs.reduce((sum, t) => sum + t.amount, 0);
      const limit = b.amount_limit;
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      md += `| ${b.categories?.name || 'Geral'} | ${formatBRL(limit)} | ${formatBRL(spent)} | **${pct.toFixed(0)}%** |\n`;
    }

    return md;
  }

  // 5. Comando: AJUDA
  if (/\b(ajuda|help|comandos|como funciona)\b/i.test(cleanText)) {
    return `Olá! Sou o assistente financeiro do ZenTriq. No momento, estou sem conexão com a inteligência artificial online do Gemini (ou sua Chave de API não foi configurada).

No entanto, você ainda pode me enviar **comandos locais offline** para consultar suas finanças:
- **"saldo"** ou **"contas"**: Mostra os saldos das suas contas bancárias.
- **"metas"**: Mostra o andamento das suas metas.
- **"orçamentos"**: Mostra quanto você já consumiu dos seus limites de gastos.
- **"quanto gastei com [categoria]"**: Informa seu total de despesas do mês na categoria escolhida.

*Dica: Vá em 'Configurações' no menu lateral e cadastre sua Chave da API Gemini para liberar o bate-papo com inteligência artificial inteligente!*`;
  }

  return null;
};

/**
 * Processa a mensagem do usuário (modo híbrido offline/Gemini).
 * 
 * @param {string} userId 
 * @param {string} userMessageText 
 * @returns {Promise<string>}
 */
const generateChatResponse = async (userId, userMessageText) => {
  // 1. Validar se existe resposta offline baseada em regras locais
  const offlineResponse = await processOfflineCommands(userId, userMessageText);
  if (offlineResponse) {
    return offlineResponse;
  }

  // 2. Tentar usar a API online do Gemini
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { gemini_api_key: true }
  });

  if (!user || !user.gemini_api_key) {
    return `Para responder perguntas personalizadas e livres, por favor, configure sua **Chave de API do Gemini** na aba de **Configurações**.

*(Como o Gemini não está ativo no momento, você pode digitar **"ajuda"** para ver a lista de comandos locais offline disponíveis).*`;
  }

  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const { startDate, endDate } = getMonthRange(month, year);

    // 3. Montar Contexto Financeiro do Banco de Dados
    // Contas
    const accounts = await prisma.accounts.findMany({ where: { user_id: userId, is_active: 1 } });
    const accountsCtx = accounts.map(a => `${a.name}: saldo ${formatBRL(a.balance)}`).join(', ');

    // Orçamentos
    const budgets = await prisma.budgets.findMany({ where: { user_id: userId, month, year }, include: { categories: true } });
    const budgetsCtx = [];
    for (const b of budgets) {
      const txs = await prisma.transactions.findMany({
        where: { user_id: userId, category_id: b.category_id, type: 'expense', date: { gte: startDate, lte: endDate + 'T23:59:59' } }
      });
      const spent = txs.reduce((sum, t) => sum + t.amount, 0);
      budgetsCtx.push(`${b.categories?.name}: limite ${formatBRL(b.amount_limit)}, gasto ${formatBRL(spent)}`);
    }

    // Metas
    const goals = await prisma.goals.findMany({ where: { user_id: userId } });
    const goalsCtx = goals.map(g => `${g.name}: alvo ${formatBRL(g.target_amount)}, atual ${formatBRL(g.current_amount)}`).join(', ');

    // Investimentos
    const investments = await prisma.investments.findMany({ where: { user_id: userId } });
    const investmentsCtx = investments.map(i => `${i.name} (${i.type}): investido ${formatBRL(i.invested_amount)}, atual ${formatBRL(i.current_amount)}`).join(', ');

    // Últimas 15 transações de gastos/receitas
    const txs = await prisma.transactions.findMany({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
      take: 15,
      include: { categories: true }
    });
    const txsCtx = txs.map(t => `- [${t.date}] ${t.type === 'expense' ? 'Despesa' : 'Receita'}: ${formatBRL(t.amount)} em ${t.categories?.name || 'Geral'} - "${t.description}"`).join('\n');

    // Contexto financeiro final a ser injetado no prompt
    const financialContext = `
CONTEXTO FINANCEIRO DO USUÁRIO:
- Mês/Ano Atual: ${month}/${year}
- Contas Ativas: [${accountsCtx || 'Nenhuma'}]
- Orçamentos Atuais: [${budgetsCtx.join(', ') || 'Nenhum'}]
- Metas Financeiras: [${goalsCtx || 'Nenhuma'}]
- Investimentos: [${investmentsCtx || 'Nenhum'}]
- Últimas Transações Lançadas:
${txsCtx || 'Nenhuma transação recente no banco.'}
`;

    // 4. Buscar histórico de conversação do banco (últimas 8 mensagens)
    const history = await prisma.chat_messages.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
      take: 8
    });

    // Formatar os turnos de histórico no formato de payload do Gemini
    const contents = [];
    
    // Mapear histórico no formato que a API do Gemini exige (user / model)
    for (const h of history) {
      contents.push({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      });
    }

    // Injetar o contexto financeiro mais atualizado no último turno de pergunta do usuário
    contents.push({
      role: 'user',
      parts: [
        { text: financialContext },
        { text: `PERGUNTA DO USUÁRIO: ${userMessageText}` }
      ]
    });

    // 5. Configurar prompt de sistema
    const systemInstruction = {
      parts: [
        {
          text: `Você é o ZenTriq AI, um assistente financeiro pessoal de elite integrado ao aplicativo ZenTriq.
Você ajuda o usuário a entender seus gastos, analisar investimentos, criar hábitos de poupança e planejar metas.
Diretrizes:
- Seja amigável, analítico e direto. Não use jargões excessivamente complexos.
- Use dados do contexto financeiro fornecido para responder de forma personalizada.
- NUNCA revele chaves de API, senhas ou dados sensíveis.
- Formate suas respostas em Markdown premium (tabelas, listas ou negritos).
- Dê insights acionáveis baseados no orçamento e despesas dele.
- Suas respostas devem ser redigidas rigorosamente em Português do Brasil (PT-BR).`
        }
      ]
    };

    logger.info({ userId }, 'Chamando a API do Gemini 1.5 para processamento de mensagem do chat');

    // 6. Fazer requisição HTTP para o Gemini API usando fetch nativo
    const apiKey = user.gemini_api_key;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction
      })
    });

    if (!response.ok) {
      logger.error({ userId, status: response.status }, 'Falha na resposta da API Gemini');
      return 'Desculpe, tive um problema de comunicação com o servidor de inteligência do Gemini. Verifique a chave de API cadastrada em Configurações.';
    }

    const resJson = await response.json();
    
    // Tratar retorno estruturado do Gemini
    const replyText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      logger.warn({ userId, resJson }, 'Resposta vazia ou em formato inválido do Gemini');
      return 'Não consegui obter uma resposta inteligível do assistente de IA. Tente reformular a pergunta.';
    }

    return replyText;
  } catch (err) {
    logger.error({ err, userId }, 'Erro crítico ao consultar a API do Gemini');
    return 'Ocorreu um erro interno ao processar sua pergunta com a inteligência artificial.';
  }
};

module.exports = {
  generateChatResponse
};
