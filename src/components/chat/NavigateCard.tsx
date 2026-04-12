import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { NavigateCardData } from '@/types/chat';

export function NavigateCard({ data }: { data: NavigateCardData }) {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      className="w-full justify-between rounded-xl text-sm"
      onClick={() => navigate(data.path)}
    >
      <span>{data.label}</span>
      <ArrowRight className="w-4 h-4" />
    </Button>
  );
}
