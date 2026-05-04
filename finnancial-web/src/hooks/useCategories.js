import { useState, useEffect } from 'react';
import { categoriesApi } from '../api/categories';

/**
 * Hook customizado para gerenciar a listagem de categorias financeiras.
 * Permite filtragem por tipo (receita/despesa).
 * 
 * @param {string|null} [type=null] - Filtro opcional por tipo ('income' | 'expense').
 * @returns {{data: Array|null, loading: boolean}} Lista de categorias e estado de carregamento.
 */
export function useCategories(type = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCategories = () => {
    const params = type ? { type } : {};
    setLoading(true);
    categoriesApi.list(params)
      .then(res => { 
        setData(res.data); 
      })
      .catch(err => {
        // Tratamento de erro silencioso ou via toast global
      })
      .finally(() => { 
        setLoading(false); 
      });
  };

  useEffect(() => {
    fetchCategories();
  }, [type]);

  return { data, loading, refresh: fetchCategories };
}
