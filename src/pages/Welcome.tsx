import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Zap, Wallet, CreditCard, TrendingUp, Sparkles, Bot, Key, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface SlideData {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  floatingIcons: React.ReactNode[];
}

// Color themes for each slide - matching Login page
const colorThemes = [
  {
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    orbColor: 'bg-blue-500/20',
    orbColor2: 'bg-cyan-400/15',
    dotColor: 'bg-blue-400/40',
    dotColor2: 'bg-cyan-400/30',
    floatingBg: ['bg-blue-500/90', 'bg-cyan-500/80', 'bg-blue-400/70'],
    sparkleColor: 'bg-blue-400',
    pulseColor: 'bg-blue-500',
    gradientBg: 'bg-gradient-to-b from-blue-500/15 via-blue-500/5 to-transparent',
  },
  {
    iconBg: 'bg-gradient-to-br from-violet-500 to-purple-400',
    orbColor: 'bg-violet-500/20',
    orbColor2: 'bg-purple-400/15',
    dotColor: 'bg-violet-400/40',
    dotColor2: 'bg-purple-400/30',
    floatingBg: ['bg-violet-500/90', 'bg-purple-500/80', 'bg-violet-400/70'],
    sparkleColor: 'bg-violet-400',
    pulseColor: 'bg-violet-500',
    gradientBg: 'bg-gradient-to-b from-violet-500/15 via-violet-500/5 to-transparent',
  },
  {
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-400',
    orbColor: 'bg-emerald-500/20',
    orbColor2: 'bg-teal-400/15',
    dotColor: 'bg-emerald-400/40',
    dotColor2: 'bg-teal-400/30',
    floatingBg: ['bg-emerald-500/90', 'bg-teal-500/80', 'bg-emerald-400/70'],
    sparkleColor: 'bg-emerald-400',
    pulseColor: 'bg-emerald-500',
    gradientBg: 'bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent',
  },
  {
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-400',
    orbColor: 'bg-amber-500/20',
    orbColor2: 'bg-orange-400/15',
    dotColor: 'bg-amber-400/40',
    dotColor2: 'bg-orange-400/30',
    floatingBg: ['bg-amber-500/90', 'bg-orange-500/80', 'bg-amber-400/70'],
    sparkleColor: 'bg-amber-400',
    pulseColor: 'bg-amber-500',
    gradientBg: 'bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-transparent',
  },
  {
    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-400',
    orbColor: 'bg-rose-500/20',
    orbColor2: 'bg-pink-400/15',
    dotColor: 'bg-rose-400/40',
    dotColor2: 'bg-pink-400/30',
    floatingBg: ['bg-rose-500/90', 'bg-pink-500/80', 'bg-rose-400/70'],
    sparkleColor: 'bg-rose-400',
    pulseColor: 'bg-rose-500',
    gradientBg: 'bg-gradient-to-b from-rose-500/15 via-rose-500/5 to-transparent',
  },
];

const slides: SlideData[] = [
  {
    icon: <Shield className="w-10 h-10 text-white" />,
    iconBg: colorThemes[0].iconBg,
    title: '轻松管理您的数字资产',
    description: '一站式管理您的收款和结算资金，安全便捷的交易体验，随时随地掌控您的财务。',
    floatingIcons: [
      <Wallet className="w-5 h-5" />,
      <CreditCard className="w-4 h-4" />,
      <TrendingUp className="w-4 h-4" />,
    ],
  },
  {
    icon: <Lock className="w-10 h-10 text-white" />,
    iconBg: colorThemes[1].iconBg,
    title: '顶级安全，无忧交易',
    description: '采用MPC多方计算技术保护您的资产，非托管设计确保只有您能控制自己的资金。',
    floatingIcons: [
      <Shield className="w-5 h-5" />,
      <Sparkles className="w-4 h-4" />,
      <Lock className="w-4 h-4" />,
    ],
  },
  {
    icon: <Zap className="w-10 h-10 text-white" />,
    iconBg: colorThemes[2].iconBg,
    title: '快速收款，即时到账',
    description: '支持多种数字货币收款，实时查看交易记录，让您的业务结算更加高效。',
    floatingIcons: [
      <Zap className="w-5 h-5" />,
      <TrendingUp className="w-4 h-4" />,
      <Sparkles className="w-4 h-4" />,
    ],
  },
  {
    icon: <Bot className="w-10 h-10 text-white" />,
    iconBg: colorThemes[3].iconBg,
    title: '连接 AI Agent，自动化交易',
    description: '通过 API Key 授权外部 Agent 发起交易，让自动化策略 7×24 小时为您工作。',
    floatingIcons: [
      <Key className="w-5 h-5" />,
      <Bot className="w-4 h-4" />,
      <Sparkles className="w-4 h-4" />,
    ],
  },
  {
    icon: <SlidersHorizontal className="w-10 h-10 text-white" />,
    iconBg: colorThemes[4].iconBg,
    title: '智能风控，掌控每一笔',
    description: '灵活配置审批模式：手动审核、自动批准、或混合策略，资金安全始终在您手中。',
    floatingIcons: [
      <Shield className="w-5 h-5" />,
      <SlidersHorizontal className="w-4 h-4" />,
      <Lock className="w-4 h-4" />,
    ],
  },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentIndex(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    api.on('select', onSelect);
    onSelect();
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Graphics Carousel - matching Login page structure */}
      <div className="relative">
        <Carousel
          className="flex-shrink-0 relative z-10"
          setApi={setApi}
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: true,
            }),
          ]}
        >
          <CarouselContent className="ml-0">
            {slides.map((slide, index) => (
              <CarouselItem key={index} className="pl-0">
                <div className="relative h-56 flex items-center justify-center">
                  {/* Background Gradient - extends to top edge */}
                  <div className={`absolute inset-0 -top-20 ${colorThemes[index].gradientBg}`} />
                  
                  {/* Animated Background Orbs */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className={`absolute top-4 left-1/4 w-20 h-20 rounded-full blur-3xl ${colorThemes[index].orbColor}`}
                  />
                  <motion.div
                    animate={{ 
                      scale: [1.2, 1, 1.2],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className={`absolute bottom-4 right-1/4 w-24 h-24 rounded-full blur-3xl ${colorThemes[index].orbColor2}`}
                  />
                  
                  {/* Main Icon with Orbiting Elements */}
                  <div className="relative z-10">
                    {/* Outer Ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 w-36 h-36 -m-4"
                      style={{ transformOrigin: 'center' }}
                    >
                      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${colorThemes[index].dotColor}`} />
                      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${colorThemes[index].dotColor2}`} />
                    </motion.div>

                    {/* Floating Icons */}
                    <motion.div
                      animate={{ y: [0, -8, 0], x: [0, 3, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className={`absolute -top-5 -right-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${colorThemes[index].floatingBg[0]} text-white`}
                    >
                      {slide.floatingIcons[0]}
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, 5, 0], x: [0, -2, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                      className={`absolute -bottom-2 -left-5 w-6 h-6 rounded-lg flex items-center justify-center shadow-md ${colorThemes[index].floatingBg[1]} text-white`}
                    >
                      {slide.floatingIcons[1]}
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, -4, 0], rotate: [0, 6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                      className={`absolute top-1/2 -right-8 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center shadow-md ${colorThemes[index].floatingBg[2]} text-white`}
                    >
                      {slide.floatingIcons[2]}
                    </motion.div>

                    {/* Main Icon Container with Pulse */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                      className="relative"
                    >
                      {/* Pulse Ring */}
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                        className={`absolute inset-0 rounded-2xl ${colorThemes[index].pulseColor}`}
                      />
                      
                      {/* Icon Box */}
                      <div className={`relative w-24 h-24 rounded-2xl ${slide.iconBg} flex items-center justify-center shadow-2xl`}>
                        <motion.div
                          animate={{ rotate: [0, 4, -4, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          {slide.icon}
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Sparkle Effects */}
                    <motion.div
                      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                      className={`absolute -top-1 left-0 w-1.5 h-1.5 rounded-full ${colorThemes[index].sparkleColor}`}
                    />
                    <motion.div
                      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.7 }}
                      className={`absolute bottom-2 -right-2 w-1 h-1 rounded-full ${colorThemes[index].sparkleColor}`}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Content Area - OUTSIDE carousel, animated based on currentIndex */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {slides.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  width: i === currentIndex ? 24 : 6,
                  backgroundColor: i === currentIndex 
                    ? 'hsl(var(--foreground))' 
                    : 'hsl(var(--muted-foreground) / 0.3)',
                }}
                transition={{ duration: 0.3 }}
                className="h-1 rounded-full"
              />
            ))}
          </div>

          {/* Brand */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">商户钱包</span>
          </div>

          {/* Animated Title & Description - matching Login pattern */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <h1 className="text-xl font-bold text-foreground mb-2 leading-tight">
                {slides[currentIndex].title}
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                {slides[currentIndex].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Buttons at Bottom */}
      <div className="px-4 pb-8 pt-4 flex gap-3 bg-background">
        <Button
          variant="outline"
          size="lg"
          className="flex-1 h-12 text-base font-medium"
          onClick={handleLogin}
        >
          注册
        </Button>
        <Button
          variant="default"
          size="lg"
          className="flex-1 h-12 text-base font-medium"
          onClick={handleLogin}
        >
          登录
        </Button>
      </div>
    </div>
  );
}
