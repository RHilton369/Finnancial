import { useState, useEffect } from 'react';
import { transactionsApi } from '../api/transactions';

/**
 * Hook customizado para gerenciar a listagem de transações com filtros e paginação.
 * 
 * @param {Object} filters - Critérios de busca (mês, ano, categoria, tipo, etc).
 * @param {any} refetchSignal - Gatilho externo para forçar a atualização dos dados.
 * @returns {{data: Object|null, loading: boolean, error: any, refetch: Function}}
 */
export function useTransactions(filters, refetchSignal) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    
    // Converte filtros em string para o array de dependência estável
    transactionsApi.list(filters)
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
  }, [JSON.stringify(filters), refetchSignal]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => { /* Gerenciado via refetchSignal no componente pai */ } 
  };
}
