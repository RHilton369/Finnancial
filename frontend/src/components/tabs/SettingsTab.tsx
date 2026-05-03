"use client";

import { Settings } from "lucide-react";

export default function SettingsTab() {
  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Settings className="w-6 h-6 text-emerald-500" /> Configurações da Conta
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
                Nome de Exibição
              </label>
              <input
                type="text"
                defaultValue="Usuário FinanZen"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
                WhatsApp Vinculado
              </label>
              {/* TODO: Buscar do banco via API ao invés de hardcoded */}
              <input
                type="text"
                disabled
                value="Vinculado via Evolution API"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Preferências do Sistema</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-medium">Modo Escuro (Amoled)</p>
                  <p className="text-xs text-gray-500">
                    Otimizado para economia de bateria e conforto visual.
                  </p>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-medium">Notificações por WhatsApp</p>
                  <p className="text-xs text-gray-500">
                    Receber alertas de gastos e resumos semanais.
                  </p>
                </div>
                <div className="w-12 h-6 bg-white/10 rounded-full relative">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end">
            <button className="px-8 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 border-l-4 border-red-500/50">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Zona de Perigo</h3>
        <p className="text-sm text-gray-500 mb-6">
          Ao excluir sua conta, todos os dados de transações e categorias serão removidos
          permanentemente.
        </p>
        <button className="px-6 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500 hover:text-white transition">
          Apagar Meus Dados
        </button>
      </div>
    </div>
  );
}
