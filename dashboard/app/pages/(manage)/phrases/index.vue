<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { useQuery } from '@tanstack/vue-query';
import type { Phrase } from 'database/schemas/schema';

const searchTerm = ref('');

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
        <div class="flex items-center justify-between">
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
          icon="solar:danger-bold"
          :actions="[
            {
              label: 'Retry',
              color: 'error',
              size: 'md',
              onClick: () => void refetch(),
            },
          ]"
          class="max-w-fit min-w-md"
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
