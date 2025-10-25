<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home">
        <template #leading>
          <UDashboardSidebarCollapse
            variant="ghost"
            :ui="{
              leadingIcon: 'text-dimmed',
            }"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <h1>Test</h1>
      <UButton>Click me</UButton>
    </template>
  </UDashboardPanel>
</template>
