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
import { Check } from 'lucide-react';
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import type { FeedbackStatusInfer } from 'database/types';
import { setStatus } from '@/actions/feedbacks';
import { statusTransitions } from '@/definitions/feedbacks';

export function StatusUpdate({
  queryClient,
  id,
  status,
}: {
  queryClient: QueryClient;
  id: string;
  status: FeedbackStatusInfer;
}) {
  const [value, setValue] = useState<FeedbackStatusInfer | null>(null);

  const availableTransitions = statusTransitions.get(status) ?? [];
  const items = [
    { label: 'Change the status', value: null },
    ...availableTransitions.map(s => ({ label: s, value: s })),
  ];

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: FeedbackStatusInfer }) =>
      setStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['feedback', id] });
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
