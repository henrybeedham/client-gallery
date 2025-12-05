<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { renderMarkdown, formatTimeRemaining } from '$lib/utils';
	import { onMount, tick } from 'svelte';

	let { data, form } = $props();

	let selectedPhotos: Set<number> = $state(new Set());
	let isSelecting = $state(false);
	let lightboxIndex: number | null = $state(null);
	let isDownloading = $state(false);
	let downloadProgress = $state(0);
	let passwordInput = $state('');
	let lastSelectedIndex: number | null = $state(null);
	let downloadAbortController: AbortController | null = null;

	// Lazy loading state - use $derived to reset when data changes (e.g., tag filter changes)
	let displayedPhotos = $state([...data.photos]);
	let isLoadingMore = $state(false);
	let hasMore = $state(data.hasMore);
	let loadMoreTrigger: HTMLDivElement;

	// Masonry layout state
	let masonryContainer: HTMLDivElement;
	let masonryPositions = $state<{ left: string; top: string; width: string }[]>([]);
	let masonryHeight = $state(0);
	let columnCount = $state(4);
	const MASONRY_GAP = 6; // gap in pixels

	// Calculate masonry positions when photos or container size changes
	function calculateMasonryLayout() {
		if (!masonryContainer || data.album.layout_style !== 'masonry') return;
		if (columnCount <= 0) return; // Safety check to prevent division by zero

		const containerWidth = masonryContainer.offsetWidth;
		const columnWidth = (containerWidth - MASONRY_GAP * (columnCount - 1)) / columnCount;
		const columnHeights = new Array(columnCount).fill(0);
		const positions: { left: string; top: string; width: string }[] = [];

		for (const photo of displayedPhotos) {
			// Find the shortest column
			const minHeight = Math.min(...columnHeights);
			const columnIndex = columnHeights.indexOf(minHeight);

			// Calculate position
			const left = columnIndex * (columnWidth + MASONRY_GAP);
			const top = columnHeights[columnIndex];

			// Calculate item height based on aspect ratio
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

			// Update column height
			columnHeights[columnIndex] += itemHeight + MASONRY_GAP;
		}

		masonryPositions = positions;
		masonryHeight = Math.max(...columnHeights);
	}

	// Determine column count based on screen size
	function updateColumnCount() {
		if (typeof window === 'undefined') return;
		if (window.innerWidth >= 1024) {
			columnCount = 4;
		} else if (window.innerWidth >= 640) {
			columnCount = 3;
		} else {
			columnCount = 2;
		}
	}

	// Track previous photo count to avoid unnecessary masonry recalculations
	let prevPhotoCount = $state(0);

	// Reset displayed photos when data changes (e.g., tag filter or sort changes)
	$effect(() => {
		displayedPhotos = [...data.photos];
		hasMore = data.hasMore;
		selectedPhotos = new Set();
		isSelecting = false;
		lastSelectedIndex = null;
		prevPhotoCount = 0; // Reset to force masonry recalculation
	});

	// Recalculate masonry when photos change
	$effect(() => {
		if (data.album.layout_style === 'masonry' && displayedPhotos.length > 0) {
			// Only recalculate if photo count changed
			if (displayedPhotos.length !== prevPhotoCount) {
				prevPhotoCount = displayedPhotos.length;
				// Use tick to ensure DOM is updated
				tick().then(() => {
					calculateMasonryLayout();
				});
			}
		}
	});

	// Touch swipe state for lightbox
	let touchStartX = $state(0);
	let touchEndX = $state(0);
	let isTouchOnButton = $state(false);
	const minSwipeDistance = 50;

	// Preload threshold for triggering more photos to load in lightbox
	const LIGHTBOX_PRELOAD_THRESHOLD = 3;

	// Helper function to validate and sanitize aspect ratio values
	function getAspectRatioStyle(width: number | null, height: number | null): string {
		if (
			width === null ||
			height === null ||
			typeof width !== 'number' ||
			typeof height !== 'number' ||
			!Number.isFinite(width) ||
			!Number.isFinite(height) ||
			width <= 0 ||
			height <= 0
		) {
			return '';
		}
		return `aspect-ratio: ${Math.round(width)} / ${Math.round(height)}`;
	}

	// Set up intersection observer for infinite scroll and masonry resize handler
	onMount(() => {
		// Set up resize handler for masonry
		updateColumnCount();
		const handleResize = () => {
			updateColumnCount();
			calculateMasonryLayout();
		};
		window.addEventListener('resize', handleResize);

		// Initial masonry calculation
		if (data.album.layout_style === 'masonry') {
			tick().then(() => calculateMasonryLayout());
		}

		// Set up intersection observer
		if (!loadMoreTrigger) {
			return () => {
				window.removeEventListener('resize', handleResize);
				// Cancel any ongoing downloads when component unmounts
				if (downloadAbortController && !downloadAbortController.signal.aborted) {
					try {
						downloadAbortController.abort();
					} catch (e) {
						console.log('Error aborting download on unmount:', e);
					}
				}
			};
		}

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					loadMorePhotos();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(loadMoreTrigger);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', handleResize);
			// Cancel any ongoing downloads when component unmounts
			if (downloadAbortController && !downloadAbortController.signal.aborted) {
				try {
					downloadAbortController.abort();
				} catch (e) {
					console.log('Error aborting download on unmount:', e);
				}
			}
		};
	});

	async function loadMorePhotos() {
		if (isLoadingMore || !hasMore) return;

		isLoadingMore = true;
		try {
			const url = new URL(`/api/photos/${data.album.slug}/list`, window.location.origin);
			url.searchParams.set('offset', String(displayedPhotos.length));
			url.searchParams.set('sort', data.selectedSort);
			if (data.selectedTag) {
				url.searchParams.set('tag', data.selectedTag);
			}

			const response = await fetch(url.toString());
			if (!response.ok) throw new Error('Failed to load more photos');

			const result = await response.json();
			displayedPhotos = [...displayedPhotos, ...result.photos];
			hasMore = result.hasMore;
		} catch (e) {
			console.error('Failed to load more photos:', e);
		}
		isLoadingMore = false;
	}

	// Handle shift+click selection
	function handlePhotoClick(photoId: number, index: number, event: MouseEvent) {
		if (!isSelecting) {
			// Navigate to photo detail page with smooth client-side navigation
			goto(`/album/${data.album.slug}/photo/${photoId}`);
			return;
		}

		if (event.shiftKey && lastSelectedIndex !== null) {
			// Shift+click: select range
			const start = Math.min(lastSelectedIndex, index);
			const end = Math.max(lastSelectedIndex, index);
			const rangeIds = displayedPhotos.slice(start, end + 1).map((p) => p.id);
			rangeIds.forEach((id) => selectedPhotos.add(id));
			selectedPhotos = new Set(selectedPhotos);
		} else {
			// Normal click: toggle selection
			toggleSelection(photoId);
			lastSelectedIndex = index;
		}
	}

	function toggleSelection(photoId: number) {
		if (selectedPhotos.has(photoId)) {
			selectedPhotos.delete(photoId);
		} else {
			selectedPhotos.add(photoId);
		}
		selectedPhotos = new Set(selectedPhotos);
	}

	function selectAll() {
		// Use allPhotoIds from server to ensure all photos are selected even with lazy loading
		selectedPhotos = new Set(data.allPhotoIds);
	}

	function clearSelection() {
		selectedPhotos = new Set();
		isSelecting = false;
		lastSelectedIndex = null;
	}

	function toggleSelectMode() {
		isSelecting = !isSelecting;
		if (!isSelecting) {
			selectedPhotos = new Set();
			lastSelectedIndex = null;
		}
	}

	async function downloadWithProgress(
		url: string,
		filename: string,
		trackAlbumDownload = false,
		trackPhotoIds: number[] = []
	) {
		// Cancel any existing download - only abort if not already aborted
		if (downloadAbortController && !downloadAbortController.signal.aborted) {
			try {
				downloadAbortController.abort();
			} catch (e) {
				console.log('Error aborting previous download:', e);
			}
		}

		// Create new AbortController for this download
		downloadAbortController = new AbortController();
		const signal = downloadAbortController.signal;

		isDownloading = true;
		downloadProgress = 0;
		try {
			// Track download analytics
			if (trackAlbumDownload) {
				fetch(`/api/download/track/${data.album.id}`, { method: 'POST' }).catch((e) =>
					console.warn('Analytics tracking failed:', e)
				);
			}
			// Track individual photo downloads
			for (const photoId of trackPhotoIds) {
				fetch(`/api/download/track-photo/${data.album.id}/${photoId}`, { method: 'POST' }).catch(
					(e) => console.warn('Analytics tracking failed:', e)
				);
			}

			const response = await fetch(url, { signal });
			if (!response.ok) throw new Error('Download failed');

			// Try Content-Length first, then fall back to X-Estimated-Size for streaming responses
			const contentLength = response.headers.get('Content-Length');
			const estimatedSize = response.headers.get('X-Estimated-Size');
			const total = contentLength
				? parseInt(contentLength, 10)
				: estimatedSize
					? parseInt(estimatedSize, 10)
					: 0;

			let blob: Blob;
			if (total && response.body) {
				const reader = response.body.getReader();
				const chunks: BlobPart[] = [];
				let received = 0;

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
					received += value.length;
					// Cap progress at 99% until complete to handle size estimation differences
					downloadProgress = Math.min(99, Math.round((received / total) * 100));
				}
				// Set to 100% when done
				downloadProgress = 100;

				blob = new Blob(chunks, { type: 'application/zip' });
			} else {
				blob = await response.blob();
			}

			const blobUrl = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = blobUrl;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(blobUrl);
			document.body.removeChild(a);
		} catch (e) {
			// Don't show error if the download was aborted intentionally
			if (e instanceof Error && e.name === 'AbortError') {
				console.log('Download cancelled');
			} else {
				console.error('Download failed:', e);
				alert('Download failed. Please try again.');
			}
		} finally {
			isDownloading = false;
			downloadProgress = 0;
			downloadAbortController = null;
		}
	}

	async function downloadAlbum() {
		await downloadWithProgress(
			`/api/download/album/${data.album.id}`,
			`${data.album.slug}.zip`,
			true
		);
	}

	async function downloadSelected() {
		if (selectedPhotos.size === 0) return;
		const ids = Array.from(selectedPhotos);
		await downloadWithProgress(
			`/api/download/photos/${data.album.slug}?ids=${ids.join(',')}`,
			`${data.album.slug}-selected.zip`,
			false,
			ids
		);
	}

	function openLightbox(index: number) {
		lightboxIndex = index;
	}

	function closeLightbox() {
		lightboxIndex = null;
	}

	function nextPhoto() {
		if (lightboxIndex !== null && lightboxIndex < displayedPhotos.length - 1) {
			lightboxIndex++;
			// Trigger loading more photos when approaching the end (check isLoadingMore to prevent race conditions)
			if (
				hasMore &&
				!isLoadingMore &&
				lightboxIndex >= displayedPhotos.length - LIGHTBOX_PRELOAD_THRESHOLD
			) {
				loadMorePhotos();
			}
		}
	}

	function prevPhoto() {
		if (lightboxIndex !== null && lightboxIndex > 0) {
			lightboxIndex--;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (lightboxIndex === null) return;

		if (e.key === 'Escape') closeLightbox();
		if (e.key === 'ArrowRight') nextPhoto();
		if (e.key === 'ArrowLeft') prevPhoto();
	}

	function handleTouchStart(e: TouchEvent) {
		// Check if the touch started on a button element
		const target = e.target as HTMLElement | null;
		if (!target) {
			isTouchOnButton = false;
			return;
		}
		isTouchOnButton = target.closest('button') !== null || target.closest('a') !== null;
		touchStartX = e.touches[0].clientX;
	}

	function handleTouchMove(e: TouchEvent) {
		touchEndX = e.touches[0].clientX;
	}

	function handleTouchEnd() {
		if (lightboxIndex === null) return;

		// Don't process swipe if touch started on a button
		if (isTouchOnButton) {
			touchStartX = 0;
			touchEndX = 0;
			isTouchOnButton = false;
			return;
		}

		const swipeDistance = touchStartX - touchEndX;
		if (Math.abs(swipeDistance) >= minSwipeDistance) {
			if (swipeDistance > 0) {
				nextPhoto();
			} else {
				prevPhoto();
			}
		}
		touchStartX = 0;
		touchEndX = 0;
	}

	// Track single photo download
	function trackPhotoDownload(photoId: number) {
		fetch(`/api/download/track-photo/${data.album.id}/${photoId}`, { method: 'POST' }).catch((e) =>
			console.warn('Analytics tracking failed:', e)
		);
	}

	// Sanitize color to prevent XSS
	function sanitizeColor(color: string): string {
		// Only allow valid hex colors or standard color names
		const hexPattern = /^#[0-9A-Fa-f]{3,8}$/;
		const colorNames = /^(red|blue|green|yellow|orange|purple|pink|cyan|white|black|gray|grey)$/i;
		if (hexPattern.test(color) || colorNames.test(color)) {
			return color;
		}
		return '#3b82f6'; // Default blue if invalid
	}

	let safeColor = $derived(sanitizeColor(data.album.primary_color || '#3b82f6'));
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{data.album.title} - Gallery</title>
	<meta
		name="description"
		content={data.album.description || `View ${data.album.title} photo gallery`}
	/>

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:title" content={data.album.title} />
	<meta
		property="og:description"
		content={data.album.description || `View ${data.album.title} photo gallery`}
	/>
	{#if data.album.cover_filename}
		<meta
			property="og:image"
			content="/api/photos/{data.album.slug}/{data.album.cover_filename}/medium"
		/>
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.album.title} />
	<meta
		name="twitter:description"
		content={data.album.description || `View ${data.album.title} photo gallery`}
	/>
	{#if data.album.cover_filename}
		<meta
			name="twitter:image"
			content="/api/photos/{data.album.slug}/{data.album.cover_filename}/medium"
		/>
	{/if}

	<!-- Custom color scheme -->
	{@html `<style>:root { --gallery-primary: ${safeColor}; }</style>`}
</svelte:head>

{#if data.isExpired}
	<!-- Expired gallery page -->
	<div class="min-h-screen flex items-center justify-center p-4">
		<div
			class="bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-8 max-w-md w-full text-center"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="64"
				height="64"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="mx-auto mb-4 text-gray-500"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<polyline points="12 6 12 12 16 14"></polyline>
			</svg>
			<h1 class="text-2xl font-bold mb-2">{data.album.title}</h1>
			<p class="text-gray-400 mb-6">This gallery has expired and is no longer available.</p>

			{#if data.contactEmail || data.contactPhone}
				<div class="border-t border-[var(--color-border)] pt-6">
					<p class="text-sm text-gray-400 mb-4">If you need access, please contact:</p>
					{#if data.contactEmail}
						<a
							href="mailto:{data.contactEmail}"
							class="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 mb-2"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
								></path>
								<polyline points="22,6 12,13 2,6"></polyline>
							</svg>
							{data.contactEmail}
						</a>
					{/if}
					{#if data.contactPhone}
						<a
							href="tel:{data.contactPhone}"
							class="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path
									d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
								></path>
							</svg>
							{data.contactPhone}
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{:else if data.requiresPassword}
	<div class="min-h-screen flex items-center justify-center p-4">
		<div
			class="bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-2xl p-8 max-w-md w-full"
		>
			<h1 class="text-2xl font-bold mb-2 text-center">{data.album.title}</h1>
			<p class="text-gray-400 text-center mb-6">This album is password protected</p>

			{#if form?.error}
				<div
					class="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-4"
				>
					{form.error}
				</div>
			{/if}

			<form method="POST" action="?/unlock" use:enhance>
				<input
					type="password"
					name="password"
					class="form-input mb-4"
					placeholder="Enter password"
					bind:value={passwordInput}
					required
				/>
				<button type="submit" class="btn btn-primary w-full"> Unlock Gallery </button>
			</form>
		</div>
	</div>
{:else}
	<div class="min-h-screen flex flex-col relative">
		<!-- Background image if set -->
		{#if data.album.background_filename}
			<div
				class="fixed inset-0 z-0"
				style="background-image: url('/api/photos/{data.album.slug}/{data.album
					.background_filename}/medium'); background-size: cover; background-position: center;"
			>
				<div class="absolute inset-0 backdrop-blur-2xl bg-[var(--color-bg)]/85"></div>
			</div>
		{/if}

		<header
			class="sticky top-0 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)] z-50"
		>
			<div class="container">
				<div class="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
					<div class="min-w-0">
						<div class="flex items-center gap-3">
							<h1 class="text-lg font-semibold">{data.album.title}</h1>
							{#if data.album.album_date}
								<span
									class="text-sm text-center font-medium px-2 py-0.5 rounded-full bg-[var(--gallery-primary)]/20"
									style="color: var(--gallery-primary);"
								>
									{new Date(data.album.album_date).toLocaleDateString('en-UK', {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
									})}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
							<span>{data.totalCount} photos</span>
							{#if data.expiresIn && data.expiresIn > 0}
								<span class="text-amber-500"
									>• Expires in {formatTimeRemaining(data.expiresIn)}</span
								>
							{/if}
						</div>
					</div>
					<div class="flex gap-2 flex-shrink-0">
						<button class="btn btn-secondary text-sm" onclick={toggleSelectMode}>
							{isSelecting ? 'Cancel' : 'Select to download'}
						</button>
						{#if isSelecting && selectedPhotos.size > 0}
							<button
								class="btn text-sm relative overflow-hidden"
								style="background-color: var(--gallery-primary); color: white;"
								onclick={downloadSelected}
								disabled={isDownloading}
							>
								{#if isDownloading}
									<span class="relative z-10">Downloading... {downloadProgress}%</span>
									<span
										class="absolute left-0 top-0 bottom-0 transition-all duration-200"
										style="width: {downloadProgress}%; background-color: color-mix(in srgb, var(--gallery-primary), black 15%);"
									></span>
								{:else}
									Download ({selectedPhotos.size})
								{/if}
							</button>
						{:else if !isSelecting}
							<button
								class="btn text-sm relative overflow-hidden"
								style="background-color: var(--gallery-primary); color: white;"
								onclick={downloadAlbum}
								disabled={isDownloading}
							>
								{#if isDownloading}
									<span class="relative z-10">Downloading... {downloadProgress}%</span>
									<span
										class="absolute left-0 top-0 bottom-0 transition-all duration-200"
										style="width: {downloadProgress}%; background-color: color-mix(in srgb, var(--gallery-primary), black 15%);"
									></span>
								{:else}
									Download All
								{/if}
							</button>
						{/if}
					</div>
				</div>
			</div>
		</header>

		{#if isSelecting}
			<div class="text-white py-3 relative z-10" style="background-color: var(--gallery-primary);">
				<div class="container flex items-center justify-between">
					<span class="text-sm">{selectedPhotos.size} selected</span>
					<div class="flex gap-4">
						<button class="text-sm font-medium opacity-90 hover:opacity-100" onclick={selectAll}
							>Select All</button
						>
						<button
							class="text-sm font-medium opacity-90 hover:opacity-100"
							onclick={clearSelection}>Clear</button
						>
					</div>
				</div>
			</div>
		{/if}

		<main class="flex-1 py-6 relative z-10">
			<div class="container">
				{#if data.album.description}
					<div class="prose prose-invert prose-sm max-w-none mb-6 text-gray-300">
						{@html renderMarkdown(data.album.description)}
					</div>
				{/if}

				{#if data.tags && data.tags.length > 0}
					<div class="flex flex-wrap gap-2 mb-6">
						<a
							href="/album/{data.album.slug}?sort={data.selectedSort}"
							data-sveltekit-noscroll
							class="px-3 py-1.5 rounded-full text-sm transition-colors {!data.selectedTag
								? ' text-white'
								: 'bg-[var(--color-bg-tertiary)] text-gray-300 hover:bg-[var(--color-border)]'}"
							style={!data.selectedTag ? `background-color: var(--gallery-primary);` : ''}
						>
							All
						</a>
						{#each data.tags as tag}
							<a
								href="/album/{data.album.slug}?tag={tag.slug}&sort={data.selectedSort}"
								data-sveltekit-noscroll
								class="px-3 py-1.5 rounded-full text-sm transition-colors {data.selectedTag ===
								tag.slug
									? ' text-white'
									: 'bg-[var(--color-bg-tertiary)] text-gray-300 hover:bg-[var(--color-border)]'}"
								style={data.selectedTag === tag.slug
									? `background-color: var(--gallery-primary);`
									: ''}
							>
								{tag.name}
							</a>
						{/each}
					</div>
				{/if}

				<!-- Sort dropdown -->
				<div class="flex items-center gap-2 mb-4">
					<label for="sortSelect" class="text-sm text-gray-400">Sort:</label>
					<select
						id="sortSelect"
						class="form-select text-sm py-1 px-2 bg-[var(--color-bg-secondary)] border-[var(--color-border)] rounded"
						onchange={(e) => {
							const target = e.target as HTMLSelectElement;
							const url = new URL(window.location.href);
							url.searchParams.set('sort', target.value);
							if (data.selectedTag) {
								url.searchParams.set('tag', data.selectedTag);
							}
							window.location.href = url.toString();
						}}
					>
						<option value="oldest" selected={data.selectedSort === 'oldest'}>Oldest first</option>
						<option value="newest" selected={data.selectedSort === 'newest'}>Newest first</option>
						<option value="random" selected={data.selectedSort === 'random'}>Random Order</option>
					</select>
				</div>

				{#if displayedPhotos.length === 0}
					<div class="empty-state">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="48"
							height="48"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
							<circle cx="8.5" cy="8.5" r="1.5"></circle>
							<polyline points="21 15 16 10 5 21"></polyline>
						</svg>
						<h3>No photos in this album</h3>
						<p>Check back soon for new photos!</p>
					</div>
				{:else}
					{#if data.album.layout_style === 'masonry'}
						<!-- Masonry Layout with absolute positioning for proper order and stable loading -->
						<div
							bind:this={masonryContainer}
							class="relative w-full"
							style="height: {masonryHeight}px;"
						>
							{#each displayedPhotos as photo, index}
								<button
									class="group absolute bg-[var(--color-bg-secondary)] overflow-hidden transition-all duration-200 {selectedPhotos.has(
										photo.id
									)
										? 'ring-4 ring-offset-2 ring-offset-[var(--color-bg)] scale-[97.65%]'
										: ''}"
									style="{masonryPositions[index]
										? `left: ${masonryPositions[index].left}; top: ${masonryPositions[index].top}; width: ${masonryPositions[index].width};`
										: 'visibility: hidden;'}{selectedPhotos.has(photo.id)
										? ' --tw-ring-color: var(--gallery-primary);'
										: ''}"
									onclick={(e) => handlePhotoClick(photo.id, index, e)}
								>
									<img
										src="/api/photos/{data.album.slug}/{photo.filename}/thumbnail"
										alt={photo.original_filename}
										loading="lazy"
										class="w-full object-cover"
										style={getAspectRatioStyle(photo.width, photo.height)}
									/>
									{#if isSelecting}
										<div
											class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors {selectedPhotos.has(
												photo.id
											)
												? 'text-white'
												: 'bg-white/90 border-2 border-gray-300'}"
											style={selectedPhotos.has(photo.id)
												? `background-color: var(--gallery-primary);`
												: ''}
										>
											{#if selectedPhotos.has(photo.id)}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="3"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="20 6 9 17 4 12"></polyline>
												</svg>
											{/if}
										</div>
									{/if}
								</button>
							{/each}
						</div>
					{:else}
						<!-- Grid Layout (default) -->
						<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
							{#each displayedPhotos as photo, index}
								<button
									class="group relative bg-[var(--color-bg-secondary)] overflow-hidden transition-all duration-200 {selectedPhotos.has(
										photo.id
									)
										? 'ring-4 ring-offset-2 ring-offset-[var(--color-bg)] scale-[95.5%]'
										: ''}"
									style={selectedPhotos.has(photo.id)
										? `--tw-ring-color: var(--gallery-primary);`
										: ''}
									onclick={(e) => handlePhotoClick(photo.id, index, e)}
								>
									<img
										src="/api/photos/{data.album.slug}/{photo.filename}/thumbnail"
										alt={photo.original_filename}
										loading="lazy"
										class="w-full aspect-square object-cover"
									/>
									{#if isSelecting}
										<div
											class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors {selectedPhotos.has(
												photo.id
											)
												? 'text-white'
												: 'bg-white/90 border-2 border-gray-300'}"
											style={selectedPhotos.has(photo.id)
												? `background-color: var(--gallery-primary);`
												: ''}
										>
											{#if selectedPhotos.has(photo.id)}
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="3"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="20 6 9 17 4 12"></polyline>
												</svg>
											{/if}
										</div>
									{/if}
								</button>
							{/each}
						</div>
					{/if}

					<!-- Load more trigger and loading indicator -->
					<div bind:this={loadMoreTrigger} class="py-8 flex justify-center">
						{#if isLoadingMore}
							<div class="flex items-center gap-2 text-gray-400">
								<svg
									class="animate-spin h-5 w-5"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
								<span>Loading more photos...</span>
							</div>
						{:else if hasMore}
							<button class="btn btn-secondary text-sm" onclick={loadMorePhotos}>
								Load More
							</button>
						{:else if displayedPhotos.length > 0}
							<span class="text-gray-500 text-sm">All {data.totalCount} photos loaded</span>
						{/if}
					</div>
				{/if}
			</div>
		</main>
	</div>
{/if}

{#if lightboxIndex !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex flex-col"
		onclick={closeLightbox}
		role="dialog"
		aria-modal="true"
		aria-label="Photo lightbox"
	>
		<div class="flex items-center justify-between p-4 text-white flex-shrink-0">
			<span class="text-sm opacity-80">{lightboxIndex + 1} / {data.totalCount}</span>
			<span class="text-sm font-bold opacity-80"
				>{displayedPhotos[lightboxIndex].original_filename}</span
			>
			<button
				class="p-2 opacity-80 hover:opacity-100 transition-opacity"
				onclick={closeLightbox}
				aria-label="Close lightbox"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex-1 flex items-center justify-center relative px-12 min-h-0 overflow-hidden"
			onclick={(e) => e.stopPropagation()}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
		>
			<button
				class="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity z-10"
				onclick={(e) => {
					e.stopPropagation();
					prevPhoto();
				}}
				disabled={lightboxIndex === 0}
				aria-label="Previous photo"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</button>
			<img
				src="/api/photos/{data.album.slug}/{displayedPhotos[lightboxIndex].filename}/medium"
				alt={displayedPhotos[lightboxIndex].original_filename}
				class="max-w-full max-h-full object-contain"
				style="max-height: calc(100vh - 140px);"
			/>
			<button
				class="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity z-10"
				onclick={(e) => {
					e.stopPropagation();
					nextPhoto();
				}}
				disabled={lightboxIndex === displayedPhotos.length - 1}
				aria-label="Next photo"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</button>
		</div>
		<div class="flex justify-center p-4 flex-shrink-0">
			<a
				href="/api/photos/{data.album.slug}/{displayedPhotos[lightboxIndex].filename}/original"
				download={displayedPhotos[lightboxIndex].original_filename}
				class="btn"
				style="background-color: var(--gallery-primary); color: white;"
				onclick={(e) => {
					e.stopPropagation();
					if (lightboxIndex !== null) {
						trackPhotoDownload(displayedPhotos[lightboxIndex].id);
					}
				}}
			>
				Download Photo
			</a>
		</div>
	</div>
{/if}
