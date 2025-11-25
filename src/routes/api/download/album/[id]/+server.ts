import type { RequestHandler } from './$types';
import { getAlbumById, getPhotosByAlbum } from '$lib/server/db';
import { getImagePath } from '$lib/server/storage';
import { error } from '@sveltejs/kit';
import archiver from 'archiver';
import { createReadStream } from 'fs';

export const GET: RequestHandler = async ({ params }) => {
	const albumId = parseInt(params.id);
	if (isNaN(albumId)) {
		throw error(400, 'Invalid album ID');
	}

	const album = getAlbumById(albumId);
	if (!album || !album.is_public) {
		throw error(404, 'Album not found');
	}

	const photos = getPhotosByAlbum(albumId);
	if (photos.length === 0) {
		throw error(404, 'No photos in album');
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
			'Content-Disposition': `attachment; filename="${album.slug}.zip"`
		}
	});
};
