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
];
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <Logo class="w-full text-sm" :content="collapsed ? 'AD' : undefined" />
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
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
