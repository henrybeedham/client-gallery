<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { slugify, formatFileSize } from '$lib/utils';

	let { data, form } = $props();

	let title = $state(data.album.title);
	let customSlug = $state(data.album.slug);
	let description = $state(data.album.description || '');
	let isPublic = $state(data.album.is_public === 1);
	let showOnHome = $state(data.album.show_on_home === 1);
	let password = $state(data.album.password || '');
	let layout = $state(data.album.layout || 'grid');

	let autoSlug = $derived(slugify(title));

	let loading = $state(false);
	let uploading = $state(false);
	let uploadProgress = $state(0);
	let uploadStatus = $state('');
	let deleteConfirm: number | null = $state(null);
	let selectedPhoto: number[] | null = $state([]);

	let fileInput: HTMLInputElement;

	// Get tags for a specific photo
	function getPhotoTags(photoId: number): number[] {
		return (
			data.photoTags
				?.filter((pt: { photo_id: number; tag_id: number }) => pt.photo_id === photoId)
				.map((pt: { photo_id: number; tag_id: number }) => pt.tag_id) || []
		);
	}

	// Check if a tag is applied to all currently selected photos
	function isTagAppliedToAllSelected(tagId: number): boolean {
		if (!selectedPhoto || selectedPhoto.length === 0) return false;
		return selectedPhoto.every((id) => getPhotoTags(id).includes(tagId));
	}

	async function handleUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (!files || files.length === 0) return;

		uploading = true;
		uploadProgress = 0;
		uploadStatus = `Uploading ${files.length} file(s)...`;

		const formData = new FormData();
		for (const file of files) {
			formData.append('photos', file);
		}

		try {
			const xhr = new XMLHttpRequest();

			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					uploadProgress = Math.round((e.loaded / e.total) * 100);
					uploadStatus = `Uploading... ${uploadProgress}%`;
				}
			});

			xhr.addEventListener('load', async () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					uploadStatus = 'Upload complete! Processing...';
					await invalidateAll();
					uploadStatus = 'Upload complete!';
				} else {
					uploadStatus = 'Upload failed';
				}
				uploading = false;
				setTimeout(() => {
					uploadProgress = 0;
					uploadStatus = '';
				}, 3000);
			});

			xhr.addEventListener('error', () => {
				uploadStatus = 'Upload failed';
				uploading = false;
			});

			xhr.open('POST', `/admin/albums/${data.album.id}?/uploadPhotos`);
			xhr.send(formData);
		} catch {
			uploadStatus = 'Upload failed';
			uploading = false;
		}

		input.value = '';
	}

	async function togglePhotoTag(photoIds: number[], tagId: number) {
		let currentStatus: 'add' | 'remove' | 'mixed' = 'mixed';
		for (const photoId of photoIds) {
			const hasTag = getPhotoTags(photoId).includes(tagId);
			if (hasTag) {
				if (currentStatus === 'add') {
					currentStatus = 'mixed';
					break;
				}
				currentStatus = 'remove';
			} else {
				if (currentStatus === 'remove') {
					currentStatus = 'mixed';
					break;
				}
				currentStatus = 'add';
			}
		}

		switch (currentStatus) {
			case 'add':
				for (const photoId of photoIds) {
					const formData = new FormData();
					formData.append('photoId', photoId.toString());
					formData.append('tagId', tagId.toString());
					await fetch(`/admin/albums/${data.album.id}?/addTagToPhoto`, {
						method: 'POST',
						body: formData
					});
				}
				break;
			case 'remove':
				for (const photoId of photoIds) {
					const formData = new FormData();
					formData.append('photoId', photoId.toString());
					formData.append('tagId', tagId.toString());
					await fetch(`/admin/albums/${data.album.id}?/removeTagFromPhoto`, {
						method: 'POST',
						body: formData
					});
				}
				break;
			case 'mixed':
				// If mixed, we can choose to add the tag to all photos
				for (const photoId of photoIds) {
					const formData = new FormData();
					formData.append('photoId', photoId.toString());
					formData.append('tagId', tagId.toString());
					await fetch(`/admin/albums/${data.album.id}?/addTagToPhoto`, {
						method: 'POST',
						body: formData
					});
				}
				break;
		}

		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Edit {data.album.title} - Admin</title>
</svelte:head>

<div>
	<div class="flex items-start gap-3 mb-8">
		<a
			href="/admin"
			class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors mt-1"
			aria-label="Back to dashboard"
		>
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
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</a>
		<div>
			<h1 class="text-2xl font-bold">{data.album.title}</h1>
			<a
				href="/album/{data.album.slug}"
				target="_blank"
				class="text-sm text-blue-400 hover:text-blue-300"
			>
				View album →
			</a>
		</div>
	</div>

	{#if form?.error}
		<div class="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
			{form.error}
		</div>
	{/if}

	{#if form?.message}
		<div
			class="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm mb-6"
		>
			{form.message}
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
		<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold">Photos ({data.photos.length})</h2>
				<div class="flex gap-2">
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						multiple
						onchange={handleUpload}
						bind:this={fileInput}
						hidden
					/>
					{#if selectedPhoto && selectedPhoto.length > 0}
						<button onclick={() => (selectedPhoto = [])} class="btn btn-secondary">
							Deselect All
						</button>
					{/if}
					<button class="btn btn-primary" onclick={() => fileInput.click()} disabled={uploading}>
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
							<polyline points="17 8 12 3 7 8"></polyline>
							<line x1="12" y1="3" x2="12" y2="15"></line>
						</svg>
						{uploading ? 'Uploading...' : 'Upload Photos'}
					</button>
				</div>
			</div>

			{#if uploadStatus}
				<div class="mb-4">
					<div class="flex items-center justify-between text-sm mb-2">
						<span class="text-gray-400">{uploadStatus}</span>
						{#if uploading}
							<span class="text-blue-400">{uploadProgress}%</span>
						{/if}
					</div>
					<div class="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
						<div
							class="h-full bg-blue-500 transition-all duration-300 ease-out"
							style="width: {uploadProgress}%"
						></div>
					</div>
				</div>
			{/if}

			{#if data.photos.length === 0}
				<div class="text-center py-12 text-gray-500">
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
						class="mx-auto mb-4 opacity-50"
					>
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
						<circle cx="8.5" cy="8.5" r="1.5"></circle>
						<polyline points="21 15 16 10 5 21"></polyline>
					</svg>
					<p class="mb-4">No photos yet</p>
					<button class="btn btn-primary" onclick={() => fileInput.click()}> Upload Photos </button>
				</div>
			{:else}
				<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
					{#each data.photos as photo}
						<div
							class="group relative rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] cursor-pointer transition-all {photo.id ===
							data.album.cover_photo_id
								? 'ring-2 ring-yellow-500'
								: ''} {selectedPhoto?.includes(photo.id)
								? 'ring-2 ring-blue-500 scale-[0.98]'
								: ''}"
							onclick={() => {
								if (selectedPhoto?.includes(photo.id)) {
									selectedPhoto = selectedPhoto.filter((id) => id !== photo.id);
								} else {
									selectedPhoto = [...(selectedPhoto || []), photo.id];
								}
							}}
							role="button"
							tabindex="0"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									if (selectedPhoto?.includes(photo.id)) {
										selectedPhoto = selectedPhoto.filter((id) => id !== photo.id);
									} else {
										selectedPhoto = [...(selectedPhoto || []), photo.id];
									}
								}
							}}
						>
							<img
								src="/api/photos/{data.album.slug}/{photo.filename}/thumbnail"
								alt={photo.original_filename}
								loading="lazy"
								class="w-full aspect-square object-cover"
							/>
							<div
								class="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2"
							>
								<div class="flex gap-1 justify-end" onclick={(e) => e.stopPropagation()}>
									{#if photo.id !== data.album.cover_photo_id}
										<form method="POST" action="?/setCover" use:enhance>
											<input type="hidden" name="photoId" value={photo.id} />
											<button
												type="submit"
												class="p-1.5 rounded bg-black/50 text-white hover:bg-yellow-500"
												title="Set as cover"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polygon
														points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
													></polygon>
												</svg>
											</button>
										</form>
									{:else}
										<span class="p-1.5 rounded bg-yellow-500 text-white" title="Cover photo">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="currentColor"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<polygon
													points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
												></polygon>
											</svg>
										</span>
									{/if}
									{#if deleteConfirm === photo.id}
										<form
											method="POST"
											action="?/deletePhoto"
											use:enhance={() => {
												return async ({ update }) => {
													deleteConfirm = null;
													await update();
												};
											}}
										>
											<input type="hidden" name="photoId" value={photo.id} />
											<button
												type="submit"
												class="p-1.5 rounded bg-red-500 text-white"
												title="Confirm delete"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<polyline points="20 6 9 17 4 12"></polyline>
												</svg>
											</button>
										</form>
										<button
											class="p-1.5 rounded bg-black/50 text-white hover:bg-black/70"
											onclick={(e) => {
												e.stopPropagation();
												deleteConfirm = null;
											}}
											title="Cancel"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
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
									{:else}
										<button
											class="p-1.5 rounded bg-black/50 text-white hover:bg-red-500"
											onclick={(e) => {
												e.stopPropagation();
												deleteConfirm = photo.id;
											}}
											title="Delete"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<polyline points="3 6 5 6 21 6"></polyline>
												<path
													d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
												></path>
											</svg>
										</button>
									{/if}
								</div>
							</div>
							<div class="p-2 text-xs">
								<p class="truncate text-gray-300" title={photo.original_filename}>
									{photo.original_filename}
								</p>
								<span class="text-gray-500">{formatFileSize(photo.file_size || 0)}</span>
								<div>
									{#if getPhotoTags(photo.id).length > 0}
										{#each getPhotoTags(photo.id) as tagId}
											{#each data.tags.filter((t) => t.id === tagId) as tag}
												<span
													class="inline-block bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-1 mt-1"
													title={tag.name}
												>
													{tag.name}
												</span>
											{/each}
										{/each}
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="space-y-6">
			<div
				class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 top-6"
			>
				<h2 class="text-lg font-semibold mb-4">Settings</h2>
				<form
					method="POST"
					action="?/updateAlbum"
					use:enhance={() => {
						loading = true;
						return async ({ result, update }) => {
							loading = false;
							if (result.type === 'success') {
								await invalidateAll();
							}
							await update({ reset: false });
						};
					}}
				>
					<div class="space-y-4">
						<div>
							<label for="title" class="block text-sm font-medium mb-1.5">Title</label>
							<input
								type="text"
								id="title"
								name="title"
								class="form-input"
								bind:value={title}
								required
							/>
						</div>

						<div>
							<label for="slug" class="block text-sm font-medium mb-1.5">URL Slug</label>
							<div class="flex items-center gap-2">
								<span class="text-gray-500 text-sm">/album/</span>
								<input
									type="text"
									id="slug"
									name="slug"
									class="form-input flex-1"
									bind:value={customSlug}
									placeholder={autoSlug}
								/>
							</div>
						</div>

						<div>
							<label for="description" class="block text-sm font-medium mb-1.5">
								Description
								<span class="text-gray-500 font-normal">(markdown)</span>
							</label>
							<textarea
								id="description"
								name="description"
								class="form-textarea"
								rows="3"
								bind:value={description}
							></textarea>
						</div>

						<div>
							<label for="layout" class="block text-sm font-medium mb-1.5">Gallery Layout</label>
							<select id="layout" name="layout" class="form-select" bind:value={layout}>
								<option value="grid">Grid</option>
								<option value="masonry">Masonry</option>
							</select>
						</div>

						<div class="space-y-3 pt-2">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									name="isPublic"
									bind:checked={isPublic}
									class="w-4 h-4 accent-blue-500"
								/>
								<span class="text-sm">Public album</span>
							</label>

							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									name="showOnHome"
									bind:checked={showOnHome}
									class="w-4 h-4 accent-blue-500"
								/>
								<span class="text-sm">Show on homepage</span>
							</label>
						</div>

						<div>
							<label for="password" class="block text-sm font-medium mb-1.5">
								Password
								<span class="text-gray-500 font-normal">(optional)</span>
							</label>
							<input
								type="text"
								id="password"
								name="password"
								class="form-input"
								bind:value={password}
								placeholder="Leave empty for no password"
							/>
						</div>

						<button type="submit" class="btn btn-primary w-full mt-4" disabled={loading}>
							{loading ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</form>
			</div>

			{#if data.tags.length > 0 || true}
				<div
					class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 top-[calc(1.5rem+600px)]"
					style="max-height: calc(100vh - 3rem); overflow-y: auto;"
				>
					<h2 class="text-lg font-semibold mb-4">Photo Tags</h2>
					<form method="POST" action="?/createTag" use:enhance class="flex gap-2 mb-4">
						<input
							type="text"
							name="name"
							class="form-input flex-1"
							placeholder="New tag name..."
						/>
						<button type="submit" class="btn btn-secondary">Add</button>
					</form>
					{#if data.tags.length > 0}
						<div class="flex flex-wrap gap-2 mb-4">
							{#each data.tags as tag}
								<form method="POST" action="?/deleteTag" use:enhance class="inline">
									<input type="hidden" name="tagId" value={tag.id} />
									<button
										type="submit"
										class="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-bg-tertiary)] rounded-full text-sm hover:bg-red-500/20 group transition-colors"
									>
										{tag.name}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="12"
											height="12"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											class="opacity-50 group-hover:opacity-100"
										>
											<line x1="18" y1="6" x2="6" y2="18"></line>
											<line x1="6" y1="6" x2="18" y2="18"></line>
										</svg>
									</button>
								</form>
							{/each}
						</div>
						{#if selectedPhoto && selectedPhoto.length > 0}
							<div class="border-t border-[var(--color-border)] pt-4">
								<p class="text-sm text-gray-400 mb-2">
									Click tags to add/remove from selected photo:
								</p>
								<div class="flex flex-wrap gap-2">
									{#each data.tags as tag}
										<button
											type="button"
											onclick={() => togglePhotoTag(selectedPhoto!, tag.id)}
											class="px-3 py-1 rounded-full text-sm transition-colors {isTagAppliedToAllSelected(
												tag.id
											)
												? 'bg-blue-500 text-white'
												: 'bg-[var(--color-bg-tertiary)] text-gray-300 hover:bg-[var(--color-border)]'}"
										>
											{tag.name}
										</button>
									{/each}
								</div>
							</div>
						{:else}
							<p class="text-sm text-gray-500 border-t border-[var(--color-border)] pt-4">
								Select a photo to assign tags to it.
							</p>
						{/if}
					{:else}
						<p class="text-sm text-gray-500">
							No tags yet. Add tags to categorize photos within this album.
						</p>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
