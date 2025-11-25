import type { PageServerLoad } from './$types';
import { getAlbums } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	// Get only public albums that should be shown on home
	const albums = getAlbums(true, true);

	return {
		albums
	};
};
