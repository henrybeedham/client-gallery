import type { PageServerLoad, Actions } from './$types';
import { createAlbum, getAlbumBySlug } from '$lib/server/db';
import { slugify } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString() || '';
		const slugInput = data.get('slug')?.toString() || '';
		const description = data.get('description')?.toString() || '';
		const isPublic = data.get('isPublic') === 'on';
		const showOnHome = data.get('showOnHome') === 'on';
		const password = data.get('password')?.toString() || '';
		const sortOrder = (data.get('sortOrder')?.toString() || 'oldest') as
			| 'newest'
			| 'oldest'
			| 'random';
		const albumDate = data.get('albumDate')?.toString() || null;
		const expiresAt = data.get('expiresAt')?.toString() || null;
		const primaryColor = data.get('primaryColor')?.toString() || '#3b82f6';

		if (!title.trim()) {
			return fail(400, { error: 'Title is required', title, description, slug: slugInput });
		}

		const slug = slugInput.trim() || slugify(title);
		if (!slug) {
			return fail(400, { error: 'Invalid title/slug', title, description, slug: slugInput });
		}

		// Check if slug already exists
		const existing = getAlbumBySlug(slug);
		if (existing) {
			return fail(400, {
				error: 'An album with this slug already exists',
				title,
				description,
				slug: slugInput
			});
		}

		try {
			const albumId = createAlbum(
				title.trim(),
				slug,
				description.trim() || null,
				isPublic,
				showOnHome,
				password || null,
				sortOrder,
				albumDate,
				expiresAt,
				primaryColor
			);
			redirect(303, `/admin/albums/${albumId}`);
		} catch (e) {
			if (e && typeof e === 'object' && 'status' in e) throw e;
			return fail(500, { error: 'Failed to create album', title, description, slug: slugInput });
		}
	}
};
