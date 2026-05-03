# Resumo: Fundação do Projeto FinanZen

O ambiente do **FinanZen** foi inicializado com sucesso em duas frentes independentes (`backend` e `frontend`), focadas na robustez, tipagem forte e qualidade profissional ditada pelas suas regras globais.

## 🏗️ O que foi construído?

### 1. Backend (Motor Inteligente e API)
Localizado em `d:\Arquivos_Obsidian\FinanZen\backend`

- **Core:** Inicializamos o Node.js + TypeScript com Fastify (alta performance) e Zod (validação estrita).
- **Banco de Dados:** Prisma ORM configurado. Já estruturamos o `schema.prisma` com os modelos base:
  - `User`
  - `Category`
  - `Transaction`
  - `BudgetLimit`
- **Inteligência Artificial (OpenAI):** Criado o serviço isolado `src/services/openai.ts`. Implementamos uma engenharia de prompt restrita a JSON, extraindo `{ tipo, valor, categoria, descricao }` do texto puro e aplicando "Fail Fast" se faltarem dados.
- **WhatsApp (Stub):** Base estruturada em `src/services/whatsapp.ts` para conectar facilmente com a Meta Cloud API (ou Baileys) no futuro.
- **Webhook e Logs:** A rota principal `POST /webhook` já existe e amarra a recepção da mensagem, extração com GPT-4o-mini e envio da confirmação de volta. A observabilidade completa está injetada via **Pino**, com níveis de erro e formato JSON para os logs.

### 2. Frontend (Painel Web)
Localizado em `d:\Arquivos_Obsidian\FinanZen\frontend`

- Inicializamos o painel usando **Next.js** (App Router), TypeScript e TailwindCSS.

> [!TIP]
> **Próximos Passos (Action Items):**
> Para dar continuidade, precisaremos:
> 1. Adicionar sua chave em um `.env` no backend (`OPENAI_API_KEY="..."`).
> 2. Decidir se o banco PostgreSQL será local (Docker) ou nuvem (Supabase / Neon), e rodar `npx prisma db push`.
> 3. Entrar no desenvolvimento da UI premium com Next.js no `frontend`.

## Como Iniciar para Testes Iniciais

Se você quiser testar o compilador do backend agora:
```powershell
cd backend
npm run dev
```
*(O servidor iniciará na porta 3000)*


---------------------

Walkthrough: Estabilização e Otimização de Memória
Para resolver o problema de reinicialização do sistema causado por exaustão de memória, implementamos uma série de medidas defensivas e otimizações de recursos.

🛠️ Mudanças Realizadas
1. Gestão Inteligente de Processos (Singleton)
Arquivo: 
FinanZen.vbs
Melhoria: Agora o script verifica via WMI se já existem instâncias do backend ou frontend rodando antes de tentar iniciá-las. Isso evita que cliques acidentais no atalho multipliquem o consumo de RAM.
Delay: Aumentamos o tempo de espera para 10 segundos antes de abrir o navegador, permitindo que o Next.js complete a compilação inicial sem travar a interface.
2. Limites de Memória (Hard Limits)
Arquivos: 
backend/package.json
 e 
frontend/package.json
Melhoria: Injetamos NODE_OPTIONS='--max-old-space-size=...' nos scripts.
Backend: 1GB (suficiente para Fastify + tsx).
Frontend: 2GB (necessário para compilação pesada do Next.js).
Isso garante que o Node.js não tente "sequestrar" toda a RAM da máquina até causar um crash no Windows.
3. Simplificação da Infraestrutura de Dados
Arquivo: 
prisma.ts
Melhoria: Removemos o @prisma/adapter-pg e o pool manual de pg. O Prisma Client nativo gerencia conexões de forma muito mais eficiente e estável, reduzindo o overhead de threads e vazamentos de memória latentes no adaptador.
4. Paginação Defensiva no Dashboard
Arquivo: 
page.tsx
Melhoria: Adicionamos um .limit(500) na busca inicial de transações. Isso protege o sistema caso o banco de dados cresça, evitando que o Next.js tente processar e renderizar milhares de registros de uma só vez na carga inicial.
5. Logger de Baixo Impacto
Arquivo: 
logger.ts
Melhoria: Desativamos o transport pino-pretty em favor do log JSON padrão. O pino-pretty utiliza worker threads adicionais que podem ser pesadas em ambientes com recursos limitados.
✅ Verificação Final
 O sistema não inicia processos duplicados ao executar o VBS repetidamente.
 O consumo de RAM do node.exe deve se manter estável dentro dos limites.
 O Dashboard carrega as últimas 500 transações de forma fluida.
TIP

Se o sistema ainda parecer lento, considere fechar o Docker da Evolution API enquanto não estiver testando integrações de WhatsApp, pois o Docker é um grande consumidor de memória no Windows.

