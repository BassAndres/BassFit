/**
 * Countdown rest timer. Call `start(seconds)` (e.g. when a set is completed);
 * exposes the remaining seconds and whether it's running. Fires `onComplete`
 * once when it reaches zero (used to trigger a haptic in the UI).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseRestTimer {
  remaining: number;
  running: boolean;
  start: (seconds: number) => void;
  add: (seconds: number) => void;
  stop: () => void;
}

export function useRestTimer(onComplete?: () => void): UseRestTimer {
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setRemaining((prev) => {
      if (prev <= 1) {
        clear();
        setRunning(false);
        onCompleteRef.current?.();
        return 0;
      }
      return prev - 1;
    });
  }, [clear]);

  const start = useCallback(
    (seconds: number) => {
      clear();
      setRemaining(seconds);
      setRunning(true);
      intervalRef.current = setInterval(tick, 1000);
    },
    [clear, tick]
  );

  const add = useCallback((seconds: number) => {
    setRemaining((prev) => Math.max(0, prev + seconds));
  }, []);

  const stop = useCallback(() => {
    clear();
    setRunning(false);
    setRemaining(0);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return { remaining, running, start, add, stop };
}
