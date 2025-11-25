<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Admin Login - Gallery</title>
</svelte:head>

<div class="login-page">
	<div class="login-card">
		<div class="login-header">
			<h1>Admin Login</h1>
			<p>Sign in to manage your gallery</p>
		</div>

		{#if form?.error}
			<div class="error-message">
				{form.error}
			</div>
		{/if}

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
				<label for="username" class="form-label">Username</label>
				<input
					type="text"
					id="username"
					name="username"
					class="form-input"
					required
					autocomplete="username"
				/>
			</div>

			<div class="form-group">
				<label for="password" class="form-label">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					class="form-input"
					required
					autocomplete="current-password"
				/>
			</div>

			<button type="submit" class="btn btn-primary login-btn" disabled={loading}>
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>

		<div class="back-link">
			<a href="/">← Back to Gallery</a>
		</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.login-card {
		width: 100%;
		max-width: 400px;
		background-color: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 2rem;
	}

	.login-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.login-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.login-header p {
		color: var(--color-text-secondary);
		font-size: 0.875rem;
	}

	.error-message {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-error);
		color: var(--color-error);
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.login-btn {
		width: 100%;
		margin-top: 0.5rem;
	}

	.back-link {
		text-align: center;
		margin-top: 1.5rem;
	}

	.back-link a {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		transition: color 0.15s ease;
	}

	.back-link a:hover {
		color: var(--color-text);
	}
</style>
