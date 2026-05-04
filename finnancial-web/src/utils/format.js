import { format, formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value, options = {}) {
  const absVal = Math.abs(value ?? 0);
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
    ...options
  }).format(absVal);
  return value < 0 ? `- ${formatted}` : formatted;
}

export function formatCurrencyCompact(value) {
  const abs = Math.abs(value ?? 0);
  if (abs >= 1_000_000) return `R$ ${(abs/1_000_000).toFixed(1)}M`;
  if (abs >= 10_000)    return `R$ ${(abs/1_000).toFixed(1)}K`;
  return formatCurrency(abs);
}

export function formatDate(dateStr, pattern = "d 'de' MMM") {
  return format(parseISO(dateStr), pattern, { locale: ptBR });
}

export function formatMonthYear(month, year) {
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${months[month - 1]} ${year}`;
}

export function formatMonthLabel(month) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[month - 1] || '';
}

export function formatRelativeDate(dateStr) {
  return formatDistanceToNow(parseISO(dateStr), { locale: ptBR, addSuffix: true });
}

export function getDaysUntil(dateStr) {
  return differenceInDays(parseISO(dateStr), new Date());
}

export function formatPct(value) {
  return `${(value ?? 0).toFixed(1)}%`;
}
