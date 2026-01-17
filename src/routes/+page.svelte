<script lang="ts">
	import { Image, Lock } from 'lucide-svelte';
	import { renderMarkdown } from '$lib/utils';
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { animateIn } from '$lib/animate.js';

	let { data } = $props();
	let scrollY = $state(0);
	let isAtTop = $derived(scrollY < 50);

	// Timing constants for scroll restoration
	const SCROLL_RESTORE_IMAGE_DELAY = 300; // Wait for images to load
	const SCROLL_RESTORE_CLEANUP_DELAY = 1000; // Cleanup after scroll completes

	// Save scroll position when clicking a featured photo
	function saveScrollPosition(photoId: number) {
		if (browser) {
			sessionStorage.setItem('fromHomepage', 'true');
			sessionStorage.setItem('homeScrollToPhoto', photoId.toString());
		}
	}

	// Restore scroll position when returning from photo detail
	onMount(() => {
		const scrollToPhotoId = sessionStorage.getItem('homeScrollToPhoto');

		if (scrollToPhotoId) {
			const photoId = parseInt(scrollToPhotoId);
			// Validate photo ID is a positive number
			if (!isNaN(photoId) && photoId > 0) {
				tick()
					.then(() => {
						// Give images and masonry layout time to calculate
						setTimeout(() => {
							// Find the photo element with validated ID
							const photoLink = document.querySelector(
								`a[data-photo-id="${photoId}"]`
							) as HTMLElement;
							if (photoLink) {
								photoLink.scrollIntoView({ behavior: 'auto', block: 'center' });
								// Clean up after scrolling
								setTimeout(() => {
									sessionStorage.removeItem('homeScrollToPhoto');
								}, SCROLL_RESTORE_CLEANUP_DELAY);
							} else {
								// Fallback: just clear storage if photo not found
								sessionStorage.removeItem('homeScrollToPhoto');
							}
						}, SCROLL_RESTORE_IMAGE_DELAY);
					})
					.catch((error) => {
						console.error('Failed to restore scroll position:', error);
						sessionStorage.removeItem('homeScrollToPhoto');
					});
			} else {
				// Clear invalid photo ID from storage
				sessionStorage.removeItem('homeScrollToPhoto');
			}
		}
	});

	// Masonry layout for featured album (if layout_style is masonry)
	let masonryContainer: HTMLDivElement | null = null;
	let masonryPositions = $state<{ left: string; top: string; width: string }[]>([]);
	let masonryHeight = $state(0);
	let columnCount = $state(4);
	const MASONRY_GAP = 8;

	function calculateMasonryLayout() {
		if (!masonryContainer || !data.featuredAlbum || data.featuredAlbum.layout_style !== 'masonry')
			return;
		if (columnCount <= 0 || data.featuredPhotos.length === 0) return;

		const containerWidth = masonryContainer.offsetWidth;
		const columnWidth = (containerWidth - MASONRY_GAP * (columnCount - 1)) / columnCount;
		const columnHeights = new Array(columnCount).fill(0);
		const positions: { left: string; top: string; width: string }[] = [];

		for (const photo of data.featuredPhotos) {
			const minHeight = Math.min(...columnHeights);
			const columnIndex = columnHeights.indexOf(minHeight);
			const left = columnIndex * (columnWidth + MASONRY_GAP);
			const top = columnHeights[columnIndex];
			const aspectRatio =
				photo.width && photo.height && photo.width > 0 && photo.height > 0
					? photo.width / photo.height
					: 1;
			const itemHeight = columnWidth / aspectRatio;

			positions.push({
				left: `${left}px`,
				top: `${top}px`,
				width: `${columnWidth}px`
			});

			columnHeights[columnIndex] += itemHeight + MASONRY_GAP;
		}

		masonryPositions = positions;
		masonryHeight = Math.max(...columnHeights);
	}

	function updateColumnCount() {
		if (typeof window === 'undefined') return;
		if (window.innerWidth >= 1280) columnCount = 4;
		else if (window.innerWidth >= 1024) columnCount = 3;
		else if (window.innerWidth >= 640) columnCount = 2;
		else columnCount = 1;

		if (masonryContainer && masonryContainer.offsetWidth === 0) {
			// If container has no width yet, force a recalculation after a tick
			requestAnimationFrame(() => {
				updateColumnCount();
				calculateMasonryLayout();
			});
		}
	}

	// Re-calculate masonry when layout changes or window resizes
	$effect(() => {
		if (data.featuredAlbum?.layout_style === 'masonry' && browser) {
			updateColumnCount();
			calculateMasonryLayout();

			const handleResize = () => {
				updateColumnCount();
				calculateMasonryLayout();
			};
			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}
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

<svelte:window bind:scrollY />

<div class="min-h-screen flex flex-col bg-[var(--color-cream)]">
	<!-- Navigation -->
	<header
		class="fixed w-full top-0 z-50 transition-all duration-300 animate-fade-in
  {isAtTop
			? 'bg-transparent border-transparent'
			: 'bg-[var(--color-cream)]/50 backdrop-blur-sm border-b border-[var(--color-border)]'}"
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
	<section
		class="relative pb-20 md:pb-32 lg:pb-40 pt-40 md:pt-64 lg:pt-64 animate-fade-in overflow-hidden"
	>
		{#if data.settings.heroImage}
			<div class="absolute inset-0 z-0">
				<div
					class="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style="background-image: url('/api/hero/{data.settings.heroImage}');"
					role="img"
					aria-label="Hero Image"
				></div>

				<div
					class="absolute inset-0 bg-gradient-to-b from-[var(--color-cream)]/50 via-[var(--color-cream)]/65 to-[var(--color-cream)]"
				></div>
			</div>
		{/if}

		<div class="container relative z-10">
			<div class="max-w-4xl">
				<h1
					class="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 text-[var(--color-charcoal)] leading-[1.1] drop-shadow-sm"
					style="font-family: 'Playfair Display', serif; white-space: pre-line;"
				>
					{data.settings.heroTitle}
				</h1>
				<p
					class="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl leading-relaxed mb-10 drop-shadow-sm"
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
				<div class="mb-24 md:mb-32 scroll-fade-in" use:animateIn>
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

					<!-- Featured Album Photos with Layout Respect -->
					{#if data.featuredAlbum.layout_style === 'masonry'}
						<!-- Masonry Layout -->
						<div
							bind:this={masonryContainer}
							class="relative scroll-fade-in"
							use:animateIn
							style="height: {masonryHeight}px"
						>
							{#each data.featuredPhotos as photo, index}
								{@const position = masonryPositions[index]}
								{#if position}
									<a
										href="/album/{data.featuredAlbum.slug}/photo/{photo.id}"
										class="group block absolute"
										style="left: {position.left}; top: {position.top}; width: {position.width}"
										data-photo-id={photo.id}
										onclick={() => saveScrollPosition(photo.id)}
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
								{/if}
							{/each}
						</div>
					{:else}
						<!-- Grid Layout -->
						<div
							class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
						>
							{#each data.featuredPhotos as photo}
								<a
									href="/album/{data.featuredAlbum.slug}/photo/{photo.id}"
									class="group block scroll-fade-in"
									use:animateIn
									data-photo-id={photo.id}
									onclick={() => saveScrollPosition(photo.id)}
								>
									<div class="relative overflow-hidden bg-[var(--color-bg-secondary)]">
										<img
											src="/api/photos/{data.featuredAlbum.slug}/{photo.filename}/medium"
											alt={photo.original_filename}
											loading="lazy"
											class="w-full aspect-square object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-95"
										/>
									</div>
								</a>
							{/each}
						</div>
					{/if}

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

			<div class="mb-16 md:mb-24 scroll-fade-in" use:animateIn>
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
					use:animateIn
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
	<section
		class="py-20 md:py-32 bg-[var(--color-bg-secondary)] scroll-fade-in"
		id="about"
		use:animateIn
	>
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
