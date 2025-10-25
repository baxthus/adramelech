<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const open = ref(false);

const links = [
  {
    label: 'Home',
    icon: 'solar:home-smile-bold',
    to: '/',
    onSelect: () => (open.value = false),
  },
  {
    label: 'Phrases',
    icon: 'solar:document-text-bold',
    to: '/phrases',
    onSelect: () => (open.value = false),
  },
  {
    label: 'Users',
    icon: 'solar:users-group-rounded-bold',
    to: '/users',
    onSelect: () => (open.value = false),
  },
] satisfies NavigationMenuItem[];

const groups = [
  {
    id: 'links',
    label: 'Go to',
    items: links.flat(),
  },
  {
    id: 'code',
    label: 'Code',
    items: [
      {
        id: 'Source',
        label: 'Source Code',
        icon: 'simple-icons:github',
        to: 'https://github.com/baxthus/adramelech',
        target: '_blank',
      },
    ],
  },
];
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar v-model:open="open" collapsible class="bg-elevated/25">
      <template #header="{ collapsed }">
        <Logo class="w-full" :content="collapsed ? 'AD' : undefined" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
          tooltip
          popover
        />

        <div class="mt-auto flex justify-end">
          <UDashboardSidebarCollapse />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
