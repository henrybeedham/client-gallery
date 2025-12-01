import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getProdigiClient, extractOrderStatusAndCost } from '$lib/server/prodigi';
import {
	getPhotoById,
	getAlbumById,
	createPrintOrder,
	updatePrintOrderProdigiId,
	updatePrintOrderStatus
} from '$lib/server/db';
import { env } from '$env/dynamic/private';
import { v4 as uuidv4 } from 'uuid';

export const POST: RequestHandler = async ({ request }) => {
	const prodigi = getProdigiClient();

	if (!prodigi.isConfigured()) {
		throw error(503, 'Print service is not configured');
	}

	const data = await request.json();
	const {
		photoId,
		sku,
		copies,
		shippingMethod,
		recipient
	}: {
		photoId: number;
		sku: string;
		copies: number;
		shippingMethod: 'Budget' | 'Standard' | 'Express' | 'Overnight';
		recipient: {
			name: string;
			email?: string;
			phone?: string;
			address: {
				line1: string;
				line2?: string;
				city: string;
				state?: string;
				postalCode: string;
				countryCode: string;
			};
		};
	} = data;

	// Validate required fields
	if (!photoId || !sku || !recipient?.name || !recipient?.address) {
		throw error(400, 'Missing required fields');
	}

	const { address } = recipient;
	if (!address.line1 || !address.city || !address.postalCode || !address.countryCode) {
		throw error(400, 'Missing required address fields');
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

	// Create local order record first
	const localOrderId = createPrintOrder(
		photoId,
		photo.album_id,
		sku,
		copies || 1,
		shippingMethod || 'Standard',
		recipient.name,
		recipient.email || null,
		recipient.phone || null,
		address.line1,
		address.line2 || null,
		address.city,
		address.state || null,
		address.postalCode,
		address.countryCode
	);

	try {
		// Create order with Prodigi
		const prodigiOrder = await prodigi.createOrder({
			merchantReference: `gallery-${localOrderId}`,
			shippingMethod: shippingMethod || 'Standard',
			idempotencyKey: uuidv4(),
			recipient: {
				name: recipient.name,
				email: recipient.email,
				phoneNumber: recipient.phone,
				address: {
					line1: address.line1,
					line2: address.line2,
					townOrCity: address.city,
					stateOrCounty: address.state,
					postalOrZipCode: address.postalCode,
					countryCode: address.countryCode
				}
			},
			items: [
				{
					merchantReference: `photo-${photoId}`,
					sku,
					copies: copies || 1,
					sizing: 'fillPrintArea',
					assets: [
						{
							printArea: 'default',
							url: photoUrl
						}
					]
				}
			]
		});

		// Update local order with Prodigi order ID and data
		updatePrintOrderProdigiId(localOrderId, prodigiOrder.id, JSON.stringify(prodigiOrder));

		// Update status based on Prodigi response using shared utility
		const { status, totalCost } = extractOrderStatusAndCost(prodigiOrder);
		if (totalCost) {
			updatePrintOrderStatus(localOrderId, status, totalCost.amount, totalCost.currency);
		} else {
			updatePrintOrderStatus(localOrderId, status);
		}

		return json({
			success: true,
			orderId: localOrderId,
			prodigiOrderId: prodigiOrder.id,
			status: prodigiOrder.status?.stage,
			order: {
				id: prodigiOrder.id,
				created: prodigiOrder.created,
				status: prodigiOrder.status,
				shippingMethod: prodigiOrder.shippingMethod
			}
		});
	} catch (err) {
		// Update local order status to failed
		updatePrintOrderStatus(localOrderId, 'failed');
		console.error('Failed to create Prodigi order:', err);
		throw error(
			500,
			err instanceof Error ? err.message : 'Failed to create order with print service'
		);
	}
};
