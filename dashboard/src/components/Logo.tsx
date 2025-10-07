import { cn } from '@heroui/react';
import { Boldonse } from 'next/font/google';

const boldonse = Boldonse({
  subsets: ['latin'],
  weight: '400',
  fallback: ['sans-serif'],
});

export default function Logo({ className }: { className?: string }) {
  return (
    <p className={cn(boldonse.className, 'text-center', className)}>
      Adramelech Dashboard
    </p>
  );
}
