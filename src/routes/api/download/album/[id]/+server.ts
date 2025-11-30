import type { RequestHandler } from './$types';
import { getAlbumById, getPhotosByAlbum } from '$lib/server/db';
import { getImagePath } from '$lib/server/storage';
import { error } from '@sveltejs/kit';
import archiver from 'archiver';
import { createReadStream, statSync, existsSync } from 'fs';

// Default file size estimate (7MB) when actual size is unknown
const DEFAULT_FILE_SIZE_ESTIMATE = 7000000;

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

	// Calculate estimated total size from original files for progress estimation
	let estimatedTotalSize = 0;
	for (const photo of photos) {
		const filePath = getImagePath(photo.filename, 'original', album.slug);
		try {
			const stats = statSync(filePath);
			estimatedTotalSize += stats.size;
		} catch {
			// If file stats fail, use stored file_size or default
			estimatedTotalSize += photo.file_size || DEFAULT_FILE_SIZE_ESTIMATE;
		}
	}

	// Create a zip stream
	const archive = archiver('zip', { zlib: { level: 5 } });

	// Create a ReadableStream that streams the archive data
	const stream = new ReadableStream({
		start(controller) {
			archive.on('data', (chunk: Uint8Array) => {
				controller.enqueue(chunk);
			});

			archive.on('end', () => {
				controller.close();
			});

			archive.on('error', (err) => {
				controller.error(err);
			});

			// Add photos to archive, skipping any files that don't exist
			for (const photo of photos) {
				const filePath = getImagePath(photo.filename, 'original', album.slug);
				if (existsSync(filePath)) {
					archive.append(createReadStream(filePath), { name: photo.original_filename });
				}
			}

			// Finalize the archive
			archive.finalize();
		},
		cancel() {
			// Clean up the archive when the client cancels the download
			archive.abort();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${album.slug}.zip"`,
			// Provide estimated size as a custom header for progress tracking
			// Don't use Content-Length since actual ZIP size differs due to compression
			'X-Estimated-Size': estimatedTotalSize.toString()
		}
	});
};
