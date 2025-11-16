import { AlertCircleIcon, type LucideIcon } from 'lucide-react';
import { Alert as CnAlert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { createElement, type ComponentProps } from 'react';

export default function Alert({
  title,
  description,
  icon,
  ...props
}: {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
} & ComponentProps<typeof CnAlert>) {
  return (
    <CnAlert {...props} className={cn('w-full', props.className)}>
      {props.variant === 'destructive' && !icon && <AlertCircleIcon />}
      {icon && createElement(icon)}
      <AlertTitle>{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}
    </CnAlert>
  );
}
