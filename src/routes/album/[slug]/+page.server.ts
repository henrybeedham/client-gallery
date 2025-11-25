import type { PageServerLoad } from './$types';
import { getAlbumBySlug, getPhotosByAlbum } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const album = getAlbumBySlug(params.slug);

	if (!album || !album.is_public) {
		throw error(404, 'Album not found');
	}

	const photos = getPhotosByAlbum(album.id);

	return {
		album,
		photos
	};
};
