<script setup lang="ts">
const { class: className, content = 'Adramelech Dashboard' } = defineProps<{
  class?: string;
  content?: string;
}>();
</script>

<template>
  <p class="font-boldonse text-center" :class="className">
    {{ content }}
  </p>
</template>
