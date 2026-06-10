# ZenTriq - API de Gestão Financeira

Backend RESTful de alto desempenho para o sistema ZenTriq, construído com Node.js, Express e Prisma ORM.

## 🚀 Tecnologias e Padrões

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Banco de Dados**: MongoDB (via Prisma ORM)
- **Observabilidade**: Pino (Logs estruturados em JSON para Cloud/Produção)
- **Qualidade**: JSDoc abrangente e lógica defensive (Early Returns)

## 📦 Instalação e Configuração

1. **Instalar dependências**:
```bash
npm install
```

2. **Variáveis de Ambiente**:
Configure o arquivo `.env` baseado no `.env.example`:
```env
PORT=3001
JWT_SECRET=sua_chave_secreta
DATABASE_URL="mongodb://..."
```

3. **Gerar Artefatos do Prisma**:
```bash
npx prisma generate
```

4. **Rodar em Desenvolvimento**:
```bash
npm run dev
```

## 📊 Observabilidade

A API utiliza o **Pino** para registro de logs. Em desenvolvimento, os logs são formatados pelo `pino-pretty`. Em produção, são gerados logs JSON puros para fácil integração com Datadog/ElasticSearch.

- `ERROR`: Falhas críticas sistêmicas.
- `WARN`: Anomalias de negócio (ex: token inválido).
- `INFO`: Operações normais do servidor.

## 🛠 Padrões de Código (Clean Code)

- **Single Responsibility (SRP)**: Controllers e Models isolados.
- **Fail Fast (Early Returns)**: Lógicas defensivas no início das funções.
- **Sanitization**: Entradas validadas via Schemas (Zod).

## 📄 Licença

Uso Privado - ZenTriq System

## Endpoints

| Método   | Rota                              | Auth | Descrição                        |
|----------|-----------------------------------|------|----------------------------------|
| POST     | /api/auth/register                | Não  | Criar conta                      |
| POST     | /api/auth/login                   | Não  | Login                            |
| POST     | /api/auth/refresh                 | Não  | Renovar access token             |
| POST     | /api/auth/logout                  | Sim  | Logout                           |
| GET      | /api/transactions                 | Sim  | Listar transações (paginado)     |
| POST     | /api/transactions                 | Sim  | Criar transação                  |
| PUT      | /api/transactions/:id             | Sim  | Atualizar transação              |
| DELETE   | /api/transactions/:id             | Sim  | Deletar transação                |
| GET      | /api/dashboard/summary            | Sim  | Resumo do dashboard              |
| GET      | /api/dashboard/cashflow           | Sim  | Fluxo de caixa (últimos N meses) |
| GET      | /api/dashboard/by-category        | Sim  | Gastos por categoria             |
| GET      | /api/dashboard/daily-spending     | Sim  | Gastos diários do mês            |
| GET      | /api/budgets                      | Sim  | Listar orçamentos do mês         |
| POST     | /api/budgets                      | Sim  | Criar orçamento                  |
| PUT      | /api/budgets/:id                  | Sim  | Atualizar orçamento              |
| DELETE   | /api/budgets/:id                  | Sim  | Deletar orçamento                |
| GET      | /api/categories                   | Sim  | Listar categorias                |
| POST     | /api/categories                   | Sim  | Criar categoria                  |
| PUT      | /api/categories/:id               | Sim  | Atualizar categoria              |
| DELETE   | /api/categories/:id               | Sim  | Deletar categoria                |
| GET      | /api/accounts                     | Sim  | Listar contas                    |
| POST     | /api/accounts                     | Sim  | Criar conta                      |
| PUT      | /api/accounts/:id                 | Sim  | Atualizar conta                  |
| DELETE   | /api/accounts/:id                 | Sim  | Desativar conta                  |
| GET      | /api/goals                        | Sim  | Listar metas                     |
| POST     | /api/goals                        | Sim  | Criar meta                       |
| PUT      | /api/goals/:id                    | Sim  | Atualizar meta                   |
| DELETE   | /api/goals/:id                    | Sim  | Deletar meta                     |
| PATCH    | /api/goals/:id/deposit            | Sim  | Depositar em meta                |
| GET      | /api/recurring                    | Sim  | Listar recorrentes               |
| POST     | /api/recurring                    | Sim  | Criar recorrente                 |
| PUT      | /api/recurring/:id                | Sim  | Atualizar recorrente             |
| DELETE   | /api/recurring/:id                | Sim  | Deletar recorrente               |
| POST     | /api/recurring/process            | Sim  | Processar vencimentos            |
| GET      | /api/reports/monthly              | Sim  | Relatório anual                  |
| GET      | /api/reports/category-evolution   | Sim  | Evolução de categoria            |

## Exemplos de curl

### Registrar

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "João Silva", "email": "joao@email.com", "password": "123456", "monthly_income": 5000}'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@email.com", "password": "123456"}'
```

### Criar transação

```bash
curl -X POST http://localhost:3001/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"account_id": 1, "category_id": 2, "type": "expense", "amount": 45.90, "description": "Almoço", "date": "2025-01-15"}'
```
