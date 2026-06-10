# 💎 ZenTriq - Acompanhamento do Projeto e Progresso

Este documento registra a linha do tempo do desenvolvimento, as decisões arquiteturais tomadas e o status de evolução das tarefas, garantindo rastreabilidade e auditoria constante sob os padrões de engenharia de software e Clean Code.

---

## 📅 Status Recente: Evolução v2.4.0 (10/06/2026)

### 1. Suporte à Quantidade de Cotas em Investimentos
* **Motivação:** Ao atualizar as cotações financeiras automáticas via API Brapi, o sistema substituía incorretamente o saldo consolidado de um ativo pelo preço de uma única cota (ex: reduzindo R$ 10.737,41 de investimento para R$ 4,14 unitários, gerando ROI de -99.73%).
* **Solução:**
  * Implementação da coluna `quantity` (Float) no banco de dados MongoDB (atualizado nos arquivos [schema.prisma](file:///d:/Arquivos_Obsidian/ZenTriq/zentriq-api/schema.prisma) e [prisma/schema.prisma](file:///d:/Arquivos_Obsidian/ZenTriq/zentriq-api/prisma/schema.prisma)).
  * Atualização dos Schemas de validação Zod no backend ([investmentSchemas.js](file:///d:/Arquivos_Obsidian/ZenTriq/zentriq-api/src/schemas/investmentSchemas.js)) para suportar a quantidade de cotas.
  * Atualização dos endpoints de criação e edição no [investmentController.js](file:///d:/Arquivos_Obsidian/ZenTriq/zentriq-api/src/controllers/investmentController.js) para salvar e modificar o número de cotas.
  * Ajuste do multiplicador no [investmentService.js](file:///d:/Arquivos_Obsidian/ZenTriq/zentriq-api/src/services/investmentService.js) (`valor_atualizado = preco_unitario * quantidade`).
  * **Fallback Inteligente:** Se o ativo no banco não possuir quantidade de cotas preenchida (ativos legados), o sistema estima a quantidade dividindo o `invested_amount` pelo `price` da cotação. Isso corrigiu a rentabilidade retroativa do usuário automaticamente de forma limpa.
  * **Frontend:** Implementado campo de preenchimento no formulário de cadastro e edição de renda variável/cripto, além de um badge visual premium de exibição na listagem de ativos ([Investments.jsx](file:///d:/Arquivos_Obsidian/ZenTriq/zentriq-web/src/pages/Investments.jsx)).

### 2. Sincronização em Lote da Brapi
* **Problema:** A chave de API do plano gratuito da Brapi limita as buscas a no máximo 1 ativo por requisição URL, fazendo o lote `AURE3,TASA4` retornar erro 400.
* **Solução:** O serviço [investmentService.js](file:///d:/Arquivos_Obsidian/ZenTriq/zentriq-api/src/services/investmentService.js) foi refatorado para realizar chamadas em paralelo (usando `Promise.all`) individualmente por ticker, contornando a restrição e tornando o processo robusto e livre de falhas de cotação.

### 3. Geração de Release Executável e Atualização de Atalhos
* **Ação:** Executado o script [build.ps1](file:///d:/Arquivos_Obsidian/ZenTriq/build.ps1) para empacotar o backend da API via `pkg`, compilar o frontend com Vite, e gerar o instalador do Electron em `zentriq-web/release/ZenTriq Setup 2.0.0.exe`.
* **Ação:** Execução do instalador em modo silencioso no terminal local do Windows, atualizando os binários na máquina e atualizando o atalho `D:\Desktop\ZenTriq.lnk` apontando para o app executável.

### 4. Auditoria de Clean Code
* **Ação:** Criado e executado o script [clean_code.js](file:///d:/Arquivos_Obsidian/ZenTriq/zentriq-api/scratch/clean_code.js) para garantir conformidade estrita com o limite de 400 linhas por arquivo de código e identificar o uso de console.logs.

---

## 📋 Planejamento de Expansão: Aplicativo Android (APK)

Como o frontend do ZenTriq é construído em React + Vite (Single Page Application), o caminho de menor fricção e maior manutenibilidade para gerar o aplicativo Android (.apk) sem duplicar regras de negócio é o **Ionic Capacitor**.

### Fluxo de Implementação da APK:
1. **Adicionar Capacitor ao Frontend:**
   No diretório `zentriq-web`, inicializar o Capacitor e associá-lo ao build de SPA:
   ```bash
   pnpm add @capacitor/core @capacitor/cli
   npx cap init ZenTriq com.zentriq.app --web-dir=dist
   ```
2. **Adicionar a plataforma Android:**
   Instalar o pacote nativo para Android e adicionar a plataforma:
   ```bash
   pnpm add @capacitor/android
   npx cap add android
   ```
3. **Ponte de Comunicação com a API local:**
   Como a API local (`zentriq-api`) é hospedada localmente no computador em desenvolvimento (localhost:3001), o aplicativo Android precisa mapear as URLs do Axios para a rota de desenvolvimento (usando IP de rede do host, ex: `http://10.0.2.2:3001` no emulador ou o IP do computador na rede local).
4. **Build do APK:**
   * Gerar o build de produção do frontend (`pnpm run build`).
   * Sincronizar o build web com o projeto Android nativo (`npx cap copy` / `npx cap sync`).
   * Abrir o projeto no Android Studio (`npx cap open android`) e compilar o APK assinado ou de debug via Gradle (`Build > Build Bundle(s) / APK(s) > Build APK(s)`).
5. **Automação (Script de Build Android):**
   Criar um script PowerShell local `build-android.ps1` que automatize:
   * Compilação do frontend Vite.
   * Cópia de arquivos estáticos para o diretório nativo Android.
   * Compilação silenciosa usando a ferramenta de CLI do Gradle (`./gradlew assembleDebug` ou `./gradlew assembleRelease`).

---

### 5. Limpeza de Executáveis Obsoletos
* **Ação:** Removidos todos os instaladores pesados antigos e redundantes que estavam acumulados na raiz do workspace (`ZenTriq_Alertas.exe`, `ZenTriq_Cartoes_2.0.0.exe`, `ZenTriq_IA.exe`, `ZenTriq_Investimentos.exe`, `ZenTriq_Wrapped.exe`), liberando cerca de 840 MB de armazenamento em disco e mantendo o repositório limpo de ruídos obsoletos.

---

### 6. Sincronização com o GitHub e Auditoria do MongoDB
* **GitHub:** Commit e Push executados com sucesso para a branch `main` no repositório `https://github.com/RHilton369/ZenTriq.git`. Todos os arquivos de desenvolvimento novos de `zentriq-api` e `zentriq-web` foram rastreados e sincronizados com a nuvem, confirmando o estágio evolutivo v2.4.0 no repositório remoto.
* **MongoDB:** Executada a auditoria na base de dados do Atlas. Verificado através do script de depuração que todos os ativos de Renda Variável (`BBAS3`, `RANI3`, `AURE3`, `TASA4`) do usuário ativo já contêm a propriedade `quantity` populada com sucesso no banco, garantindo o fim do fallback dinâmico e assegurando a consistência física dos dados.
