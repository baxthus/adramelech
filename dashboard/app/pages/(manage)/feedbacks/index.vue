<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { useQuery } from '@tanstack/vue-query';
import type { Feedback } from 'database/schemas/schema';

const appConfig = useAppConfig();

const UuidRender = resolveComponent('UuidRender');

const searchTerm = ref('');

const {
  data: feedbacks,
  isLoading,
  isRefetching,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: ['feedbacks', searchTerm],
  queryFn: () =>
    $fetch<Feedback[]>('/api/feedbacks', {
      query: {
        searchTerm: searchTerm.value,
      },
    }),
});

const columns: TableColumn<Feedback>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => h(UuidRender, { uuid: row.original.id }),
  },
];
</script>

<template>
  <UDashboardPanel id="feedbacks">
    <template #header>
      <UDashboardNavbar title="Feedbacks">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
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
          name="feedbacks"
          class="w-full max-w-md"
          @update:value="(value) => (searchTerm = value)"
        />
        <UAlert
          v-if="isError"
          color="error"
          variant="subtle"
          title="Failed to load feedbacks"
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
          :data="feedbacks"
          :columns="columns"
          :loading="isLoading || isRefetching"
          class="shrink-0"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
