<script lang="ts">
	import { enhance } from '$app/forms';
	import { slugify } from '$lib/utils';

	let { form } = $props();
	let title = $state(form?.title || '');
	let customSlug = $state(form?.slug || '');
	let loading = $state(false);

	let autoSlug = $derived(slugify(title));
	let displaySlug = $derived(customSlug || autoSlug);
</script>

<svelte:head>
	<title>New Album - Admin</title>
</svelte:head>

<div class="max-w-2xl">
	<div class="flex items-center gap-3 mb-8">
		<a
			href="/admin"
			class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
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
		<h1 class="text-2xl font-bold">New Album</h1>
	</div>

	{#if form?.error}
		<div class="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
			{form.error}
		</div>
	{/if}

	<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
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
			<div class="space-y-5">
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
					<label for="slug" class="block text-sm font-medium mb-1.5">
						URL Slug
						<span class="text-gray-500 font-normal">(optional - auto-generated from title)</span>
					</label>
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
					{#if displaySlug}
						<p class="text-xs text-gray-500 mt-1">Full URL: /album/{displaySlug}</p>
					{/if}
				</div>

				<div>
					<label for="description" class="block text-sm font-medium mb-1.5">
						Description
						<span class="text-gray-500 font-normal">(supports markdown)</span>
					</label>
					<textarea
						id="description"
						name="description"
						class="form-textarea"
						rows="4"
						placeholder="Enter album description... You can use **bold**, *italic*, and other markdown formatting."
						>{form?.description || ''}</textarea
					>
				</div>

				<div>
					<label for="layout" class="block text-sm font-medium mb-1.5">Gallery Layout</label>
					<select id="layout" name="layout" class="form-select">
						<option value="grid">Grid</option>
						<option value="masonry">Masonry</option>
					</select>
				</div>

				<div class="flex flex-col gap-3">
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" name="isPublic" checked class="w-4 h-4 accent-blue-500" />
						<span class="text-sm">Public album</span>
					</label>
					<p class="text-xs text-gray-500 ml-6">Private albums are only visible to admins</p>
				</div>

				<div class="flex flex-col gap-3">
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" name="showOnHome" checked class="w-4 h-4 accent-blue-500" />
						<span class="text-sm">Show on homepage</span>
					</label>
					<p class="text-xs text-gray-500 ml-6">
						Hidden albums can still be accessed via direct link
					</p>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium mb-1.5">
						Password Protection
						<span class="text-gray-500 font-normal">(optional)</span>
					</label>
					<input
						type="text"
						id="password"
						name="password"
						class="form-input"
						placeholder="Leave empty for no password"
					/>
					<p class="text-xs text-gray-500 mt-1">
						Visitors will need to enter this password to view the album
					</p>
				</div>
			</div>

			<div class="flex gap-3 justify-end mt-8 pt-6 border-t border-[var(--color-border)]">
				<a href="/admin" class="btn btn-secondary">Cancel</a>
				<button type="submit" class="btn btn-primary" disabled={loading}>
					{loading ? 'Creating...' : 'Create Album'}
				</button>
			</div>
		</form>
	</div>
</div>
