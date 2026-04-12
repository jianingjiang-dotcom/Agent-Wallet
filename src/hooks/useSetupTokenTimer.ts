import { useState, useEffect } from 'react';

export function useSetupTokenTimer(expiresAt: Date | null) {
  const [remainingMs, setRemainingMs] = useState(() => {
    if (!expiresAt) return 0;
    return Math.max(0, expiresAt.getTime() - Date.now());
  });

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      return;
    }

    const update = () => {
      const ms = Math.max(0, expiresAt.getTime() - Date.now());
      setRemainingMs(ms);
    };
    update();

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remainingMs <= 0;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const remainingFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { remainingMs, remainingFormatted, isExpired };
}
