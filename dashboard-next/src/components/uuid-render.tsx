import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useLongPress } from '@/hooks/use-long-press';

export function UUIDRender({ value }: { value: string }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const longPressEvent = useLongPress(() => isMobile && setOpen(true));

  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={0}>
      <TooltipTrigger>
        <span {...longPressEvent}>{value.split('-')[0] + '...'}</span>
      </TooltipTrigger>
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
  );
}
