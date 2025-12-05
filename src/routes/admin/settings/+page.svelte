<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Settings - Admin</title>
</svelte:head>

<div class="max-w-4xl">
	<div class="mb-8">
		<h1 class="text-2xl font-bold mb-2">Default Album Settings</h1>
		<p class="text-sm text-gray-500">
			Set default values for new albums. These can be overridden when creating or editing
			individual albums.
		</p>
	</div>

	{#if form?.success}
		<div
			class="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg text-sm mb-6"
		>
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6"
		>
			{form.error}
		</div>
	{/if}

	<form method="POST" action="?/updateSettings" use:enhance>
		<div
			class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 space-y-6"
		>
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
						class="h-10 w-20 rounded border border-[var(--color-border)]"
						value={data.settings.defaultColor}
					/>
					<input
						type="text"
						class="form-input flex-1"
						placeholder="#3b82f6"
						value={data.settings.defaultColor}
						oninput={(e) => {
							const target = e.target as HTMLInputElement;
							const colorPicker = document.getElementById('defaultColor') as HTMLInputElement;
							if (colorPicker) colorPicker.value = target.value;
						}}
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
						class="w-4 h-4 rounded border-[var(--color-border)]"
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
						class="w-4 h-4 rounded border-[var(--color-border)]"
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
