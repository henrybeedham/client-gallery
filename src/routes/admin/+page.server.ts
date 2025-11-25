import type { PageServerLoad, Actions } from './$types';
import { getAlbums, getCategories, deleteAlbum, getPhotosByAlbum } from '$lib/server/db';
import { deleteImageFiles } from '$lib/server/storage';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const albums = getAlbums(null, false);
	const categories = getCategories();

	return {
		albums,
		categories
	};
};

export const actions: Actions = {
	deleteAlbum: async ({ request }) => {
		const data = await request.formData();
		const albumId = parseInt(data.get('albumId')?.toString() || '');

		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		try {
			// Delete all photos first
			const photos = getPhotosByAlbum(albumId);
			for (const photo of photos) {
				await deleteImageFiles(photo.filename);
			}

			deleteAlbum(albumId);
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to delete album' });
		}
	}
};
