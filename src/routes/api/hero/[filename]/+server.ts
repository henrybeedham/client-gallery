import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export const GET: RequestHandler = async ({ params }) => {
	const { filename } = params;

	if (!filename) {
		throw error(400, 'Filename required');
	}

	// Prevent directory traversal
	if (filename.includes('..') || filename.includes('/')) {
		throw error(400, 'Invalid filename');
	}

	try {
		const heroDir = path.resolve('./uploads/hero');
		const filepath = path.join(heroDir, filename);

		// Verify file exists and is within hero directory
		if (!filepath.startsWith(heroDir)) {
			throw error(403, 'Access denied');
		}

		if (!fs.existsSync(filepath)) {
			throw error(404, 'Hero image not found');
		}

		const buffer = fs.readFileSync(filepath);

		// Determine content type from filename extension
		const ext = filename.split('.').pop()?.toLowerCase();
		let contentType = 'image/jpeg';
		if (ext === 'png') contentType = 'image/png';
		else if (ext === 'webp') contentType = 'image/webp';
		else if (ext === 'gif') contentType = 'image/gif';

		return new Response(buffer, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, 'Failed to load hero image');
	}
};
