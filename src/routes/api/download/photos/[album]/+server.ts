import type { RequestHandler } from './$types';
import { getPhotosByIds } from '$lib/server/db';
import { getImagePath } from '$lib/server/storage';
import { error } from '@sveltejs/kit';
import archiver from 'archiver';
import { createReadStream, statSync, existsSync } from 'fs';

// Default file size estimate (7MB) when actual size is unknown
const DEFAULT_FILE_SIZE_ESTIMATE = 7000000;

export const GET: RequestHandler = async ({ url, params }) => {
	const idsParam = url.searchParams.get('ids');
	const albumSlug = params.album;

	if (!idsParam) {
		throw error(400, 'Missing photo IDs');
	}

	if (!albumSlug) {
		throw error(400, 'Missing album slug');
	}

	const ids = idsParam
		.split(',')
		.map((id) => parseInt(id))
		.filter((id) => !isNaN(id));
	if (ids.length === 0) {
		throw error(400, 'Invalid photo IDs');
	}

	const photos = getPhotosByIds(ids);
	if (photos.length === 0) {
		throw error(404, 'No photos found');
	}

	// Calculate estimated total size from original files for progress estimation
	let estimatedTotalSize = 0;
	for (const photo of photos) {
		const filePath = getImagePath(photo.filename, 'original', albumSlug);
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
				const filePath = getImagePath(photo.filename, 'original', albumSlug);
				if (existsSync(filePath)) {
					archive.append(createReadStream(filePath), { name: photo.original_filename });
				}
			}

			// Finalize the archive
			archive.finalize();
		},
		cancel() {
			// Clean up the archive when the client cancels the download
			// Wrap in try-catch to prevent crashes when archive is already closed
			try {
				if (!archive.pointer()) {
					// Archive hasn't been finalized yet, safe to abort
					archive.abort();
				}
			} catch (err) {
				// Silently ignore errors - archive may already be closed
				console.log('Archive abort error (safe to ignore):', err);
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': 'attachment; filename="photos.zip"',
			// Provide estimated size as a custom header for progress tracking
			// Don't use Content-Length since actual ZIP size differs due to compression
			'X-Estimated-Size': estimatedTotalSize.toString()
		}
	});
};
