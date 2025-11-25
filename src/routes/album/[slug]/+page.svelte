<script lang="ts">
	import { formatFileSize } from '$lib/utils';

	let { data } = $props();

	let viewMode: 'grid' | 'masonry' = $state('grid');
	let selectedPhotos: Set<number> = $state(new Set());
	let isSelecting = $state(false);
	let lightboxIndex: number | null = $state(null);
	let isDownloading = $state(false);

	function toggleSelection(photoId: number) {
		if (selectedPhotos.has(photoId)) {
			selectedPhotos.delete(photoId);
		} else {
			selectedPhotos.add(photoId);
		}
		selectedPhotos = new Set(selectedPhotos);
	}

	function selectAll() {
		selectedPhotos = new Set(data.photos.map((p) => p.id));
	}

	function clearSelection() {
		selectedPhotos = new Set();
		isSelecting = false;
	}

	function toggleSelectMode() {
		isSelecting = !isSelecting;
		if (!isSelecting) {
			selectedPhotos = new Set();
		}
	}

	async function downloadAlbum() {
		isDownloading = true;
		try {
			const response = await fetch(`/api/download/album/${data.album.id}`);
			if (!response.ok) throw new Error('Download failed');
			
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${data.album.slug}.zip`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (e) {
			console.error('Download failed:', e);
			alert('Download failed. Please try again.');
		}
		isDownloading = false;
	}

	async function downloadSelected() {
		if (selectedPhotos.size === 0) return;
		
		isDownloading = true;
		try {
			const ids = Array.from(selectedPhotos).join(',');
			const response = await fetch(`/api/download/photos?ids=${ids}`);
			if (!response.ok) throw new Error('Download failed');
			
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${data.album.slug}-selected.zip`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (e) {
			console.error('Download failed:', e);
			alert('Download failed. Please try again.');
		}
		isDownloading = false;
	}

	function openLightbox(index: number) {
		if (!isSelecting) {
			lightboxIndex = index;
		}
	}

	function closeLightbox() {
		lightboxIndex = null;
	}

	function nextPhoto() {
		if (lightboxIndex !== null && lightboxIndex < data.photos.length - 1) {
			lightboxIndex++;
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
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{data.album.title} - Gallery</title>
</svelte:head>

<div class="page">
	<header class="header">
		<div class="container">
			<div class="header-content">
				<div class="header-left">
					<a href="/" class="back-btn" aria-label="Back to albums">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="15 18 9 12 15 6"></polyline>
						</svg>
					</a>
					<div class="header-title">
						<h1>{data.album.title}</h1>
						<span class="photo-count">{data.photos.length} photos</span>
					</div>
				</div>
				<div class="header-actions">
					<button class="btn btn-secondary" onclick={toggleSelectMode}>
						{isSelecting ? 'Cancel' : 'Select'}
					</button>
					{#if isSelecting && selectedPhotos.size > 0}
						<button class="btn btn-primary" onclick={downloadSelected} disabled={isDownloading}>
							{isDownloading ? 'Downloading...' : `Download (${selectedPhotos.size})`}
						</button>
					{:else if !isSelecting}
						<button class="btn btn-primary" onclick={downloadAlbum} disabled={isDownloading}>
							{isDownloading ? 'Downloading...' : 'Download All'}
						</button>
					{/if}
				</div>
			</div>
		</div>
	</header>

	{#if isSelecting}
		<div class="selection-bar">
			<div class="container">
				<div class="selection-content">
					<span>{selectedPhotos.size} selected</span>
					<div class="selection-actions">
						<button class="btn-text" onclick={selectAll}>Select All</button>
						<button class="btn-text" onclick={clearSelection}>Clear</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<main class="main">
		<div class="container">
			{#if data.album.description}
				<p class="album-description">{data.album.description}</p>
			{/if}

			<div class="controls">
				<div class="view-toggle">
					<button
						class="view-btn"
						class:active={viewMode === 'grid'}
						onclick={() => (viewMode = 'grid')}
						aria-label="Grid view"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="7" height="7"></rect>
							<rect x="14" y="3" width="7" height="7"></rect>
							<rect x="14" y="14" width="7" height="7"></rect>
							<rect x="3" y="14" width="7" height="7"></rect>
						</svg>
					</button>
					<button
						class="view-btn"
						class:active={viewMode === 'masonry'}
						onclick={() => (viewMode = 'masonry')}
						aria-label="Masonry view"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="7" height="9"></rect>
							<rect x="14" y="3" width="7" height="5"></rect>
							<rect x="14" y="12" width="7" height="9"></rect>
							<rect x="3" y="16" width="7" height="5"></rect>
						</svg>
					</button>
				</div>
			</div>

			{#if data.photos.length === 0}
				<div class="empty-state">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
						<circle cx="8.5" cy="8.5" r="1.5"></circle>
						<polyline points="21 15 16 10 5 21"></polyline>
					</svg>
					<h3>No photos in this album</h3>
					<p>Check back soon for new photos!</p>
				</div>
			{:else}
				<div class="gallery" class:masonry={viewMode === 'masonry'}>
					{#each data.photos as photo, index}
						<button
							class="gallery-item"
							class:selected={selectedPhotos.has(photo.id)}
							onclick={() => isSelecting ? toggleSelection(photo.id) : openLightbox(index)}
						>
							<img
								src="/api/photos/{photo.filename}/thumbnail"
								alt={photo.original_filename}
								loading="lazy"
							/>
							{#if isSelecting}
								<div class="select-indicator" class:checked={selectedPhotos.has(photo.id)}>
									{#if selectedPhotos.has(photo.id)}
										<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="20 6 9 17 4 12"></polyline>
										</svg>
									{/if}
								</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

{#if lightboxIndex !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div class="lightbox" onclick={closeLightbox} role="dialog" aria-modal="true" aria-label="Photo lightbox">
		<div class="lightbox-header">
			<span class="lightbox-counter">{lightboxIndex + 1} / {data.photos.length}</span>
			<button class="lightbox-close" onclick={closeLightbox} aria-label="Close lightbox">
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
			<button class="lightbox-nav lightbox-prev" onclick={(e) => { e.stopPropagation(); prevPhoto(); }} disabled={lightboxIndex === 0} aria-label="Previous photo">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</button>
			<img
				src="/api/photos/{data.photos[lightboxIndex].filename}/medium"
				alt={data.photos[lightboxIndex].original_filename}
			/>
			<button class="lightbox-nav lightbox-next" onclick={(e) => { e.stopPropagation(); nextPhoto(); }} disabled={lightboxIndex === data.photos.length - 1} aria-label="Next photo">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="9 18 15 12 9 6"></polyline>
				</svg>
			</button>
		</div>
		<div class="lightbox-footer">
			<a
				href="/api/photos/{data.photos[lightboxIndex].filename}/original"
				download={data.photos[lightboxIndex].original_filename}
				class="btn btn-primary"
				onclick={(e) => e.stopPropagation()}
			>
				Download Original
			</a>
		</div>
	</div>
{/if}

<style>
	.page {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.header {
		position: sticky;
		top: 0;
		background-color: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
		z-index: 100;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 0;
		gap: 1rem;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 0;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.375rem;
		color: var(--color-text-secondary);
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.back-btn:hover {
		color: var(--color-text);
		background-color: var(--color-bg-secondary);
	}

	.header-title {
		min-width: 0;
	}

	.header-title h1 {
		font-size: 1.125rem;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.photo-count {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.selection-bar {
		background-color: var(--color-primary);
		color: white;
		padding: 0.75rem 0;
	}

	.selection-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.selection-actions {
		display: flex;
		gap: 1rem;
	}

	.btn-text {
		background: none;
		border: none;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		opacity: 0.9;
	}

	.btn-text:hover {
		opacity: 1;
	}

	.main {
		flex: 1;
		padding: 1.5rem 0;
	}

	.album-description {
		color: var(--color-text-secondary);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.controls {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 1rem;
	}

	.view-toggle {
		display: flex;
		gap: 0.25rem;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.25rem;
	}

	.view-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.375rem;
		background: transparent;
		border: none;
		color: var(--color-text-muted);
		transition: all 0.15s ease;
	}

	.view-btn:hover {
		color: var(--color-text);
	}

	.view-btn.active {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.gallery {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;
	}

	@media (min-width: 640px) {
		.gallery {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.gallery {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.gallery.masonry {
		display: block;
		column-count: 2;
		column-gap: 0.5rem;
	}

	@media (min-width: 640px) {
		.gallery.masonry {
			column-count: 3;
		}
	}

	@media (min-width: 1024px) {
		.gallery.masonry {
			column-count: 4;
		}
	}

	.gallery.masonry .gallery-item {
		break-inside: avoid;
		margin-bottom: 0.5rem;
	}

	.gallery-item {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 1;
		background-color: var(--color-bg-secondary);
		border: none;
		padding: 0;
		cursor: pointer;
		overflow: hidden;
		border-radius: 0.375rem;
		transition: opacity 0.15s ease;
	}

	.gallery.masonry .gallery-item {
		aspect-ratio: auto;
	}

	.gallery-item:hover {
		opacity: 0.9;
	}

	.gallery-item.selected {
		outline: 3px solid var(--color-primary);
		outline-offset: -3px;
	}

	.gallery-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.gallery.masonry .gallery-item img {
		height: auto;
	}

	.select-indicator {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.9);
		border: 2px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.select-indicator.checked {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
	}

	/* Lightbox */
	.lightbox {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.95);
		z-index: 1000;
		display: flex;
		flex-direction: column;
	}

	.lightbox-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		color: white;
	}

	.lightbox-counter {
		font-size: 0.875rem;
	}

	.lightbox-close {
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		padding: 0.5rem;
		display: flex;
		opacity: 0.8;
		transition: opacity 0.15s ease;
	}

	.lightbox-close:hover {
		opacity: 1;
	}

	.lightbox-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 0 3rem;
	}

	.lightbox-content img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.lightbox-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: white;
		cursor: pointer;
		padding: 1rem;
		opacity: 0.7;
		transition: opacity 0.15s ease;
	}

	.lightbox-nav:hover:not(:disabled) {
		opacity: 1;
	}

	.lightbox-nav:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.lightbox-prev {
		left: 0;
	}

	.lightbox-next {
		right: 0;
	}

	.lightbox-footer {
		display: flex;
		justify-content: center;
		padding: 1rem;
	}

	@media (max-width: 640px) {
		.header-actions .btn {
			padding: 0.5rem 0.75rem;
			font-size: 0.75rem;
		}

		.lightbox-content {
			padding: 0 2.5rem;
		}
	}
</style>