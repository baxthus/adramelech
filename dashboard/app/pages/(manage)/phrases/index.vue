<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { Phrase } from 'database/schemas/schema';
import type { Row } from '@tanstack/vue-table';
import copyToClipboard from '~/utils/copyToClipboard';

const appConfig = useAppConfig();

const toast = useToast();
const { copy } = useClipboard();

const UuidRender = resolveComponent('UuidRender');
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
  onMutate: (id) => {
    loadingToast.create(toast, `delete-phrase-${id}`, {
      title: 'Deleting phrase...',
    });
  },
  onSuccess: (_, id) => {
    queryClient.invalidateQueries({ queryKey: ['phrases'] });
    loadingToast.update(toast, `delete-phrase-${id}`, {
      title: 'Phrase deleted',
      color: 'success',
      icon: appConfig.ui.icons.success,
    });
  },
  onError: (error, id) => {
    loadingToast.update(toast, `delete-phrase-${id}`, {
      title: 'Failed to delete phrase',
      color: 'error',
      icon: appConfig.ui.icons.error,
    });
  },
});

const columns: TableColumn<Phrase>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => h(UuidRender, { uuid: row.original.id }),
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
              icon: appConfig.ui.icons.menuVertical,
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
    icon: appConfig.ui.icons.trash,
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

        <template #right>
          <PhrasesAddModal :query-client="queryClient" />
          <UButton
            :icon="appConfig.ui.icons.reload"
            color="neutral"
            variant="subtle"
            :disabled="isLoading"
            :loading="isRefetching"
            @click="() => void refetch()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <SearchField
          name="phrases"
          class="w-full max-w-md"
          @update:value="(value) => (searchTerm = value)"
        />
        <UAlert
          v-if="isError"
          color="error"
          variant="subtle"
          title="Failed to load phrases"
          :description="error?.message"
          :icon="appConfig.ui.icons.error"
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
          :loading="isLoading || isRefetching"
          class="shrink-0"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
