<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import '@fontsource/geist-sans';
	import '@fontsource/boldonse';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<title>Adramelech Dashboard</title>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

<main class="p-4">
	{@render children?.()}
</main>
