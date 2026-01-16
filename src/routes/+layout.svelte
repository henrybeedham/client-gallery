<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { children } = $props();
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
