<script lang="ts">
	import { X, Menu, LayoutGrid, Plus, Settings, LogOut } from 'lucide-svelte';

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
				<X size={24} />
			{:else}
				<Menu size={24} />
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
					<LayoutGrid size={18} />
					Dashboard
				</a>
				<a
					href="/admin/albums/new"
					class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
					onclick={closeMobileMenu}
				>
					<Plus size={18} />
					New Album
				</a>
				<a
					href="/admin/settings"
					class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
					onclick={closeMobileMenu}
				>
					<Settings size={18} />
					Settings
				</a>
			</nav>
			<div class="p-4 border-t border-[var(--color-border)]">
				<form action="/admin/logout" method="POST">
					<button
						type="submit"
						class="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
					>
						<LogOut size={18} />
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
