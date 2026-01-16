<script lang="ts">
	import { Image, Lock } from 'lucide-svelte';
	import { renderMarkdown } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data } = $props();

	// Intersection Observer for scroll animations
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px 100px 0px' }
		);

		document.querySelectorAll('.scroll-fade-in').forEach((el) => {
			observer.observe(el);
		});

		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<title>Photography Portfolio</title>
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
		class="sticky top-0 bg-[var(--color-cream)]/95 backdrop-blur-sm border-b border-[var(--color-border)] z-50 animate-fade-in"
	>
		<div class="container">
			<div class="flex items-center justify-between py-6 md:py-8">
				<a href="/" class="text-xl md:text-2xl font-bold tracking-tight serif-heading">
					{data.settings.siteTitle}
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

	<!-- Hero Section -->
	<section class="relative py-20 md:py-32 lg:py-40 animate-fade-in overflow-hidden">
		{#if data.settings.heroImage}
			<div class="absolute inset-0 z-0">
				<img
					src="/api/hero/{data.settings.heroImage}"
					alt="Hero"
					class="w-full h-full object-cover"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-b from-[var(--color-cream)]/60 via-[var(--color-cream)]/70 to-[var(--color-cream)]"
				></div>
			</div>
		{/if}
		<div class="container relative z-10">
			<div class="max-w-4xl">
				<h1
					class="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 text-[var(--color-charcoal)] leading-[1.1]"
					style="font-family: 'Playfair Display', serif; white-space: pre-line;"
				>
					{data.settings.heroTitle}
				</h1>
				<p
					class="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl leading-relaxed mb-10"
				>
					{data.settings.heroDescription}
				</p>
				<a
					href="/#work"
					class="btn btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform"
				>
					View Work
				</a>
			</div>
		</div>
	</section>

	<!-- Work Section -->
	<main class="flex-1 pb-20 md:pb-32" id="work">
		<div class="container">
			<!-- Featured Album Photos -->
			{#if data.featuredAlbum && data.featuredPhotos.length > 0}
				<div class="mb-24 md:mb-32 scroll-fade-in">
					<div class="mb-12 md:mb-16">
						<h2
							class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-charcoal)] mb-4"
							style="font-family: 'Playfair Display', serif;"
						>
							{data.featuredAlbum.title}
						</h2>
						<div class="w-24 h-0.5 bg-[var(--color-charcoal)] mb-6"></div>
						{#if data.featuredAlbum.description}
							<div class="prose max-w-3xl">
								{@html renderMarkdown(data.featuredAlbum.description)}
							</div>
						{/if}
					</div>

					<!-- Masonry Grid for Featured Photos -->
					<div
						class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 md:gap-8 space-y-6 md:space-y-8"
					>
						{#each data.featuredPhotos as photo, index}
							<a
								href="/album/{data.featuredAlbum.slug}/photo/{photo.id}"
								class="group block break-inside-avoid mb-6 md:mb-8 scroll-fade-in"
								onclick={() => sessionStorage.setItem('fromHomepage', 'true')}
							>
								<div class="relative overflow-hidden bg-[var(--color-bg-secondary)]">
									<img
										src="/api/photos/{data.featuredAlbum.slug}/{photo.filename}/medium"
										alt={photo.original_filename}
										loading="lazy"
										class="w-full h-auto transition-all duration-700 group-hover:scale-105 group-hover:brightness-95"
									/>
								</div>
							</a>
						{/each}
					</div>

					<div class="text-center mt-12 md:mt-16">
						<a
							href="/album/{data.featuredAlbum.slug}"
							class="btn btn-secondary inline-flex items-center gap-2 hover:scale-105 transition-transform"
						>
							View Full Collection
						</a>
					</div>
				</div>
			{/if}

			<div class="mb-16 md:mb-24 scroll-fade-in">
				<h2
					class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-charcoal)] mb-4"
					style="font-family: 'Playfair Display', serif;"
				>
					Explore More
				</h2>
				<div class="w-24 h-0.5 bg-[var(--color-charcoal)]"></div>
			</div>

			{#if data.showOnHomeAlbums && data.showOnHomeAlbums.length > 0}
				<!-- Show on Home Albums Grid -->
				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-16 scroll-fade-in"
				>
					{#each data.showOnHomeAlbums as album, index}
						<a
							href="/album/{album.slug}"
							class="group block animate-fade-in"
							style="animation-delay: {index * 0.1}s;"
						>
							<div class="relative overflow-hidden bg-[var(--color-bg-secondary)] mb-4">
								{#if album.cover_filename}
									<img
										src="/api/photos/{album.slug}/{album.cover_filename}/medium"
										alt={album.title}
										loading="lazy"
										class="w-full aspect-[4/3] object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-95"
									/>
								{:else}
									<div
										class="w-full aspect-[4/3] flex items-center justify-center bg-[var(--color-bg-tertiary)]"
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
							<div>
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

			<div class="text-center py-8">
				<a
					href="/galleries"
					class="btn btn-primary inline-flex items-center gap-2 hover:scale-105 transition-transform"
				>
					View All Galleries
				</a>
			</div>
		</div>
	</main>

	<!-- About Section -->
	<section class="py-20 md:py-32 bg-[var(--color-bg-secondary)] scroll-fade-in" id="about">
		<div class="container">
			<div class="max-w-3xl mx-auto text-center">
				<h2
					class="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--color-charcoal)] mb-8"
					style="font-family: 'Playfair Display', serif;"
				>
					{data.settings.aboutTitle}
				</h2>
				<p
					class="text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed mb-8"
					style="white-space: pre-line;"
				>
					{data.settings.aboutText}
				</p>
				{#if data.settings.showContactOnHome && (data.settings.contactEmail || data.settings.contactPhone)}
					<div class="mt-8 space-y-2">
						{#if data.settings.contactEmail}
							<p class="text-base text-[var(--color-text-muted)]">
								Email: <a
									href="mailto:{data.settings.contactEmail}"
									class="underline hover:text-[var(--color-charcoal)] transition-colors"
									>{data.settings.contactEmail}</a
								>
							</p>
						{/if}
						{#if data.settings.contactPhone}
							<p class="text-base text-[var(--color-text-muted)]">
								Phone: <a
									href="tel:{data.settings.contactPhone}"
									class="underline hover:text-[var(--color-charcoal)] transition-colors"
									>{data.settings.contactPhone}</a
								>
							</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="py-12 border-t border-[var(--color-border)] bg-[var(--color-cream)]">
		<div class="container">
			<div class="flex items-center justify-between flex-wrap gap-4">
				<p class="nav-text text-[var(--color-text-muted)]">
					{data.settings.copyrightText}
				</p>
				<a
					href="/admin"
					class="nav-text text-[var(--color-text-muted)] hover:text-[var(--color-charcoal)] transition-colors duration-300"
					>Admin</a
				>
			</div>
		</div>
	</footer>
</div>

<style>
	.serif-heading {
		font-family: 'Playfair Display', serif;
	}
</style>
