<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

const { collapsed } = defineProps<{
  collapsed?: boolean;
}>();

const { user } = useUser();
const { signOut } = useAuth();
const clerk = useClerk();

const colorMode = useColorMode();
const appConfig = useAppConfig();

const userName = computed(
  () =>
    user.value?.firstName ||
    user.value?.username ||
    user.value?.emailAddresses[0]?.emailAddress ||
    'User',
);

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: userName.value,
      avatar: {
        src: user.value?.imageUrl,
        alt: userName.value,
      },
    },
  ],
  [
    {
      label: 'Profile',
      icon: 'lucide:user',
      onSelect: () => clerk.value?.openUserProfile(),
    },
  ],
  [
    {
      label: 'Theme',
      icon: 'lucide:sun-moon',
      children: [
        {
          label: 'System',
          icon: 'lucide:monitor',
          type: 'checkbox',
          checked: colorMode.preference === 'system',
          onSelect: (e) => {
            e.preventDefault();
            colorMode.preference = 'system';
          },
        },
        {
          label: 'Light',
          icon: 'lucide:sun',
          type: 'checkbox',
          checked: colorMode.preference === 'light',
          onSelect: (e) => {
            e.preventDefault();
            colorMode.preference = 'light';
          },
        },
        {
          label: 'Dark',
          icon: 'lucide:moon',
          type: 'checkbox',
          checked: colorMode.preference === 'dark',
          onSelect: (e) => {
            e.preventDefault();
            colorMode.preference = 'dark';
          },
        },
      ],
    },
    {
      label: 'Source Code',
      icon: 'lucide:github',
      to: appConfig.data.repository,
      target: '_blank',
    },
    {
      label: 'Sign out',
      icon: 'lucide:log-out',
      onSelect: async () => {
        await signOut.value();
        await navigateTo('/sign-in');
      },
    },
  ],
]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      :label="collapsed ? undefined : userName"
      :avatar="{
        src: user?.imageUrl,
        alt: userName,
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      :trailing-icon="collapsed ? undefined : 'lucide:chevrons-up-down'"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    />
  </UDropdownMenu>
</template>
