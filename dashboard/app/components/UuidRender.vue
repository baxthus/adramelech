<script setup lang="ts">
import { breakpointsTailwind } from '@vueuse/core';

const { uuid } = defineProps<{
  uuid: string;
}>();

const breakpoints = useBreakpoints(breakpointsTailwind);
const isMobile = breakpoints.isSmaller('md');

const open = ref(false);
</script>

<template>
  <UTooltip v-model:open="open" :text="uuid" :delay-duration="0">
    <span @click="isMobile ? (open = !open) : null">
      {{ uuid.split('-')[0] + '...' }}
    </span>
  </UTooltip>
</template>
