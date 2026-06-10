# 💰 ZenTriq Web — Desktop App

> Aplicativo desktop de controle financeiro pessoal construído com **Electron + Vite + React**.

---

## 🏗️ Arquitetura

```
zentriq-web/
├── electron/
│   ├── main.js          # Processo principal do Electron
│   └── preload.js       # Bridge segura (contextIsolation)
├── src/
│   ├── api/             # Clientes HTTP (axios)
│   ├── context/         # Contextos React (AuthContext)
│   ├── pages/           # Páginas da aplicação
│   └── components/      # Componentes reutilizáveis
├── dist/                # Build do frontend (gerado)
├── dist-electron/       # Build do Electron (gerado)
├── release/             # Instalador gerado pelo electron-builder
├── vite.config.js       # Configuração do Vite + electron plugin
└── package.json         # Dependências e configuração do electron-builder
```

---

## 🚀 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm run dev` | Inicia em modo desenvolvimento (Electron + Vite HMR) |
| `pnpm run build` | Build apenas do frontend (pasta `dist/`) |
| `pnpm run build:electron` | Build completo + gera instalador `.exe` |
| `pnpm run preview` | Preview do build do frontend |

---

## 📦 Gerando o Instalador

```powershell
pnpm run build:electron
```

O instalador será gerado em:
```
release/ZenTriq Setup 1.0.0.exe
```

---

## ⚙️ Configuração Técnica

### Vite (`vite.config.js`)

| Opção | Valor | Motivo |
|-------|-------|--------|
| `base` | `'./'` | **Obrigatório** para Electron — sem isso o app não carrega em produção (paths absolutos quebram no protocolo `file://`) |
| `outDir` | `'dist'` | Pasta de saída do build |
| `emptyOutDir` | `true` | Limpa antes de cada build |
| `manualChunks` | Separado por vendor | Code-splitting para reduzir bundle principal |

### Electron Builder (`package.json → build`)

```json
{
  "build": {
    "appId": "com.zentriq.app",
    "directories": { "output": "release" },
    "files": ["dist/**/*", "dist-electron/**/*"],
    "win": { "target": "nsis" },
    "nsis": { "oneClick": false, "allowToChangeInstallationDirectory": true }
  }
}
```

---

## 🐛 Histórico de Correções

### ✨ Melhoria: Centralização de Layout das Telas Principais
**Data:** 2026-04-08  
**Implementação:** Adicionado contêiner limitador de largura com auto-alinhamento (margin 0 auto) dentro de `AppLayout.jsx` e `Layout.module.css`.  
**Efeito:** O Design de páginas como Dashboard, Transações, Orçamentos, Metas, e Relatórios agora não se deformam e/ou não ocupam a largura completa em casos de monitores ultra-wide, aparentando uma UI mais harmônica e profissional de forma global.

### 🔴 Bug: "Not allowed to load local resource" no build
**Data:** 2026-04-07  
**Causa:** O Vite gerava referências de assets com paths absolutos (ex: `/assets/app.js`). Isso funciona em `localhost` (dev) mas quebra no protocolo `file://` usado pelo Electron em produção.  
**Solução:** Adicionar `base: './'` no `vite.config.js` — força o Vite a gerar paths relativos (`./assets/app.js`), compatíveis com o protocolo `file://`.

---

## 🔧 Stack de Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Desktop | Electron 41 |
| Frontend | React 18 + Vite 5 |
| Roteamento | React Router DOM 6 |
| Formulários | React Hook Form + Zod |
| Gráficos | Recharts |
| HTTP | Axios |
| Build | vite-plugin-electron + electron-builder |
| Package Manager | pnpm |

---

## 🌐 Backend

O app consome uma API REST local. Configure a URL no arquivo `.env`:

```env
VITE_API_URL=http://localhost:3001
```

---

*Última atualização: 2026-04-07*
