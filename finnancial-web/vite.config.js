import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import path from 'path'

export default defineConfig({
  /**
   * IMPORTANTE: base: './' é OBRIGATÓRIO para builds Electron.
   * Sem isso, o Vite gera referências absolutas (ex: /assets/app.js)
   * que só funcionam via HTTP. No protocolo file://, o Electron não
   * consegue resolver esses caminhos → erro "Not allowed to load local resource".
   */
  base: './',

  plugins: [
    react(),
    electron([
      {
        // Processo principal do Electron
        entry: 'electron/main.js',
      },
      {
        // Script de preload (ponte segura entre renderer e main)
        entry: 'electron/preload.js',
        onstart(options) {
          options.reload()
        },
      },
    ]),
  ],

  resolve: {
    alias: {
      // Atalho '@' aponta para a pasta src
      '@': path.resolve(__dirname, './src')
    }
  },

  build: {
    // Pasta de saída do build do frontend
    outDir: 'dist',
    // Limpa a pasta antes de cada build
    emptyOutDir: true,
    // Aumenta o limite de aviso de chunk (padrão 500kb)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        /**
         * Code-splitting manual: separa as libs grandes em chunks próprios.
         * Isso reduz o bundle principal e melhora o carregamento inicial.
         */
        manualChunks: {
          // Core do React
          'vendor-react': ['react', 'react-dom'],
          // Roteamento
          'vendor-router': ['react-router-dom'],
          // Biblioteca de gráficos (maior dependência)
          'vendor-charts': ['recharts'],
          // Utilitários de formulário
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Ícones
          'vendor-icons': ['lucide-react'],
          // Data e HTTP
          'vendor-utils': ['date-fns', 'axios'],
        },
      },
    },
  }
})
