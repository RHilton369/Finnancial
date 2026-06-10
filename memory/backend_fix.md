# 🛠 Backend Fix - Histórico de Manutenção

> [!NOTE]
> **Memorial de Procedimentos:** Este documento descreve as correções sistêmicas aplicadas quando o projeto ainda utilizava o sistema `sql.js`. 
> Atualmente, a estabilidade é garantida pelo **Prisma ORM** e o monitoramento é feito via **Pino Logger**.

## 🔴 Problema Recorrente: "O backend encerra inesperadamente"

Na arquitetura legada, o processo Node.js apresentava instabilidades devido à manipulação direta do SQLite em memória. Os ajustes aplicados foram:

### 1. Sincronização de Ambiente (`server.js`)
- Configuração do **Dotenv** com caminho absoluto para garantir o carregamento das variáveis independentemente do diretório de execução:
  ```javascript
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
  ```

### 2. Resolução de Caminhos (`database.js`)
- Ajuste do `PROJECT_ROOT` para referenciar a raiz correta da API e não a pasta de código-fonte:
  ```javascript
  PROJECT_ROOT = path.resolve(__dirname, '..', '..');
  ```
- O `DB_PATH` passou a ser resolvido como um caminho absoluto dinâmico.

### 3. Integridade de Dados (`sql.js`)
- Implementação das funções `execParams` e `runParams` para contornar a limitação de parâmetros do driver antigo, garantindo que as queries não falhassem silenciosamente.

---

## 🔄 Procedimento de Reinicialização (Legado)

Caso precise rodar a versão antiga ou limpar processos órfãos:

```powershell
# 1. Encerrar todos os processos Node residuais
taskkill /F /IM node.exe

# 2. Iniciar o Backend (API)
cd D:/Arquivos_Obsidian/ZenTriq/zentriq-api
npm run dev

# 3. Iniciar o Frontend (Web)
cd D:/Arquivos_Obsidian/ZenTriq/zentriq-web
npm run dev
```

> [!TIP]
> No sistema atual, os logs detalhados de erros podem ser encontrados no console formatados pelo **pino-pretty**, facilitando o diagnóstico de quedas sem a necessidade de reinicializações constantes.
