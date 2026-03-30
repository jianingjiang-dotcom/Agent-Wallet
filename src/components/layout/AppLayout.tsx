import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { SecurityBanner } from '@/components/ui/SecurityBanner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
  showSecurityBanner?: boolean;
  pageBg?: string; // e.g. 'bg-page'
  // Header props
  title?: string;
  titleSuffix?: ReactNode;
  titleBadge?: number; // Red notification count badge beside title
  showBack?: boolean;
  backIcon?: LucideIcon;
  onBack?: () => void;
  rightAction?: ReactNode;
  leftAction?: ReactNode;
}

export function AppLayout({
  children,
  showNav = false,
  showSecurityBanner = true,
  pageBg,
  title,
  titleSuffix,
  titleBadge,
  showBack = false,
  backIcon: BackIcon = ArrowLeft,
  onBack,
  rightAction,
  leftAction,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const showBanner = showNav && showSecurityBanner;
  const hasHeader = title || showBack || rightAction || leftAction;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if ((location.state as { fromSidebar?: boolean })?.fromSidebar) {
      navigate('/home', { state: { openSidebar: true } });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
{showBanner && <SecurityBanner />}

      {/* Page Header */}
      {hasHeader && (
        <header
          className={cn(
            "flex items-center justify-between px-4 h-[44px] sticky top-0 z-10",
            !pageBg && "backdrop-blur-xl border-b border-border/30 bg-background/80",
            pageBg && pageBg
          )}
        >
          <div className="flex items-center">
            {leftAction ?? (showBack && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-6 h-6"
              >
                <BackIcon className="w-6 h-6" strokeWidth={1.5} style={{ color: '#1c1c1c' }} />
              </button>
            ))}
          </div>

          <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1.5">
              {title && (
                <h1 className="text-lg font-semibold text-foreground leading-7">
                  {title}
                </h1>
              )}
              {titleBadge !== undefined && titleBadge > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 min-w-5 px-1.5 text-xs font-medium"
                >
                  {titleBadge > 99 ? '99+' : titleBadge}
                </Badge>
              )}
              {titleSuffix && (
                <div className="pointer-events-auto">{titleSuffix}</div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            {rightAction}
          </div>
        </header>
      )}

      <main className={cn("flex-1 flex flex-col overflow-auto", pageBg ?? (showNav ? "bg-page" : "bg-background"))}>
        {children}
        {showNav && <div className="shrink-0 h-[96px]" />}
      </main>

      {showNav && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
