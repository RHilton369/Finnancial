"use client";

import { useState, useEffect } from "react";

/**
 * Hook genérico para buscar dados da API quando uma aba é ativada.
 * Elimina duplicação do padrão: setLoading → fetch → setData → catch → finally.
 */
export function useFetchOnTab<T>(
  url: string,
  activeTab: string,
  targetTab: string
): { data: T[]; isLoading: boolean; error: string | null } {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== targetTab) return;

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [activeTab, targetTab, url]);

  return { data, isLoading, error };
}
