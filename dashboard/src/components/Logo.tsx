import cn from '@/utils/cn';
import { Boldonse } from 'next/font/google';

const boldonse = Boldonse({
  subsets: ['latin'],
  weight: '400',
  fallback: ['sans-serif'],
});

export default function Logo({ className }: { className?: string }) {
  return (
    <p className={cn(boldonse.className, className)}>Adramelech Dashboard</p>
  );
}
