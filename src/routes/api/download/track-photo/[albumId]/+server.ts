import type { RequestHandler } from './$types';
import { recordAnalyticsEvent } from '$lib/server/db';

export const POST: RequestHandler = async ({ params }) => {
	const albumId = parseInt(params.albumId);
	if (isNaN(albumId)) {
		return new Response('Invalid album ID', { status: 400 });
	}

	recordAnalyticsEvent(albumId, 'download');

	return new Response('OK', { status: 200 });
};
