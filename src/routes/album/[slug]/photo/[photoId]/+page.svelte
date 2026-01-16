<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ArrowLeft, ChevronLeft, ChevronRight, Download, Camera, Aperture } from 'lucide-svelte';

	let { data } = $props();

	let touchStartX = 0;
	let touchStartY = 0;
	const SWIPE_THRESHOLD = 50; // minimum distance to trigger swipe

	// Build URL with query parameters
	function buildPhotoUrl(photoId: number): string {
		const url = new URL(`/album/${data.album.slug}/photo/${photoId}`, window.location.origin);
		if (data.selectedTag) {
			url.searchParams.set('tag', data.selectedTag);
		}
		if (data.selectedSort) {
			url.searchParams.set('sort', data.selectedSort);
		}
		return url.pathname + url.search;
	}

	function buildAlbumUrl(scrollToPhotoId?: number): string {
		const url = new URL(`/album/${data.album.slug}`, window.location.origin);
		if (data.selectedTag) {
			url.searchParams.set('tag', data.selectedTag);
		}
		if (data.selectedSort) {
			url.searchParams.set('sort', data.selectedSort);
		}
		if (scrollToPhotoId) {
			url.searchParams.set('scrollToPhoto', String(scrollToPhotoId));
		}
		return url.pathname + url.search;
	}

	function navigatePrev() {
		if (data.prevPhoto) {
			goto(buildPhotoUrl(data.prevPhoto.id), { replaceState: true, noScroll: true });
		}
	}

	function navigateNext() {
		if (data.nextPhoto) {
			goto(buildPhotoUrl(data.nextPhoto.id), { replaceState: true, noScroll: true });
		}
	}

	function backToAlbum() {
		// Check if we came from homepage based on referrer or sessionStorage
		const referrer = document.referrer;
		let fromHome = false;

		// Safely access sessionStorage
		try {
			fromHome = typeof window !== 'undefined' && sessionStorage.getItem('fromHomepage') === 'true';
		} catch (e) {
			// SessionStorage not available
		}

		if (
			fromHome ||
			(referrer &&
				(referrer.includes('/#work') || (referrer.endsWith('/') && !referrer.includes('/album/'))))
		) {
			try {
				if (typeof window !== 'undefined') {
					sessionStorage.removeItem('fromHomepage');
				}
			} catch (e) {
				// SessionStorage not available
			}
			goto('/');
		} else {
			goto(buildAlbumUrl(data.photo.id));
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') backToAlbum();
		if (e.key === 'ArrowRight' && data.nextPhoto) navigateNext();
		if (e.key === 'ArrowLeft' && data.prevPhoto) navigatePrev();
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		touchStartY = e.touches[0].clientY;
	}

	function handleTouchEnd(e: TouchEvent) {
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;

		const deltaX = touchStartX - touchEndX;
		const deltaY = touchStartY - touchEndY;

		// Only consider horizontal swipes (ignore vertical swipes)
		if (Math.abs(deltaX) > Math.abs(deltaY)) {
			if (deltaX > SWIPE_THRESHOLD && data.nextPhoto) {
				navigateNext();
			} else if (deltaX < -SWIPE_THRESHOLD && data.prevPhoto) {
				navigatePrev();
			}
		}
	}

	// Format EXIF values for display
	function formatAperture(aperture: number | null): string {
		if (!aperture) return '';
		return `f/${aperture.toFixed(1)}`;
	}

	function formatFocalLength(focalLength: number | null): string {
		if (!focalLength) return '';
		return `${Math.round(focalLength)}mm`;
	}

	function formatDateTime(dateTime: string | null): string {
		if (!dateTime) return '';
		const date = new Date(dateTime);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	// Format short date for Open Graph
	function formatShortDateTime(dateTime: string | null): string {
		if (!dateTime) return '';
		const date = new Date(dateTime);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	// Track photo download
	function trackPhotoDownload() {
		fetch(`/api/download/track-photo/${data.album.id}/${data.photo.id}`, { method: 'POST' }).catch(
			(e) => console.warn('Analytics tracking failed:', e)
		);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title
		>{data.album.title} - {data.photo.date_taken
			? formatShortDateTime(data.photo.date_taken)
			: 'Photo'}</title
	>
	<meta
		name="description"
		content="Photo from {data.album.title}{data.photo.date_taken
			? ' taken on ' + formatShortDateTime(data.photo.date_taken)
			: ''}"
	/>

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta
		property="og:title"
		content="{data.album.title}{data.photo.date_taken
			? ' - ' + formatShortDateTime(data.photo.date_taken)
			: ''}"
	/>
	<meta
		property="og:description"
		content="Photo from {data.album.title}{data.photo.date_taken
			? ' taken on ' + formatShortDateTime(data.photo.date_taken)
			: ''}"
	/>
	<meta property="og:image" content="/api/photos/{data.album.slug}/{data.photo.filename}/medium" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="{data.album.title}{data.photo.date_taken
			? ' - ' + formatShortDateTime(data.photo.date_taken)
			: ''}"
	/>
	<meta
		name="twitter:description"
		content="Photo from {data.album.title}{data.photo.date_taken
			? ' taken on ' + formatShortDateTime(data.photo.date_taken)
			: ''}"
	/>
	<meta name="twitter:image" content="/api/photos/{data.album.slug}/{data.photo.filename}/medium" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div
	class="min-h-screen flex flex-col bg-[var(--color-cream)] relative"
	ontouchstart={handleTouchStart}
	ontouchend={handleTouchEnd}
>
	<!-- Header -->
	<header
		class="sticky top-0 bg-[var(--color-cream)]/95 backdrop-blur-sm border-b border-[var(--color-border)] z-50"
	>
		<div class="container">
			<div class="flex items-center justify-between py-4 gap-4">
				<div class="flex items-center gap-4">
					<button
						onclick={backToAlbum}
						class="flex items-center gap-2 text-sm hover:opacity-70 transition-all nav-text text-[var(--color-charcoal)]"
					>
						<ArrowLeft size={18} strokeWidth={1.5} />
						<span class="hidden sm:inline">Back</span>
					</button>
				</div>
				<div class="nav-text text-[var(--color-text-muted)]">
					{data.currentIndex + 1} / {data.totalPhotos}
				</div>
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 flex flex-col lg:flex-row relative animate-fade-in">
		<!-- Image section -->
		<div class="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
			<div
				class="relative w-full h-full flex items-center justify-center"
				in:fade={{ duration: 300, easing: cubicOut }}
			>
				<!-- Navigation buttons -->
				{#if data.prevPhoto}
					<button
						onclick={navigatePrev}
						class="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-[var(--color-charcoal)] text-[var(--color-cream)] hover:scale-110 transition-all z-10"
						aria-label="Previous photo"
					>
						<ChevronLeft size={24} strokeWidth={1.5} />
					</button>
				{/if}

				<img
					src="/api/photos/{data.album.slug}/{data.photo.filename}/medium"
					alt={data.photo.original_filename}
					class="max-w-full max-h-[80vh] object-contain"
					in:fly={{ y: 20, duration: 400, easing: cubicOut }}
				/>

				{#if data.nextPhoto}
					<button
						onclick={navigateNext}
						class="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-[var(--color-charcoal)] text-[var(--color-cream)] hover:scale-110 transition-all z-10"
						aria-label="Next photo"
					>
						<ChevronRight size={24} strokeWidth={1.5} />
					</button>
				{/if}
			</div>
		</div>

		<!-- Info sidebar -->
		<aside
			class="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-y-auto"
			in:fly={{ x: 50, duration: 400, easing: cubicOut }}
		>
			<div class="p-8 space-y-6">
				<!-- Title -->
				<div>
					<h1
						class="text-2xl font-bold mb-2 text-[var(--color-charcoal)]"
						style="font-family: 'Playfair Display', serif;"
					>
						{data.album.title}
					</h1>
					{#if data.photo.date_taken}
						<p class="text-sm text-[var(--color-text-secondary)]">
							{formatDateTime(data.photo.date_taken)}
						</p>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex flex-col gap-3">
					<a
						href="/api/photos/{data.album.slug}/{data.photo.filename}/original"
						download={data.photo.original_filename}
						class="btn btn-primary w-full flex items-center justify-center gap-2"
						onclick={trackPhotoDownload}
					>
						<Download size={18} strokeWidth={1.5} />
						Download Original
					</a>
				</div>

				<!-- EXIF metadata -->
				{#if data.photo.camera_make || data.photo.camera_model || data.photo.lens_model || data.photo.focal_length || data.photo.aperture || data.photo.shutter_speed || data.photo.iso}
					<div class="border-t border-[var(--color-border)] pt-6">
						<h2 class="nav-text text-[var(--color-text-muted)] mb-4">Camera & Settings</h2>
						<dl class="space-y-3">
							{#if data.photo.camera_model}
								<div class="flex items-start gap-3">
									<Camera
										size={16}
										class="text-[var(--color-accent)] mt-0.5 flex-shrink-0"
										strokeWidth={1.5}
									/>
									<dd class="text-sm font-medium text-[var(--color-text-secondary)]">
										{data.photo.camera_model}
									</dd>
								</div>
							{/if}
							{#if data.photo.lens_model}
								<div class="flex items-start gap-3">
									<Aperture
										size={16}
										class="text-[var(--color-accent)] mt-0.5 flex-shrink-0"
										strokeWidth={1.5}
									/>
									<dd class="text-sm font-medium text-[var(--color-text-secondary)]">
										{data.photo.lens_model}
									</dd>
								</div>
							{/if}
							{#if data.photo.focal_length}
								<div>
									<dd class="text-sm font-medium text-[var(--color-text-secondary)]">
										{formatFocalLength(data.photo.focal_length)}
									</dd>
								</div>
							{/if}
							{#if data.photo.aperture}
								<div>
									<dd class="text-sm font-medium text-[var(--color-text-secondary)]">
										{formatAperture(data.photo.aperture)}
									</dd>
								</div>
							{/if}
							{#if data.photo.shutter_speed}
								<div>
									<dd class="text-sm font-medium text-[var(--color-text-secondary)]">
										{data.photo.shutter_speed}
									</dd>
								</div>
							{/if}
							{#if data.photo.iso}
								<div>
									<dd class="text-sm font-medium text-[var(--color-text-secondary)]">
										ISO {data.photo.iso}
									</dd>
								</div>
							{/if}
						</dl>
					</div>
				{/if}

				<!-- File info -->
				<div class="border-t border-[var(--color-border)] pt-6">
					<h2 class="nav-text text-[var(--color-text-muted)] mb-4">File Information</h2>
					<dl class="space-y-3">
						<div>
							<dt class="text-xs text-[var(--color-text-muted)] mb-1">Dimensions</dt>
							<dd class="text-sm font-medium text-[var(--color-text-secondary)]">
								{data.photo.width} × {data.photo.height}
							</dd>
						</div>
						{#if data.photo.file_size}
							<div>
								<dt class="text-xs text-[var(--color-text-muted)] mb-1">File Size</dt>
								<dd class="text-sm font-medium text-[var(--color-text-secondary)]">
									{(data.photo.file_size / 1024 / 1024).toFixed(2)} MB
								</dd>
							</div>
						{/if}
					</dl>
				</div>
			</div>
		</aside>
	</main>
</div>
