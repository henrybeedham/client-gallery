import type { PageServerLoad } from './$types';
import { getAlbumsForGalleries, getSettings } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	// Get all public albums that should be shown on galleries page
	const albums = getAlbumsForGalleries();
	const settings = getSettings();

	return {
		albums,
		settings
	};
};
