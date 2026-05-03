# 💎 FinanZen v2.2.14 — Enterprise & Audit Edition

O **FinanZen** é um sistema avançado de gestão financeira pessoal e empresarial, concebido com foco em escalabilidade, resiliência atômica e precisão contábil. A versão v2.2.14 marca a consolidação da arquitetura de transações interativas, garantindo que todas as mutações no banco de dados sejam infalíveis.

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
6. **Output:** Disponível em `finnancial-web/release/Finnancial Setup <version>.exe`. O Instalador já configura o atalho na Área de Trabalho (`shortcut: true` nativo do electron-builder).

## 🩺 Manutenção e Troubleshoot

Caso detecte qualquer desvio nos dashboards, utilize as rotas de utilitários mantidas no controlador de Manutenção (`maintenanceController`):
- **Recalcular Saldos (`/maintenance/recalculate`):** Processo corretivo pesado. Faz a varredura atômica de todas as transações cronológicas reconstruindo os saldos dinamicamente de cada conta.
- **Check de Consistência (`/maintenance/consistency`):** Compara saldos operacionais e contábeis devolvendo métricas de diferença.

---
_A excelência técnica não é um diferencial, é um requisito mínimo._
