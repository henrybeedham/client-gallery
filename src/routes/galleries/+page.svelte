<script lang="ts">
	import { Image, Lock } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Galleries - Henry Beedham Photography</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen flex flex-col bg-[var(--color-cream)]">
	<!-- Navigation -->
	<header
		class="sticky top-0 bg-[var(--color-cream)]/95 backdrop-blur-sm border-b border-[var(--color-border)] z-50"
	>
		<div class="container">
			<div class="flex items-center justify-between py-6 md:py-8">
				<a href="/" class="text-xl md:text-2xl font-bold tracking-tight serif-heading">
					{data.settings.siteTitle}
				</a>
				<nav class="flex items-center gap-8 md:gap-12">
					<a
						href="/"
						class="nav-text text-[var(--color-text-secondary)] hover:text-[var(--color-charcoal)] transition-colors duration-300"
						>Home</a
					>
					<a
						href="/galleries"
						class="nav-text text-[var(--color-charcoal)] transition-colors duration-300"
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

	<!-- Galleries Section -->
	<main class="flex-1 py-20 md:py-32">
		<div class="container">
			<div class="mb-16 md:mb-24">
				<h1
					class="text-5xl md:text-6xl lg:text-7xl font-bold text-[var(--color-charcoal)] mb-6"
					style="font-family: 'Playfair Display', serif;"
				>
					Galleries
				</h1>
				<p class="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl">
					Explore the complete collection of photographic work, each gallery telling its own story.
				</p>
			</div>

			{#if data.albums.length === 0}
				<div class="text-center py-32">
					<Image size={64} strokeWidth={1} class="mx-auto mb-6 text-[var(--color-accent)]" />
					<h3
						class="text-2xl font-bold mb-3 text-[var(--color-charcoal)]"
						style="font-family: 'Playfair Display', serif;"
					>
						No Galleries Available
					</h3>
					<p class="text-[var(--color-text-secondary)]">Check back soon for new collections.</p>
				</div>
			{:else}
				<!-- Masonry Grid -->
				<div class="columns-1 md:columns-2 lg:columns-3 gap-8 md:gap-12 space-y-8 md:space-y-12">
					{#each data.albums as album, index}
						<a
							href="/album/{album.slug}"
							class="group block break-inside-avoid mb-8 md:mb-12 animate-fade-in"
							style="animation-delay: {index * 0.1}s;"
						>
							<div class="relative overflow-hidden bg-[var(--color-bg-secondary)]">
								{#if album.cover_filename}
									<img
										src="/api/photos/{album.slug}/{album.cover_filename}/medium"
										alt={album.title}
										loading="lazy"
										class="w-full h-auto transition-all duration-700 group-hover:scale-105 group-hover:brightness-95"
									/>
								{:else}
									<div
										class="w-full aspect-[4/5] flex items-center justify-center bg-[var(--color-bg-tertiary)]"
									>
										<Image size={64} strokeWidth={1} class="text-[var(--color-accent)]" />
									</div>
								{/if}
								{#if album.password}
									<div class="absolute top-4 right-4">
										<Lock size={18} class="text-white drop-shadow-lg" strokeWidth={1.5} />
									</div>
								{/if}
							</div>
							<div class="pt-6">
								<h3
									class="text-2xl md:text-3xl font-bold text-[var(--color-charcoal)] mb-2 transition-colors group-hover:text-[var(--color-text-secondary)]"
									style="font-family: 'Playfair Display', serif;"
								>
									{album.title}
								</h3>
								{#if album.photo_count}
									<p class="nav-text text-[var(--color-text-muted)]">
										{album.photo_count}
										{album.photo_count === 1 ? 'Image' : 'Images'}
									</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>

	<!-- Footer -->
	<footer class="py-12 border-t border-[var(--color-border)] bg-[var(--color-cream)]">
		<div class="container">
			<div class="text-center">
				<p class="nav-text text-[var(--color-text-muted)]">
					{data.settings.copyrightText}
				</p>
			</div>
		</div>
	</footer>
</div>

<style>
	.serif-heading {
		font-family: 'Playfair Display', serif;
	}
</style>
