import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getProdigiClient, PHOTO_PRINT_SKUS } from '$lib/server/prodigi';

export const GET: RequestHandler = async () => {
	const prodigi = getProdigiClient();

	if (!prodigi.isConfigured()) {
		throw error(503, 'Print service is not configured');
	}

	// Return the predefined photo print SKUs with descriptions
	const products = Object.entries(PHOTO_PRINT_SKUS).map(([size, sku]) => ({
		size,
		sku,
		description: `${size} Photo Print`
	}));

	return json({ products });
};
