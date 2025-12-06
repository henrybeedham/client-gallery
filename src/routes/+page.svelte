<script lang="ts">
	import { Image, Lock } from 'lucide-svelte';
	
	let { data } = $props();
</script>

<svelte:head>
	<title>Gallery - Photography Portfolio</title>
</svelte:head>

<div class="min-h-screen flex flex-col">
	<header
		class="sticky top-0 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)] z-50"
	>
		<div class="container">
			<div class="flex items-center justify-between py-4">
				<a href="/" class="text-xl font-bold tracking-tight">Gallery</a>
				<nav>
					<a href="/admin" class="text-sm text-gray-400 hover:text-white transition-colors">Admin</a
					>
				</nav>
			</div>
		</div>
	</header>

	<main class="flex-1 py-8">
		<div class="container">
			<h1 class="text-3xl font-bold mb-8">Albums</h1>

			{#if data.albums.length === 0}
				<div class="empty-state">
					<Image size={48} strokeWidth={1.5} />
					<h3>No albums yet</h3>
					<p>Check back soon for new photos!</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each data.albums as album}
						<a
							href="/album/{album.slug}"
							class="group block bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
						>
							<div class="relative aspect-[4/3] bg-[var(--color-bg-tertiary)] overflow-hidden">
								{#if album.cover_filename}
									<img
										src="/api/photos/{album.slug}/{album.cover_filename}/thumbnail"
										alt={album.title}
										loading="lazy"
										class="w-full h-full object-cover transition-transform group-hover:scale-105"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center text-gray-600">
										<Image size={48} strokeWidth={1.5} />
									</div>
								{/if}
								<div
									class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4"
								>
									<span class="text-white text-sm font-medium">{album.photo_count || 0} photos</span
									>
								</div>
								{#if album.password}
									<div class="absolute top-3 right-3">
										<Lock size={16} class="text-white drop-shadow-lg" />
									</div>
								{/if}
							</div>
							<div class="p-4">
								<h3 class="font-semibold text-lg">{album.title}</h3>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>
