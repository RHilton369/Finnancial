import { useState, useEffect } from 'react';
import { goalsApi } from '../api/goals';

/**
 * Hook customizado para gerenciar a listagem de metas financeiras do usuário.
 * 
 * @returns {{data: Array|null, loading: boolean, error: any, refetch: Function}} Lista de metas e estado de carregamento.
 */
export function useGoals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    goalsApi.list()
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
  }, []);

  /**
   * Reseta os dados para forçar uma nova chamada de API no próximo ciclo.
   */
  const refetch = () => setData(null);

  return { data, loading, error, refetch };
}
