<script lang="ts">
	import { enhance } from '$app/forms';
	import { slugify } from '$lib/utils';

	let { data, form } = $props();
	let title = $state('');
	let loading = $state(false);

	let slug = $derived(slugify(title));
</script>

<svelte:head>
	<title>New Album - Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<a href="/admin" class="back-btn" aria-label="Back to dashboard">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</a>
		<h1>New Album</h1>
	</div>

	{#if form?.error}
		<div class="error-message">{form.error}</div>
	{/if}

	<div class="form-card">
		<form
			method="POST"
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
				<label for="description" class="form-label">Description (optional)</label>
				<textarea
					id="description"
					name="description"
					class="form-textarea"
					rows="3"
				></textarea>
			</div>

			<div class="form-group">
				<label for="categoryId" class="form-label">Category (optional)</label>
				<select id="categoryId" name="categoryId" class="form-select">
					<option value="">No category</option>
					{#each data.categories as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>

			<div class="form-group">
				<label class="form-checkbox">
					<input type="checkbox" name="isPublic" checked />
					<span>Public album</span>
				</label>
				<p class="form-hint">Private albums are only visible to admins</p>
			</div>

			<div class="form-actions">
				<a href="/admin" class="btn btn-secondary">Cancel</a>
				<button type="submit" class="btn btn-primary" disabled={loading}>
					{loading ? 'Creating...' : 'Create Album'}
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.page {
		max-width: 600px;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
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
	}

	.back-btn:hover {
		color: var(--color-text);
		background-color: var(--color-bg-secondary);
	}

	.error-message {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-error);
		color: var(--color-error);
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
	}

	.form-card {
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 1.5rem;
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.form-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
	}
</style>