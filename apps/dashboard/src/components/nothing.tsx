import { cn } from '@/lib/utils';
import { CircleSlash2 } from 'lucide-react';

export function Nothing({ className }: { className?: string }) {
  return (
    <CircleSlash2
      className={cn('text-muted-foreground mx-0.5 size-4', className)}
    />
  );
}
