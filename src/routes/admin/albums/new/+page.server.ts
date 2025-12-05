import type { PageServerLoad, Actions } from './$types';
import { createAlbum, getAlbumBySlug, getSettings } from '$lib/server/db';
import { slugify } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const settings = getSettings();
	return { settings };
};

export const actions: Actions = {
	default: async ({ request }) => {
		// Load settings to get defaults
		const settings = getSettings();

		const data = await request.formData();
		const title = data.get('title')?.toString() || '';
		const slugInput = data.get('slug')?.toString() || '';
		const description = data.get('description')?.toString() || settings.defaultDescription;
		const isPublic = data.has('isPublic') ? data.get('isPublic') === 'on' : settings.defaultIsPublic;
		const showOnHome = data.has('showOnHome')
			? data.get('showOnHome') === 'on'
			: settings.defaultShowOnHome;
		const password = data.get('password')?.toString() || '';
		const sortOrder =
			(data.get('sortOrder')?.toString() as 'newest' | 'oldest' | 'random') ||
			settings.defaultSortOrder;
		const layoutStyleInput = data.get('layoutStyle')?.toString() || settings.defaultLayoutStyle;
		const layoutStyle = (layoutStyleInput === 'masonry' ? 'masonry' : 'grid') as 'grid' | 'masonry';
		const albumDate = data.get('albumDate')?.toString() || null;
		const expiresAt = data.get('expiresAt')?.toString() || null;
		const primaryColor = data.get('primaryColor')?.toString() || settings.defaultColor;

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
				primaryColor,
				layoutStyle
			);
			redirect(303, `/admin/albums/${albumId}`);
		} catch (e) {
			if (e && typeof e === 'object' && 'status' in e) throw e;
			return fail(500, { error: 'Failed to create album', title, description, slug: slugInput });
		}
	}
};
