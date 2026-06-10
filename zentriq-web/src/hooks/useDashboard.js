import { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboard';

/**
 * Hook customizado para gerenciar os dados consolidados do dashboard.
 * Realiza chamadas paralelas para buscar o resumo mensal e o fluxo de caixa histórico.
 * 
 * @param {number} month - Mês de referência para o resumo.
 * @param {number} year - Ano de referência para o resumo.
 * @returns {{summary: Object|null, cashflow: Array|null, loading: boolean, error: string|null}}
 */
export function useDashboard(month, year) {
  const [data, setData] = useState(null);
  const [cashflow, setCashflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    if (!month || !year) return;
    
    setLoading(true);
    try {
      // Busca dados em paralelo para melhorar a performance de carregamento inicial
      const [summaryRes, cashflowRes] = await Promise.all([
        dashboardApi.summary(month, year).catch(e => ({ error: true, original: e })),
        dashboardApi.cashflow(6).catch(e => ({ error: true, original: e })),
      ]);

      // Processa resposta do resumo mensal
      if (!summaryRes.error) {
        setData(summaryRes.data);
      } else {
        setError('Erro ao carregar resumo mensal');
      }

      // Processa resposta do fluxo de caixa
      if (!cashflowRes.error) {
        setCashflow(cashflowRes.data);
      }
    } catch (err) {
      setError('Erro inesperado na comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [month, year]);

  return { summary: data, cashflow, loading, error, refresh: fetchDashboard };
}
