import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useMutation, type QueryClient } from '@tanstack/react-query';
import { phraseInsertSchema, type PhraseInsert } from 'database/schemas/schema';
import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPhrase } from './actions';
import { useState } from 'react';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import Alert from '@/components/alert';

export function NewPhraseDialog({
  queryClient,
  slick = false,
}: {
  queryClient: QueryClient;
  slick?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<PhraseInsert>({
    resolver: zodResolver(phraseInsertSchema),
    defaultValues: {
      content: '',
      source: '',
    },
  });

  const { mutate, isPending, isError, error, reset } = useMutation({
    mutationFn: (phrase: PhraseInsert) => createPhrase(phrase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phrases'] });
      setOpen(false);
    },
  });

  const onSubmit = (phrase: PhraseInsert) => mutate(phrase);

  return (
    <Dialog
      open={open}
      onOpenChange={state => {
        form.reset();
        reset();
        setOpen(state);
      }}
    >
      <DialogTrigger asChild>
        <Button size={slick ? 'sm' : 'icon'}>
          <Plus />
          {slick && 'New Phrase'}
        </Button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={isPending ? e => e.preventDefault() : undefined}
        onPointerDownOutside={isPending ? e => e.preventDefault() : undefined}
        className="max-h-full overflow-y-auto"
      >
        <DialogHeader className="mb-2">
          <DialogTitle>New Phrase</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="content"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="content">Content</FieldLabel>
                  <Textarea
                    {...field}
                    id="content"
                    placeholder="Tell me who I should be"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="source"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="source">Source</FieldLabel>
                  <Input
                    {...field}
                    id="source"
                    placeholder="Kill for You; Gigi Perez"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {isError && (
              <Alert
                title="Failed to create phrase"
                description={error.message}
                variant="destructive"
              />
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isPending}>
                  Close
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner />}
                Create
              </Button>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
