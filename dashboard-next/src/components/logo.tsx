import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-x-2', className)}>
      <Image
        src="/logo.png"
        alt="Adramelech Logo"
        width={40}
        height={40}
        priority
      />
      <span className="font-brand w-min text-center text-sm">
        Adramelech Dashboard
      </span>
    </div>
  );
}
