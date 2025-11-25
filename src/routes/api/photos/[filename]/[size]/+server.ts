import type { RequestHandler } from './$types';
import { getImageBuffer } from '$lib/server/storage';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, url }) => {
	const { filename, size } = params;
	const albumSlug = url.searchParams.get('album');

	if (!albumSlug) {
		throw error(400, 'Album slug required');
	}

	if (!['original', 'medium', 'thumbnail'].includes(size)) {
		throw error(400, 'Invalid size');
	}

	try {
		const buffer = await getImageBuffer(filename, size as 'original' | 'medium' | 'thumbnail', albumSlug);

		// Determine content type from filename extension
		const ext = filename.split('.').pop()?.toLowerCase();
		let contentType = 'image/jpeg';
		if (ext === 'png') contentType = 'image/png';
		else if (ext === 'webp') contentType = 'image/webp';
		else if (ext === 'gif') contentType = 'image/gif';

		return new Response(new Uint8Array(buffer), {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch {
		throw error(404, 'Image not found');
	}
};
