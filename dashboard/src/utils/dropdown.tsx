import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { ComponentProps } from 'react';

export interface DropdownItem {
  type?: 'label' | 'separator';
  label?: string;
  icon?: React.ReactNode;
  variant?: ComponentProps<typeof DropdownMenuItem>['variant'];
  onClick?: () => void;
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
      >
        {item.icon}
        {item.label}
      </DropdownMenuItem>
    );
  });
