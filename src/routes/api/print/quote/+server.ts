import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getProdigiClient } from '$lib/server/prodigi';
import { getPhotoById, getAlbumById } from '$lib/server/db';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	const prodigi = getProdigiClient();

	if (!prodigi.isConfigured()) {
		throw error(503, 'Print service is not configured');
	}

	const data = await request.json();
	const { photoId, sku, copies, countryCode, shippingMethod } = data;

	if (!photoId || !sku || !countryCode) {
		throw error(400, 'Missing required fields: photoId, sku, countryCode');
	}

	const photo = getPhotoById(photoId);
	if (!photo) {
		throw error(404, 'Photo not found');
	}

	const album = getAlbumById(photo.album_id);
	if (!album) {
		throw error(404, 'Album not found');
	}

	// Build the public URL for the photo (original quality)
	const baseUrl = env.PUBLIC_BASE_URL || 'http://localhost:5173';
	const photoUrl = `${baseUrl}/api/photos/${album.slug}/${photo.filename}/original`;

	try {
		const quote = await prodigi.getQuote({
			shippingMethod: shippingMethod || 'Standard',
			destinationCountryCode: countryCode,
			currencyCode: 'USD',
			items: [
				{
					sku,
					copies: copies || 1,
					assets: [
						{
							printArea: 'default',
							url: photoUrl
						}
					]
				}
			]
		});

		return json({
			quote: {
				shippingMethod: quote.shipmentMethod,
				itemsCost: quote.costSummary.items,
				shippingCost: quote.costSummary.shipping,
				totalCost: quote.costSummary.totalCost,
				items: quote.quotes
			}
		});
	} catch (err) {
		console.error('Failed to get quote:', err);
		throw error(500, err instanceof Error ? err.message : 'Failed to get quote from print service');
	}
};
