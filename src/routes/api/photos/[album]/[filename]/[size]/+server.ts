import type { RequestHandler } from './$types';
import { getImageBuffer } from '$lib/server/storage';
import { error } from '@sveltejs/kit';
import path from 'path';
import fs from 'fs/promises';
import { env } from '$env/dynamic/private';

const UPLOAD_DIR = env.UPLOAD_DIR || './uploads';

export const GET: RequestHandler = async ({ params, request }) => {
	const { filename, size, album } = params;

	if (!album) {
		throw error(400, 'Album slug required');
	}

	if (!['original', 'medium', 'thumbnail'].includes(size)) {
		throw error(400, 'Invalid size');
	}

	try {
		// For original size, always serve the original file as-is
		if (size === 'original') {
			const buffer = await getImageBuffer(filename, 'original', album);

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
		}

		// For medium and thumbnail, check if client supports WebP
		const acceptHeader = request.headers.get('accept') || '';
		const supportsWebP = acceptHeader.includes('image/webp');

		// Try to serve WebP first if supported, fall back to JPEG
		const baseFilename = filename.replace(/\.[^.]+$/, '');
		let filePath: string;
		let contentType: string;

		if (supportsWebP) {
			const webpPath = path.join(UPLOAD_DIR, album, size, `${baseFilename}.webp`);
			try {
				await fs.access(webpPath);
				filePath = webpPath;
				contentType = 'image/webp';
			} catch {
				// WebP not available, try JPEG
				filePath = path.join(UPLOAD_DIR, album, size, `${baseFilename}.jpg`);
				contentType = 'image/jpeg';
			}
		} else {
			// Client doesn't support WebP, serve JPEG
			filePath = path.join(UPLOAD_DIR, album, size, `${baseFilename}.jpg`);
			contentType = 'image/jpeg';
		}

		// Verify the file exists before reading
		try {
			await fs.access(filePath);
		} catch {
			throw error(404, 'Image not found');
		}

		const buffer = await fs.readFile(filePath);

		return new Response(new Uint8Array(buffer), {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable',
				Vary: 'Accept'
			}
		});
	} catch (e) {
		// If it's already an error we threw, re-throw it
		if (e && typeof e === 'object' && 'status' in e) {
			throw e;
		}
		// Otherwise, it's an unexpected error
		throw error(500, 'Failed to load image');
	}
};
