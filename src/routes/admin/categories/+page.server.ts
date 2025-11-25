import type { PageServerLoad, Actions } from './$types';
import { getCategories, createCategory, updateCategory, deleteCategory } from '$lib/server/db';
import { slugify } from '$lib/utils';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const categories = getCategories();
	return { categories };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString() || '';

		if (!name.trim()) {
			return fail(400, { error: 'Name is required' });
		}

		const slug = slugify(name);
		if (!slug) {
			return fail(400, { error: 'Invalid name' });
		}

		try {
			createCategory(name.trim(), slug);
			return { success: true };
		} catch {
			return fail(500, { error: 'Category already exists or creation failed' });
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id')?.toString() || '');
		const name = data.get('name')?.toString() || '';

		if (isNaN(id) || !name.trim()) {
			return fail(400, { error: 'Invalid data' });
		}

		const slug = slugify(name);
		if (!slug) {
			return fail(400, { error: 'Invalid name' });
		}

		try {
			updateCategory(id, name.trim(), slug);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to update category' });
		}
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = parseInt(data.get('id')?.toString() || '');

		if (isNaN(id)) {
			return fail(400, { error: 'Invalid category ID' });
		}

		try {
			deleteCategory(id);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to delete category' });
		}
	}
};
