import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n';

const ACTIVE_COLOR = '#1F32D6';
const LIGHT_INACTIVE = '#73798B';
const DARK_INACTIVE = '#8E8E9A';

// Ripple state
interface Ripple {
  id: number;
  x: number;
  y: number;
}

let rippleCounter = 0;

// Icon paths: [wallet, pact, mine]
const iconDefault: string[][] = [
  // 钱包 — closed
  [
    'M18.3329 9.14174V10.8584C18.3329 11.3167 17.9662 11.6917 17.4995 11.7084H15.8662C14.9662 11.7084 14.1412 11.0501 14.0662 10.1501C14.0162 9.62507 14.2162 9.13341 14.5662 8.79174C14.8745 8.47507 15.2995 8.29175 15.7662 8.29175H17.4995C17.9662 8.30841 18.3329 8.68341 18.3329 9.14174Z',
    'M17.0577 12.9584H15.866C14.2827 12.9584 12.9493 11.7667 12.816 10.2501C12.741 9.38342 13.0577 8.51675 13.691 7.90008C14.2243 7.35008 14.966 7.04175 15.766 7.04175H17.0577C17.2993 7.04175 17.4993 6.84175 17.4743 6.60008C17.291 4.57508 15.9493 3.19175 13.9577 2.95841C13.7577 2.92508 13.5493 2.91675 13.3327 2.91675H5.83268C5.59935 2.91675 5.37435 2.93341 5.15768 2.96675C3.03268 3.23341 1.66602 4.81675 1.66602 7.08342V12.9167C1.66602 15.2167 3.53268 17.0834 5.83268 17.0834H13.3327C15.666 17.0834 17.2743 15.6251 17.4743 13.4001C17.4993 13.1584 17.2993 12.9584 17.0577 12.9584ZM10.8327 8.12508H5.83268C5.49102 8.12508 5.20768 7.84175 5.20768 7.50008C5.20768 7.15842 5.49102 6.87508 5.83268 6.87508H10.8327C11.1743 6.87508 11.4577 7.15842 11.4577 7.50008C11.4577 7.84175 11.1743 8.12508 10.8327 8.12508Z',
  ],
  // Pact (shield)
  [
    'M9.99984 1.81665C10.1082 1.81665 10.2165 1.84165 10.3165 1.89165L15.6832 4.53332C16.0665 4.72499 16.2998 5.11665 16.2998 5.54165V9.16665C16.2998 12.7583 13.6415 16.1083 10.2082 17.0583C10.0748 17.0917 9.92484 17.0917 9.79151 17.0583C6.35817 16.1083 3.69984 12.7583 3.69984 9.16665V5.54165C3.69984 5.11665 3.93317 4.72499 4.31651 4.53332L9.68317 1.89165C9.78317 1.84165 9.89151 1.81665 9.99984 1.81665Z',
    'M9.16667 10.5917L8.09167 9.51667C7.85 9.275 7.45833 9.275 7.21667 9.51667C6.975 9.75833 6.975 10.15 7.21667 10.3917L8.72917 11.9042C8.97083 12.1458 9.3625 12.1458 9.60417 11.9042L12.7833 8.725C13.025 8.48333 13.025 8.09167 12.7833 7.85C12.5417 7.60833 12.15 7.60833 11.9083 7.85L9.16667 10.5917Z',
  ],
  // 我的
  [
    'M10 10.625C11.7259 10.625 13.125 9.22589 13.125 7.5C13.125 5.77411 11.7259 4.375 10 4.375C8.27411 4.375 6.875 5.77411 6.875 7.5C6.875 9.22589 8.27411 10.625 10 10.625Z',
    'M10 12.5C6.6625 12.5 3.9375 14.6333 3.9375 17.2917C3.9375 17.5208 4.12917 17.7083 4.35417 17.7083H15.6458C15.8708 17.7083 16.0625 17.5208 16.0625 17.2917C16.0625 14.6333 13.3375 12.5 10 12.5Z',
  ],
];

const iconActive: (string[][] | null)[] = [
  // 钱包 — active
  [
    'M17.0577 12.9584H15.866C14.2827 12.9584 12.9493 11.7667 12.816 10.2501C12.741 9.38342 13.0577 8.51675 13.691 7.90008C14.2243 7.35008 14.966 7.04175 15.766 7.04175H17.0577C17.2993 7.04175 17.4993 6.84175 17.4743 6.60008C17.291 4.57508 15.9493 3.19175 13.9577 2.95841C13.7577 2.92508 13.5493 2.91675 13.3327 2.91675H5.83268C5.59935 2.91675 5.37435 2.93341 5.15768 2.96675C3.03268 3.23341 1.66602 4.81675 1.66602 7.08342V12.9167C1.66602 15.2167 3.53268 17.0834 5.83268 17.0834H13.3327C15.666 17.0834 17.2743 15.6251 17.4743 13.4001C17.4993 13.1584 17.2993 12.9584 17.0577 12.9584Z',
    'M18.3329 9.14174V10.8584C18.3329 11.3167 17.9662 11.6917 17.4995 11.7084H15.8662C14.9662 11.7084 14.1412 11.0501 14.0662 10.1501C14.0162 9.62507 14.2162 9.13341 14.5662 8.79174C14.8745 8.47507 15.2995 8.29175 15.7662 8.29175H17.4995C17.9662 8.30841 18.3329 8.68341 18.3329 9.14174Z',
    'M10.833 8.125H5.833C5.491 8.125 5.208 7.842 5.208 7.5C5.208 7.158 5.491 6.875 5.833 6.875H10.833C11.174 6.875 11.458 7.158 11.458 7.5C11.458 7.842 11.174 8.125 10.833 8.125Z',
    'M8.333 10.625H5.833C5.491 10.625 5.208 10.342 5.208 10C5.208 9.658 5.491 9.375 5.833 9.375H8.333C8.674 9.375 8.958 9.658 8.958 10C8.958 10.342 8.674 10.625 8.333 10.625Z',
  ],
  // Pact — active (filled shield)
  [
    'M9.99984 1.81665C10.1082 1.81665 10.2165 1.84165 10.3165 1.89165L15.6832 4.53332C16.0665 4.72499 16.2998 5.11665 16.2998 5.54165V9.16665C16.2998 12.7583 13.6415 16.1083 10.2082 17.0583C10.0748 17.0917 9.92484 17.0917 9.79151 17.0583C6.35817 16.1083 3.69984 12.7583 3.69984 9.16665V5.54165C3.69984 5.11665 3.93317 4.72499 4.31651 4.53332L9.68317 1.89165C9.78317 1.84165 9.89151 1.81665 9.99984 1.81665Z',
  ],
  // 我的 — active
  [
    'M10 10.625C11.7259 10.625 13.125 9.22589 13.125 7.5C13.125 5.77411 11.7259 4.375 10 4.375C8.27411 4.375 6.875 5.77411 6.875 7.5C6.875 9.22589 8.27411 10.625 10 10.625Z',
    'M10 12.5C6.6625 12.5 3.9375 14.6333 3.9375 17.2917C3.9375 17.5208 4.12917 17.7083 4.35417 17.7083H15.6458C15.8708 17.7083 16.0625 17.5208 16.0625 17.2917C16.0625 14.6333 13.3375 12.5 10 12.5Z',
    'M16.25 5.625C16.25 5.97 15.97 6.25 15.625 6.25C15.28 6.25 15 5.97 15 5.625C15 5.28 15.28 5 15.625 5C15.97 5 16.25 5.28 16.25 5.625Z',
    'M17.1 5.15L16.85 5.01C16.86 4.88 16.86 4.75 16.85 4.62L17.1 4.48C17.2 4.42 17.24 4.3 17.19 4.19L16.94 3.76C16.89 3.66 16.77 3.62 16.66 3.67L16.41 3.81C16.31 3.73 16.2 3.66 16.08 3.61L16.08 3.33C16.08 3.22 15.99 3.12 15.87 3.12H15.37C15.26 3.12 15.16 3.22 15.16 3.33L15.16 3.61C15.04 3.66 14.93 3.73 14.83 3.81L14.58 3.67C14.47 3.62 14.35 3.66 14.3 3.76L14.05 4.19C14 4.3 14.04 4.42 14.14 4.48L14.39 4.62C14.38 4.75 14.38 4.88 14.39 5.01L14.14 5.15C14.04 5.21 14 5.33 14.05 5.44L14.3 5.87C14.35 5.97 14.47 6.01 14.58 5.96L14.83 5.82C14.93 5.9 15.04 5.97 15.16 6.02L15.16 6.3C15.16 6.41 15.26 6.51 15.37 6.51H15.87C15.99 6.51 16.08 6.41 16.08 6.3L16.08 6.02C16.2 5.97 16.31 5.9 16.41 5.82L16.66 5.96C16.77 6.01 16.89 5.97 16.94 5.87L17.19 5.44C17.24 5.33 17.2 5.21 17.1 5.15Z',
  ],
];

const PACT_INDEX = 1;
const navPaths = ['/home', '/pact', '/mine'];

// Ripple component — expands from click point then fades
function RippleEffect({ ripples, color }: { ripples: Ripple[]; color: string }) {
  return (
    <AnimatePresence>
      {ripples.map(r => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.75 }}
          animate={{ scale: 4, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: 40,
            height: 40,
            marginLeft: -20,
            marginTop: -20,
            borderRadius: '50%',
            background: color,
            pointerEvents: 'none',
          }}
        />
      ))}
    </AnimatePresence>
  );
}

export function BottomNav({ activeOverride }: { activeOverride?: number } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const t = useT();
  const tabLabels = [t.nav.wallet, t.nav.pact, t.nav.mine];

  const routeIndex = Math.max(0, navPaths.findIndex(p => location.pathname.startsWith(p)));
  const realIndex = activeOverride !== undefined ? activeOverride : routeIndex;
  const [displayIndex, setDisplayIndex] = useState(realIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const isDark = resolvedTheme === 'dark';
  const INACTIVE_COLOR = isDark ? DARK_INACTIVE : LIGHT_INACTIVE;

  // Per-tab ripple state
  const [tabRipples, setTabRipples] = useState<Record<number, Ripple[]>>({});
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const triggerRipple = useCallback((i: number, e: React.MouseEvent | React.TouchEvent) => {
    const btn = btnRefs.current[i];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const id = ++rippleCounter;
    setTabRipples(prev => ({ ...prev, [i]: [...(prev[i] || []), { id, x, y }] }));
    setTimeout(() => {
      setTabRipples(prev => ({ ...prev, [i]: (prev[i] || []).filter(r => r.id !== id) }));
    }, 600);
  }, []);

  const handleTabClick = useCallback((i: number, e: React.MouseEvent | React.TouchEvent) => {
    triggerRipple(i, e);
    if (i === realIndex || isAnimating) return;
    setIsAnimating(true);
    setDisplayIndex(i);
    setTimeout(() => {
      navigate(navPaths[i]);
      setIsAnimating(false);
    }, 250);
  }, [realIndex, isAnimating, navigate, triggerRipple]);

  const rippleColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(31, 50, 214, 0.2)';
  const pactRippleColor = 'rgba(255,255,255,0.45)';

  return (
    <div className="flex justify-center px-[16px] pb-[21px]">
      <nav
        className="flex flex-row justify-center items-end w-full rounded-[47px] relative"
        style={{
          padding: '4px',
          height: '62px',
          background: isDark
            ? 'rgba(30, 30, 30, 0.65)'
            : 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          boxShadow: isDark
            ? '0 2px 20px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)'
            : '0 2px 20px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255,255,255,0.9)',
          border: isDark
            ? '0.5px solid rgba(255,255,255,0.08)'
            : '0.5px solid rgba(255,255,255,0.5)',
          overflow: 'visible',
        }}
      >
        {tabLabels.map((label, i) => {
          const isActive = i === displayIndex;
          const isPact = i === PACT_INDEX;

          // Pact — elevated circle button
          if (isPact) {
            return (
              <button
                key={i}
                ref={el => { btnRefs.current[i] = el; }}
                type="button"
                onClick={(e) => handleTabClick(i, e)}
                className="flex-1 flex flex-col items-center justify-end relative z-[2] h-full"
                aria-label={label}
              >
                {/* Elevated circle */}
                <div
                  className="absolute flex items-center justify-center rounded-full overflow-hidden"
                  style={{
                    width: 56,
                    height: 56,
                    top: -16,
                    background: 'linear-gradient(135deg, #1F32D6, #6366F1)',
                    boxShadow: isActive
                      ? '0 -4px 16px rgba(31, 50, 214, 0.4), 0 4px 12px rgba(99, 102, 241, 0.3)'
                      : '0 -2px 12px rgba(31, 50, 214, 0.25), 0 4px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Ripple inside circle */}
                  <RippleEffect ripples={tabRipples[i] || []} color={pactRippleColor} />
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="relative z-10"
                  >
                    {(isActive && iconActive[i] ? iconActive[i]! : iconDefault[i]).map((d, j) => (
                      <path key={j} d={d} fill="white" />
                    ))}
                  </svg>
                </div>
                {/* Label below the circle */}
                <span
                  className="text-[10px] leading-3 font-medium mb-[2px]"
                  style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
                >
                  {label}
                </span>
              </button>
            );
          }

          // Regular tabs — wallet & mine
          const activeIcon = iconActive[i];
          const paths = isActive && activeIcon ? activeIcon : iconDefault[i];
          const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <button
              key={i}
              ref={el => { btnRefs.current[i] = el; }}
              type="button"
              onClick={(e) => handleTabClick(i, e)}
              className="flex-1 flex flex-col items-center justify-center gap-[2px] relative h-full rounded-full z-[1] overflow-hidden"
              aria-label={label}
            >
              {/* Ripple layer */}
              <RippleEffect ripples={tabRipples[i] || []} color={rippleColor} />
              <svg
                width="26"
                height="26"
                viewBox="0 0 20 20"
                fill="none"
                className="relative z-10"
              >
                {paths.map((d, j) => (
                  <path key={j} d={d} fill={color} />
                ))}
              </svg>
              <span
                className="text-[10px] leading-3 font-medium relative z-10"
                style={{ color }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
