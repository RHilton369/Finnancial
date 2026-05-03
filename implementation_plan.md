# Plano de Implementação: FinanZen

Este documento detalha o planejamento arquitetural e as etapas de desenvolvimento do **FinanZen**, um gestor financeiro inteligente integrado ao WhatsApp com um painel web analítico.

## 🎯 Visão Geral
O objetivo é construir uma plataforma robusta onde o usuário interage via WhatsApp (texto, áudio, imagens) e uma Inteligência Artificial interpreta a entrada, categoriza a transação e salva em um banco de dados. Um painel web (Dashboard) fornecerá visualizações financeiras, gestão de limites e configurações.

> [!IMPORTANT]
> **Aderência às Regras Globais:** Toda a arquitetura foi desenhada para respeitar estritamente as regras de Clean Code (SRP, Early Returns, arquivos curtos, tipagem forte), Logging estruturado (Pino), Tratamento de Erros e Segurança (Sanitização).

## 🏗️ Arquitetura e Stack Tecnológica Proposta

Embora o esboço inicial em Python esteja no arquivo `.md`, proponho a seguinte stack profissional para garantir tipagem, escalabilidade e seguir o histórico de tecnologias modernas:

1. **Backend (Webhook & API):** Node.js com TypeScript (framework Fastify ou Express). 
2. **Banco de Dados:** PostgreSQL (relacional, ideal para relatórios financeiros e consistência) manipulado via **Prisma ORM** (para evitar problema N+1 e garantir transações atômicas).
3. **Integração WhatsApp:** API Oficial do WhatsApp Cloud (Meta) para estabilidade e compliance ou integração via Baileys/WA-Web.js para prototipagem ágil.
4. **Inteligência Artificial:** OpenAI API (modelos GPT-4o-mini para texto/JSON e Whisper para transcrição de áudio).
5. **Frontend (Dashboard):** Next.js (React) + TailwindCSS, focado em uma interface premium, dinâmica e responsiva (com gráficos usando Recharts ou Chart.js).
6. **Observabilidade (Logs):** Biblioteca `pino` para logs em JSON estruturado, injetando `Trace IDs` (Request IDs) em todas as requisições.

## ⚠️ User Review Required

Por favor, revise as decisões abaixo. Se aprovado, iniciaremos a criação da base de código do projeto.

- **Stack Tecnológica:** Você concorda em seguir com Node.js + TypeScript + Prisma + PostgreSQL? Ou prefere manter o backend em Python (FastAPI)?
- **Integração WhatsApp:** Para a primeira versão, usaremos a API Oficial da Meta (necessita conta comercial no Facebook e configuração de webhook HTTPS) ou uma biblioteca via QR Code (como Baileys) para uso pessoal imediato?

## ❓ Open Questions

> [!WARNING]
> Precisamos definir os seguintes pontos antes de iniciar:
> 1. Como será gerenciada a autenticação do painel Web? (ex: Login clássico com E-mail/Senha, Google OAuth, ou Magic Links?)
> 2. Qual o nome de preferência para a pasta onde inicializaremos o projeto? (Ex: `finanzen-app` dentro de `d:\Arquivos_Obsidian\FinanZen`).

## 📋 Fases de Implementação

### Fase 1: Fundação do Backend e Setup Inicial
- [x] Inicialização do projeto Node.js + TypeScript + Prisma.
- [x] Modelagem do banco de dados (`User`, `Transaction`, `Category`, `BudgetLimit`) em padrão Enterprise.
- Implementação da camada de Observabilidade (`pino` logger) e Error Handling global (Fail Fast).
- Criação das rotas HTTP iniciais.

### Fase 2: Motor de Inteligência Artificial e Webhook
- Criação dos Services isolados (SRP) para comunicar com a OpenAI.
- Engenharia de Prompts para converter mensagens soltas em objetos JSON `{ tipo, valor, categoria, descricao }`.
- Criação do endpoint Webhook do WhatsApp e validação de payload (usando `zod`).

### Fase 3: Dashboard Web (Interface Premium)
- Inicialização da camada Web (Next.js).
- Criação dos componentes de painel de controle (Dark Mode, tipografia profissional, micro-interações).
- Integração da API para gráficos de relatórios financeiros.

### Fase 4: Refinamentos e Background Jobs
- Implementação de Cron Jobs para verificação diária de alertas e faturas.
- Escrita dos testes unitários (Mocks) para as funções mais sensíveis.

---

## 🧪 Verification Plan

### Testes Automatizados
- Scripts de teste automatizado usando Mocks para garantir que o comportamento de Parsing da OpenAI funcione sob stress sem estourar custos.

### Verificação Manual
- Configurar variáveis de ambiente, executar `npm run dev` e submeter payloads via Postman simulando o WhatsApp.
- Conferir visualmente a estrutura e fluidez do Painel Web Next.js.

----------------

Isso significa que você ainda não possui um serviço do PostgreSQL rodando ativamente na porta 5432 da sua máquina, ou ele está desligado.

O que precisamos fazer agora para avançar:

Opção A (Local): Se você tem o Postgres ou o Docker instalados na sua máquina, inicie o serviço do Postgres. (Se quiser usar Docker, basta me avisar que eu crio um docker-compose.yml rapidinho pra você subir o banco em 1 segundo).
Opção B (Nuvem): Se você pretende usar um banco gratuito na nuvem (como Supabase ou Neon), você precisa criar o banco lá e colar o link de conexão que eles te derem dentro do seu arquivo backend/.env na variável DATABASE_URL.
Qual caminho você prefere seguir para continuarmos? Se quiser o Docker, posso providenciar o arquivo agora mesmo!


-----------

Boas notícias! O motor de Inteligência Artificial já está 100% funcional e configurado com a sua nova chave do OpenRouter.

🧪 Resultado do Teste de IA:
Consegui disparar um teste real para o seu webhook e a IA respondeu perfeitamente:

Entrada: "Gastei 45 reais no almoco hoje"
Saída da IA (OpenRouter):
json
{
  "tipo": "despesa",
  "valor": 45.0,
  "categoria": "Alimentação",
  "descricao": "Gastei 45 reais no almoco hoje"
}
O sistema agora utiliza o modelo Mistral/Llama via OpenRouter, que é extremamente rápido e econômico.

🛑 Próximo Passo: Ajuste na Conexão do Banco (Supabase)
O teste de ponta a ponta falhou no passo final (gravar no banco) porque a DATABASE_URL que você me enviou (https://qdgnuwvtgyodtpcefufy.supabase.co) é a URL da API do Supabase, e o banco de dados (Prisma) precisa de uma URL de conexão PostgreSQL (que começa com postgresql://).

Além disso, detectei que o seu banco está usando apenas IPv6, o que pode causar erros de conexão em alguns ambientes. Para resolver isso, configurei o seu backend para usar o Pooler do Supabase, que é mais estável e compatível com IPv4.

O que eu preciso de você: Vá no seu painel do Supabase em: Settings > Database > Connection String > URI

Selecione a opção Transaction (porta 6543).
Copie essa URL. Ela deve ser algo como: postgresql://postgres.qdgnuwvtgyodtpcefufy:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
Me envie essa URL ou apenas confirme se o host é esse mesmo.
O que eu já fiz:

Configurei o arquivo backend/.env com a sua senha @369AWZ#dfx7 (já apliquei o encoding necessário para caracteres especiais).
O backend já está rodando na porta 3001 e o frontend na 3000.
O código do Webhook já está pronto para salvar os dados assim que a URL de conexão for validada.
Assim que você me passar o link correto de conexão, eu finalizo o "Push" das tabelas e o sistema estará pronto para uso real!

-----------------

Plano de Estabilização e Otimização de Memória — FinanZen
O usuário relatou que o sistema está reiniciando a máquina alegando falta de memória após a última refatoração. Isso geralmente indica um vazamento de memória massivo, um loop infinito de processos ou exaustão de recursos do Windows durante a compilação (Next.js + tsx).

User Review Required
IMPORTANT

O script de inicialização FinanZen.vbs será atualizado para evitar a abertura de múltiplas instâncias simultâneas, o que é a causa mais provável de travamento em máquinas com menos de 16GB de RAM.

WARNING

Removeremos o @prisma/adapter-pg em favor do cliente nativo do Prisma para eliminar possíveis vazamentos de memória no adaptador de driver, que ainda é uma funcionalidade em evolução no Prisma 7.

Propostas de Mudanças
1. Otimização de Recursos (Backend)
[MODIFY] 
package.json
Adicionar limite de memória (--max-old-space-size=1024) aos scripts de dev e start.
Garantir que o tsx ignore diretórios desnecessários.
[MODIFY] 
prisma.ts
Remover o uso de PrismaPg (adapter) e Pool. O Prisma gerencia seu próprio pool de conexões de forma muito mais eficiente em ambientes Node.js padrão. Isso reduz o overhead de threads e memória.
[MODIFY] 
logger.ts
Simplificar o logger em desenvolvimento para evitar o uso extensivo de worker threads do pino-pretty se a memória estiver baixa.
2. Otimização de Recursos (Frontend)
[MODIFY] 
package.json
Adicionar limite de memória ao next dev (NODE_OPTIONS='--max-old-space-size=2048').
[MODIFY] 
page.tsx
Adicionar um limite razoável na busca inicial de transações (ex: últimas 500) para evitar que o Node.js tente processar milhares de objetos em memória a cada refresh da página.
3. Estabilização da Inicialização
[MODIFY] 
FinanZen.vbs
Implementar uma checagem básica para não iniciar novos processos se o node.exe já estiver rodando o sistema.
Aumentar o delay de abertura do navegador para dar tempo de o Next.js inicializar sem competir por CPU com o backend.
Plano de Verificação
Testes Manuais
Executar o sistema via atalho e monitorar o Gerenciador de Tarefas (Task Manager).
Verificar se o uso de memória do node.exe se estabiliza abaixo dos limites configurados.
Tentar abrir o sistema duas vezes seguidas e garantir que o VBS não dispare duplicatas pesadas.
