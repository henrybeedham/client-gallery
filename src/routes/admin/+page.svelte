<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate } from '$lib/utils';
	import { Plus, Image, Edit, ExternalLink, Check, X, Trash2 } from 'lucide-svelte';

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
			<Plus size={18} />
			New Album
		</a>
	</div>

	<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
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
				<Image size={48} strokeWidth={1.5} />
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
													<Image size={20} strokeWidth={1.5} />
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
											<Edit size={16} />
										</a>
										<a
											href="/album/{album.slug}"
											target="_blank"
											class="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
											title="View"
										>
											<ExternalLink size={16} />
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
													<Check size={16} />
												</button>
											</form>
											<button
												class="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
												onclick={() => (deleteConfirm = null)}
												title="Cancel"
											>
												<X size={16} />
											</button>
										{:else}
											<button
												class="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
												onclick={() => (deleteConfirm = album.id)}
												title="Delete"
											>
												<Trash2 size={16} />
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
