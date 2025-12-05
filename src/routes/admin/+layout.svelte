<script lang="ts">
	let { data, children } = $props();
	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

{#if data.isAuthenticated}
	<div class="flex min-h-screen">
		<!-- Mobile menu button -->
		<button
			class="fixed top-4 left-4 z-[60] p-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] lg:hidden"
			onclick={toggleMobileMenu}
			aria-label="Toggle menu"
		>
			{#if mobileMenuOpen}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
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
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="3" y1="12" x2="21" y2="12"></line>
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<line x1="3" y1="18" x2="21" y2="18"></line>
				</svg>
			{/if}
		</button>

		<!-- Overlay for mobile menu -->
		{#if mobileMenuOpen}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="fixed inset-0 bg-black/50 z-40 lg:hidden" onclick={closeMobileMenu}></div>
		{/if}

		<!-- Sidebar -->
		<aside
			class="w-64 bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl border-r border-[var(--color-border)] fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-300 {mobileMenuOpen
				? 'translate-x-0'
				: '-translate-x-full'} lg:translate-x-0"
		>
			<div class="p-5 border-b border-[var(--color-border)] flex items-center gap-3">
				<a href="/" class="text-lg font-bold">Gallery</a>
				<span
					class="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 bg-blue-500 text-white rounded"
					>Admin</span
				>
			</div>
			<nav class="flex-1 p-3 flex flex-col gap-1">
				<a
					href="/admin"
					class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
					onclick={closeMobileMenu}
				>
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
						<rect x="3" y="3" width="7" height="7"></rect>
						<rect x="14" y="3" width="7" height="7"></rect>
						<rect x="14" y="14" width="7" height="7"></rect>
						<rect x="3" y="14" width="7" height="7"></rect>
					</svg>
					Dashboard
				</a>
				<a
					href="/admin/albums/new"
					class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
					onclick={closeMobileMenu}
				>
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
				<a
					href="/admin/settings"
					class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
					onclick={closeMobileMenu}
				>
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
						<circle cx="12" cy="12" r="3"></circle>
						<path
							d="M12 1v6m0 6v6m5.196-14.196l-4.243 4.243m0 5.657l-4.242 4.242M23 12h-6m-6 0H1m14.196 5.196l-4.243-4.242m0-5.657L6.804 2.804"
						></path>
					</svg>
					Settings
				</a>
			</nav>
			<div class="p-4 border-t border-[var(--color-border)]">
				<form action="/admin/logout" method="POST">
					<button
						type="submit"
						class="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
					>
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
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
							<polyline points="16 17 21 12 16 7"></polyline>
							<line x1="21" y1="12" x2="9" y2="12"></line>
						</svg>
						Logout
					</button>
				</form>
			</div>
		</aside>
		<main
			class="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-full lg:max-w-[calc(100%-16rem)]"
		>
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
