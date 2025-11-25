import type { RequestHandler } from './$types';
import { getPhotosByIds } from '$lib/server/db';
import { getImagePath } from '$lib/server/storage';
import { error } from '@sveltejs/kit';
import archiver from 'archiver';
import { createReadStream } from 'fs';

export const GET: RequestHandler = async ({ url }) => {
	const idsParam = url.searchParams.get('ids');
	if (!idsParam) {
		throw error(400, 'Missing photo IDs');
	}

	const ids = idsParam.split(',').map((id) => parseInt(id)).filter((id) => !isNaN(id));
	if (ids.length === 0) {
		throw error(400, 'Invalid photo IDs');
	}

	const photos = getPhotosByIds(ids);
	if (photos.length === 0) {
		throw error(404, 'No photos found');
	}

	// Create a zip stream
	const archive = archiver('zip', { zlib: { level: 5 } });

	// Collect all chunks into a buffer
	const chunks: Uint8Array[] = [];
	archive.on('data', (chunk: Uint8Array) => chunks.push(chunk));

	// Add photos to archive
	for (const photo of photos) {
		const filePath = getImagePath(photo.filename, 'original');
		archive.append(createReadStream(filePath), { name: photo.original_filename });
	}

	// Finalize and wait for completion
	await archive.finalize();

	const buffer = Buffer.concat(chunks);

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment; filename="photos.zip"'
		}
	});
};
