<script lang="ts">
	interface Props {
		copyrightText: string;
	}

	let { copyrightText }: Props = $props();
</script>

<footer class="py-12 border-t border-[var(--color-border)] bg-[var(--color-cream)]">
	<div class="container">
		<div class="flex items-center justify-between flex-wrap gap-4">
			<p class="nav-text text-[var(--color-text-muted)]">
				{copyrightText}
			</p>
			<a
				href="/admin"
				class="nav-text text-[var(--color-text-muted)] hover:text-[var(--color-charcoal)] transition-colors duration-300"
				>Admin</a
			>
		</div>
	</div>
</footer>
