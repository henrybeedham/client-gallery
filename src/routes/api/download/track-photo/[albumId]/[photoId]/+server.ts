import type { RequestHandler } from './$types';
import { recordAnalyticsEvent } from '$lib/server/db';

export const POST: RequestHandler = async ({ params }) => {
	const albumId = parseInt(params.albumId);
	const photoId = parseInt(params.photoId);
	
	if (isNaN(albumId)) {
		return new Response('Invalid album ID', { status: 400 });
	}

	if (isNaN(photoId)) {
		return new Response('Invalid photo ID', { status: 400 });
	}

	try {
		recordAnalyticsEvent(albumId, 'download', photoId);
	} catch (e) {
		console.warn('Failed to record analytics:', e);
	}

	return new Response('OK', { status: 200 });
};
