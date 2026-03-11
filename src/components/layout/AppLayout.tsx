import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, type LucideIcon } from 'lucide-react';
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
  titleBadge?: number; // Red notification count badge beside title
  showBack?: boolean;
  backIcon?: LucideIcon;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export function AppLayout({
  children,
  showNav = true,
  showSecurityBanner = true,
  pageBg,
  title,
  titleBadge,
  showBack = false,
  backIcon: BackIcon = ChevronLeft,
  onBack,
  rightAction,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const showBanner = showNav && showSecurityBanner;
  const hasHeader = title || showBack || rightAction;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={cn("h-full flex flex-col relative overflow-hidden pt-7", pageBg ?? "bg-background")}>
      {showBanner && <SecurityBanner />}

      {/* Page Header */}
      {hasHeader && (
        <header
          className={cn(
            "flex items-center justify-between px-4 py-3 sticky top-0 z-10",
            !pageBg && "backdrop-blur-xl border-b border-border/30 bg-background/80",
            pageBg && pageBg
          )}
        >
          <div className="w-10">
            {showBack && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-8 h-8 -ml-1"
              >
                <BackIcon className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {title && (
              <h1 className="text-base font-semibold text-foreground">
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
          </div>

          <div className="w-10 flex justify-end">
            {rightAction}
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col overflow-auto">
        {children}
        {showNav && <div className="shrink-0 h-[100px]" />}
      </main>

      {/* Gradient fade above bottom nav */}
      {showNav && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none z-30" />
      )}

      {showNav && <BottomNav />}
    </div>
  );
}
