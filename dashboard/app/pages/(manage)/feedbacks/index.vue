<script setup lang="ts">
import type { BadgeProps, TableColumn } from '@nuxt/ui';
import { useQuery } from '@tanstack/vue-query';
import type { Feedback, FeedbackStatus } from 'database/schemas/schema';

const appConfig = useAppConfig();

const UuidRender = resolveComponent('UuidRender');
const UBadge = resolveComponent('UBadge');

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

const statusColor: Record<FeedbackStatus, BadgeProps['color']> = {
  open: 'secondary',
  acknowledged: 'warning',
  closed: 'neutral',
  resolved: 'primary',
  accepted: 'success',
  rejected: 'error',
};

const columns: TableColumn<Feedback>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => h(UuidRender, { uuid: row.original.id }),
  },
  {
    accessorKey: 'profileId',
    header: 'Profile',
    cell: ({ row }) =>
      h(UuidRender, {
        uuid: row.original.profileId,
        to: `/profiles/${row.original.profileId}`,
      }),
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          class: 'capitalize',
          variant: 'subtle',
          color: statusColor[row.original.status],
        },
        () => row.original.status,
      ),
  },
  {
    accessorKey: 'response',
    header: 'Responded',
    cell: ({ row }) =>
      h(
        UBadge,
        {
          class: 'capitalize',
          variant: 'subtle',
          color: row.original.response ? 'success' : 'neutral',
        } as BadgeProps,
        () => (row.original.response ? 'Yes' : 'No'),
      ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ row }) => formatDate(new Date(row.original.createdAt)),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    cell: ({ row }) => formatDate(new Date(row.original.updatedAt)),
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
        <ErrorAlert
          v-if="isError"
          title="Failed to load feedbacks"
          :error="error"
          :retry-action="refetch"
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
