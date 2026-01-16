<script lang="ts">
	import { enhance } from '$app/forms';
	import { Upload } from 'lucide-svelte';

	let { data, form } = $props();
	let colorValue = $state(data.settings.defaultColor);
	let selectedHeroFile: File | null = $state(null);
	let heroImagePreview: string | null = $state(null);

	function handleHeroFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			selectedHeroFile = file;
			heroImagePreview = URL.createObjectURL(file);
		}
	}
</script>

<svelte:head>
	<title>Settings - Admin</title>
</svelte:head>

<div class="max-w-4xl">
	<div class="mb-8">
		<h1 class="text-2xl font-bold mb-2">Settings</h1>
		<p class="text-sm text-gray-500">
			Configure default album settings and homepage hero image.
		</p>
	</div>

	{#if form?.success}
		<div class="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 text-sm mb-6">
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 text-sm mb-6">
			{form.error}
		</div>
	{/if}

	<!-- Hero Image Upload Section -->
	<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 mb-6">
		<h2 class="text-lg font-semibold mb-4">Homepage Hero Image</h2>
		<p class="text-sm text-gray-500 mb-4">
			Upload a background image for the homepage hero section. Recommended size: 2400x1600px.
		</p>

		{#if data.settings.heroImage || heroImagePreview}
			<div class="mb-4">
				<img
					src={heroImagePreview || `/uploads/hero/${data.settings.heroImage}`}
					alt="Hero preview"
					class="w-full max-w-md h-48 object-cover border border-[var(--color-border)]"
				/>
			</div>
		{/if}

		<form method="POST" action="?/uploadHeroImage" enctype="multipart/form-data" use:enhance>
			<div class="flex gap-4">
				<label class="flex-1 cursor-pointer">
					<div
						class="flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
					>
						<Upload size={18} />
						<span class="text-sm">{selectedHeroFile ? selectedHeroFile.name : 'Choose Image'}</span>
					</div>
					<input
						type="file"
						name="heroImage"
						accept="image/*"
						class="hidden"
						on:change={handleHeroFileSelect}
					/>
				</label>
				{#if selectedHeroFile}
					<button type="submit" class="btn btn-primary"> Upload Hero Image </button>
				{/if}
			</div>
		</form>
	</div>

	<!-- Default Album Settings -->
	<form method="POST" action="?/updateSettings" use:enhance>
		<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 space-y-6">
			<h2 class="text-lg font-semibold">Default Album Settings</h2>
			<p class="text-sm text-gray-500 -mt-4">
				Set default values for new albums. These can be overridden when creating or editing
				individual albums.
			</p>
			<!-- Default Description -->
			<div>
				<label for="defaultDescription" class="block text-sm font-medium mb-2">
					Default Description
				</label>
				<textarea
					id="defaultDescription"
					name="defaultDescription"
					class="form-textarea"
					rows="3"
					placeholder="Enter default description for new albums (optional)"
					value={data.settings.defaultDescription}
				></textarea>
				<p class="text-xs text-gray-500 mt-1">Supports Markdown formatting</p>
			</div>

			<!-- Default Color -->
			<div>
				<label for="defaultColor" class="block text-sm font-medium mb-2">
					Default Primary Color
				</label>
				<div class="flex gap-2">
					<input
						type="color"
						id="defaultColor"
						name="defaultColor"
						class="h-10 w-20 border border-[var(--color-border)]"
						bind:value={colorValue}
					/>
					<input
						type="text"
						class="form-input flex-1"
						placeholder="#3b82f6"
						bind:value={colorValue}
					/>
				</div>
				<p class="text-xs text-gray-500 mt-1">Used for buttons and accents</p>
			</div>

			<!-- Default Layout Style -->
			<div>
				<label for="defaultLayoutStyle" class="block text-sm font-medium mb-2">
					Default Layout Style
				</label>
				<select id="defaultLayoutStyle" name="defaultLayoutStyle" class="form-select">
					<option value="grid" selected={data.settings.defaultLayoutStyle === 'grid'}
						>Grid (Equal squares)</option
					>
					<option value="masonry" selected={data.settings.defaultLayoutStyle === 'masonry'}
						>Masonry (Pinterest-style)</option
					>
				</select>
			</div>

			<!-- Default Sort Order -->
			<div>
				<label for="defaultSortOrder" class="block text-sm font-medium mb-2">
					Default Sort Order
				</label>
				<select id="defaultSortOrder" name="defaultSortOrder" class="form-select">
					<option value="oldest" selected={data.settings.defaultSortOrder === 'oldest'}
						>Oldest first</option
					>
					<option value="newest" selected={data.settings.defaultSortOrder === 'newest'}
						>Newest first</option
					>
					<option value="random" selected={data.settings.defaultSortOrder === 'random'}
						>Random order</option
					>
				</select>
			</div>

			<!-- Default Visibility -->
			<div class="space-y-3">
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						name="defaultIsPublic"
						class="w-4 h-4 border-[var(--color-border)]"
						checked={data.settings.defaultIsPublic}
					/>
					<span class="text-sm">
						<span class="font-medium">Public by default</span>
						<span class="block text-xs text-gray-500">Make new albums publicly accessible</span>
					</span>
				</label>

				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						name="defaultShowOnHome"
						class="w-4 h-4 border-[var(--color-border)]"
						checked={data.settings.defaultShowOnHome}
					/>
					<span class="text-sm">
						<span class="font-medium">Show on homepage by default</span>
						<span class="block text-xs text-gray-500">Display new albums on the homepage</span>
					</span>
				</label>
			</div>

			<!-- Submit Button -->
			<div class="flex justify-end pt-4 border-t border-[var(--color-border)]">
				<button type="submit" class="btn btn-primary"> Save Settings </button>
			</div>
		</div>
	</form>
</div>
