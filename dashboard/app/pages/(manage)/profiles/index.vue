<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { Row } from '@tanstack/vue-table';
import type { Profile } from 'database/schemas/schema';

const appConfig = useAppConfig();

const toast = useToast();
const { copy } = useClipboard();

const UuuidRender = resolveComponent('UuidRender');
const UIcon = resolveComponent('UIcon');
const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');

const searchTerm = ref('');

const queryClient = useQueryClient();
const {
  data: profiles,
  isLoading,
  isRefetching,
  isError,
  error,
  refetch,
} = useQuery({
  queryKey: ['profiles', searchTerm],
  queryFn: () =>
    $fetch<Profile[]>('/api/profiles', {
      query: {
        searchTerm: searchTerm.value,
      },
    }),
});

const deleteMutation = useMutation({
  mutationFn: (id: string) =>
    $fetch(`/api/profiles/${id}`, {
      method: 'DELETE',
    }),
  onMutate: (id) => {
    loadingToast.create(toast, `delete-profile-${id}`, {
      title: 'Deleting profile...',
    });
  },
  onSuccess: (_, id) => {
    queryClient.invalidateQueries({ queryKey: ['profiles'] });
    loadingToast.update(toast, `delete-profile-${id}`, {
      title: 'Profile deleted',
      color: 'success',
      icon: appConfig.ui.icons.success,
    });
  },
  onError: (error, id) => {
    loadingToast.update(toast, `delete-profile-${id}`, {
      title: 'Failed to delete profile',
      description: error?.message,
      color: 'error',
      icon: appConfig.ui.icons.error,
    });
  },
});

const columns: TableColumn<Profile>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => h(UuuidRender, { uuid: row.original.id }),
  },
  {
    accessorKey: 'discordId',
    header: 'Discord ID',
  },
  {
    accessorKey: 'nickname',
    header: 'Nickname',
    cell: ({ row }) =>
      row.original.nickname || h(UIcon, { name: appConfig.ui.icons.nothing }),
  },
  {
    accessorKey: 'bio',
    header: 'Bio',
    cell: ({ row }) =>
      row.original.bio
        ? h(
            'span',
            { class: 'whitespace-pre truncate max-w-xs block' },
            row.original.bio,
          )
        : h(UIcon, { name: appConfig.ui.icons.nothing }),
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
            'aria-label': 'Profile actions',
          },
          () =>
            h(UButton, {
              icon: appConfig.ui.icons.menuVertical,
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto',
              'aria-label': 'Open actions menu',
            }),
        ),
      ),
  },
];

const getRowActions = (row: Row<Profile>) => {
  const actions: DropdownMenuItem[] = [
    {
      label: 'View details',
      icon: appConfig.ui.icons.eye,
      to: `/profiles/${row.original.id}`,
    },
    { type: 'separator' },
    {
      label: 'Copy ID',
      onSelect: () => copyToClipboard(copy, toast.add, row.original.id, 'ID'),
    },
    {
      label: 'Copy Discord ID',
      onSelect: () =>
        copyToClipboard(copy, toast.add, row.original.discordId, 'Discord ID'),
    },
  ];

  if (row.original.nickname)
    actions.push({
      label: 'Copy Nickname',
      onSelect: () =>
        copyToClipboard(copy, toast.add, row.original.nickname!, 'Nickname'),
    });
  if (row.original.bio)
    actions.push({
      label: 'Copy Bio',
      onSelect: () =>
        copyToClipboard(copy, toast.add, row.original.bio!, 'Bio'),
    });

  actions.push(
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
  );

  return actions;
};
</script>

<template>
  <UDashboardPanel id="profiles">
    <template #header>
      <UDashboardNavbar title="Profiles">
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
          name="profiles"
          class="w-full max-w-md"
          @update:value="(value) => (searchTerm = value)"
        />
        <UAlert
          v-if="isError"
          color="error"
          variant="subtle"
          title="Failed to load profiles"
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
          :data="profiles"
          :columns="columns"
          :loading="isLoading || isRefetching"
          class="shrink-0"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
