<script setup lang="ts">
const props = defineProps<{
  name: string;
  delay?: number;
  class?: string;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

const searchInput = ref<string>('');

const debouncedEmit = debounce((value: string) => {
  emit('update:value', value);
}, props.delay ?? 500);
</script>

<template>
  <UInput
    v-model="searchInput"
    color="neutral"
    :placeholder="`Search ${name}...`"
    leading-icon="lucide:search"
    :class="props.class"
    :ui="{ trailing: 'pe-1' }"
    @update:model-value="debouncedEmit"
  >
    <template v-if="searchInput?.length" #trailing>
      <UButton
        color="neutral"
        variant="link"
        size="sm"
        icon="lucide:circle-x"
        aria-label="Clear input"
        @click="
          searchInput = '';
          debouncedEmit('');
        "
      />
    </template>
  </UInput>
</template>
