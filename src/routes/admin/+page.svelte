<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/utils';

	let { data } = $props();
	let deleteConfirm: number | null = $state(null);
</script>

<svelte:head>
	<title>Dashboard - Admin</title>
</svelte:head>

<div class="dashboard">
	<div class="page-header">
		<h1>Dashboard</h1>
		<a href="/admin/albums/new" class="btn btn-primary">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
			New Album
		</a>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">{data.albums.length}</div>
			<div class="stat-label">Albums</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{data.albums.reduce((acc, a) => acc + (a.photo_count || 0), 0)}</div>
			<div class="stat-label">Photos</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{data.categories.length}</div>
			<div class="stat-label">Categories</div>
		</div>
	</div>

	<div class="section">
		<h2>Albums</h2>
		
		{#if data.albums.length === 0}
			<div class="empty-state">
				<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
					<circle cx="8.5" cy="8.5" r="1.5"></circle>
					<polyline points="21 15 16 10 5 21"></polyline>
				</svg>
				<h3>No albums yet</h3>
				<p>Create your first album to get started</p>
				<a href="/admin/albums/new" class="btn btn-primary">Create Album</a>
			</div>
		{:else}
			<div class="albums-table-wrapper">
				<table class="albums-table">
					<thead>
						<tr>
							<th>Album</th>
							<th>Category</th>
							<th>Photos</th>
							<th>Status</th>
							<th>Created</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each data.albums as album}
							<tr>
								<td>
									<div class="album-cell">
										<div class="album-thumb">
											{#if album.cover_filename}
												<img src="/api/photos/{album.cover_filename}/thumbnail" alt={album.title} />
											{:else}
												<div class="album-thumb-placeholder">
													<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
														<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
														<circle cx="8.5" cy="8.5" r="1.5"></circle>
														<polyline points="21 15 16 10 5 21"></polyline>
													</svg>
												</div>
											{/if}
										</div>
										<div class="album-info">
											<a href="/admin/albums/{album.id}" class="album-title">{album.title}</a>
											<span class="album-slug">/{album.slug}</span>
										</div>
									</div>
								</td>
								<td>
									{#if album.category_name}
										<span class="category-badge">{album.category_name}</span>
									{:else}
										<span class="text-muted">—</span>
									{/if}
								</td>
								<td>{album.photo_count || 0}</td>
								<td>
									{#if album.is_public}
										<span class="status-badge status-public">Public</span>
									{:else}
										<span class="status-badge status-private">Private</span>
									{/if}
								</td>
								<td class="text-muted">{formatDate(album.created_at)}</td>
								<td>
									<div class="actions">
										<a href="/admin/albums/{album.id}" class="btn btn-secondary btn-icon" title="Edit">
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
											</svg>
										</a>
										<a href="/album/{album.slug}" target="_blank" class="btn btn-secondary btn-icon" title="View">
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
												<polyline points="15 3 21 3 21 9"></polyline>
												<line x1="10" y1="14" x2="21" y2="3"></line>
											</svg>
										</a>
										{#if deleteConfirm === album.id}
											<form
												method="POST"
												action="?/deleteAlbum"
												use:enhance={() => {
													return async ({ update }) => {
														deleteConfirm = null;
														await update();
													};
												}}
											>
												<input type="hidden" name="albumId" value={album.id} />
												<button type="submit" class="btn btn-danger btn-icon" title="Confirm Delete">
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<polyline points="20 6 9 17 4 12"></polyline>
													</svg>
												</button>
											</form>
											<button class="btn btn-secondary btn-icon" onclick={() => deleteConfirm = null} title="Cancel">
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<line x1="18" y1="6" x2="6" y2="18"></line>
													<line x1="6" y1="6" x2="18" y2="18"></line>
												</svg>
											</button>
										{:else}
											<button class="btn btn-secondary btn-icon" onclick={() => deleteConfirm = album.id} title="Delete">
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<polyline points="3 6 5 6 21 6"></polyline>
													<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
												</svg>
											</button>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard {
		max-width: 1200px;
	}

	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 1.5rem;
		text-align: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.section {
		margin-bottom: 2rem;
	}

	.section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.albums-table-wrapper {
		overflow-x: auto;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
	}

	.albums-table {
		width: 100%;
		border-collapse: collapse;
	}

	.albums-table th,
	.albums-table td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.albums-table th {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-secondary);
		background-color: var(--color-bg-tertiary);
	}

	.albums-table tbody tr:last-child td {
		border-bottom: none;
	}

	.albums-table tbody tr:hover {
		background-color: var(--color-bg-tertiary);
	}

	.album-cell {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.album-thumb {
		width: 48px;
		height: 48px;
		border-radius: 0.375rem;
		overflow: hidden;
		flex-shrink: 0;
	}

	.album-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.album-thumb-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-muted);
	}

	.album-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.album-title {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 0.15s ease;
	}

	.album-title:hover {
		color: var(--color-primary);
	}

	.album-slug {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.category-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background-color: var(--color-bg-tertiary);
		border-radius: 0.25rem;
	}

	.status-badge {
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 9999px;
	}

	.status-public {
		background-color: rgba(34, 197, 94, 0.1);
		color: var(--color-success);
	}

	.status-private {
		background-color: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
	}

	.text-muted {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.empty-state {
		padding: 3rem 2rem;
	}

	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.albums-table th:nth-child(4),
		.albums-table td:nth-child(4),
		.albums-table th:nth-child(5),
		.albums-table td:nth-child(5) {
			display: none;
		}
	}
</style>