"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createCategory, deleteCategory } from "@/lib/api";
import { formatCurrency } from "@/lib/formatters";
import type { Category, NotificationState } from "@/types";

interface CategoriesTabProps {
  categorias: Category[];
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}

export default function CategoriesTab({
  categorias,
  setNotification,
  refreshData,
}: CategoriesTabProps) {
  const [newCategory, setNewCategory] = useState({ name: "", color: "#3b82f6" });

  const handleCreate = async () => {
    if (!newCategory.name) return;

    try {
      await createCategory(newCategory);
      setNotification({ msg: "Categoria criada!", type: "success" });
      setNewCategory({ name: "", color: "#3b82f6" });
      refreshData();
    } catch {
      setNotification({ msg: "Erro ao criar categoria.", type: "error" });
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Excluir a categoria "${cat.name}"?`)) return;

    try {
      await deleteCategory(cat.id);
      setNotification({ msg: "Categoria removida!", type: "success" });
      refreshData();
    } catch {
      setNotification({ msg: "Erro ao excluir.", type: "error" });
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Nova Categoria</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Nome da categoria (ex: Lazer)"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          <input
            type="color"
            value={newCategory.color}
            onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
            className="w-16 h-12 bg-white/5 border border-white/10 rounded-xl p-1 cursor-pointer"
          />
          <button
            onClick={handleCreate}
            className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shrink-0"
          >
            Adicionar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorias.map((cat) => (
          <div
            key={cat.id}
            className="glass-card p-6 flex justify-between items-center group hover:translate-y-[-2px] transition-all border-b-2"
            style={{ borderBottomColor: cat.color }}
          >
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <div>
                <h3 className="font-bold text-white">{cat.name}</h3>
                <p className="text-xs text-gray-500">Saldo: {formatCurrency(cat.value || 0)}</p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(cat)}
              className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
