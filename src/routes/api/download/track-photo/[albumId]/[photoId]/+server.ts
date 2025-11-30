import type { RequestHandler } from './$types';
import { recordAnalyticsEvent } from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ params, cookies }) => {
	const albumId = parseInt(params.albumId);
	const photoId = parseInt(params.photoId);
	const isAuthenticated = validateSession(cookies);

	if (isNaN(albumId)) {
		return new Response('Invalid album ID', { status: 400 });
	}

	if (isNaN(photoId)) {
		return new Response('Invalid photo ID', { status: 400 });
	}

	try {
		if (!isAuthenticated) {
			recordAnalyticsEvent(albumId, 'download', photoId);
		}
	} catch (e) {
		console.warn('Failed to record analytics:', e);
	}

	return new Response('OK', { status: 200 });
};
