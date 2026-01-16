import type { PageServerLoad } from './$types';
import { getFeaturedAlbum, getPhotosByAlbum } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	// Get the featured album to display on home page
	const featuredAlbum = getFeaturedAlbum();
	let featuredPhotos: any[] = [];

	if (featuredAlbum) {
		// Get photos for the featured album (limit to 20 for homepage)
		featuredPhotos = getPhotosByAlbum(featuredAlbum.id, undefined, 'newest').slice(0, 20);
	}

	return {
		featuredAlbum,
		featuredPhotos
	};
};
