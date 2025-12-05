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

	// Track if the stream has been cancelled to prevent enqueueing after close
	let isCancelled = false;

	// Create a ReadableStream that streams the archive data
	const stream = new ReadableStream({
		start(controller) {
			archive.on('data', (chunk: Uint8Array) => {
				// Only enqueue if not cancelled - prevents ERR_INVALID_STATE
				if (!isCancelled) {
					try {
						controller.enqueue(chunk);
					} catch (err) {
						// Ignore errors if controller is already closed
						console.log('Enqueue error (stream may be cancelled):', err);
					}
				}
			});

			archive.on('end', () => {
				if (!isCancelled) {
					try {
						controller.close();
					} catch (err) {
						// Ignore if already closed
						console.log('Close error (stream may be cancelled):', err);
					}
				}
			});

			archive.on('error', (err) => {
				if (!isCancelled) {
					try {
						controller.error(err);
					} catch (e) {
						console.log('Error reporting failed (stream may be cancelled):', e);
					}
				}
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
			// Mark as cancelled to prevent further operations
			isCancelled = true;

			// Clean up the archive when the client cancels the download
			try {
				// Remove all event listeners to stop processing
				archive.removeAllListeners();
				// Destroy the archive to stop file operations
				archive.destroy();
			} catch (err) {
				// Silently ignore errors during cleanup
				console.log('Archive cleanup error (safe to ignore):', err);
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
