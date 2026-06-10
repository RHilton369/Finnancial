# 💎 ZenTriq v2.0.0 — Enterprise & Audit Edition

O **ZenTriq** é um sistema avançado de gestão financeira pessoal e empresarial, concebido com foco em escalabilidade, resiliência atômica e precisão contábil. A versão v2.0.0 marca a consolidação da arquitetura de transações interativas, garantindo que todas as mutações no banco de dados sejam infalíveis.

## 🚀 Arquitetura e Tech Stack

O ecossistema é desenhado para atuar de forma híbrida (Web/Desktop) e assíncrona, composto pelas tecnologias:

- **Backend (API):** Node.js empacotado em executável otimizado via `pkg`.
- **Database ORM:** Prisma Client operando sob o MongoDB Atlas (Cloud) com Engine Nativa (Windows DLL).
- **Frontend (UI):** React + Vite, com roteamento dinâmico e gráficos fluídos em Recharts.
- **Desktop Wrapper:** Electron Builder para entrega de um Instalador unificado (.exe) com integração nativa no Windows.
- **Observability:** Central de Logs estruturados via `pino` (Backend) e `electron-log` (Frontend), assegurando rastreabilidade em todos os níveis.

## 🛡️ Pilares de Engenharia e Integridade

Nesta edição, as diretrizes rigorosas de confiabilidade foram implementadas:

1. **Atomicidade Absoluta (Transações Interativas):** 100% das operações críticas de Controladores (Ex: Contas, Metas, Orçamentos, Recorrências e Transações) foram refatoradas para utilizarem o modelo de Transação Interativa do Prisma (`prisma.$transaction(async (tx) => {})`). Isso impossibilita falhas parciais durante um fluxo financeiro.
2. **Fail Fast & Sanitization:** Regras de negócio restritas no topo das rotas com retornos antecipados. Nenhum payload chega à base sem validação estrita.
3. **Observabilidade Limpa:** Zero uso de `console.log` puristas. O log sistêmico respeita os níveis `INFO`, `WARN` e `ERROR`, sem vazar PIIs ou Tokens Sensíveis, conforme rigor de compliance.
4. **DRY & SRP:** Funções atômicas nos modelos e controle isolado nos "Controllers". Arquitetura limpa e escalável.

## 🛠️ Guia do Desenvolvedor e Processo de Build

O sistema possui scripts automatizados para evitar manipulações propensas a erro humano.

### Requisitos Prévios
- Node.js >= 18.x
- PNPM (Fast, disk space efficient package manager)
- Conexão ativa com a internet (para o DB Pull/Push do Prisma e instâncias do MongoDB Atlas)

### Geração da Release Executável (Installer)
Para empacotar a API e o Frontend em um instalador único de forma silenciosa e limpa:

```powershell
./build.ps1
```

**O que o script automatiza:**
1. Encerra processos e limpa o ambiente temporário (Taskkill / Cleanup).
2. Atualiza e gera o Cliente Prisma (com download forçado da Engine de consulta).
3. Compila a API backend utilizando `pkg` (Node.js -> .exe interno).
4. Compila o Frontend através do Vite.
5. Invoca o Electron Builder empacotando tudo em um instalador.
6. **Output:** Disponível em `zentriq-web/release/ZenTriq Setup <version>.exe`. O Instalador já configura o atalho na Área de Trabalho (`shortcut: true` nativo do electron-builder).

## 🩺 Manutenção e Troubleshoot

Caso detecte qualquer desvio nos dashboards, utilize as rotas de utilitários mantidas no controlador de Manutenção (`maintenanceController`):
- **Recalcular Saldos (`/maintenance/recalculate`):** Processo corretivo pesado. Faz a varredura atômica de todas as transações cronológicas reconstruindo os saldos dinamicamente de cada conta.
- **Check de Consistência (`/maintenance/consistency`):** Compara saldos operacionais e contábeis devolvendo métricas de diferença.

## 🎨 Estágio Evolutivo: Premium UI/UX & Data Integrity (v2.4.0)

A interface e as rotinas do ZenTriq foram refinadas para oferecer consistência absoluta e resolver erros lógicos:
- **Suporte à Quantidade de Cotas em Investimentos (v2.4.0):** Implementada a persistência de quantidades de cotas/ações (`quantity` no MongoDB e Prisma Client) para investimentos de Renda Variável e Criptoativos. A sincronização de cotações automáticas da Brapi agora calcula o saldo total atualizado multiplicando o preço unitário do ativo pela quantidade de cotas. Adicionado também um algoritmo de fallback que estima a quantidade de cotas para ativos legados (valor investido / cotação), prevenindo a queda incorreta do patrimônio de mercado. No frontend, a tela de investimentos recebeu um campo dedicado para quantidade no formulário e badges de exibição premium na tabela.
- **Gráficos e Relatórios Responsivos (v2.3.0):** A tela de Relatórios foi reestruturada organizando os gráficos de Receitas vs Despesas e Evolução por Categoria lado a lado em uma grid (`chartsGrid`) responsiva em desktop, movendo a tabela de Resumo Mensal para a base da página para otimização de espaço e rolagem fluida.
- **Limpeza Visual de Células Zeradas:** Valores zerados (`R$ 0,00`) e badges de poupança vazia (`0.0%`) na tabela de relatórios agora utilizam cores cinzas neutras, removendo poluição visual e destacando apenas as movimentações reais.
- **Consistência de Saldo de Contas e Rendimentos:** Saldo atual negativo de contas (ex: Nubank devedor) e rendimento negativo de ativos agora herdam corretamente a cor vermelha coral (`var(--color-danger)`), enquanto saldos positivos ficam em verde.
- **Autocategorização e Integridade de Dados:** O algoritmo de categorização automática em `createBulk` foi corrigido para associar a categoria "Salário" apenas a receitas (`income`), evitando que despesas e pagamentos de boletos contendo a palavra "pagamento" fossem classificados incorretamente. Um script corretivo de banco de dados (`fix_data.js`) higienizou com sucesso 20 lançamentos históricos inconsistentes.
- **Efeito Glassmorphism:** O dark mode agora conta com cartões semi-transparentes estruturados com gradientes de fundo sutis, bordas finas claras (`rgba(255, 255, 255, 0.05)`) e elevação dinâmica em hover.
- **Saldo Inteligente:** Destaque dinâmico de saldos com cores adaptativas em tons pastéis (verde esmeralda para saldo positivo e coral/vermelho para saldo negativo).
- **Substituição de Emojis por Ícones:** Substituição de emojis textuais estáticos por ícones dinâmicos de alta definição baseados em SVG da biblioteca `lucide-react` para maior profissionalismo.
- **Ações Rápidas & Micro-interações:** Botões de ação circulares e minimalistas com hovers fluidos na tabela de transações, barras de progresso com cantos arredondados de pílula (`border-radius: 99px`) e transições aceleradas na tela de orçamentos, e efeitos de foco com brilho glow verde nos campos de formulário das configurações.
- **Animações IA:** O avatar central do Assistente Financeiro IA conta com animação contínua de pulso e glow, simulando atividade inteligente em tempo real.

---
_A excelência técnica não é um diferencial, é um requisito mínimo._
