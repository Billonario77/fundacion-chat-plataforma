import { useState, useEffect, useCallback, useRef } from 'react';

interface RefreshOptions {
  interval?: number; // Intervalo en ms
  enabled?: boolean; // Si está habilitado
  onRefresh: () => Promise<void>; // Función de refresco
  dependencies?: any[]; // Dependencias para reiniciar el intervalo
  showLoadingOverlay?: boolean; // Si muestra overlay cuando recarga
}

export const useIntelligentRefresh = ({
  interval = 30000,
  enabled = true,
  onRefresh,
  dependencies = [],
  showLoadingOverlay = false
}: RefreshOptions) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (isRefreshing || !enabled) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      await onRefresh();
      if (mountedRef.current) {
        setLastRefresh(new Date());
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
        console.error('Error en refresco:', err);
      }
    } finally {
      if (mountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh, isRefreshing, enabled]);

  // Refresco automático
  useEffect(() => {
    mountedRef.current = true;
    
    if (!enabled) return;
    
    // Ejecutar inmediatamente
    refresh();
    
    // Configurar intervalo
    timeoutRef.current = setInterval(refresh, interval);
    
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, interval, refresh, ...dependencies]);

  // Refresco manual
  const manualRefresh = useCallback(async () => {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    await refresh();
    
    // Reiniciar intervalo
    if (enabled) {
      timeoutRef.current = setInterval(refresh, interval);
    }
  }, [refresh, interval, enabled]);

  return {
    isRefreshing,
    lastRefresh,
    error,
    manualRefresh,
    lastRefreshTime: lastRefresh ? lastRefresh.toLocaleTimeString() : 'Nunca'
  };
};
