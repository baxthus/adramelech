<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';

const appConfig = useAppConfig();

const { data, isError, error } = useQuery({
  queryKey: ['home-stats'],
  queryFn: () => $fetch('/api/stats'),
  placeholderData: {
    totalPhrases: 0,
    totalProfiles: 0,
    totalFeedbacks: 0,
  },
});

const stats = computed(() => [
  {
    title: 'Phrases',
    value: data.value?.totalPhrases,
    icon: appConfig.ui.icons.phrases,
    to: '/phrases',
  },
  {
    title: 'Profiles',
    value: data.value?.totalProfiles,
    icon: appConfig.ui.icons.profiles,
    to: '/profiles',
  },
  {
    title: 'Feedbacks',
    value: data.value?.totalFeedbacks,
    icon: appConfig.ui.icons.feedbacks,
    to: '/feedbacks',
  },
]);
</script>

<template>
  <UAlert
    v-if="isError"
    color="error"
    variant="subtle"
    title="Failed to load stats"
    :description="error?.message"
    :icon="appConfig.ui.icons.error"
  />
  <UPageGrid v-else class="gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.to"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading:
          'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal',
      }"
      class="first:rounded-l-lg last:rounded-r-lg hover:z-1 lg:rounded-none"
    >
      <span class="text-highlighted text-2xl">
        {{ stat.value }}
      </span>
    </UPageCard>
  </UPageGrid>
</template>
