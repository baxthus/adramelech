<script setup lang="ts">
const props = defineProps<{
  name: string;
  delay?: number;
  class?: string;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

const appConfig = useAppConfig();

const searchInput = ref<string>('');
</script>

<template>
  <UFieldGroup :class="props.class">
    <UInput
      v-model="searchInput"
      :placeholder="`Search ${name}...`"
      :ui="{ trailing: 'pe-1' }"
      class="flex-1"
      @keyup.enter="emit('update:value', searchInput)"
    >
      <template v-if="searchInput?.length" #trailing>
        <UButton
          color="neutral"
          variant="link"
          size="sm"
          :icon="appConfig.ui.icons.clear"
          aria-label="Clear input"
          @click="
            searchInput = '';
            emit('update:value', '');
          "
        />
      </template>
    </UInput>
    <UButton
      color="neutral"
      variant="outline"
      :icon="appConfig.ui.icons.search"
      aria-label="Search"
      @click="emit('update:value', searchInput)"
    />
  </UFieldGroup>
</template>
