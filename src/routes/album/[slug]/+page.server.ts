import type { PageServerLoad, Actions } from './$types';
import { getAlbumBySlug, getPhotosByAlbum, getTagsByAlbum, recordAnalyticsEvent } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params, cookies, url }) => {
	const album = getAlbumBySlug(params.slug);

	if (!album || !album.is_public) {
		throw error(404, 'Album not found');
	}

	// Check if album has expired
	const isExpired = album.expires_at ? new Date(album.expires_at) < new Date() : false;
	const expiresIn = album.expires_at
		? Math.max(0, new Date(album.expires_at).getTime() - Date.now())
		: null;

	// Get contact details from environment variables
	const contactEmail = env.GALLERY_CONTACT_EMAIL || null;
	const contactPhone = env.GALLERY_CONTACT_PHONE || null;

	if (isExpired) {
		return {
			album,
			photos: [],
			tags: [],
			requiresPassword: false,
			isExpired: true,
			expiresIn: null,
			selectedTag: undefined,
			selectedSort: album.sort_order || 'newest',
			contactEmail,
			contactPhone,
			allPhotoIds: []
		};
	}

	// Check password protection
	if (album.password) {
		const sessionPassword = cookies.get(`album_${album.id}_auth`);
		if (sessionPassword !== album.password) {
			return {
				album,
				photos: [],
				tags: [],
				requiresPassword: true,
				isExpired: false,
				expiresIn,
				selectedSort: album.sort_order || 'newest',
				contactEmail,
				contactPhone,
				allPhotoIds: []
			};
		}
	}

	// Record page view
	recordAnalyticsEvent(album.id, 'page_view');

	const tagSlug = url.searchParams.get('tag') || undefined;
	// Allow user to override sort order via query parameter, otherwise use album default
	const sortParam = url.searchParams.get('sort');
	const validSorts = ['newest', 'oldest', 'random'];
	const sortOrder = sortParam && validSorts.includes(sortParam) ? sortParam : (album.sort_order || 'newest');
	const photos = getPhotosByAlbum(album.id, tagSlug, sortOrder as 'newest' | 'oldest' | 'random');
	const tags = getTagsByAlbum(album.id);
	
	// Get all photo IDs for select all functionality
	const allPhotoIds = photos.map(p => p.id);

	return {
		album,
		photos,
		tags,
		requiresPassword: false,
		isExpired: false,
		expiresIn,
		selectedTag: tagSlug,
		selectedSort: sortOrder,
		contactEmail,
		contactPhone,
		allPhotoIds
	};
};

export const actions: Actions = {
	unlock: async ({ request, params, cookies }) => {
		const album = getAlbumBySlug(params.slug);
		if (!album) {
			return fail(404, { error: 'Album not found' });
		}

		const data = await request.formData();
		const password = data.get('password')?.toString() || '';

		if (album.password && password === album.password) {
			cookies.set(`album_${album.id}_auth`, password, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7 // 7 days
			});
			return { success: true };
		}

		return fail(401, { error: 'Incorrect password' });
	}
};
