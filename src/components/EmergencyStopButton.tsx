import { useState } from 'react';
import { OctagonX, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EmergencyStopButtonProps {
  isPaused: boolean;
  onPause: (reason?: string) => void;
  onResume: () => void;
  label?: string;
}

export function EmergencyStopButton({ isPaused, onPause, onResume, label }: EmergencyStopButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (isPaused) {
    return (
      <Button
        variant="outline"
        className="w-full h-12 gap-2 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
        onClick={onResume}
      >
        <Play className="w-4 h-4" />
        恢复 Agent 访问
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="destructive"
        className="w-full h-12 gap-2"
        onClick={() => setShowConfirm(true)}
      >
        <OctagonX className="w-4 h-4" />
        {label || '紧急暂停 Agent'}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认紧急暂停</AlertDialogTitle>
            <AlertDialogDescription>
              暂停后，Agent 将无法通过 API 发起任何交易。已在审核队列中的交易不受影响。您可以随时恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { onPause('手动紧急暂停'); setShowConfirm(false); }}
            >
              确认暂停
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
