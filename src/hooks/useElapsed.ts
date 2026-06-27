/**
 * Live elapsed-seconds counter since a start timestamp (epoch millis).
 * Ticks once per second; used for the in-session duration readout.
 */
import { useEffect, useState } from 'react';

export function useElapsed(startedAt: number | undefined): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}
