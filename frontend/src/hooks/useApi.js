import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage, isCanceled } from '../utils/errors';

/**
 * Runs `fetcher(signal)` whenever `deps` change, with loading/error state, request
 * cancellation and a `reload` function for retry buttons. Previous data is kept while
 * a new request is in flight so filtered lists do not flash empty.
 */
export default function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetcherRef
      .current(controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (isCanceled(err)) return;
        setState((s) => ({ data: s.data, loading: false, error: getErrorMessage(err) }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}
