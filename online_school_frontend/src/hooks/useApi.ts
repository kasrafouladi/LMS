import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Simple data-fetching hook.
 * Re-runs whenever `deps` change (like useEffect).
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(() => listCourses(), []);
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const counter = useRef(0);

  const run = useCallback(() => {
    const id = ++counter.current;
    setLoading(true);
    setError(null);
    fetcher()
      .then(res => { if (id === counter.current) setData(res); })
      .catch(err => {
        if (id !== counter.current) return;
        if (err instanceof ApiError) setError(err.message);
        else setError('خطای ناشناخته');
      })
      .finally(() => { if (id === counter.current) setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}
