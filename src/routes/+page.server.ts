import type { PageServerLoad } from './$types';
import {
	getFeaturedAlbum,
	getPhotosByAlbum,
	getAlbumsForShowOnHome,
	getSettings
} from '$lib/server/db';

export const load: PageServerLoad = async () => {
	// Get the featured album to display on home page
	const featuredAlbum = getFeaturedAlbum();
	let featuredPhotos: any[] = [];

	if (featuredAlbum) {
		// Get photos for the featured album (limit to 20 for homepage)
		featuredPhotos = getPhotosByAlbum(featuredAlbum.id, undefined, 'newest');
	}

	// Get albums to show in the "Explore More" section (show_on_home = 1, featured_on_home = 0)
	const showOnHomeAlbums = getAlbumsForShowOnHome();

	// Get all settings for homepage content
	const settings = getSettings();

	return {
		featuredAlbum,
		featuredPhotos,
		showOnHomeAlbums,
		settings
	};
};
