/** URL base da API backend, centralizada para evitar hardcode espalhado */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";

// --- Helpers genéricos de fetch ---

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// --- Transações ---

export function deleteTransaction(id: string): Promise<{ success: boolean }> {
  return request(`/transactions/${id}`, { method: "DELETE" });
}

export function updateTransaction(
  id: string,
  data: Record<string, unknown>
): Promise<{ success: boolean }> {
  return request(`/transactions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// --- Categorias ---

export function fetchCategories() {
  return request<{ id: string; name: string; color: string }[]>("/categories");
}

export function createCategory(data: { name: string; color?: string }) {
  return request("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: string): Promise<{ success: boolean }> {
  return request(`/categories/${id}`, { method: "DELETE" });
}

// --- Limites ---

import type { BudgetLimit } from "@/types";

export function fetchLimits(): Promise<BudgetLimit[]> {
  return request("/limits");
}

export function createLimit(data: {
  categoryId: string;
  amount: number;
  period?: string;
}) {
  return request("/limits", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteLimit(id: string): Promise<{ success: boolean }> {
  return request(`/limits/${id}`, { method: "DELETE" });
}

// --- Message Logs ---

import type { MessageLog } from "@/types";

export function fetchMessageLogs(): Promise<MessageLog[]> {
  return request("/message-logs");
}
