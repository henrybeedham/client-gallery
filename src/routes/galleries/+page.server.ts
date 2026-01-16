import type { PageServerLoad } from './$types';
import { getAlbumsForGalleries } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	// Get all public albums that should be shown on galleries page
	const albums = getAlbumsForGalleries();

	return {
		albums
	};
};
