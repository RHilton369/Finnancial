import { useState } from 'react';

/**
 * Hook customizado para persistência de estado reativo no localStorage do navegador.
 * Sincroniza um estado do React com uma chave específica no armazenamento local.
 * 
 * @param {string} key - Chave utilizada para salvar no localStorage.
 * @param {any} defaultValue - Valor inicial caso a chave não exista ou seja inválida.
 * @returns {[any, Function]} Um array contendo o valor atual e uma função para atualizá-lo.
 */
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      // Retorna o valor padrão em caso de erro de parsing ou acesso bloqueado
      return defaultValue;
    }
  });

  /**
   * Atualiza o estado do React e persiste o novo valor no armazenamento local.
   * 
   * @param {any|Function} newValue - Novo valor ou função de atualização.
   */
  function setStoredValue(newValue) {
    const resolved = typeof newValue === 'function' ? newValue(value) : newValue;
    setValue(resolved);
    localStorage.setItem(key, JSON.stringify(resolved));
  }

  return [value, setStoredValue];
}
