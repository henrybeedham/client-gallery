import type { RequestHandler } from './$types';
import { recordAnalyticsEvent } from '$lib/server/db';
import { validateSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ params, cookies }) => {
	const albumId = parseInt(params.albumId);
	const isAuthenticated = validateSession(cookies);
	if (isNaN(albumId)) {
		return new Response('Invalid album ID', { status: 400 });
	}

	try {
		if (!isAuthenticated) {
			recordAnalyticsEvent(albumId, 'album_download');
		}
	} catch (e) {
		console.warn('Failed to record analytics:', e);
	}

	return new Response('OK', { status: 200 });
};
