# 📋 Checklist de Implantação e Deployment (Enterprise-Grade)

Este checklist cobre os passos necessários para configurar, assegurar e realizar o deploy do **FinanZen** em ambientes corporativos e em produção.

## 1. Setup e Configuração do Ambiente ⚙️
- [ ] **Variáveis de Ambiente (.env):** Assegurar que todas as chaves (OpenAI, WhatsApp API, JWT Secrets) estão definidas via plataforma de CI/CD ou Secret Manager (ex: AWS Secrets Manager). NUNCA efetuar push para o repositório.
- [ ] **Configuração do Banco de Dados:** Provisionar uma instância de PostgreSQL gerenciada (ex: AWS RDS, Supabase, Neon) com backups automáticos ativados.
- [ ] **Migrations Iniciais:** Executar `npx prisma migrate deploy` no ambiente alvo para garantir que a estrutura corporativa do banco está replicada em PRD.
- [ ] **Logs Estruturados:** Validar que a biblioteca `pino` está formatando logs em JSON na saída, viabilizando a ingestão em ferramentas de observabilidade (Datadog, ElasticSearch, CloudWatch).

## 2. Segurança e Compliance 🔒
- [ ] **Sanitização de Inputs (Zero Trust):** Garantir que o `zod` está validando rigorosamente todos os payloads de Webhook do WhatsApp e das APIs consumidas pelo Dashboard.
- [ ] **Zero Vazamentos Sensíveis (PIIs):** Checar se o logger está devidamente configurado para redigir/ofuscar dados sensíveis (senhas, e-mails, tokens).
- [ ] **Rate Limiting:** Configurar middlewares de throttling (ex: `fastify-rate-limit`) nas rotas públicas e nos Webhooks para prevenir DDoS e abusos.
- [ ] **Headers de Segurança e CORS:** Configurar Helmet e políticas rígidas de CORS apontando apenas para os domínios autênticos do Frontend (em PRD).

## 3. Banco de Dados e Escalabilidade 🗄️
- [ ] **Soft Deletes:** Validar que exclusões de usuário e categorias aplicam apenas data em `deletedAt`, preservando histórico de uso e auditoria.
- [ ] **Índices Otimizados:** Revisão das queries em massa. As chaves `userId`, `categoryId`, `phone` e `date` agora possuem índices (`@@index`) mapeados para buscas ultra-rápidas.
- [ ] **Tipagem Financeira Estrita:** Os valores monetários estão definidos como tipo `Decimal` (com precisão) em oposição ao perigoso `Float`, prevenindo bugs de arredondamento em cálculos.
- [ ] **Conexões Connection Pool:** Em cloud serverless, configurar connection pooling (como o Prisma Accelerate/PgBouncer) visando sustentar múltiplas requisições simultâneas.

## 4. Testes e CI/CD 🚀
- [ ] **Testes Unitários:** Aprovação da suite de testes antes do deploy (principalmente para os utilitários de IA Mocks), com meta de cobertura de vias satisfatória.
- [ ] **Linting & Type Checking:** Bloqueio de commits/deploys que possuem falha de validação TypeScript (comando `tsc --noEmit` + linter).
- [ ] **Build Process:** Construção isolada e otimizada (via Dockerfile Multi-stage) da camada Web e do Backend.

## 5. Deployment e Orquestração ☁️
- [ ] **Containerização / PaaS:** Implantar em infraestrutura escalável (ex: Railway, Vercel, AWS ECS) que aceite instâncias de workers background se aplicável no futuro.
- [ ] **Monitoramento de Saúde (Health Check):** Configurar e provisionar um endpoint `/health` (que bate rapidamente no Postgres retornando status `200 OK`) integrado com ferramentas de UptimeRobot ou Route 53.
