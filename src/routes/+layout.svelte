<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Gallery</title>
	<meta name="description" content="Professional Photography Gallery" />
</svelte:head>

{@render children()}
