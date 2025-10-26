<script setup lang="ts">
const { class: className, collapsed = false } = defineProps<{
  class?: string;
  collapsed?: boolean;
}>();
</script>

<template>
  <div class="flex" :class="className">
    <div class="flex items-center gap-x-2">
      <img
        src="/logo.png"
        alt="Adramelech Logo"
        class="size-10 object-contain"
      />
      <span v-if="!collapsed" class="font-logo w-min text-center text-sm"
        >Adramelech Dashboard</span
      >
    </div>
  </div>
</template>
