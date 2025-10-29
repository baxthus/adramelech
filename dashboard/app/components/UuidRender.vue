<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core';

const { uuid, to } = defineProps<{
  uuid: string;
  to?: string;
}>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.isSmaller('md');

const open = ref(false);
</script>

<template>
  <UTooltip v-model:open="open" :text="uuid" :delay-duration="0">
    <ULink v-if="to" :to="to">
      {{ uuid.split('-')[0] + '...' }}
    </ULink>
    <span v-else @click="isMobile ? (open = !open) : null">
      {{ uuid.split('-')[0] + '...' }}
    </span>
  </UTooltip>
</template>
