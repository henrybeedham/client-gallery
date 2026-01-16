<script lang="ts">
	interface Props {
		siteTitle: string;
		scrollY?: number;
	}

	let { siteTitle, scrollY = 0 }: Props = $props();
	let isAtTop = $derived(scrollY < 50);
</script>

<header
	class="fixed w-full top-0 z-50 transition-all duration-300 animate-fade-in
  {isAtTop
		? 'bg-transparent border-transparent'
		: 'bg-[var(--color-cream)]/50 backdrop-blur-sm border-b border-[var(--color-border)]'}"
>
	<div class="container">
		<div class="flex items-center justify-between py-6 md:py-8">
			<a href="/" class="text-xl md:text-2xl font-bold tracking-tight serif-heading">
				{siteTitle}
			</a>
			<nav class="flex items-center gap-8 md:gap-12">
				<a
					href="/#work"
					class="nav-text text-[var(--color-text-secondary)] hover:text-[var(--color-charcoal)] transition-colors duration-300"
					>Work</a
				>
				<a
					href="/galleries"
					class="nav-text text-[var(--color-text-secondary)] hover:text-[var(--color-charcoal)] transition-colors duration-300"
					>Galleries</a
				>
				<a
					href="/#about"
					class="nav-text text-[var(--color-text-secondary)] hover:text-[var(--color-charcoal)] transition-colors duration-300"
					>About</a
				>
			</nav>
		</div>
	</div>
</header>

<style>
	.serif-heading {
		font-family: 'Playfair Display', serif;
	}
</style>
