import { useEffect } from 'react';

/**
 * Hook customizado para detectar cliques ou toques fora de um elemento específico.
 * Útil para fechar modais, menus suspensos ou qualquer componente de sobreposição.
 * 
 * @param {import('react').RefObject} ref - Referência do componente DOM a ser monitorado.
 * @param {Function} handler - Função callback disparada quando ocorre um clique fora.
 */
export function useClickOutside(ref, handler) {
  useEffect(() => {
    /**
     * Listener que verifica se o alvo do clique está dentro da árvore do elemento referenciado.
     * @param {MouseEvent|TouchEvent} event 
     */
    function listener(event) {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    }

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
