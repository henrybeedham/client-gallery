<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/utils';

	let { data } = $props();
	let deleteConfirm: number | null = $state(null);
</script>

<svelte:head>
	<title>Dashboard - Admin</title>
</svelte:head>

<div class="max-w-6xl">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold">Dashboard</h1>
		<a href="/admin/albums/new" class="btn btn-primary">
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
				<line x1="12" y1="5" x2="12" y2="19"></line>
				<line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
			New Album
		</a>
	</div>

	<div class="grid grid-cols-5 gap-4 mb-8">
		<div
			class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 text-center"
		>
			<div class="text-3xl font-bold mb-1">{data.stats.albums}</div>
			<div class="text-sm text-gray-500">Albums</div>
		</div>
		<div
			class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 text-center"
		>
			<div class="text-3xl font-bold mb-1">{data.stats.photos}</div>
			<div class="text-sm text-gray-500">Photos</div>
		</div>
		<div
			class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 text-center"
		>
			<div class="text-3xl font-bold mb-1">{data.stats.pageViews}</div>
			<div class="text-sm text-gray-500">Page Views</div>
		</div>
		<div
			class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 text-center"
		>
			<div class="text-3xl font-bold mb-1">{data.stats.photoDownloads}</div>
			<div class="text-sm text-gray-500">Photo Downloads</div>
		</div>
		<div
			class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 text-center"
		>
			<div class="text-3xl font-bold mb-1">{data.stats.albumDownloads}</div>
			<div class="text-sm text-gray-500">Album Downloads</div>
		</div>
	</div>

	<div class="mb-8">
		<h2 class="text-xl font-semibold mb-4">Albums</h2>

		{#if data.albums.length === 0}
			<div
				class="empty-state bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl"
			>
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
				<h3>No albums yet</h3>
				<p>Create your first album to get started</p>
				<a href="/admin/albums/new" class="btn btn-primary mt-4">Create Album</a>
			</div>
		{:else}
			<div
				class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden"
			>
				<table class="w-full">
					<thead>
						<tr
							class="bg-[var(--color-bg-tertiary)] text-left text-xs uppercase tracking-wide text-gray-500"
						>
							<th class="px-4 py-3 font-semibold">Album</th>
							<th class="px-4 py-3 font-semibold">Photos</th>
							<th class="px-4 py-3 font-semibold">Visibility</th>
							<th class="px-4 py-3 font-semibold hidden md:table-cell">Created</th>
							<th class="px-4 py-3 font-semibold"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.albums as album}
							<tr
								class="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
							>
								<td class="px-4 py-3">
									<div class="flex items-center gap-3">
										<div
											class="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] flex-shrink-0"
										>
											{#if album.cover_filename}
												<img
													src="/api/photos/{album.slug}/{album.cover_filename}/thumbnail"
													alt={album.title}
													class="w-full h-full object-cover"
												/>
											{:else}
												<div class="w-full h-full flex items-center justify-center text-gray-600">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="20"
														height="20"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="1.5"
													>
														<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
														<circle cx="8.5" cy="8.5" r="1.5"></circle>
														<polyline points="21 15 16 10 5 21"></polyline>
													</svg>
												</div>
											{/if}
										</div>
										<div class="min-w-0">
											<a
												href="/admin/albums/{album.id}"
												class="font-medium hover:text-blue-400 transition-colors block truncate"
												>{album.title}</a
											>
											<span class="text-xs text-gray-500">/{album.slug}</span>
										</div>
									</div>
								</td>
								<td class="px-4 py-3 text-sm">{album.photo_count || 0}</td>
								<td class="px-4 py-3">
									<div class="flex flex-wrap gap-1">
										{#if album.is_public}
											<span class="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400"
												>Public</span
											>
										{:else}
											<span class="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400"
												>Private</span
											>
										{/if}
										{#if album.expires_at < new Date().toISOString()}
											<span
												class="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400"
												>Expired</span
											>
										{/if}
										{#if !album.show_on_home}
											<span
												class="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400"
												>Hidden</span
											>
										{/if}
										{#if album.password}
											<span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400"
												>🔒</span
											>
										{/if}
									</div>
								</td>
								<td class="px-4 py-3 text-sm text-gray-500 hidden md:table-cell"
									>{formatDate(album.created_at)}</td
								>
								<td class="px-4 py-3">
									<div class="flex gap-2 justify-end">
										<a
											href="/admin/albums/{album.id}"
											class="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
											title="Edit"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
											</svg>
										</a>
										<a
											href="/album/{album.slug}"
											target="_blank"
											class="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
											title="View"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="16"
												height="16"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
											>
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
												<button
													type="submit"
													class="p-2 rounded-lg bg-red-500 text-white"
													title="Confirm"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<polyline points="20 6 9 17 4 12"></polyline>
													</svg>
												</button>
											</form>
											<button
												class="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
												onclick={() => (deleteConfirm = null)}
												title="Cancel"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<line x1="18" y1="6" x2="6" y2="18"></line>
													<line x1="6" y1="6" x2="18" y2="18"></line>
												</svg>
											</button>
										{:else}
											<button
												class="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
												onclick={() => (deleteConfirm = album.id)}
												title="Delete"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="16"
													height="16"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<polyline points="3 6 5 6 21 6"></polyline>
													<path
														d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
													></path>
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
