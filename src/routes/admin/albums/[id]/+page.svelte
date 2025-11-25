<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { slugify, formatFileSize } from '$lib/utils';

	let { data, form } = $props();

	let title = $state(data.album.title);
	let description = $state(data.album.description || '');
	let categoryId = $state(data.album.category_id?.toString() || '');
	let isPublic = $state(data.album.is_public === 1);
	let coverPhotoId = $state(data.album.cover_photo_id?.toString() || '');

	let slug = $derived(slugify(title));
	let loading = $state(false);
	let uploading = $state(false);
	let uploadProgress = $state('');
	let deleteConfirm: number | null = $state(null);

	let fileInput: HTMLInputElement;

	async function handleUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (!files || files.length === 0) return;

		uploading = true;
		uploadProgress = `Uploading ${files.length} file(s)...`;

		const formData = new FormData();
		for (const file of files) {
			formData.append('photos', file);
		}

		try {
			const response = await fetch(`/admin/albums/${data.album.id}?/uploadPhotos`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await invalidateAll();
				uploadProgress = 'Upload complete!';
			} else {
				uploadProgress = 'Upload failed';
			}
		} catch {
			uploadProgress = 'Upload failed';
		}

		uploading = false;
		input.value = '';

		setTimeout(() => {
			uploadProgress = '';
		}, 3000);
	}
</script>

<svelte:head>
	<title>Edit {data.album.title} - Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<div class="header-left">
			<a href="/admin" class="back-btn" aria-label="Back to dashboard">
				<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</a>
			<div>
				<h1>{data.album.title}</h1>
				<a href="/album/{data.album.slug}" target="_blank" class="view-link">
					View album →
				</a>
			</div>
		</div>
	</div>

	{#if form?.error}
		<div class="message error-message">{form.error}</div>
	{/if}

	{#if form?.message}
		<div class="message success-message">{form.message}</div>
	{/if}

	<div class="content-grid">
		<div class="main-content">
			<!-- Photos Section -->
			<div class="section">
				<div class="section-header">
					<h2>Photos ({data.photos.length})</h2>
					<div class="upload-controls">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							multiple
							onchange={handleUpload}
							bind:this={fileInput}
							hidden
						/>
						<button
							class="btn btn-primary"
							onclick={() => fileInput.click()}
							disabled={uploading}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="17 8 12 3 7 8"></polyline>
								<line x1="12" y1="3" x2="12" y2="15"></line>
							</svg>
							{uploading ? 'Uploading...' : 'Upload Photos'}
						</button>
					</div>
				</div>

				{#if uploadProgress}
					<div class="upload-progress">{uploadProgress}</div>
				{/if}

				{#if data.photos.length === 0}
					<div class="empty-photos">
						<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
							<circle cx="8.5" cy="8.5" r="1.5"></circle>
							<polyline points="21 15 16 10 5 21"></polyline>
						</svg>
						<p>No photos yet</p>
						<button class="btn btn-primary" onclick={() => fileInput.click()}>
							Upload Photos
						</button>
					</div>
				{:else}
					<div class="photos-grid">
						{#each data.photos as photo}
							<div class="photo-item" class:is-cover={photo.id === data.album.cover_photo_id}>
								<img
									src="/api/photos/{photo.filename}/thumbnail"
									alt={photo.original_filename}
									loading="lazy"
								/>
								<div class="photo-overlay">
									<div class="photo-actions">
										{#if photo.id !== data.album.cover_photo_id}
											<form method="POST" action="?/setCover" use:enhance>
												<input type="hidden" name="photoId" value={photo.id} />
												<button type="submit" class="photo-action-btn" title="Set as cover">
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
													</svg>
												</button>
											</form>
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
												<button type="submit" class="photo-action-btn delete" title="Confirm">
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<polyline points="20 6 9 17 4 12"></polyline>
													</svg>
												</button>
											</form>
											<button class="photo-action-btn" onclick={() => deleteConfirm = null} title="Cancel">
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<line x1="18" y1="6" x2="6" y2="18"></line>
													<line x1="6" y1="6" x2="18" y2="18"></line>
												</svg>
											</button>
										{:else}
											<button class="photo-action-btn" onclick={() => deleteConfirm = photo.id} title="Delete">
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<polyline points="3 6 5 6 21 6"></polyline>
													<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
												</svg>
											</button>
										{/if}
									</div>
									{#if photo.id === data.album.cover_photo_id}
										<span class="cover-badge">Cover</span>
									{/if}
								</div>
								<div class="photo-info">
									<span class="photo-name" title={photo.original_filename}>
										{photo.original_filename}
									</span>
									<span class="photo-size">{formatFileSize(photo.file_size || 0)}</span>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="sidebar">
			<!-- Album Settings -->
			<div class="section">
				<h2>Settings</h2>
				<form
					method="POST"
					action="?/updateAlbum"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							await update();
						};
					}}
				>
					<div class="form-group">
						<label for="title" class="form-label">Title</label>
						<input
							type="text"
							id="title"
							name="title"
							class="form-input"
							bind:value={title}
							required
						/>
						{#if slug}
							<p class="form-hint">URL: /album/{slug}</p>
						{/if}
					</div>

					<div class="form-group">
						<label for="description" class="form-label">Description</label>
						<textarea
							id="description"
							name="description"
							class="form-textarea"
							rows="3"
							bind:value={description}
						></textarea>
					</div>

					<div class="form-group">
						<label for="categoryId" class="form-label">Category</label>
						<select id="categoryId" name="categoryId" class="form-select" bind:value={categoryId}>
							<option value="">No category</option>
							{#each data.categories as category}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="coverPhotoId" class="form-label">Cover Photo</label>
						<select id="coverPhotoId" name="coverPhotoId" class="form-select" bind:value={coverPhotoId}>
							<option value="">Auto (first photo)</option>
							{#each data.photos as photo}
								<option value={photo.id}>{photo.original_filename}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label class="form-checkbox">
							<input type="checkbox" name="isPublic" bind:checked={isPublic} />
							<span>Public album</span>
						</label>
					</div>

					<button type="submit" class="btn btn-primary save-btn" disabled={loading}>
						{loading ? 'Saving...' : 'Save Changes'}
					</button>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 1200px;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.header-left {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.page-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.375rem;
		color: var(--color-text-secondary);
		transition: all 0.15s ease;
		margin-top: 0.25rem;
	}

	.back-btn:hover {
		color: var(--color-text);
		background-color: var(--color-bg-secondary);
	}

	.view-link {
		font-size: 0.875rem;
		color: var(--color-primary);
	}

	.message {
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.error-message {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-error);
		color: var(--color-error);
	}

	.success-message {
		background-color: rgba(34, 197, 94, 0.1);
		border: 1px solid var(--color-success);
		color: var(--color-success);
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	@media (min-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr 320px;
		}
	}

	.section {
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.section h2 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.section-header h2 {
		margin-bottom: 0;
	}

	.upload-progress {
		background-color: var(--color-bg-tertiary);
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.empty-photos {
		text-align: center;
		padding: 3rem 2rem;
		color: var(--color-text-secondary);
	}

	.empty-photos svg {
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-photos p {
		margin-bottom: 1rem;
	}

	.photos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 1rem;
	}

	.photo-item {
		position: relative;
		border-radius: 0.5rem;
		overflow: hidden;
		background-color: var(--color-bg-tertiary);
	}

	.photo-item.is-cover {
		outline: 2px solid var(--color-primary);
	}

	.photo-item img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
	}

	.photo-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, transparent 40%, transparent 60%, rgba(0, 0, 0, 0.4) 100%);
		opacity: 0;
		transition: opacity 0.15s ease;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 0.5rem;
	}

	.photo-item:hover .photo-overlay {
		opacity: 1;
	}

	.photo-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
	}

	.photo-action-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 0.25rem;
		background-color: rgba(0, 0, 0, 0.5);
		border: none;
		color: white;
		cursor: pointer;
		transition: background-color 0.15s ease;
	}

	.photo-action-btn:hover {
		background-color: rgba(0, 0, 0, 0.7);
	}

	.photo-action-btn.delete:hover {
		background-color: var(--color-error);
	}

	.cover-badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.5rem;
		background-color: var(--color-primary);
		color: white;
		border-radius: 0.25rem;
		align-self: flex-start;
	}

	.photo-info {
		padding: 0.5rem;
		font-size: 0.75rem;
	}

	.photo-name {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--color-text);
	}

	.photo-size {
		color: var(--color-text-muted);
	}

	.sidebar .section {
		position: sticky;
		top: 2rem;
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.save-btn {
		width: 100%;
		margin-top: 0.5rem;
	}

	@media (max-width: 768px) {
		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.photos-grid {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		}
	}
</style>