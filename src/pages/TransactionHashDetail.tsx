import { useNavigate, useParams } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import { AppLayout } from "@/components/layout/AppLayout";

const TransactionHashDetail = () => {
  const navigate = useNavigate();
  const { hash } = useParams<{ hash: string }>();

  return (
    <PageTransition>
      <AppLayout showNav={false} showBack title="交易详情" pageBg="bg-background">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-6 space-y-4">
            {/* Empty demo page */}
            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
              {hash && (
                <p className="text-center break-all px-8 text-xs text-muted-foreground/60">
                  {hash}
                </p>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </PageTransition>
  );
};

export default TransactionHashDetail;
