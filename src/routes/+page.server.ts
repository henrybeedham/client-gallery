import type { PageServerLoad } from './$types';
import { getAlbums, getCategories, type Album, type Category } from '$lib/server/db';

export const load: PageServerLoad = async ({ url }) => {
	const categorySlug = url.searchParams.get('category');

	const categories = getCategories();
	let categoryId: number | null = null;

	if (categorySlug) {
		const category = categories.find((c) => c.slug === categorySlug);
		if (category) {
			categoryId = category.id;
		}
	}

	const albums = getAlbums(categoryId, true);

	return {
		albums,
		categories,
		selectedCategory: categorySlug
	};
};
