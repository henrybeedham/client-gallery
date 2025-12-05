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
				const filePath = getImagePath(photo.filename, 'original', album.slug);
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
			'Content-Disposition': `attachment; filename="${album.slug}.zip"`,
			// Provide estimated size as a custom header for progress tracking
			// Don't use Content-Length since actual ZIP size differs due to compression
			'X-Estimated-Size': estimatedTotalSize.toString()
		}
	});
};
