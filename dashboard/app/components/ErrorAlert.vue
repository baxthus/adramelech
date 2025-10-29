<script setup lang="ts">
const { title, error, retryAction } = defineProps<{
  title: string;
  error?: Error | null;
  retryAction?: () => void;
}>();

const appConfig = useAppConfig();
</script>

<template>
  <UAlert
    color="error"
    variant="subtle"
    :title="title"
    :description="error?.message"
    :icon="appConfig.ui.icons.error"
    :actions="
      retryAction
        ? [
            {
              label: 'Retry',
              color: 'error',
              size: 'md',
              onClick: retryAction,
            },
          ]
        : undefined
    "
  />
</template>
