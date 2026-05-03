"use client";

import { MessageSquare, Activity } from "lucide-react";
import { useFetchOnTab } from "@/hooks/useFetchOnTab";
import { API_BASE_URL } from "@/lib/api";
import type { MessageLog } from "@/types";

interface ChatTabProps {
  activeTab: string;
}

export default function ChatTab({ activeTab }: ChatTabProps) {
  const { data: messageLogs, isLoading, error } = useFetchOnTab<MessageLog>(
    `${API_BASE_URL}/message-logs`,
    activeTab,
    "chat"
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-2xl font-bold text-white">Histórico do WhatsApp</h2>

      {error && (
        <div className="glass-card p-4 text-red-400 text-sm border-l-2 border-red-500">
          Erro ao carregar mensagens: {error}
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 italic">Carregando conversas...</div>
        ) : messageLogs.length === 0 ? (
          <div className="glass-card p-12 text-center text-gray-500 italic">
            Nenhuma mensagem registrada ainda.
          </div>
        ) : (
          messageLogs.map((log) => (
            <div
              key={log.id}
              className="glass-card p-6 flex gap-4 hover:bg-white/5 transition-colors border-l-2 border-emerald-500/30"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  log.status === "PROCESSED" ? "bg-emerald-500/10" : "bg-red-500/10"
                }`}
              >
                <MessageSquare
                  className={`w-6 h-6 ${
                    log.status === "PROCESSED" ? "text-emerald-500" : "text-red-500"
                  }`}
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">De: {log.from}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-gray-300 italic">&quot;{log.text}&quot;</p>
                </div>
                <div className="flex items-start gap-2 text-sm text-emerald-400">
                  <Activity className="w-4 h-4 mt-1 shrink-0" />
                  <p>{log.response}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
