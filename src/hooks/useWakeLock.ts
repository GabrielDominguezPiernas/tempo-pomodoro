import { useEffect, useRef, useCallback } from 'react';

export function useWakeLock(enabled: boolean): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator) || !navigator.wakeLock) {
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');

      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch {
      // Wake Lock puede fallar si la pestaña no está visible
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {
        // Ignorar errores al liberar
      }
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      requestWakeLock();

      // Re-adquirir al volver a la pestaña
      const handleVisibility = () => {
        if (document.visibilityState === 'visible' && enabled) {
          requestWakeLock();
        }
      };

      document.addEventListener('visibilitychange', handleVisibility);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibility);
        releaseWakeLock();
      };
    } else {
      releaseWakeLock();
    }
  }, [enabled, requestWakeLock, releaseWakeLock]);
}
