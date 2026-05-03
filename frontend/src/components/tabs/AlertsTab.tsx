"use client";

import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useFetchOnTab } from "@/hooks/useFetchOnTab";
import { API_BASE_URL, createLimit, deleteLimit } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import type { Category, BudgetLimit, NotificationState } from "@/types";

interface AlertsTabProps {
  activeTab: string;
  categorias: Category[];
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

export default function AlertsTab({
  activeTab,
  categorias,
  setNotification,
  refreshData,
}: AlertsTabProps) {
  const { data: limits, isLoading } = useFetchOnTab<BudgetLimit>(
    `${API_BASE_URL}/limits`,
    activeTab,
    "alerts"
  );

  const [newLimit, setNewLimit] = useState({
    categoryId: "",
    amount: 0,
    period: "MONTHLY",
  });

  const handleCreate = async () => {
    if (!newLimit.categoryId || !newLimit.amount) return;

    try {
      await createLimit(newLimit);
      setNotification({ msg: "Alerta configurado!", type: "success" });
      refreshData();
    } catch {
      setNotification({ msg: "Erro ao salvar.", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este alerta?")) return;
    await deleteLimit(id);
    refreshData();
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Configurar Alerta de Gastos</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
              Categoria
            </label>
            <select
              value={newLimit.categoryId}
              onChange={(e) => setNewLimit({ ...newLimit, categoryId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="">Selecionar...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
              Limite Mensal (R$)
            </label>
            <input
              type="number"
              placeholder="Ex: 500"
              value={newLimit.amount || ""}
              onChange={(e) => setNewLimit({ ...newLimit, amount: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
              Período
            </label>
            <select
              value={newLimit.period}
              onChange={(e) => setNewLimit({ ...newLimit, period: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="MONTHLY">Mensal</option>
              <option value="WEEKLY">Semanal</option>
            </select>
          </div>
          <button
            onClick={handleCreate}
            className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg h-12"
          >
            Salvar Alerta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center text-gray-500">Carregando limites...</div>
        ) : limits.length === 0 ? (
          <div className="col-span-full glass-card p-12 text-center text-gray-500">
            Nenhum limite configurado.
          </div>
        ) : (
          limits.map((lim) => {
            const currentSpent = categorias.find((c) => c.id === lim.categoryId)?.value || 0;
            const percent = Math.round((currentSpent / Number(lim.amount)) * 100);
            const isOver = percent >= 100;

            return (
              <div key={lim.id} className="glass-card p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Bell className={`w-5 h-5 ${isOver ? "text-red-500" : "text-emerald-500"}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{lim.category?.name}</h3>
                      <p className="text-xs text-gray-500">
                        Limite {lim.period === "MONTHLY" ? "Mensal" : "Semanal"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(lim.id)}
                    className="text-gray-600 hover:text-red-400 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Gasto: {formatCurrency(currentSpent)}</span>
                    <span className={`font-bold ${isOver ? "text-red-500" : "text-white"}`}>
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        isOver ? "bg-red-500" : percent > 80 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                  <p className="text-right text-xs text-gray-500">
                    Meta: {formatCurrency(Number(lim.amount))}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
