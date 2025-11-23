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
      <span className="font-brand w-min overflow-hidden text-center text-sm transition-all duration-300 ease-in-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:scale-95 group-data-[collapsible=icon]:opacity-0">
        Adramelech Dashboard
      </span>
    </div>
  );
}
