# 📜 Histórico de Erros e Correções (Legado)

> [!WARNING]
> **Aviso de Arquitetura:** Os registros abaixo referem-se à versão legada do projeto (baseada em `sql.js` e SQLite manual). 
> Atualmente, o sistema utiliza **Prisma ORM + MongoDB**, o que elimina a maioria desses problemas de forma nativa.

Este documento serve como memorial técnico das dificuldades encontradas durante a fase inicial de desenvolvimento e como elas foram mitigadas na arquitetura moderna.

## 🛠 Tabela de Incidentes e Soluções

| ID | Ocorrência / Bug | Solução (Arquitetura Legada) | Prevenção Atual (Prisma/MongoDB) |
|:---|:---|:---|:---|
| 01 | `sql.js` ignora parâmetros em `db.exec()` e `db.run()`. | Criadas funções `execParams()` e `runParams()` com `prepare()`. | **Resolvido:** O Prisma lida com parametrização de queries automaticamente de forma segura. |
| 02 | `PROJECT_ROOT` resolvia para `src/` em vez da raiz da API. | Ajustado `path.resolve` para subir dois níveis (`..`, `..`). | **Padronizado:** Estrutura de diretórios centralizada no `schema.prisma`. |
| 03 | Falha no carregamento do `.env` por path relativo. | Forçado path absoluto no `dotenv.config()` em `server.js`. | **Nativo:** O Prisma e o novo `server.js` utilizam paths absolutos garantidos. |
| 04 | Import do `ConfirmDialog` como objeto (named export) em vez de default. | Corrigido para `import ConfirmDialog from '...'`. | **Refatorado:** Todos os componentes seguem o padrão `export default` rigoroso. |
| 05 | Coluna `user_id` ausente na tabela de transações. | Necessário deletar e recriar o arquivo `.db`. | **Nativo:** Migrations do Prisma (ou `db push`) gerenciam o schema automaticamente. |
| 06 | Botões de edição e exclusão invisíveis (Opacity 0). | Removida regra de opacidade no CSS `.txActions`. | **UI Fix:** Visibilidade garantida por padrão no novo sistema de design. |
| 07 | Código morto `mapRow()` em todos os models. | Removida a limpeza manual de objetos pós-query. | **Automático:** O Prisma retorna objetos JavaScript limpos e tipados diretamente. |
| 08 | Refetch falhava no hook `useTransactions`. | Implementado `refetchSignal` (contador de estado). | **Estável:** Hooks refatorados para reagir corretamente a mudanças de dependência. |

---

*Última atualização do log: 2026-04-19 (Refatoração de Observabilidade)*
