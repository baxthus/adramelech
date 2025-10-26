<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { type QueryClient, useMutation } from '@tanstack/vue-query';
import { type PhraseInsert, phraseInsertSchema } from 'database/schemas/schema';

const { queryClient } = defineProps<{
  queryClient: QueryClient;
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const state = reactive<Partial<PhraseInsert>>({
  content: '',
  source: '',
});

const addMutation = useMutation({
  mutationFn: (phrase: PhraseInsert) =>
    $fetch('/api/phrases', {
      method: 'POST',
      body: phrase,
    }),
  onMutate: () => (loading.value = true),
  onSuccess: () => {
    open.value = false;
    queryClient.invalidateQueries({ queryKey: ['phrases'] });
    toast.add({
      title: 'Phrase added',
      color: 'success',
      icon: 'lucide:circle-check',
    });
  },
  onError: (error) => {
    toast.add({
      title: 'Failed to add phrase',
      description: error?.message,
      color: 'error',
      icon: 'lucide:circle-alert',
    });
  },
  onSettled: () => (loading.value = false),
});

const onSubmit = (event: FormSubmitEvent<PhraseInsert>) =>
  addMutation.mutate(event.data);
</script>

<template>
  <UModal v-model:open="open" title="New Phrase">
    <UButton icon="lucide:plus" />

    <template #body>
      <UForm
        :schema="phraseInsertSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Content" name="content">
          <UTextarea v-model="state.content" class="w-full" />
        </UFormField>
        <UFormField label="Source" name="source">
          <UInput v-model="state.source" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-x-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton type="submit" label="Create" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
