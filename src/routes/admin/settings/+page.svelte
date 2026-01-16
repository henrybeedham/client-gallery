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

<div class="max-w-5xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2" style="font-family: 'Playfair Display', serif;">Settings</h1>
		<p class="text-sm text-[var(--color-text-secondary)]">
			Configure your photography portfolio's appearance, content, and behavior.
		</p>
	</div>

	{#if form?.success}
		<div class="bg-green-500/10 border border-green-500 text-green-700 px-4 py-3 text-sm mb-6 animate-fade-in">
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="bg-red-500/10 border border-red-500 text-red-700 px-4 py-3 text-sm mb-6 animate-fade-in">
			{form.error}
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left column - Main settings -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Hero Image Section -->
			<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6">
				<h2 class="text-xl font-semibold mb-1" style="font-family: 'Playfair Display', serif;">Hero Image</h2>
				<p class="text-sm text-[var(--color-text-secondary)] mb-4">
					Background image for your homepage hero section. Recommended: 2400×1600px
				</p>

				{#if heroImagePreview || data.settings.heroImage}
					<div class="mb-4">
						<img
							src={heroImagePreview || (data.settings.heroImage ? `/api/hero/${data.settings.heroImage}` : '')}
							alt="Hero preview"
							class="w-full h-48 object-cover border border-[var(--color-border)]"
						/>
					</div>
				{/if}

				<form method="POST" action="?/uploadHeroImage" enctype="multipart/form-data" use:enhance>
					<div class="flex gap-3">
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
							<button type="submit" class="btn btn-primary"> Upload </button>
						{/if}
					</div>
				</form>
			</div>

			<!-- Site Branding -->
			<form method="POST" action="?/updateSettings" use:enhance>
				<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 space-y-5">
					<div>
						<h2 class="text-xl font-semibold mb-1" style="font-family: 'Playfair Display', serif;">Site Branding</h2>
						<p class="text-sm text-[var(--color-text-secondary)]">
							Identity and branding elements for your portfolio
						</p>
					</div>

					<div>
						<label for="siteTitle" class="block text-sm font-medium mb-2">
							Site Title
						</label>
						<input
							type="text"
							id="siteTitle"
							name="siteTitle"
							class="form-input"
							placeholder="Gallery"
							value={data.settings.siteTitle}
						/>
						<p class="text-xs text-[var(--color-text-muted)] mt-1">Appears in navigation and browser tabs</p>
					</div>

					<div>
						<label for="copyrightText" class="block text-sm font-medium mb-2">
							Copyright Text
						</label>
						<input
							type="text"
							id="copyrightText"
							name="copyrightText"
							class="form-input"
							placeholder="© 2024 Your Name. All rights reserved."
							value={data.settings.copyrightText}
						/>
						<p class="text-xs text-[var(--color-text-muted)] mt-1">Exactly as entered (no prefix added)</p>
					</div>

					<div class="flex justify-end pt-4 border-t border-[var(--color-border)]">
						<button type="submit" class="btn btn-primary"> Save Branding </button>
					</div>
				</div>
			</form>

			<!-- Homepage Content -->
			<form method="POST" action="?/updateSettings" use:enhance>
				<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 space-y-5">
					<div>
						<h2 class="text-xl font-semibold mb-1" style="font-family: 'Playfair Display', serif;">Homepage Content</h2>
						<p class="text-sm text-[var(--color-text-secondary)]">
							Customize the hero and about sections on your homepage
						</p>
					</div>

					<div>
						<label for="heroTitle" class="block text-sm font-medium mb-2">
							Hero Title
						</label>
						<textarea
							id="heroTitle"
							name="heroTitle"
							class="form-textarea"
							rows="2"
							placeholder="Visual Stories,&#10;Captured in Time"
							value={data.settings.heroTitle}
						></textarea>
						<p class="text-xs text-[var(--color-text-muted)] mt-1">Use \n for line breaks</p>
					</div>

					<div>
						<label for="heroDescription" class="block text-sm font-medium mb-2">
							Hero Description
						</label>
						<textarea
							id="heroDescription"
							name="heroDescription"
							class="form-textarea"
							rows="3"
							placeholder="Photography portfolio showcasing..."
							value={data.settings.heroDescription}
						></textarea>
					</div>

					<div>
						<label for="aboutTitle" class="block text-sm font-medium mb-2">
							About Section Title
						</label>
						<input
							type="text"
							id="aboutTitle"
							name="aboutTitle"
							class="form-input"
							placeholder="About"
							value={data.settings.aboutTitle}
						/>
					</div>

					<div>
						<label for="aboutText" class="block text-sm font-medium mb-2">
							About Section Text
						</label>
						<textarea
							id="aboutText"
							name="aboutText"
							class="form-textarea"
							rows="4"
							placeholder="Your bio and story..."
							value={data.settings.aboutText}
						></textarea>
					</div>

					<div class="flex justify-end pt-4 border-t border-[var(--color-border)]">
						<button type="submit" class="btn btn-primary"> Save Homepage </button>
					</div>
				</div>
			</form>

			<!-- Contact & Integration -->
			<form method="POST" action="?/updateSettings" use:enhance>
				<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 space-y-5">
					<div>
						<h2 class="text-xl font-semibold mb-1" style="font-family: 'Playfair Display', serif;">Contact & Integrations</h2>
						<p class="text-sm text-[var(--color-text-secondary)]">
							Contact information and external service integrations
						</p>
					</div>

					<div>
						<label for="contactEmail" class="block text-sm font-medium mb-2">
							Contact Email
						</label>
						<input
							type="email"
							id="contactEmail"
							name="contactEmail"
							class="form-input"
							placeholder="contact@example.com"
							value={data.settings.contactEmail}
						/>
						<p class="text-xs text-[var(--color-text-muted)] mt-1">Shown on expired galleries and optionally on homepage</p>
					</div>

					<div>
						<label for="contactPhone" class="block text-sm font-medium mb-2">
							Contact Phone
						</label>
						<input
							type="tel"
							id="contactPhone"
							name="contactPhone"
							class="form-input"
							placeholder="+1 234 567 8900"
							value={data.settings.contactPhone}
						/>
					</div>

					<div>
						<label for="discordWebhook" class="block text-sm font-medium mb-2">
							Discord Webhook URL
						</label>
						<input
							type="url"
							id="discordWebhook"
							name="discordWebhook"
							class="form-input"
							placeholder="https://discord.com/api/webhooks/..."
							value={data.settings.discordWebhook}
						/>
						<p class="text-xs text-[var(--color-text-muted)] mt-1">Receive download notifications in Discord</p>
					</div>

					<div>
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								name="showContactOnHome"
								class="w-4 h-4 border-[var(--color-border)]"
								checked={data.settings.showContactOnHome}
							/>
							<span class="text-sm">
								<span class="font-medium">Show contact on homepage</span>
								<span class="block text-xs text-[var(--color-text-muted)]">Display email and phone in About section</span>
							</span>
						</label>
					</div>

					<div class="flex justify-end pt-4 border-t border-[var(--color-border)]">
						<button type="submit" class="btn btn-primary"> Save Contact </button>
					</div>
				</div>
			</form>
		</div>

		<!-- Right column - Album defaults & appearance -->
		<div class="space-y-6">
			<!-- Appearance Settings -->
			<form method="POST" action="?/updateSettings" use:enhance>
				<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 space-y-5">
					<div>
						<h2 class="text-lg font-semibold mb-1" style="font-family: 'Playfair Display', serif;">Appearance</h2>
						<p class="text-sm text-[var(--color-text-secondary)]">
							Visual preferences
						</p>
					</div>

					<div>
						<label for="theme" class="block text-sm font-medium mb-2">
							Theme
						</label>
						<select id="theme" name="theme" class="form-select">
							<option value="light" selected={data.settings.theme === 'light'}>Light</option>
							<option value="dark" disabled>Dark (Coming Soon)</option>
						</select>
						<p class="text-xs text-[var(--color-text-muted)] mt-1">Dark theme coming in future update</p>
					</div>

					<div class="flex justify-end pt-4 border-t border-[var(--color-border)]">
						<button type="submit" class="btn btn-primary"> Save </button>
					</div>
				</div>
			</form>

			<!-- Album Defaults -->
			<form method="POST" action="?/updateSettings" use:enhance>
				<div class="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6 space-y-5">
					<div>
						<h2 class="text-lg font-semibold mb-1" style="font-family: 'Playfair Display', serif;">Album Defaults</h2>
						<p class="text-sm text-[var(--color-text-secondary)]">
							Default settings for new albums
						</p>
					</div>

					<div>
						<label for="defaultDescription" class="block text-sm font-medium mb-2">
							Default Description
						</label>
						<textarea
							id="defaultDescription"
							name="defaultDescription"
							class="form-textarea"
							rows="3"
							placeholder="Default description..."
							value={data.settings.defaultDescription}
						></textarea>
						<p class="text-xs text-[var(--color-text-muted)] mt-1">Supports Markdown</p>
					</div>

					<div>
						<label for="defaultColor" class="block text-sm font-medium mb-2">
							Primary Color
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
					</div>

					<div>
						<label for="defaultLayoutStyle" class="block text-sm font-medium mb-2">
							Layout Style
						</label>
						<select id="defaultLayoutStyle" name="defaultLayoutStyle" class="form-select">
							<option value="grid" selected={data.settings.defaultLayoutStyle === 'grid'}>Grid</option>
							<option value="masonry" selected={data.settings.defaultLayoutStyle === 'masonry'}>Masonry</option>
						</select>
					</div>

					<div>
						<label for="defaultSortOrder" class="block text-sm font-medium mb-2">
							Sort Order
						</label>
						<select id="defaultSortOrder" name="defaultSortOrder" class="form-select">
							<option value="oldest" selected={data.settings.defaultSortOrder === 'oldest'}>Oldest first</option>
							<option value="newest" selected={data.settings.defaultSortOrder === 'newest'}>Newest first</option>
							<option value="random" selected={data.settings.defaultSortOrder === 'random'}>Random</option>
						</select>
					</div>

					<div class="space-y-3">
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								name="defaultIsPublic"
								class="w-4 h-4 border-[var(--color-border)]"
								checked={data.settings.defaultIsPublic}
							/>
							<span class="text-sm font-medium">Public by default</span>
						</label>

						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								name="defaultShowOnHome"
								class="w-4 h-4 border-[var(--color-border)]"
								checked={data.settings.defaultShowOnHome}
							/>
							<span class="text-sm font-medium">Show on homepage</span>
						</label>
					</div>

					<div class="flex justify-end pt-4 border-t border-[var(--color-border)]">
						<button type="submit" class="btn btn-primary"> Save Defaults </button>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>
