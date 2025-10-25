import { cn } from '@heroui/react';

export default function Logo({ className }: { className?: string }) {
  return (
    <p className={cn('font-boldonse text-center', className)}>
      Adramelech Dashboard
    </p>
  );
}
