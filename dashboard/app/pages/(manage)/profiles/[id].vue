<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import type { Profile } from 'database/schemas/schema';
import * as z from 'zod/mini';

definePageMeta({
  validate: (route) => {
    return z.uuid().safeParse(route.params.id).success;
  },
});

const route = useRoute();
const profileId = route.params.id as string;

const { data: profile } = useQuery({
  queryKey: ['profile', profileId],
  queryFn: () => $fetch<Profile>(`/api/profiles/${profileId}`),
});
</script>

<template>
  <UDashboardPanel :id="`profile-${profileId}`">
    <template #header>
      <UDashboardNavbar :title="`Profiles / ${profileId}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <span class="whitespace-pre-wrap">
        {{ JSON.stringify(profile, null, 2) }}
      </span>
    </template>
  </UDashboardPanel>
</template>
