import { ReactNode, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PhoneFrameProps {
  children: ReactNode;
}

// Global reference for drawer container
let drawerContainerRef: HTMLDivElement | null = null;

export function getDrawerContainer() {
  return drawerContainerRef;
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isGrayBg = location.pathname.startsWith('/profile') || location.pathname.startsWith('/history') || location.pathname.startsWith('/home');

  useEffect(() => {
    if (containerRef.current) {
      drawerContainerRef = containerRef.current;
    }
    return () => {
      drawerContainerRef = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="phone-frame-container"
      className={cn("relative h-dvh overflow-hidden", isGrayBg ? "bg-page" : "bg-background")}
    >
      {children}
    </div>
  );
}
