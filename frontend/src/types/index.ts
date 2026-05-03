// --- Constantes de Domínio ---

export const TRANSACTION_TYPE = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
} as const;

export const LIMIT_PERIOD = {
  MONTHLY: "MONTHLY",
  WEEKLY: "WEEKLY",
} as const;

export const MESSAGE_STATUS = {
  PROCESSED: "PROCESSED",
  FAILED: "FAILED",
} as const;

// --- Interfaces de Domínio ---

export interface Category {
  id: string;
  name: string;
  value: number;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: keyof typeof TRANSACTION_TYPE;
  date: string;
  description: string;
  categoryId: string;
  category?: Category;
}

export interface FluxoCaixa {
  name: string;
  receita: number;
  despesa: number;
}

export interface MessageLog {
  id: string;
  from: string;
  text: string;
  response: string;
  isImage: boolean;
  status: keyof typeof MESSAGE_STATUS;
  createdAt: string;
}

export interface BudgetLimit {
  id: string;
  amount: number;
  period: keyof typeof LIMIT_PERIOD;
  categoryId: string;
  category?: Category;
}

export interface NotificationState {
  msg: string;
  type: "success" | "error";
}

// --- Props de Componentes ---

export interface DashboardProps {
  receitas: number;
  despesas: number;
  saldo: number;
  fluxoCaixa: FluxoCaixa[];
  categorias: Category[];
  transacoes: Transaction[];
  trendReceitas: number;
  trendDespesas: number;
}

/** Props compartilhadas entre as abas que precisam de notificação e formatação */
export interface TabProps {
  categorias: Category[];
  formatCurrency: (value: number) => string;
  setNotification: (n: NotificationState) => void;
  refreshData: () => void;
}
