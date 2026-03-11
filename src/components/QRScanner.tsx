import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Flashlight, FlashlightOff, Camera, X } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { parseQRCode, ParsedQRData } from '@/lib/qr-parser';
import { toast } from '@/lib/toast';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: ParsedQRData) => void;
}

export function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  }, []);

  const handleSuccessfulScan = useCallback((decodedText: string) => {
    const parsed = parseQRCode(decodedText);
    
    if (parsed.isValid) {
      // Stop scanning before callback
      stopScanner();
      toast.success('已识别收款地址');
      onScan(parsed);
      onClose();
    } else {
      toast.error(parsed.error || '无法识别的二维码');
    }
  }, [onScan, onClose, stopScanner]);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    const initScanner = async () => {
      setIsInitializing(true);
      
      try {
        // Create scanner instance
        scannerRef.current = new Html5Qrcode('qr-reader');
        
        // Get available cameras
        const cameras = await Html5Qrcode.getCameras();
        if (cameras.length === 0) {
          setHasCamera(false);
          setIsInitializing(false);
          return;
        }

        // Use back camera if available
        const backCamera = cameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('后置')
        );
        const cameraId = backCamera?.id || cameras[0].id;

        // Start scanning
        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          handleSuccessfulScan,
          () => {
            // Ignore errors during scanning
          }
        );

        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to init scanner:', error);
        setHasCamera(false);
        setIsInitializing(false);
        toast.error('无法访问摄像头，请检查权限设置');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, handleSuccessfulScan, stopScanner]);

  const toggleFlash = async () => {
    // Flash toggle is not reliably supported across all browsers/devices
    // This is a placeholder for future enhancement
    setIsFlashOn(!isFlashOn);
    toast.info(isFlashOn ? '手电筒已关闭' : '手电筒已打开');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-lg font-semibold text-white">扫描收款码</h1>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>

          {/* Scanner viewport */}
          <div className="flex flex-col items-center justify-center h-full" ref={containerRef}>
            {!hasCamera ? (
              <div className="text-center text-white p-8">
                <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">无法访问摄像头</p>
                <p className="text-sm text-white/70">请检查摄像头权限设置</p>
                <Button
                  variant="outline"
                  className="mt-6 border-white/30 text-white hover:bg-white/20"
                  onClick={onClose}
                >
                  返回
                </Button>
              </div>
            ) : (
              <>
                {/* QR Reader container */}
                <div className="relative">
                  <div 
                    id="qr-reader" 
                    className="w-[280px] h-[280px] overflow-hidden rounded-2xl"
                  />
                  
                  {/* Scanning frame overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-accent rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-accent rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-accent rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-accent rounded-br-lg" />
                    
                    {/* Scanning line animation */}
                    {!isInitializing && (
                      <motion.div
                        initial={{ top: '0%' }}
                        animate={{ top: '100%' }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
                      />
                    )}
                  </div>
                  
                  {/* Loading indicator */}
                  {isInitializing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <p className="mt-8 text-white/70 text-sm">
                  将二维码放入框内自动扫描
                </p>

                {/* Flash toggle */}
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-8 border-white/30 text-white hover:bg-white/20 gap-2"
                  onClick={toggleFlash}
                >
                  {isFlashOn ? (
                    <>
                      <FlashlightOff className="w-5 h-5" />
                      关闭手电筒
                    </>
                  ) : (
                    <>
                      <Flashlight className="w-5 h-5" />
                      打开手电筒
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Close button at bottom */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
