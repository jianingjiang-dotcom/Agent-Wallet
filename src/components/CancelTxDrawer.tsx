/**
 * Cancel Transaction Drawer
 * 
 * Allows users to cancel a pending transaction by sending
 * a replacement transaction with the same nonce.
 */

import { X } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { calculateCancelFee, getGasToken } from '@/lib/rbf-utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

interface CancelTxDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  onConfirm: (cancelFee: number, cancelGasAmount: number) => void;
}

export function CancelTxDrawer({ open, onOpenChange, transaction, onConfirm }: CancelTxDrawerProps) {
  const currentFee = transaction.gasPrice || transaction.fee || 2.50;
  const currentGasAmount = transaction.gasAmount || 0.00072;
  const gasToken = transaction.gasToken || getGasToken(transaction.network);
  
  const cancelFeeInfo = calculateCancelFee(currentFee, currentGasAmount);

  const handleConfirm = () => {
    onConfirm(cancelFeeInfo.fee, cancelFeeInfo.gasAmount);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {/* Header */}
        <DrawerHeader className="flex flex-row items-start justify-between p-4 pb-2 text-left">
          <DrawerTitle className="text-lg font-semibold text-foreground">取消交易</DrawerTitle>
          <DrawerClose asChild>
            <button className="p-2 -mr-2 -mt-1 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* Description */}
        <div className="mx-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            发送一笔替换交易以取消当前交易
          </p>
        </div>

        {/* Cancel Fee */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">取消费用</span>
            <div className="text-right">
              <span className="font-medium text-foreground">{cancelFeeInfo.gasAmount.toFixed(5)} {gasToken}</span>
              <span className="text-muted-foreground ml-2">≈ ${cancelFeeInfo.fee.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {/* Footer */}
        <DrawerFooter className="px-4 pb-6">
          <Button 
            variant="destructive"
            className="w-full h-12"
            onClick={handleConfirm}
          >
            确认取消
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
