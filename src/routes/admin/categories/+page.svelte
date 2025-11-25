<script lang="ts">
	import { enhance } from '$app/forms';
	import { slugify } from '$lib/utils';

	let { data, form } = $props();

	let newName = $state('');
	let editingId: number | null = $state(null);
	let editingName = $state('');
	let deleteConfirm: number | null = $state(null);

	let newSlug = $derived(slugify(newName));

	function startEdit(category: { id: number; name: string }) {
		editingId = category.id;
		editingName = category.name;
	}

	function cancelEdit() {
		editingId = null;
		editingName = '';
	}
</script>

<svelte:head>
	<title>Categories - Admin</title>
</svelte:head>

<div class="page">
	<div class="page-header">
		<a href="/admin" class="back-btn" aria-label="Back to dashboard">
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6"></polyline>
			</svg>
		</a>
		<h1>Categories</h1>
	</div>

	{#if form?.error}
		<div class="error-message">{form.error}</div>
	{/if}

	<div class="content-grid">
		<div class="main-content">
			<div class="section">
				<h2>All Categories</h2>

				{#if data.categories.length === 0}
					<div class="empty-state">
						<p>No categories yet. Create one to get started.</p>
					</div>
				{:else}
					<div class="categories-list">
						{#each data.categories as category}
							<div class="category-item">
								{#if editingId === category.id}
									<form
										method="POST"
										action="?/update"
										class="edit-form"
										use:enhance={() => {
											return async ({ update }) => {
												editingId = null;
												await update();
											};
										}}
									>
										<input type="hidden" name="id" value={category.id} />
										<input
											type="text"
											name="name"
											class="form-input"
											bind:value={editingName}
											required
										/>
										<button type="submit" class="btn btn-primary btn-icon" aria-label="Save">
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<polyline points="20 6 9 17 4 12"></polyline>
											</svg>
										</button>
										<button type="button" class="btn btn-secondary btn-icon" onclick={cancelEdit} aria-label="Cancel">
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<line x1="18" y1="6" x2="6" y2="18"></line>
												<line x1="6" y1="6" x2="18" y2="18"></line>
											</svg>
										</button>
									</form>
								{:else}
									<div class="category-info">
										<span class="category-name">{category.name}</span>
										<span class="category-slug">/{category.slug}</span>
									</div>
									<div class="category-actions">
										<button class="btn btn-secondary btn-icon" onclick={() => startEdit(category)} aria-label="Edit category">
											<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
												<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
											</svg>
										</button>
										{#if deleteConfirm === category.id}
											<form
												method="POST"
												action="?/delete"
												use:enhance={() => {
													return async ({ update }) => {
														deleteConfirm = null;
														await update();
													};
												}}
											>
												<input type="hidden" name="id" value={category.id} />
												<button type="submit" class="btn btn-danger btn-icon" aria-label="Confirm delete">
													<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
														<polyline points="20 6 9 17 4 12"></polyline>
													</svg>
												</button>
											</form>
											<button class="btn btn-secondary btn-icon" onclick={() => deleteConfirm = null} aria-label="Cancel delete">
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<line x1="18" y1="6" x2="6" y2="18"></line>
													<line x1="6" y1="6" x2="18" y2="18"></line>
												</svg>
											</button>
										{:else}
											<button class="btn btn-secondary btn-icon" onclick={() => deleteConfirm = category.id} aria-label="Delete category">
												<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
													<polyline points="3 6 5 6 21 6"></polyline>
													<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
												</svg>
											</button>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="sidebar">
			<div class="section">
				<h2>New Category</h2>
				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						return async ({ update }) => {
							newName = '';
							await update();
						};
					}}
				>
					<div class="form-group">
						<label for="name" class="form-label">Name</label>
						<input
							type="text"
							id="name"
							name="name"
							class="form-input"
							bind:value={newName}
							required
						/>
						{#if newSlug}
							<p class="form-hint">Slug: {newSlug}</p>
						{/if}
					</div>
					<button type="submit" class="btn btn-primary create-btn">
						Create Category
					</button>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	.page {
		max-width: 900px;
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

	.content-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	@media (min-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr 280px;
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

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--color-text-secondary);
	}

	.categories-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.category-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background-color: var(--color-bg-tertiary);
		border-radius: 0.5rem;
	}

	.category-info {
		display: flex;
		flex-direction: column;
	}

	.category-name {
		font-weight: 500;
	}

	.category-slug {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.category-actions {
		display: flex;
		gap: 0.5rem;
	}

	.edit-form {
		display: flex;
		gap: 0.5rem;
		flex: 1;
	}

	.edit-form .form-input {
		flex: 1;
	}

	.form-hint {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-top: 0.25rem;
	}

	.create-btn {
		width: 100%;
		margin-top: 0.5rem;
	}

	.sidebar .section {
		position: sticky;
		top: 2rem;
	}
</style>