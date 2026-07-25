import { useCallback, useEffect, useRef, useState } from "react";

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Runs an async fetcher, tracks loading/error/data, and optionally re-runs it
 * on an interval. One hook so every dashboard panel behaves the same way —
 * shows a spinner first, an error message on failure, data when it lands.
 *
 * `deps` re-fetches when they change (e.g. a range toggle). `pollMs` keeps a
 * panel live without a manual refresh.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  pollMs?: number
): State<T> & { refetch: () => void } {
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: true,
    error: null,
  });

  // Keep the latest fetcher without making it a dependency, so passing an
  // inline arrow function doesn't cause an infinite loop.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async (isBackground: boolean) => {
    if (!isBackground) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        // On a background poll failure, keep showing the last good data.
        data: isBackground ? s.data : null,
        loading: false,
        error: err instanceof Error ? err.message : "Something went wrong",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    run(false);
    if (!pollMs) return;
    const timer = setInterval(() => run(true), pollMs);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, pollMs]);

  return { ...state, refetch: () => run(false) };
}
