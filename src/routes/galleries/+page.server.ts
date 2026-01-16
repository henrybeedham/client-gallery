import type { PageServerLoad } from './$types';
import { getAlbums } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	// Get all public albums that should be shown on home (these will be the galleries)
	const albums = getAlbums(true, true);

	return {
		albums
	};
};
