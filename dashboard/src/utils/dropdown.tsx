import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { ComponentProps } from 'react';

export interface DropdownItem {
  type?: 'label' | 'separator';
  label?: string;
  icon?: React.ReactNode;
  variant?: ComponentProps<typeof DropdownMenuItem>['variant'];
  onClick?: () => void;
  href?: string;
}

export const mapToDropdownMenuItems = (items: DropdownItem[]) =>
  items.map((item, index) => {
    if (item.type === 'label' && item.label)
      return <DropdownMenuLabel key={index}>{item.label}</DropdownMenuLabel>;

    if (item.type === 'separator') return <DropdownMenuSeparator key={index} />;

    return (
      <DropdownMenuItem
        key={index}
        onClick={item.onClick}
        variant={item.variant}
        asChild={!!item.href}
      >
        {item.href ? (
          <Link
            href={item.href}
            target={item.href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
          >
            {item.icon}
            {item.label}
          </Link>
        ) : (
          <>
            {item.icon}
            {item.label}
          </>
        )}
      </DropdownMenuItem>
    );
  });
