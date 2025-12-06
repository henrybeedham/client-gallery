import type { PageServerLoad } from './$types';
import { getAlbumBySlug, getPhotoById, getPhotosByAlbum } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const album = getAlbumBySlug(params.slug);
	if (!album) {
		throw error(404, 'Album not found');
	}

	// Check if album is public or has expired
	const now = new Date().toISOString();
	const isExpired = album.expires_at && album.expires_at < now;

	// If album requires password and not unlocked, require password
	if (album.password && !isExpired) {
		const unlocked = cookies.get(`album_${album.id}_unlocked`);
		if (!unlocked || unlocked !== album.password) {
			throw error(403, 'Album is password protected');
		}
	}

	const photoId = parseInt(params.photoId);
	if (isNaN(photoId)) {
		throw error(404, 'Invalid photo ID');
	}

	const photo = getPhotoById(photoId);
	if (!photo || photo.album_id !== album.id) {
		throw error(404, 'Photo not found');
	}

	// Get all photos in album for navigation
	const photos = getPhotosByAlbum(album.id, undefined, album.sort_order);
	const currentIndex = photos.findIndex((p) => p.id === photoId);
	const prevPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
	const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

	return {
		album,
		photo,
		currentIndex,
		totalPhotos: photos.length,
		prevPhoto,
		nextPhoto
	};
};
