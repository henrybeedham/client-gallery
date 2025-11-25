import type { PageServerLoad, Actions } from './$types';
import { getAlbums, deleteAlbum, getStats, getAlbumById } from '$lib/server/db';
import { deleteAlbumDirectory } from '$lib/server/storage';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const albums = getAlbums(false, false);
	const stats = getStats();

	return {
		albums,
		stats
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
			const album = getAlbumById(albumId);
			if (album) {
				// Delete album directory with all photos
				await deleteAlbumDirectory(album.slug);
			}

			deleteAlbum(albumId);
			return { success: true };
		} catch (e) {
			return fail(500, {
				error: 'Failed to delete album',
				details: e instanceof Error ? e.message : String(e)
			});
		}
	}
};
