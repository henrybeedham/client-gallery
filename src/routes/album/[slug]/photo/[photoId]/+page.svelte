<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let { data } = $props();

	// Sanitize color to prevent XSS
	function sanitizeColor(color: string): string {
		const hexPattern = /^#[0-9A-Fa-f]{3,8}$/;
		const colorNames = /^(red|blue|green|yellow|orange|purple|pink|cyan|white|black|gray|grey)$/i;
		if (hexPattern.test(color) || colorNames.test(color)) {
			return color;
		}
		return '#3b82f6';
	}

	let safeColor = $derived(sanitizeColor(data.album.primary_color || '#3b82f6'));

	function navigatePrev() {
		if (data.prevPhoto) {
			goto(`/album/${data.album.slug}/photo/${data.prevPhoto.id}`);
		}
	}

	function navigateNext() {
		if (data.nextPhoto) {
			goto(`/album/${data.album.slug}/photo/${data.nextPhoto.id}`);
		}
	}

	function backToAlbum() {
		goto(`/album/${data.album.slug}`);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') backToAlbum();
		if (e.key === 'ArrowRight' && data.nextPhoto) navigateNext();
		if (e.key === 'ArrowLeft' && data.prevPhoto) navigatePrev();
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
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Track photo download
	function trackPhotoDownload() {
		fetch(`/api/download/track-photo/${data.album.id}/${data.photo.id}`, { method: 'POST' }).catch(
			(e) => console.warn('Analytics tracking failed:', e)
		);
	}

	// Share URL
	function copyShareLink() {
		const url = window.location.href;
		navigator.clipboard.writeText(url).then(
			() => {
				alert('Link copied to clipboard!');
			},
			() => {
				alert('Failed to copy link');
			}
		);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
<title>{data.photo.original_filename} - {data.album.title}</title>
<meta name="description" content="Photo from {data.album.title}" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="{data.photo.original_filename} - {data.album.title}" />
<meta
property="og:image"
content="/api/photos/{data.album.slug}/{data.photo.filename}/medium"
/>

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{data.photo.original_filename} - {data.album.title}" />
<meta
name="twitter:image"
content="/api/photos/{data.album.slug}/{data.photo.filename}/medium"
/>

<!-- Custom color scheme -->
{@html `<style>:root { --gallery-primary: ${safeColor}; }</style>`}
</svelte:head>

<div class="min-h-screen flex flex-col bg-[var(--color-bg)]">
<!-- Header -->
<header
class="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-xl border-b border-[var(--color-border)] z-50"
>
<div class="container">
<div class="flex items-center justify-between py-4">
<button onclick={backToAlbum} class="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity">
<svg
xmlns="http://www.w3.org/2000/svg"
width="20"
height="20"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round"
>
<line x1="19" y1="12" x2="5" y2="12"></line>
<polyline points="12 19 5 12 12 5"></polyline>
</svg>
<span>Back to {data.album.title}</span>
</button>
<div class="text-sm text-gray-500">
{data.currentIndex + 1} / {data.totalPhotos}
</div>
</div>
</div>
</header>

<!-- Main content -->
<main class="flex-1 flex flex-col lg:flex-row">
<!-- Image section -->
<div class="flex-1 flex items-center justify-center p-4 lg:p-8 bg-[var(--color-bg-secondary)]">
<div class="relative w-full max-w-6xl" in:fade={{ duration: 300, easing: cubicOut }}>
<!-- Navigation buttons -->
{#if data.prevPhoto}
<button
onclick={navigatePrev}
class="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all hover:scale-110 z-10"
aria-label="Previous photo"
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
<polyline points="15 18 9 12 15 6"></polyline>
</svg>
</button>
{/if}

<img
src="/api/photos/{data.album.slug}/{data.photo.filename}/medium"
alt={data.photo.original_filename}
class="w-full h-auto rounded-lg shadow-2xl"
in:fly={{ y: 20, duration: 400, easing: cubicOut }}
/>

{#if data.nextPhoto}
<button
onclick={navigateNext}
class="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all hover:scale-110 z-10"
aria-label="Next photo"
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
<polyline points="9 18 15 12 9 6"></polyline>
</svg>
</button>
{/if}
</div>
</div>

<!-- Info sidebar -->
<aside
class="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-[var(--color-border)] bg-[var(--color-bg)] overflow-y-auto"
in:fly={{ x: 50, duration: 400, easing: cubicOut }}
>
<div class="p-6 space-y-6">
<!-- Title -->
<div>
<h1 class="text-xl font-semibold mb-2">{data.photo.original_filename}</h1>
{#if data.photo.date_taken}
<p class="text-sm text-gray-500">{formatDateTime(data.photo.date_taken)}</p>
{/if}
</div>

<!-- Actions -->
<div class="flex flex-col gap-2">
<a
href="/api/photos/{data.album.slug}/{data.photo.filename}/original"
download={data.photo.original_filename}
class="btn w-full"
style="background-color: var(--gallery-primary); color: white;"
onclick={trackPhotoDownload}
>
<svg
xmlns="http://www.w3.org/2000/svg"
width="18"
height="18"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round"
>
<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
<polyline points="7 10 12 15 17 10"></polyline>
<line x1="12" y1="15" x2="12" y2="3"></line>
</svg>
Download
</a>
<button onclick={copyShareLink} class="btn btn-secondary w-full">
<svg
xmlns="http://www.w3.org/2000/svg"
width="18"
height="18"
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round"
>
<circle cx="18" cy="5" r="3"></circle>
<circle cx="6" cy="12" r="3"></circle>
<circle cx="18" cy="19" r="3"></circle>
<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
</svg>
Share Link
</button>
</div>

<!-- EXIF metadata -->
{#if data.photo.camera_make || data.photo.camera_model || data.photo.lens_model || data.photo.focal_length || data.photo.aperture || data.photo.shutter_speed || data.photo.iso}
<div class="border-t border-[var(--color-border)] pt-6">
<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
Camera & Settings
</h2>
<dl class="space-y-3">
{#if data.photo.camera_make || data.photo.camera_model}
<div>
<dt class="text-xs text-gray-500 mb-1">Camera</dt>
<dd class="text-sm font-medium">
{[data.photo.camera_make, data.photo.camera_model].filter(Boolean).join(' ')}
</dd>
</div>
{/if}
{#if data.photo.lens_model}
<div>
<dt class="text-xs text-gray-500 mb-1">Lens</dt>
<dd class="text-sm font-medium">{data.photo.lens_model}</dd>
</div>
{/if}
{#if data.photo.focal_length}
<div>
<dt class="text-xs text-gray-500 mb-1">Focal Length</dt>
<dd class="text-sm font-medium">{formatFocalLength(data.photo.focal_length)}</dd>
</div>
{/if}
{#if data.photo.aperture}
<div>
<dt class="text-xs text-gray-500 mb-1">Aperture</dt>
<dd class="text-sm font-medium">{formatAperture(data.photo.aperture)}</dd>
</div>
{/if}
{#if data.photo.shutter_speed}
<div>
<dt class="text-xs text-gray-500 mb-1">Shutter Speed</dt>
<dd class="text-sm font-medium">{data.photo.shutter_speed}</dd>
</div>
{/if}
{#if data.photo.iso}
<div>
<dt class="text-xs text-gray-500 mb-1">ISO</dt>
<dd class="text-sm font-medium">{data.photo.iso}</dd>
</div>
{/if}
</dl>
</div>
{/if}

<!-- File info -->
<div class="border-t border-[var(--color-border)] pt-6">
<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-4">
File Information
</h2>
<dl class="space-y-3">
<div>
<dt class="text-xs text-gray-500 mb-1">Dimensions</dt>
<dd class="text-sm font-medium">
{data.photo.width} × {data.photo.height}
</dd>
</div>
{#if data.photo.file_size}
<div>
<dt class="text-xs text-gray-500 mb-1">File Size</dt>
<dd class="text-sm font-medium">
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
