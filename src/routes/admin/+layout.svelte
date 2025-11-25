<script lang="ts">
	let { data, children } = $props();
</script>

{#if data.isAuthenticated}
	<div class="admin-layout">
		<aside class="sidebar">
			<div class="sidebar-header">
				<a href="/" class="logo">Gallery</a>
				<span class="badge">Admin</span>
			</div>
			<nav class="sidebar-nav">
				<a href="/admin" class="nav-item">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="7" height="7"></rect>
						<rect x="14" y="3" width="7" height="7"></rect>
						<rect x="14" y="14" width="7" height="7"></rect>
						<rect x="3" y="14" width="7" height="7"></rect>
					</svg>
					Dashboard
				</a>
				<a href="/admin/albums/new" class="nav-item">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					New Album
				</a>
				<a href="/admin/categories" class="nav-item">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="8" y1="6" x2="21" y2="6"></line>
						<line x1="8" y1="12" x2="21" y2="12"></line>
						<line x1="8" y1="18" x2="21" y2="18"></line>
						<line x1="3" y1="6" x2="3.01" y2="6"></line>
						<line x1="3" y1="12" x2="3.01" y2="12"></line>
						<line x1="3" y1="18" x2="3.01" y2="18"></line>
					</svg>
					Categories
				</a>
			</nav>
			<div class="sidebar-footer">
				<form action="/admin/logout" method="POST">
					<button type="submit" class="logout-btn">
						<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
							<polyline points="16 17 21 12 16 7"></polyline>
							<line x1="21" y1="12" x2="9" y2="12"></line>
						</svg>
						Logout
					</button>
				</form>
			</div>
		</aside>
		<main class="admin-main">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.admin-layout {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: 250px;
		background-color: var(--color-bg-secondary);
		border-right: 1px solid var(--color-border);
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: 50;
	}

	.sidebar-header {
		padding: 1.25rem;
		border-bottom: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo {
		font-size: 1.125rem;
		font-weight: 700;
	}

	.badge {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.25rem 0.5rem;
		background-color: var(--color-primary);
		color: white;
		border-radius: 0.25rem;
	}

	.sidebar-nav {
		flex: 1;
		padding: 1rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		transition: all 0.15s ease;
	}

	.nav-item:hover {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text);
	}

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--color-border);
	}

	.logout-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		background: none;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.logout-btn:hover {
		background-color: var(--color-bg-tertiary);
		color: var(--color-error);
	}

	.admin-main {
		flex: 1;
		margin-left: 250px;
		padding: 2rem;
		max-width: calc(100% - 250px);
	}

	@media (max-width: 768px) {
		.sidebar {
			width: 100%;
			height: auto;
			position: relative;
			border-right: none;
			border-bottom: 1px solid var(--color-border);
		}

		.sidebar-nav {
			flex-direction: row;
			overflow-x: auto;
			padding: 0.75rem;
			gap: 0.5rem;
		}

		.nav-item {
			white-space: nowrap;
			padding: 0.625rem 0.875rem;
		}

		.sidebar-footer {
			display: none;
		}

		.admin-main {
			margin-left: 0;
			max-width: 100%;
			padding: 1.5rem 1rem;
		}

		.admin-layout {
			flex-direction: column;
		}
	}
</style>