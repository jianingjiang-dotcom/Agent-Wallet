import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useWallet } from './WalletContext';

interface AppLockContextType {
  isLocked: boolean;
  lockTimeout: number; // seconds
  unlock: () => void;
  lock: () => void;
  setLockTimeout: (seconds: number) => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

interface AppLockProviderProps {
  children: ReactNode;
}

export function AppLockProvider({ children }: AppLockProviderProps) {
  const { isAuthenticated } = useWallet();
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeout, setLockTimeoutState] = useState(30); // Default 30 seconds
  const [backgroundTimestamp, setBackgroundTimestamp] = useState<number | null>(null);

  // Handle visibility change
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - record timestamp
        setBackgroundTimestamp(Date.now());
      } else {
        // App coming to foreground - check duration
        if (backgroundTimestamp) {
          const duration = (Date.now() - backgroundTimestamp) / 1000;
          if (duration >= lockTimeout) {
            setIsLocked(true);
          }
          setBackgroundTimestamp(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, backgroundTimestamp, lockTimeout]);

  const unlock = useCallback(() => {
    console.log('[AppLock] context.unlock()');
    setIsLocked(false);
  }, []);

  const lock = useCallback(() => {
    if (isAuthenticated) {
      console.log('[AppLock] context.lock()');
      setIsLocked(true);
    }
  }, [isAuthenticated]);


  const setLockTimeout = useCallback((seconds: number) => {
    setLockTimeoutState(seconds);
  }, []);

  return (
    <AppLockContext.Provider value={{ isLocked, lockTimeout, unlock, lock, setLockTimeout }}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (context === undefined) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
