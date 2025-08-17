<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import '@fontsource/geist-sans';
	import '@fontsource/boldonse';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
</script>

<svelte:head>
	<title>Adramelech Dashboard</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />
<Toaster position="bottom-right" richColors />

{#if page.url.pathname !== '/login'}
	<main class="p-4">
		{@render children?.()}
	</main>
{:else}
	<main>
		{@render children?.()}
	</main>
{/if}
