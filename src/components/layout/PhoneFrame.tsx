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
  const isGrayBg = location.pathname.startsWith('/profile') || location.pathname.startsWith('/history');

  useEffect(() => {
    if (containerRef.current) {
      drawerContainerRef = containerRef.current;
    }
    return () => {
      drawerContainerRef = null;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-black flex items-center justify-center p-4">
      <div
        ref={containerRef}
        id="phone-frame-container"
        className={cn("relative w-[390px] h-[844px] rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-slate-800 dark:border-slate-700", isGrayBg ? "bg-page" : "bg-background")}
      >
        {/* 顶部刘海 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-slate-800 dark:bg-slate-700 rounded-b-2xl z-50" />

        {/* 内容区域 */}
        <div className="h-full overflow-hidden relative">
          {children}
        </div>

        {/* 底部横条 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[4px] bg-slate-600 dark:bg-slate-500 rounded-full z-50" />
      </div>
    </div>
  );
}
