import {
  addToast,
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  useDisclosure,
} from '@heroui/react';
import { useMutation, type QueryClient } from '@tanstack/react-query';
import { phraseInsertSchema } from 'database/schemas/schema';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type z from 'zod';
import { IconPlus } from '@tabler/icons-react';
import { addPhrase } from './actions';

export default function AddPhraseModal({
  queryClient,
}: {
  queryClient: QueryClient;
}) {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure({
    onClose: () => form.reset(),
  });
  const [isLoading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof phraseInsertSchema>>({
    resolver: zodResolver(phraseInsertSchema),
    defaultValues: {
      content: '',
      source: '',
    },
  });

  const addMutation = useMutation({
    mutationFn: addPhrase,
    onMutate: () => setLoading(true),
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ['phrases'] });
      addToast({ title: 'Phrase added', color: 'success' });
    },
    onError: (error) => {
      addToast({
        title: 'Failed to add phrase',
        description: error?.message,
        color: 'danger',
      });
    },
    onSettled: () => setLoading(false),
  });

  const onSubmit = (data: z.infer<typeof phraseInsertSchema>) =>
    addMutation.mutate(data);

  return (
    <>
      <Button color="primary" isIconOnly aria-label="Add Note" onPress={onOpen}>
        <IconPlus />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <Form onSubmit={form.handleSubmit(onSubmit)}>
          <ModalContent>
            {() => (
              <>
                <ModalHeader>Add Phrase</ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <Controller
                      control={form.control}
                      name="content"
                      render={({ field, fieldState }) => (
                        <Textarea
                          {...field}
                          label="Content"
                          isInvalid={fieldState.invalid}
                          errorMessage={fieldState.error?.message}
                        />
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="source"
                      render={({ field, fieldState }) => (
                        <Input
                          {...field}
                          label="Source"
                          isInvalid={fieldState.invalid}
                          errorMessage={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="flat" onPress={onClose}>
                    Close
                  </Button>
                  <Button type="submit" color="primary" isLoading={isLoading}>
                    Submit
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Form>
      </Modal>
    </>
  );
}
