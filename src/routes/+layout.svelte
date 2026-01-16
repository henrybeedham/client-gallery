<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { children, data } = $props();

	// Apply theme from settings
	function applyTheme(theme: string) {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme);
		}
	}

	// Apply theme on mount and when data changes
	$effect(() => {
		if (data?.settings?.theme) {
			applyTheme(data.settings.theme);
		}
	});

	onMount(() => {
		if (data?.settings?.theme) {
			applyTheme(data.settings.theme);
		}
	});
</script>

<svelte:head>
	<title>Gallery</title>
	<meta name="description" content="Professional Photography Gallery" />
</svelte:head>

{#key $page.url.pathname}
	<div 
		in:fly={{ y: 20, duration: 400, easing: cubicOut, delay: 100 }}
		out:fade={{ duration: 200, easing: cubicOut }}
	>
		{@render children()}
	</div>
{/key}
