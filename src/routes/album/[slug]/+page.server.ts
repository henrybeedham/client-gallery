import type { PageServerLoad, Actions } from './$types';
import { getAlbumBySlug, getPhotosByAlbum, getTagsByAlbum } from '$lib/server/db';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, cookies, url }) => {
	const album = getAlbumBySlug(params.slug);

	if (!album || !album.is_public) {
		throw error(404, 'Album not found');
	}

	// Check password protection
	if (album.password) {
		const sessionPassword = cookies.get(`album_${album.id}_auth`);
		if (sessionPassword !== album.password) {
			return {
				album,
				photos: [],
				tags: [],
				requiresPassword: true
			};
		}
	}

	const tagSlug = url.searchParams.get('tag') || undefined;
	const photos = getPhotosByAlbum(album.id, tagSlug);
	const tags = getTagsByAlbum(album.id);

	return {
		album,
		photos,
		tags,
		requiresPassword: false,
		selectedTag: tagSlug
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
