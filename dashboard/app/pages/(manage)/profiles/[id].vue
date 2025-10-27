<script setup lang="ts">
const route = useRoute();
const profileId = route.params.id as string;
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
  </UDashboardPanel>
</template>
