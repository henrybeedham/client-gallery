import type { PageServerLoad, Actions } from './$types';
import { getCategories, createAlbum } from '$lib/server/db';
import { slugify } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const categories = getCategories();
	return { categories };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString() || '';
		const description = data.get('description')?.toString() || '';
		const categoryId = data.get('categoryId')?.toString() || '';
		const isPublic = data.get('isPublic') === 'on';

		if (!title.trim()) {
			return fail(400, { error: 'Title is required' });
		}

		const slug = slugify(title);
		if (!slug) {
			return fail(400, { error: 'Invalid title' });
		}

		try {
			const albumId = createAlbum(
				title.trim(),
				slug,
				description.trim() || null,
				categoryId ? parseInt(categoryId) : null,
				isPublic
			);
			throw redirect(303, `/admin/albums/${albumId}`);
		} catch (e) {
			if (e instanceof Response) throw e;
			return fail(500, { error: 'Failed to create album. Slug may already exist.' });
		}
	}
};
