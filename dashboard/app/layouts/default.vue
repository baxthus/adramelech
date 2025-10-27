<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const appConfig = useAppConfig();

const open = ref(false);

const links = [
  {
    label: 'Home',
    icon: appConfig.ui.icons.home,
    to: '/',
    onSelect: () => (open.value = false),
  },
  {
    label: 'Phrases',
    icon: appConfig.ui.icons.phrases,
    to: '/phrases',
    onSelect: () => (open.value = false),
  },
  {
    label: 'Profiles',
    icon: appConfig.ui.icons.profiles,
    to: '/profiles',
    onSelect: () => (open.value = false),
  },
  {
    label: 'Feedbacks',
    icon: appConfig.ui.icons.feedbacks,
    to: '/feedbacks',
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
      toggle-side="right"
    >
      <template #header="{ collapsed }">
        <Logo
          :collapsed="collapsed"
          class="w-full justify-start lg:justify-center"
        />
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
