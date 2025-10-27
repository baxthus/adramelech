<script setup lang="ts">
const appConfig = useAppConfig();
</script>

<template>
  <UApp class="min-h-screen" :toaster="appConfig.toaster">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
