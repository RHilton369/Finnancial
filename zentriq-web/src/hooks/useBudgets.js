import { useState, useEffect } from 'react';
import { budgetsApi } from '../api/budgets';

/**
 * Hook customizado para gerenciar a listagem de orçamentos mensais.
 * 
 * @param {number} month - Mês de referência (1-12).
 * @param {number} year - Ano de referência.
 * @returns {{data: Array|null, loading: boolean, error: any, refetch: Function}}
 */
export function useBudgets(month, year) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!month || !year) return;
    
    let cancelled = false;
    setLoading(true);

    budgetsApi.list(month, year)
      .then(res => { 
        if (!cancelled) { 
          setData(res.data); 
          setError(null); 
        } 
      })
      .catch(err => { 
        if (!cancelled) setError(err); 
      })
      .finally(() => { 
        if (!cancelled) setLoading(false); 
      });

    return () => { cancelled = true; };
  }, [month, year]);

  /**
   * Reseta o estado local para forçar um novo carregamento na próxima renderização
   * ou via efeito colateral.
   */
  const refetch = () => setData(null);

  return { data, loading, error, refetch };
}
