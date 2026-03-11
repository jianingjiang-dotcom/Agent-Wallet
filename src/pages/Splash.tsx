import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useWallet } from "@/contexts/WalletContext";
import coboLogo from "@/assets/cobo-logo.svg";

const Splash = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useWallet();
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      
      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/home', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }, 300);
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated]);

  return (
    <motion.div 
      className="absolute inset-0 bg-background flex flex-col items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Background decorative elements - blue in light mode, white/grey in dark mode */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/4 -left-20 w-72 h-72 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-foreground/5 dark:to-muted/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/3 -right-20 w-80 h-80 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-muted/30 dark:to-foreground/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-primary/10 to-transparent dark:from-muted/20 dark:to-transparent rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo container with multiple pulse rings */}
        <div className="relative">
          {/* Outer pulse ring - blue in light, white in dark */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-white/25 dark:to-white/15"
            style={{ 
              width: 120, 
              height: 120, 
              marginLeft: -18, 
              marginTop: -18,
            }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ 
              scale: [1, 1.5, 2],
              opacity: [0.5, 0.25, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          {/* Inner pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/15 dark:from-white/35 dark:to-white/20"
            style={{ 
              width: 120, 
              height: 120, 
              marginLeft: -18, 
              marginTop: -18,
            }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ 
              scale: [1, 1.5, 2],
              opacity: [0.5, 0.25, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.8
            }}
          />
          
          {/* Logo container - white background with rounded edges */}
          <motion.div
            className="w-[84px] h-[84px] rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden bg-white"
            style={{
              boxShadow: '0 20px 40px -10px hsl(0 0% 0% / 0.15), 0 10px 20px -5px hsl(0 0% 0% / 0.1)'
            }}
            initial={{ opacity: 0, scale: 0.5, rotateY: -30 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* COBO Logo - blue logo on white background */}
            <motion.img
              src={coboLogo}
              alt="COBO"
              className="w-14 h-14 relative z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </motion.div>
        </div>

        {/* Brand name */}
        <motion.h1
          className="mt-8 text-3xl font-bold text-foreground tracking-wide"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          商户钱包
        </motion.h1>

        {/* Tagline - blue accent in light mode, white in dark mode */}
        <motion.div
          className="mt-3 flex items-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
        >
          <span className="text-sm text-primary dark:text-muted-foreground font-medium">安全</span>
          <span className="w-1 h-1 rounded-full bg-primary/50 dark:bg-muted-foreground/50" />
          <span className="text-sm text-primary dark:text-muted-foreground font-medium">便捷</span>
          <span className="w-1 h-1 rounded-full bg-primary/50 dark:bg-muted-foreground/50" />
          <span className="text-sm text-primary dark:text-muted-foreground font-medium">专业</span>
        </motion.div>
      </div>

      {/* Footer with COBO logo - white background container */}
      <motion.div
        className="absolute bottom-12 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
      >
        <p className="text-xs text-muted-foreground/60">Powered by</p>
        <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm">
          <img 
            src={coboLogo} 
            alt="COBO" 
            className="h-4"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Splash;
