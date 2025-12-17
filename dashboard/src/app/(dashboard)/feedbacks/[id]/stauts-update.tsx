import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { QueryClient, useMutation } from '@tanstack/react-query';
import { FeedbackStatus } from 'database/types';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { setStatus } from './actions';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export function StatusUpdate({
  queryClient,
  id,
  status,
}: {
  queryClient: QueryClient;
  id: string;
  status: FeedbackStatus;
}) {
  const [value, setValue] = useState<FeedbackStatus | null>(null);

  const statusTransitions = new Map<FeedbackStatus, FeedbackStatus[]>([
    ['OPEN', ['ACKNOWLEDGED']],
    ['ACKNOWLEDGED', ['CLOSED', 'ACCEPTED', 'REJECTED']],
    ['ACCEPTED', ['RESOLVED']],
  ]);

  const availableTransitions = statusTransitions.get(status) ?? [];
  const items = [
    { label: 'Change the status', value: null },
    ...availableTransitions.map(s => ({ label: s, value: s })),
  ];

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatus }) =>
      setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback', id] });
      toast.success('Feedback status updated');
      setValue(null);
    },
    onError: err => {
      toast.error('Failed to update feedback status', {
        description: err.message,
      });
    },
  });

  return (
    <ButtonGroup className="w-[180px]">
      <Select
        items={items}
        onValueChange={setValue}
        value={value}
        disabled={availableTransitions.length === 0 || mutation.isPending}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {value && (
        <Button
          size="icon-sm"
          onClick={() => mutation.mutate({ id, status: value })}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? <Spinner /> : <Check />}
        </Button>
      )}
    </ButtonGroup>
  );
}
