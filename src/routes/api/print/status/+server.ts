import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getProdigiClient } from '$lib/server/prodigi';

// GET /api/print/status - Check if print service is configured
export const GET: RequestHandler = async () => {
	const prodigi = getProdigiClient();

	return json({
		configured: prodigi.isConfigured(),
		message: prodigi.isConfigured()
			? 'Print service is available'
			: 'Print service is not configured. Please set PRODIGI_API_KEY in environment variables.'
	});
};
