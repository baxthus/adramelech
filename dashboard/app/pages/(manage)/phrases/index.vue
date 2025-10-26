<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { Phrase } from 'database/schemas/schema';
import type { Row } from '@tanstack/vue-table';
import copyToClipboard from '~/utils/copyToClipboard';

const toast = useToast();
const { copy } = useClipboard();

const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');

const searchTerm = ref('');

const queryClient = useQueryClient();
const {
  data: phrases,
  isLoading,
  isRefetching,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: ['phrases', searchTerm],
  queryFn: () =>
    $fetch<Phrase[]>('/api/phrases', {
      query: {
        searchTerm: searchTerm.value,
      },
    }),
});

const deleteMutation = useMutation({
  mutationFn: (id: string) =>
    $fetch(`/api/phrases/${id}`, {
      method: 'DELETE',
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['phrases'] });
    toast.add({
      title: 'Phrase deleted',
      color: 'success',
      icon: 'lucide:check',
    });
  },
  onError: (error) => {
    toast.add({
      title: 'Failed to delete phrase',
      description: error?.message,
      color: 'error',
      icon: 'lucide:circle-alert',
    });
  },
});

const columns: TableColumn<Phrase>[] = [
  {
    accessorKey: 'id',
    header: '#',
  },
  {
    accessorKey: 'content',
    header: 'Content',
    cell: ({ row }) =>
      h('span', { class: 'whitespace-pre' }, row.original.content),
  },
  {
    accessorKey: 'source',
    header: 'Source',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'whitespace-pre' },
        row.original.source.replace(/;\s/g, '\n'),
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => formatDate(new Date(row.original.createdAt)),
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end',
            },
            items: getRowActions(row),
            'aria-label': 'Actions dropdown',
          },
          () =>
            h(UButton, {
              icon: 'lucide:ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto',
              'aria-label': 'Actions dropdown',
            }),
        ),
      ),
  },
];

const getRowActions = (row: Row<Phrase>) => [
  {
    type: 'label',
    label: 'Actions',
  },
  {
    label: 'Copy ID',
    onSelect: () => copyToClipboard(copy, toast.add, row.original.id, 'ID'),
  },
  {
    label: 'Copy Content',
    onSelect: () =>
      copyToClipboard(copy, toast.add, row.original.content, 'Content'),
  },
  {
    label: 'Copy Source',
    onSelect: () =>
      copyToClipboard(copy, toast.add, row.original.source, 'Source'),
  },
  {
    label: 'Copy Unix Timestamp',
    onSelect: () =>
      copyToClipboard(
        copy,
        toast.add,
        new Date(row.original.createdAt).getTime().toString(),
        'Unix Timestamp',
      ),
  },
  { type: 'separator' },
  {
    label: 'Delete',
    color: 'error',
    icon: 'lucide:trash',
    onSelect: () => deleteMutation.mutate(row.original.id),
  },
];
</script>

<template>
  <UDashboardPanel id="phrases">
    <template #header>
      <UDashboardNavbar title="Phrases">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-x-2">
          <SearchField
            name="phrases"
            class="w-full max-w-md"
            @update:value="(value) => (searchTerm = value)"
          />
          <div class="flex items-center gap-x-2">
            <UButton icon="lucide:plus" />
            <UButton
              icon="lucide:refresh-cw"
              color="neutral"
              variant="soft"
              :disabled="isLoading || isRefetching"
              @click="() => void refetch()"
            />
          </div>
        </div>
        <UAlert
          v-if="isError"
          color="error"
          variant="subtle"
          title="Failed to load phrases"
          :description="error?.message"
          icon="lucide:circle-alert"
          :actions="[
            {
              label: 'Retry',
              color: 'error',
              size: 'md',
              onClick: () => void refetch(),
            },
          ]"
        />
        <UTable
          v-else
          :data="phrases"
          :columns="columns"
          :loading="isLoading"
          class="flex-1"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
