# Status do Projeto ZenTriq - Ultima atualizacao: 2026-04-05

## Servidores
- Backend: `D:\Arquivos_Obsidian\OpenClaude2\zentriq-api` (porta 3001)
- Frontend: `D:\Arquivos_Obsidian\OpenClaude2\zentriq-web` (porta 5173)
- Banco: `zentriq-api/database/zentriq.db`

## Paginas implementadas (100% prontas)
- **Login / Register** ✅
- **Dashboard** ✅ (cards, donut chart, cash flow, alerts)
- **Transacoes** ✅ (lista, filtros, CRUD, edit, delete, busca debounce)
- **Orcamentos** ✅ (cards com barra, definir limite, editar, excluir)
- **Metas** ✅ (progresso, deposito, cores/icones)
- **Relatorios** ✅ (grafico anual, tabela, evolucao por categoria)
- **Configuracoes** ✅ (perfil, contas CRUD, categorias CRUD, export JSON)

## Mobile ✅
- Sidebar vira drawer no mobile (<768px) com hamburger
- CSS responsivo nas paginas

## Funcionalidades
- Mascara de moeda R$ no TransactionFormModal (formato pt-BR)
- Botoes Editar/Excluir sempre visiveis nas transacoes
- Categorias: adicionar, editar, excluir (padrao protegidas)
- Contas: adicionar, editar com tipos (corrente, poupanca, etc)

## Corrigidos
- `useTransactions.js` hook esta em `zentriq-web/src/hooks/useTransactions.js`
- Transaction model usa db.prepare()/bind()/step()
- DB_PATH path absoluto baseado em __dirname de src/config/database.js
- `PROJECT_ROOT = path.resolve(__dirname, '..', '..')` em database.js
- JWT_SECRET carregado via dotenv com path absoluto em server.js
- Import do ConfirmDialog em todos os modulos (export default, nao named)
- **Todos os 6 models corrigidos**: Account, Category, Budget, Goal, User, Transaction usam `execParams()`/`runParams()` (prepare+bind+step)
- **Codigo morto removido**: `mapRow()` de todos os models
- **Debug logs removidos**: console.log de JWT_SECRET e DB_PATH em server.js
- **Documentacao**: Script BD.md criado em `Base de Dados/` com schema completo
