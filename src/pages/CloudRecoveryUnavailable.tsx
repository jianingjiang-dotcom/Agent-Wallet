import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CloudOff, Smartphone } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function CloudRecoveryUnavailable() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cloudProvider = searchParams.get('provider') || 'icloud';

  const handleBack = () => {
    navigate('/tss-recovery?cloud=false');
  };

  const providerName = cloudProvider === 'icloud' ? 'iCloud' : 'Google Drive';

  const backupSteps = [
    {
      id: 1,
      title: '打开旧设备上的 Cobo 钱包',
      description: '确保旧设备可以正常使用',
    },
    {
      id: 2,
      title: '进入设置 → 安全备份',
      description: '在个人中心找到安全备份选项',
    },
    {
      id: 3,
      title: '选择云端备份',
      description: `将备份数据同步到 ${providerName}`,
    },
  ];

  return (
    <AppLayout showNav={false} showBack onBack={handleBack} showSecurityBanner={false}>
      {/* Content */}
      <div className="flex-1 px-4 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col"
        >
          {/* Header Info */}
          <div className="flex flex-col items-center text-center pt-6 pb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4"
            >
              <CloudOff className="w-8 h-8 text-warning" />
            </motion.div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              未检测到云端备份
            </h2>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              您的 {providerName} 中暂无备份数据，请先在旧设备上完成云端备份
            </p>
          </div>

          {/* Backup Instructions */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">
                在旧设备上完成备份
              </span>
            </div>

            <div className="space-y-4">
              {backupSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary">
                      {step.id}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
