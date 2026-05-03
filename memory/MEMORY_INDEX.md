# 🧠 Finnancial - Memorial de Memória

Este diretório atua como o banco de conhecimento histórico do projeto **Finnancial**. Ele preserva o raciocínio, os erros e as decisões tomadas durante a transição da arquitetura legada (v1) para a moderna (v2).

---

## 🗺️ Guias Centrais (Base de Conhecimento)
- [**Guia Mestre (Mapas)**](../Base%20de%20Dados/GUIA_FINNANCIAL.md) - Documento principal para localização de diretórios, rotas e componentes.
- [**Script BD (Estrutura)**](../Base%20de%20Dados/Script%20BD.md) - Estrutura definitiva das tabelas baseadas no Prisma ORM.

## 💾 Registro Histórico de Desenvolvimento
Estes arquivos registram a evolução do sistema e devem ser mantidos para consultas de retrospectiva.

- [**`PROJETO.md`**](projeto.md) - Escopo original e visão geral do histórico de desenvolvimento.
- [**`HISTÓRICO_ERROS.md`**](erros.md) - Registro técnico detalhado dos bugs da fase SQLite/Manual e suas prevenções atuais.
- [**`STATUS_IMPLANTAÇÃO.md`**](status.md) - Histórico do progresso visual e funcional datado.
- [**`BACKEND_FIX.md`**](backend_fix.md) - Manual de procedimentos de manutenção para a arquitetura antiga.

---

## 🏛️ Visão da Arquitetura Atual (v2)
O projeto foi consolidado em uma stack moderna, eliminando os silos de erro citados nos logs históricos:
- **Backend**: Node/Express + **Prisma ORM** + **MongoDB**.
- **Observabilidade**: Logs estruturados com **Pino Logger**.
- **Frontend**: React/Vite integrado via **Electron Plugin**.

---

> [!TIP]
> **Por que manter estes logs?**
> Manter o histórico de erros é fundamental para evitar a reintrodução de bugs antigos e para o onboarding de novos desenvolvedores, que podem aprender com os desafios superados.
