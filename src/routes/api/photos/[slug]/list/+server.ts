import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAlbumBySlug, getPhotosByAlbum } from '$lib/server/db';

const PHOTOS_PER_PAGE = 24;

export const GET: RequestHandler = async ({ params, url, cookies }) => {
	const album = getAlbumBySlug(params.slug);
	
	if (!album || !album.is_public) {
		throw error(404, 'Album not found');
	}

	// Check if album has expired
	const isExpired = album.expires_at ? new Date(album.expires_at) < new Date() : false;
	if (isExpired) {
		throw error(403, 'Album has expired');
	}

	// Check password protection
	if (album.password) {
		const sessionPassword = cookies.get(`album_${album.id}_auth`);
		if (sessionPassword !== album.password) {
			throw error(401, 'Password required');
		}
	}

	const tagSlug = url.searchParams.get('tag') || undefined;
	const sortParam = url.searchParams.get('sort');
	const validSorts = ['newest', 'oldest', 'random'];
	const sortOrder = sortParam && validSorts.includes(sortParam) ? sortParam : (album.sort_order || 'newest');
	
	const offset = parseInt(url.searchParams.get('offset') || '0', 10);
	const limit = parseInt(url.searchParams.get('limit') || String(PHOTOS_PER_PAGE), 10);

	// Get all photos with the current sorting
	const allPhotos = getPhotosByAlbum(album.id, tagSlug, sortOrder as 'newest' | 'oldest' | 'random');
	
	// Slice for pagination
	const photos = allPhotos.slice(offset, offset + limit);
	const hasMore = offset + limit < allPhotos.length;
	const totalCount = allPhotos.length;

	return json({
		photos,
		hasMore,
		totalCount,
		nextOffset: hasMore ? offset + limit : null
	});
};
