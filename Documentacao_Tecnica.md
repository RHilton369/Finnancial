# 📚 Documentação Técnica e User Guide - FinanZen

## Visão Geral da Arquitetura
O **FinanZen** é uma aplicação distribuída com separação clara entre a interface analítica (Frontend Next.js) e o motor de IA/Webhook (Backend Node.js/Fastify/Prisma).

---

## 🏗️ 1. Modelo de Dados Otimizado (PostgreSQL)
A nova modelagem foca em integridade, auditoria e performance de buscas:
- **`User` (`users`)**: Retém identificação primária via WhatsApp (`phone`) usando chaves primárias UUID. Suporta exclusão lógica (`deletedAt`) e flags de inatividade.
- **`Category` (`categories`)**: Expande as funcionalidades do usuário com cores e ícones customizáveis para o front-end, mantendo a regra de que uma categoria pertence rigidamente a um usuário.
- **`Transaction` (`transactions`)**: Evoluída com tipagem em `Decimal` (para dados financeiros não sofrerem arredondamentos), relacionamentos obrigatórios com restrição e enumeradores transacionais (`INCOME`, `EXPENSE`).
- **`BudgetLimit` (`budget_limits`)**: Agora permite definição explícita temporal do limite (ex: `MONTHLY` x `YEARLY`), ajudando o backend a rodar CronJobs de alerta mais acurados.

---

## 🔄 2. Fluxo de Integração e Workflow (Dev Guide)

1. **Recepção (Webhook):** Um serviço provedor (Baileys Local ou API Meta Oficial) dispara requisições POST para a rota `/api/webhook/whatsapp`.
2. **Validação e Sanitização (Middlewares):** O pacote `zod` em ação barra imediatamente payloads com estrutura inesperada. Validação de autenticidade (Tokens) barra acesso intruso. (Early Return).
3. **Parseamento pela IA:** O texto recebido ("*Gastei 50 mango no posto de gasolina.*") é empacotado com um prompt restrito em JSON para a OpenAI.
4. **Execução de Lógica (Services):** O Prisma salva a entidade de `Transaction`, verificando automaticamente se aquela operação excedeu o `BudgetLimit` daquela Categoria para alertar o usuário.
5. **Observabilidade Constante:** Cada interação recebe um `RequestId`, gerando logs consistentes em cada etapa e facilitando o tracing no Kibana/Datadog.

---

## 👩‍💻 3. User Guide Básico (Painel Web)

**Guia do Usuário Final para Operação do Dashboard:**

- **Autenticação:** O sistema prioriza um acesso fácil sem senhas clássicas (Magic Links enviados para o próprio WhatsApp ou e-mail cadastrado).
- **Visão Geral (Home):** Resumo executivo dos fluxos do mês. Entenda de imediato sua proporção Receita vs. Despesa.
- **Limites e Categorias:**
  - Vá em *Configurações > Categorias* para criar tags visuais personalizadas.
  - Defina tetos de gastos para o mês em *Limites de Orçamento*. Se você mandar uma mensagem no WhatsApp que estoure esse limite, o robô te responderá avisando.
- **Sincronização:** Todas as mensagens processadas via WhatsApp refletem em tempo real nos gráficos do painel graças à arquitetura de banco de dados unificado.

---

## 🛠️ 4. Comandos e Manutenção (Operadores do Sistema)

### Prisma - Migrações de Banco
Sempre que alterar o arquivo `schema.prisma`, rode os comandos abaixo para sincronizar a base local:
```bash
# Cria uma nova migration documentando sua alteração
npx prisma migrate dev --name <descricao_da_sua_alteracao>

# Opcional - Abre o painel nativo do banco para visualizar tabelas
npx prisma studio
```

### Qualidade e Segurança
Antes de qualquer envio de código novo, garanta:
```bash
npm run lint         # Checa o estilo e padrões (Clean Code)
npm run typecheck    # (Se implementado) Checa se nenhuma tipagem foi burlada
npm run test         # Aciona a suite de testes automatizados (Mocks de IA)
```
