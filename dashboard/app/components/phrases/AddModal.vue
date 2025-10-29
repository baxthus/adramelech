<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui';
import { type QueryClient, useMutation } from '@tanstack/vue-query';
import { type PhraseInsert, phraseInsertSchema } from 'database/schemas/schema';

const { queryClient } = defineProps<{
  queryClient: QueryClient;
}>();

const appConfig = useAppConfig();

const open = ref(false);

const state = reactive<Partial<PhraseInsert>>({
  content: '',
  source: '',
});

const { mutate, isPending, isError, error, reset } = useMutation({
  mutationFn: (phrase: PhraseInsert) =>
    $fetch('/api/phrases', {
      method: 'POST',
      body: phrase,
    }),
  onSuccess: () => {
    open.value = false;
    queryClient.invalidateQueries({ queryKey: ['phrases'] });
  },
});

const onSubmit = (event: FormSubmitEvent<PhraseInsert>) => mutate(event.data);

function resetForm() {
  state.content = '';
  state.source = '';
  reset();
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="New Phrase"
    :dismissible="!isPending"
    :close="{ disabled: isPending }"
    @update:open="resetForm"
  >
    <UButton :icon="appConfig.ui.icons.plus" label="New phrase" />

    <template #body>
      <UForm
        :schema="phraseInsertSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField name="content">
          <UTextarea
            v-model="state.content"
            placeholder="Content"
            class="w-full"
          />
        </UFormField>
        <UFormField name="source">
          <UInput v-model="state.source" placeholder="Source" class="w-full" />
        </UFormField>
        <ErrorAlert
          v-if="isError"
          title="Failed to add phrase"
          :error="error"
        />
        <div class="flex justify-end gap-x-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            :disabled="isPending"
            @click="open = false"
          />
          <UButton type="submit" label="Create" :loading="isPending" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
