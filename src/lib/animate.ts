// src/lib/actions/animate.ts
import { browser } from '$app/environment';

export function animateIn(node: HTMLElement) {
	// OPTIONAL: Check if we are restoring scroll position.
	// If we are returning from a photo detail page, we might want to skip the animation
	// so the user finds their place instantly.
	const isRestoring = browser && sessionStorage.getItem('homeScrollToPhoto');

	if (isRestoring) {
		node.classList.add('visible');
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					node.classList.add('visible');
					// Stop observing once visible so it doesn't fade out again
					observer.unobserve(node);
				}
			});
		},
		{
			threshold: 0.1,
			rootMargin: '0px 0px 100px 0px' // Triggers slightly before element leaves bottom of screen
		}
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
