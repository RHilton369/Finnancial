/** Instância reutilizável — evita criar um novo Intl.NumberFormat a cada chamada */
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}
