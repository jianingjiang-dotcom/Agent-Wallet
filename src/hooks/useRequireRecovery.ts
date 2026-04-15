import { useState, useCallback } from 'react';
import { useWallet } from '@/contexts/WalletContext';

/**
 * Hook for guarding sign-required actions when wallet is in view-only mode.
 *
 * Usage:
 *   const { guard, drawerOpen, setDrawerOpen } = useRequireRecovery();
 *   ...
 *   <Button onClick={() => guard(() => navigate('/send'))}>Send</Button>
 *   <RecoveryRequiredDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
 */
export function useRequireRecovery() {
  const { currentWallet } = useWallet();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const guard = useCallback(
    (action: () => void) => {
      if (currentWallet && !currentWallet.isKeyShareRecovered) {
        setDrawerOpen(true);
        return;
      }
      action();
    },
    [currentWallet]
  );

  return {
    guard,
    drawerOpen,
    setDrawerOpen,
    needsRecovery: currentWallet ? !currentWallet.isKeyShareRecovered : false,
    walletName: currentWallet?.name,
  };
}
