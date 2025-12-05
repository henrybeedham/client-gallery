<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { 
		ArrowLeft, 
		ChevronLeft, 
		ChevronRight, 
		Download, 
		Camera, 
		Aperture
	} from 'lucide-svelte';

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
<title>{data.album.title} - {data.photo.date_taken ? formatShortDateTime(data.photo.date_taken) : 'Photo'}</title>
<meta name="description" content="Photo from {data.album.title}{data.photo.date_taken ? ' taken on ' + formatShortDateTime(data.photo.date_taken) : ''}" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="{data.album.title}{data.photo.date_taken ? ' - ' + formatShortDateTime(data.photo.date_taken) : ''}" />
<meta property="og:description" content="Photo from {data.album.title}{data.photo.date_taken ? ' taken on ' + formatShortDateTime(data.photo.date_taken) : ''}" />
<meta
property="og:image"
content="/api/photos/{data.album.slug}/{data.photo.filename}/medium"
/>

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{data.album.title}{data.photo.date_taken ? ' - ' + formatShortDateTime(data.photo.date_taken) : ''}" />
<meta name="twitter:description" content="Photo from {data.album.title}{data.photo.date_taken ? ' taken on ' + formatShortDateTime(data.photo.date_taken) : ''}" />
<meta
name="twitter:image"
content="/api/photos/{data.album.slug}/{data.photo.filename}/medium"
/>

<!-- Custom color scheme -->
{@html `<style>:root { --gallery-primary: ${safeColor}; }</style>`}
</svelte:head>

<div class="min-h-screen flex flex-col bg-[var(--color-bg)] relative">
<!-- Blurred background image -->
<div 
class="fixed inset-0 z-0"
style="background-image: url('/api/photos/{data.album.slug}/{data.photo.filename}/medium'); 
background-size: cover; 
background-position: center;
filter: blur(40px);
transform: scale(1.1);"
></div>
<div class="fixed inset-0 z-0 bg-black/60"></div>

<!-- Header -->
<header
class="sticky top-0 bg-black/40 backdrop-blur-xl border-b border-white/10 z-50"
>
<div class="container">
<div class="flex items-center justify-between py-4">
<button onclick={backToAlbum} class="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity text-white">
<ArrowLeft size={20} />
<span>Back to {data.album.title}</span>
</button>
<div class="text-sm text-gray-300">
{data.currentIndex + 1} / {data.totalPhotos}
</div>
</div>
</div>
</header>

<!-- Main content -->
<main class="flex-1 flex flex-col lg:flex-row relative z-10">
<!-- Image section -->
<div class="flex-1 flex items-center justify-center p-4 lg:p-8 lg:overflow-hidden min-h-[50vh] lg:min-h-0">
<div class="relative w-full lg:h-full flex items-center justify-center" in:fade={{ duration: 300, easing: cubicOut }}>
<!-- Navigation buttons -->
{#if data.prevPhoto}
<button
onclick={navigatePrev}
class="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all hover:scale-110 z-10 backdrop-blur-sm"
aria-label="Previous photo"
>
<ChevronLeft size={24} />
</button>
{/if}

<img
src="/api/photos/{data.album.slug}/{data.photo.filename}/medium"
alt={data.photo.original_filename}
class="w-full lg:max-w-full lg:max-h-full object-contain rounded-lg shadow-2xl"
in:fly={{ y: 20, duration: 400, easing: cubicOut }}
/>

{#if data.nextPhoto}
<button
onclick={navigateNext}
class="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all hover:scale-110 z-10 backdrop-blur-sm"
aria-label="Next photo"
>
<ChevronRight size={24} />
</button>
{/if}
</div>
</div>

<!-- Info sidebar -->
<aside
class="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 bg-black/40 backdrop-blur-xl lg:overflow-y-auto lg:max-h-[calc(100vh-73px)]"
in:fly={{ x: 50, duration: 400, easing: cubicOut }}
>
<div class="p-6 space-y-6">
<!-- Title -->
<div>
<h1 class="text-xl font-semibold mb-2 text-white">{data.photo.original_filename}</h1>
{#if data.photo.date_taken}
<p class="text-sm text-gray-300">{formatDateTime(data.photo.date_taken)}</p>
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
<Download size={18} />
Download
</a>
</div>

<!-- EXIF metadata -->
{#if data.photo.camera_make || data.photo.camera_model || data.photo.lens_model || data.photo.focal_length || data.photo.aperture || data.photo.shutter_speed || data.photo.iso}
<div class="border-t border-white/10 pt-6">
<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
Camera & Settings
</h2>
<dl class="space-y-3">
{#if data.photo.camera_make || data.photo.camera_model}
<div class="flex items-start gap-3">
<Camera size={16} class="text-gray-400 mt-0.5 flex-shrink-0" />
<dd class="text-sm font-medium text-white">
{[data.photo.camera_make, data.photo.camera_model].filter(Boolean).join(' ')}
</dd>
</div>
{/if}
{#if data.photo.lens_model}
<div class="flex items-start gap-3">
<Aperture size={16} class="text-gray-400 mt-0.5 flex-shrink-0" />
<dd class="text-sm font-medium text-white">{data.photo.lens_model}</dd>
</div>
{/if}
{#if data.photo.focal_length}
<div>
<dd class="text-sm font-medium text-white">{formatFocalLength(data.photo.focal_length)}</dd>
</div>
{/if}
{#if data.photo.aperture}
<div>
<dd class="text-sm font-medium text-white">{formatAperture(data.photo.aperture)}</dd>
</div>
{/if}
{#if data.photo.shutter_speed}
<div>
<dd class="text-sm font-medium text-white">{data.photo.shutter_speed}</dd>
</div>
{/if}
{#if data.photo.iso}
<div>
<dd class="text-sm font-medium text-white">ISO {data.photo.iso}</dd>
</div>
{/if}
</dl>
</div>
{/if}

<!-- File info -->
<div class="border-t border-white/10 pt-6">
<h2 class="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-4">
File Information
</h2>
<dl class="space-y-3">
<div>
<dt class="text-xs text-gray-400 mb-1">Dimensions</dt>
<dd class="text-sm font-medium text-white">
{data.photo.width} × {data.photo.height}
</dd>
</div>
{#if data.photo.file_size}
<div>
<dt class="text-xs text-gray-400 mb-1">File Size</dt>
<dd class="text-sm font-medium text-white">
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
