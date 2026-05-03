"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, Bell, Settings,
  MessageSquare, PieChart as PieIcon, Activity, Trash2, Edit2, X,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { deleteTransaction, updateTransaction } from "@/lib/api";
import type { DashboardProps, NotificationState } from "@/types";
import ChatTab from "./tabs/ChatTab";
import CategoriesTab from "./tabs/CategoriesTab";
import AlertsTab from "./tabs/AlertsTab";
import SettingsTab from "./tabs/SettingsTab";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function DashboardClient({
  receitas, despesas, saldo, fluxoCaixa,
  categorias, transacoes, trendReceitas, trendDespesas,
}: DashboardProps) {
  const router = useRouter();
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  /** Re-fetch server-side sem recarregar a página inteira */
  const refreshData = () => router.refresh();

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta transação?")) return;
    try {
      await deleteTransaction(id);
      setNotification({ msg: "Transação excluída com sucesso!", type: "success" });
      refreshData();
    } catch {
      setNotification({ msg: "Falha ao excluir.", type: "error" });
    }
  };

  const handleEdit = (t: any) => {
    setEditingTransaction({
      ...t,
      amount: Number(t.amount),
      date: new Date(t.date).toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTransaction(editingTransaction.id, editingTransaction);
      setNotification({ msg: "Alterações salvas!", type: "success" });
      setIsModalOpen(false);
      refreshData();
    } catch {
      setNotification({ msg: "Erro ao salvar.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTransactions = (transacoes || []).filter(
    (t) =>
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Renderização das Abas ---

  const renderActiveTab = () => {
    if (isInitialLoading) {
      return (
        <div className="animate-pulse space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="glass-card h-32 bg-white/5" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card h-80 lg:col-span-2 bg-white/5" />
            <div className="glass-card h-80 bg-white/5" />
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "chat":
        return <ChatTab activeTab={activeTab} />;
      case "categories":
        return (
          <CategoriesTab
            categorias={categorias}
            setNotification={setNotification}
            refreshData={refreshData}
          />
        );
      case "alerts":
        return (
          <AlertsTab
            activeTab={activeTab}
            categorias={categorias}
            setNotification={setNotification}
            refreshData={refreshData}
          />
        );
      case "settings":
        return <SettingsTab />;
      case "dashboard":
        return renderDashboard();
      default:
        return renderPlaceholder();
    }
  };

  const renderPlaceholder = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] glass-card p-12 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
        <Activity className="w-10 h-10 text-emerald-400 opacity-50" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Seção em Desenvolvimento</h2>
      <p className="text-gray-400 max-w-md">
        A aba <span className="text-emerald-400 font-bold uppercase">{activeTab}</span> está sendo preparada.
      </p>
      <button onClick={() => setActiveTab("dashboard")} className="mt-8 px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg">
        Voltar ao Dashboard
      </button>
    </div>
  );

  const renderDashboard = () => (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receitas */}
        <div className="glass-card p-6 border-l-4 border-emerald-500 hover:translate-y-[-4px] transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">Receitas Mensais</p>
              <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(receitas)}</h3>
              <p className={`text-xs mt-4 flex items-center gap-1 font-medium px-2 py-1 rounded-full w-fit ${trendReceitas >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"}`}>
                {trendReceitas >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendReceitas > 0 ? `+${trendReceitas}` : trendReceitas}% vs mês anterior
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Wallet className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="glass-card p-6 border-l-4 border-red-500 hover:translate-y-[-4px] transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">Despesas Mensais</p>
              <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(despesas)}</h3>
              <p className={`text-[10px] font-medium mt-1 ${trendDespesas >= 0 ? "text-red-400" : "text-emerald-400"}`}>
                {trendDespesas >= 0 ? "Acima" : "Abaixo"} da média ({trendDespesas}%)
              </p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        {/* Saldo */}
        <div className="glass-card p-6 border-l-4 border-blue-500 hover:translate-y-[-4px] transition-all duration-300 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-medium">Saldo Disponível</p>
              <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(saldo)}</h3>
              <p className="text-xs text-blue-400 mt-4 flex items-center gap-1 font-medium bg-blue-500/10 px-2 py-1 rounded-full w-fit">
                <Activity className="w-3 h-3" /> Sugestão: Investir R$ {Math.round(saldo * 0.2)}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <PieIcon className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-xl font-semibold text-white mb-6">Fluxo de Caixa (Mensal)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fluxoCaixa}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4b5563" />
                <YAxis stroke="#4b5563" />
                <Tooltip contentStyle={{ backgroundColor: "rgba(23, 25, 31, 0.9)", border: "none", borderRadius: "10px" }} itemStyle={{ color: "#fff" }} />
                <Area type="monotone" dataKey="receita" stroke="#10b981" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} />
                <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesa)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/3">
            <h3 className="text-xl font-semibold text-white mb-6">Categorias</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categorias} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {categorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "rgba(23, 25, 31, 0.95)", border: "none", borderRadius: "16px", backdropFilter: "blur(10px)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-full md:w-2/3 space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {categorias.map((item, index) => {
              const percent = despesas > 0 ? ((item.value / despesas) * 100).toFixed(1) : "0";
              return (
                <div key={item.name} className="group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }} />
                      {item.name}
                    </span>
                    <span className="text-white font-bold">{formatCurrency(item.value)} <span className="text-gray-500 font-normal ml-2">({percent}%)</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000 group-hover:brightness-125" style={{ width: `${percent}%`, backgroundColor: item.color || COLORS[index % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transações Recentes */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-xl font-semibold text-white">Transações Recentes</h3>
          <div className="relative w-full md:w-64">
            <input type="text" placeholder="Buscar transação..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-4 pr-10 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none transition" />
            <Activity className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="pb-4 font-medium">Descrição</th>
                <th className="pb-4 font-medium">Categoria</th>
                <th className="pb-4 font-medium">Data</th>
                <th className="pb-4 font-medium text-right">Valor</th>
                <th className="pb-4 font-medium text-center w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {filteredTransactions.map((t: any) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-4 font-medium text-white">{t.description}</td>
                  <td className="py-4"><span className="px-2 py-1 rounded-md bg-white/5 text-xs text-gray-400">{t.category?.name || "Sem Categoria"}</span></td>
                  <td className="py-4 text-sm text-gray-500">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                  <td className={`py-4 text-right font-bold ${t.type === "INCOME" ? "text-emerald-400" : "text-red-400"}`}>{t.type === "INCOME" ? "+" : "-"} {formatCurrency(t.amount)}</td>
                  <td className="py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500 italic">Nenhuma transação encontrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // --- Layout Principal ---

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative bg-[#0f1117] text-gray-100">
      {notification && (
        <div className={`fixed top-6 right-6 z-[100] p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${notification.type === "success" ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"} backdrop-blur-md border border-white/20`}>
          <Activity className="w-5 h-5" />
          <span className="font-medium">{notification.msg}</span>
        </div>
      )}

      {isSaving && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="glass-card p-8 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white font-bold tracking-widest">PROCESSANDO...</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-full md:w-64 glass-card m-4 p-6 flex-col gap-8 hidden md:flex border-r border-white/5">
        <div className="flex items-center gap-3 text-2xl font-bold text-white tracking-wider">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          FinanZen
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { key: "dashboard", label: "Dashboard", icon: Activity },
            { key: "chat", label: "Chat (WhatsApp)", icon: MessageSquare },
            { key: "categories", label: "Categorias", icon: PieIcon },
            { key: "alerts", label: "Alertas", icon: Bell },
            { key: "settings", label: "Configurações", icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === key ? "bg-emerald-500/10 text-emerald-400 font-medium" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
            >
              <Icon className="w-5 h-5" /> {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Visão Geral</h1>
            <p className="text-gray-400">Acompanhe a saúde do seu bolso com IA.</p>
          </div>
          <button className="glass-card p-3 rounded-full hover:bg-white/10 transition">
            <Bell className="w-6 h-6 text-gray-300" />
          </button>
        </header>

        {renderActiveTab()}
      </main>

      {/* Modal de Edição */}
      {isModalOpen && editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md p-8 relative shadow-2xl border border-white/10">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Editar Transação</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Descrição</label>
                <input type="text" value={editingTransaction.description} onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Valor (R$)</label>
                  <input type="number" value={editingTransaction.amount} onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Tipo</label>
                  <select value={editingTransaction.type} onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition">
                    <option value="INCOME">Receita</option>
                    <option value="EXPENSE">Despesa</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data</label>
                  <input type="date" value={editingTransaction.date} onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
                  <select value={editingTransaction.categoryId} onChange={(e) => setEditingTransaction({ ...editingTransaction, categoryId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition">
                    <option value="">Sem Categoria</option>
                    {categorias.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition font-medium">Cancelar</button>
                <button onClick={handleSave} disabled={isSaving} className={`flex-1 p-3 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition font-bold flex items-center justify-center gap-2 ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
