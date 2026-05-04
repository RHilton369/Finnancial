import { useState, useEffect } from 'react';

/**
 * Hook customizado para aplicar atraso (debounce) na atualização de um valor reativo.
 * Útil para otimizar chamadas de API em campos de busca ou filtragem em tempo real.
 * 
 * @param {any} value - O valor original a ser observado.
 * @param {number} [delay=300] - Tempo de espera em milissegundos antes de atualizar o valor debounced.
 * @returns {any} O valor atualizado após o período de inatividade.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // Configura um temporizador para atualizar o valor real após o delay
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    // Limpa o temporizador se o valor mudar antes do prazo, reiniciando a contagem
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
