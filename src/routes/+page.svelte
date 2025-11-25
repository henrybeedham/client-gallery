<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();

	let viewMode: 'grid' | 'masonry' = $state('grid');
</script>

<svelte:head>
	<title>Gallery - Photography Portfolio</title>
</svelte:head>

<div class="page">
	<header class="header">
		<div class="container">
			<div class="header-content">
				<a href="/" class="logo">Gallery</a>
				<nav class="nav">
					<a href="/admin" class="nav-link">Admin</a>
				</nav>
			</div>
		</div>
	</header>

	<main class="main">
		<div class="container">
			<div class="page-header">
				<h1>Albums</h1>

				<div class="controls">
					{#if data.categories.length > 0}
						<div class="category-filter">
							<a
								href="/"
								class="category-btn"
								class:active={!data.selectedCategory}
							>
								All
							</a>
							{#each data.categories as category}
								<a
									href="/?category={category.slug}"
									class="category-btn"
									class:active={data.selectedCategory === category.slug}
								>
									{category.name}
								</a>
							{/each}
						</div>
					{/if}

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
			</div>

			{#if data.albums.length === 0}
				<div class="empty-state">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
						<circle cx="8.5" cy="8.5" r="1.5"></circle>
						<polyline points="21 15 16 10 5 21"></polyline>
					</svg>
					<h3>No albums yet</h3>
					<p>Check back soon for new photos!</p>
				</div>
			{:else}
				<div class="albums-grid" class:masonry={viewMode === 'masonry'}>
					{#each data.albums as album}
						<a href="/album/{album.slug}" class="album-card">
							<div class="album-cover">
								{#if album.cover_filename}
									<img
										src="/api/photos/{album.cover_filename}/thumbnail"
										alt={album.title}
										loading="lazy"
									/>
								{:else}
									<div class="album-placeholder">
										<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
											<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
											<circle cx="8.5" cy="8.5" r="1.5"></circle>
											<polyline points="21 15 16 10 5 21"></polyline>
										</svg>
									</div>
								{/if}
								<div class="album-overlay">
									<span class="photo-count">{album.photo_count || 0} photos</span>
								</div>
							</div>
							<div class="album-info">
								<h3>{album.title}</h3>
								{#if album.category_name}
									<span class="album-category">{album.category_name}</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

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
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.025em;
	}

	.nav-link {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		transition: color 0.15s ease;
	}

	.nav-link:hover {
		color: var(--color-text);
	}

	.main {
		flex: 1;
		padding: 2rem 0;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (min-width: 640px) {
		.controls {
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}
	}

	.category-filter {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.category-btn {
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 500;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		transition: all 0.15s ease;
	}

	.category-btn:hover {
		background-color: var(--color-bg-tertiary);
	}

	.category-btn.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: white;
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

	.albums-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.albums-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.albums-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.albums-grid.masonry {
		display: block;
		column-count: 1;
		column-gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.albums-grid.masonry {
			column-count: 2;
		}
	}

	@media (min-width: 1024px) {
		.albums-grid.masonry {
			column-count: 3;
		}
	}

	.albums-grid.masonry .album-card {
		break-inside: avoid;
		margin-bottom: 1.5rem;
	}

	.album-card {
		display: block;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		overflow: hidden;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.album-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.album-cover {
		position: relative;
		aspect-ratio: 4 / 3;
		background-color: var(--color-bg-tertiary);
		overflow: hidden;
	}

	.albums-grid.masonry .album-cover {
		aspect-ratio: auto;
	}

	.album-cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.album-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-muted);
	}

	.album-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 50%);
		display: flex;
		align-items: flex-end;
		padding: 1rem;
		opacity: 0;
		transition: opacity 0.15s ease;
	}

	.album-card:hover .album-overlay {
		opacity: 1;
	}

	.photo-count {
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
	}

	.album-info {
		padding: 1rem;
	}

	.album-info h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.25rem;
	}

	.album-category {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}
</style>
