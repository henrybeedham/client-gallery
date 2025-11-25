<script lang="ts">
	import { enhance } from '$app/forms';
	import { renderMarkdown } from '$lib/utils';

	let { data, form } = $props();

	let selectedPhotos: Set<number> = $state(new Set());
	let isSelecting = $state(false);
	let lightboxIndex: number | null = $state(null);
	let isDownloading = $state(false);
	let downloadProgress = $state(0);
	let passwordInput = $state('');

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
		downloadProgress = 0;
		try {
			const response = await fetch(`/api/download/album/${data.album.id}`);
			if (!response.ok) throw new Error('Download failed');

			const contentLength = response.headers.get('Content-Length');
			const total = contentLength ? parseInt(contentLength, 10) : 0;

			if (total && response.body) {
				const reader = response.body.getReader();
				const chunks: BlobPart[] = [];
				let received = 0;

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
					received += value.length;
					downloadProgress = Math.round((received / total) * 100);
				}

				const blob = new Blob(chunks, { type: 'application/zip' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${data.album.slug}.zip`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${data.album.slug}.zip`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}
		} catch (e) {
			console.error('Download failed:', e);
			alert('Download failed. Please try again.');
		}
		isDownloading = false;
		downloadProgress = 0;
	}

	async function downloadSelected() {
		if (selectedPhotos.size === 0) return;

		isDownloading = true;
		downloadProgress = 0;
		try {
			const ids = Array.from(selectedPhotos).join(',');
			const response = await fetch(`/api/download/photos/${data.album.slug}?ids=${ids}`);
			if (!response.ok) throw new Error('Download failed');

			const contentLength = response.headers.get('Content-Length');
			const total = contentLength ? parseInt(contentLength, 10) : 0;

			if (total && response.body) {
				const reader = response.body.getReader();
				const chunks: BlobPart[] = [];
				let received = 0;

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
					received += value.length;
					downloadProgress = Math.round((received / total) * 100);
				}

				const blob = new Blob(chunks, { type: 'application/zip' });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${data.album.slug}-selected.zip`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			} else {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${data.album.slug}-selected.zip`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
			}
		} catch (e) {
			console.error('Download failed:', e);
			alert('Download failed. Please try again.');
		}
		isDownloading = false;
		downloadProgress = 0;
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

{#if data.requiresPassword}
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
				<button type="submit" class="btn btn-primary w-full"> Unlock Album </button>
			</form>
		</div>
	</div>
{:else}
	<div class="min-h-screen flex flex-col">
		<header
			class="sticky top-0 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)] z-50"
		>
			<div class="container">
				<div class="flex items-center justify-between py-4 gap-4">
					<div class="min-w-0">
						<h1 class="text-lg font-semibold truncate">{data.album.title}</h1>
						<span class="text-xs text-gray-500">{data.photos.length} photos</span>
					</div>
					<div class="flex gap-2 flex-shrink-0">
						<button class="btn btn-secondary text-sm" onclick={toggleSelectMode}>
							{isSelecting ? 'Cancel' : 'Select'}
						</button>
						{#if isSelecting && selectedPhotos.size > 0}
							<button
								class="btn btn-primary text-sm relative overflow-hidden"
								onclick={downloadSelected}
								disabled={isDownloading}
							>
								{#if isDownloading}
									<span class="relative z-10">Downloading... {downloadProgress}%</span>
									<span
										class="absolute inset-0 bg-blue-600 transition-all duration-200"
										style="width: {downloadProgress}%"
									></span>
								{:else}
									Download ({selectedPhotos.size})
								{/if}
							</button>
						{:else if !isSelecting}
							<button
								class="btn btn-primary text-sm relative overflow-hidden"
								onclick={downloadAlbum}
								disabled={isDownloading}
							>
								{#if isDownloading}
									<span class="relative z-10">Downloading... {downloadProgress}%</span>
									<span
										class="absolute inset-0 bg-blue-600 transition-all duration-200"
										style="width: {downloadProgress}%"
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
			<div class="bg-blue-500 text-white py-3">
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

		<main class="flex-1 py-6">
			<div class="container">
				{#if data.album.description}
					<div class="prose prose-invert prose-sm max-w-none mb-6 text-gray-300">
						{@html renderMarkdown(data.album.description)}
					</div>
				{/if}

				{#if data.tags && data.tags.length > 0}
					<div class="flex flex-wrap gap-2 mb-6">
						<a
							href="/album/{data.album.slug}"
							class="px-3 py-1.5 rounded-full text-sm transition-colors {!data.selectedTag
								? 'bg-blue-500 text-white'
								: 'bg-[var(--color-bg-tertiary)] text-gray-300 hover:bg-[var(--color-border)]'}"
						>
							All
						</a>
						{#each data.tags as tag}
							<a
								href="/album/{data.album.slug}?tag={tag.slug}"
								class="px-3 py-1.5 rounded-full text-sm transition-colors {data.selectedTag ===
								tag.slug
									? 'bg-blue-500 text-white'
									: 'bg-[var(--color-bg-tertiary)] text-gray-300 hover:bg-[var(--color-border)]'}"
							>
								{tag.name}
							</a>
						{/each}
					</div>
				{/if}

				{#if data.photos.length === 0}
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
					<div
						class={data.album.layout === 'masonry'
							? 'columns-2 sm:columns-3 lg:columns-4 gap-3'
							: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'}
					>
						{#each data.photos as photo, index}
							<button
								class="group relative {data.album.layout === 'masonry'
									? 'mb-3 break-inside-avoid block'
									: ''} w-full bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02] {selectedPhotos.has(
									photo.id
								)
									? 'ring-4 ring-blue-500 scale-[0.97]'
									: ''}"
								onclick={() => (isSelecting ? toggleSelection(photo.id) : openLightbox(index))}
							>
								<img
									src="/api/photos/{data.album.slug}/{photo.filename}/thumbnail"
									alt={photo.original_filename}
									loading="lazy"
									class="w-full {data.album.layout === 'masonry'
										? 'h-auto'
										: 'aspect-square object-cover'}"
								/>
								{#if isSelecting}
									<div
										class="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors {selectedPhotos.has(
											photo.id
										)
											? 'bg-blue-500 text-white'
											: 'bg-white/90 border-2 border-gray-300'}"
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
			</div>
		</main>
	</div>
{/if}

{#if lightboxIndex !== null}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1000] flex flex-col"
		onclick={closeLightbox}
		role="dialog"
		aria-modal="true"
		aria-label="Photo lightbox"
	>
		<div class="flex items-center justify-between p-4 text-white flex-shrink-0">
			<span class="text-sm opacity-80">{lightboxIndex + 1} / {data.photos.length}</span>
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
				src="/api/photos/{data.album.slug}/{data.photos[lightboxIndex].filename}/medium"
				alt={data.photos[lightboxIndex].original_filename}
				class="max-w-full max-h-full object-contain"
				style="max-height: calc(100vh - 140px);"
			/>
			<button
				class="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white opacity-70 hover:opacity-100 disabled:opacity-30 transition-opacity z-10"
				onclick={(e) => {
					e.stopPropagation();
					nextPhoto();
				}}
				disabled={lightboxIndex === data.photos.length - 1}
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
				href="/api/photos/{data.album.slug}/{data.photos[lightboxIndex].filename}/original"
				download={data.photos[lightboxIndex].original_filename}
				class="btn btn-primary"
				onclick={(e) => e.stopPropagation()}
			>
				Download Original
			</a>
		</div>
	</div>
{/if}
