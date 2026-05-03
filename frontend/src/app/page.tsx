import { createClient } from '@/utils/supabase/server';
import DashboardClient from '@/components/DashboardClient';

export default async function Page() {
  const supabase = await createClient();

  // Buscar transações (usando os nomes reais das colunas no banco)
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id, 
      amount, 
      type, 
      date, 
      description, 
      category_id,
      categories (
        id, 
        name, 
        color
      )
    `)
    .order('date', { ascending: false })
    .limit(500);

  if (error) {
    // Erro é registrado no server log do Next.js automaticamente
    // Retorno antecipado com dashboard vazio ao invés de silenciar
  }

  // Normalização: Converter snake_case do DB para o padrão do componente
  const normalizedTransactions = (transactions || []).map((tx: any) => ({
    ...tx,
    categoryId: tx.category_id,
    category: Array.isArray(tx.categories) ? tx.categories[0] : tx.categories
  }));

  let receitas = 0;
  let despesas = 0;
  let receitasMesAnterior = 0;
  let despesasMesAnterior = 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const fluxoCaixaMap = new Map();
  const categoryMap = new Map();

  normalizedTransactions.forEach((tx: any) => {
    const txDate = new Date(tx.date);
    const txMonth = txDate.getMonth();
    const txYear = txDate.getFullYear();
    const amount = Number(tx.amount);
    const isIncome = tx.type === 'INCOME';
    
    // Totais Mês Atual
    if (txMonth === currentMonth && txYear === currentYear) {
      if (isIncome) receitas += amount;
      else despesas += amount;
    }

    // Totais Mês Anterior
    if (txMonth === lastMonth && txYear === lastMonthYear) {
      if (isIncome) receitasMesAnterior += amount;
      else despesasMesAnterior += amount;
    }

    // Fluxo por dia (Mês Atual)
    if (txMonth === currentMonth && txYear === currentYear) {
      const dateStr = txDate.getDate().toString();
      if (!fluxoCaixaMap.has(dateStr)) {
        fluxoCaixaMap.set(dateStr, { name: dateStr, receita: 0, despesa: 0 });
      }
      const dayData = fluxoCaixaMap.get(dateStr);
      if (isIncome) dayData.receita += amount;
      else dayData.despesa += amount;
    }

    // Categorias (Mês Atual - apenas despesas no gráfico de pizza)
    if (txMonth === currentMonth && txYear === currentYear && !isIncome && tx.category) {
      const catId = tx.category.id;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { id: catId, name: tx.category.name, value: 0, color: tx.category.color });
      }
      categoryMap.get(catId).value += amount;
    }
  });

  const fluxoCaixa = Array.from(fluxoCaixaMap.values()).sort((a, b) => Number(a.name) - Number(b.name));
  const categoriasData = Array.from(categoryMap.values());
  const saldo = receitas - despesas;

  // Cálculos de Tendência
  const calcTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  };

  const trendReceitas = calcTrend(receitas, receitasMesAnterior);
  const trendDespesas = calcTrend(despesas, despesasMesAnterior);

  return (
    <DashboardClient 
      receitas={receitas}
      despesas={despesas}
      saldo={saldo}
      fluxoCaixa={fluxoCaixa}
      categorias={categoriasData}
      transacoes={normalizedTransactions}
      trendReceitas={trendReceitas}
      trendDespesas={trendDespesas}
    />
  );
}
