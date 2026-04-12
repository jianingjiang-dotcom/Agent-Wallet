import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceKickInfo, DeviceSessionStatus } from '@/types/wallet';

interface UseDeviceSessionOptions {
  enabled: boolean;
  checkInterval?: number; // milliseconds
  onKicked?: (info: DeviceKickInfo) => void;
}

interface UseDeviceSessionReturn {
  sessionStatus: DeviceSessionStatus;
  kickInfo: DeviceKickInfo | null;
  isKickedDialogOpen: boolean;
  closeKickedDialog: () => void;
  simulateKick: () => void; // For demo purposes
}

export function useDeviceSession({
  enabled,
  checkInterval = 5000,
  onKicked,
}: UseDeviceSessionOptions): UseDeviceSessionReturn {
  const [sessionStatus, setSessionStatus] = useState<DeviceSessionStatus>('active');
  const [kickInfo, setKickInfo] = useState<DeviceKickInfo | null>(null);
  const [isKickedDialogOpen, setIsKickedDialogOpen] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate session check (in real app, this would be WebSocket or API call)
  const checkSession = useCallback(() => {
    // Check localStorage for kick signal (demo purposes)
    const kickSignal = localStorage.getItem('device_kicked');
    if (kickSignal) {
      const info: DeviceKickInfo = JSON.parse(kickSignal);
      setSessionStatus('kicked');
      setKickInfo(info);
      setIsKickedDialogOpen(true);
      onKicked?.(info);
      localStorage.removeItem('device_kicked');
    }
  }, [onKicked]);

  // Start session monitoring
  useEffect(() => {
    if (!enabled) return;

    // Initial check
    checkSession();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(checkSession, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, checkInterval, checkSession]);

  // Close dialog and navigate to login
  const closeKickedDialog = useCallback(() => {
    setIsKickedDialogOpen(false);
    // Navigate to device kicked page or login
    navigate('/device-kicked');
  }, [navigate]);

  // Simulate being kicked (for demo/testing)
  const simulateKick = useCallback(() => {
    const info: DeviceKickInfo = {
      kickedAt: new Date(),
      newDeviceName: 'iPhone 15 Pro',
      newDeviceLocation: '上海, 中国',
      reason: 'new_device_login',
    };
    
    // Set kick signal in localStorage (simulates server push)
    localStorage.setItem('device_kicked', JSON.stringify(info));
  }, []);

  return {
    sessionStatus,
    kickInfo,
    isKickedDialogOpen,
    closeKickedDialog,
    simulateKick,
  };
}

// Helper to trigger kick from another "device" (for testing)
export function triggerDeviceKick(deviceName: string, location?: string) {
  const info: DeviceKickInfo = {
    kickedAt: new Date(),
    newDeviceName: deviceName,
    newDeviceLocation: location,
    reason: 'new_device_login',
  };
  localStorage.setItem('device_kicked', JSON.stringify(info));
}
