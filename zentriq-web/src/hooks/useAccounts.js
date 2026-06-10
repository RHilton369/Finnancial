import { useState, useEffect } from 'react';
import { accountsApi } from '../api/accounts';

/**
 * Hook customizado para gerenciar a listagem de contas financeiras.
 * Lida com o estado de carregamento e armazena os dados vindos da API.
 * 
 * @returns {{data: Array|null, loading: boolean}} Objeto contendo os dados das contas e estado de processamento.
 */
export function useAccounts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = () => {
    setLoading(true);
    accountsApi.list()
      .then(res => { 
        setData(res.data); 
      })
      .catch(err => {
        // Erros de API podem ser tratados aqui ou via toast global
      })
      .finally(() => { 
        setLoading(false); 
      });
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return { data, loading, refresh: fetchAccounts };
}
