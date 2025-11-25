import type { PageServerLoad, Actions } from './$types';
import {
	getAlbumById,
	getPhotosByAlbum,
	getCategories,
	updateAlbum,
	createPhoto,
	deletePhoto,
	setAlbumCover,
	updatePhotoOrder,
	getPhotoById
} from '$lib/server/db';
import { processAndSaveImage, deleteImageFiles } from '$lib/server/storage';
import { slugify } from '$lib/utils';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const albumId = parseInt(params.id);
	if (isNaN(albumId)) {
		throw error(404, 'Album not found');
	}

	const album = getAlbumById(albumId);
	if (!album) {
		throw error(404, 'Album not found');
	}

	const photos = getPhotosByAlbum(albumId);
	const categories = getCategories();

	return {
		album,
		photos,
		categories
	};
};

export const actions: Actions = {
	updateAlbum: async ({ params, request }) => {
		const albumId = parseInt(params.id);
		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		const data = await request.formData();
		const title = data.get('title')?.toString() || '';
		const description = data.get('description')?.toString() || '';
		const categoryId = data.get('categoryId')?.toString() || '';
		const isPublic = data.get('isPublic') === 'on';
		const coverPhotoId = data.get('coverPhotoId')?.toString() || '';

		if (!title.trim()) {
			return fail(400, { error: 'Title is required' });
		}

		const slug = slugify(title);
		if (!slug) {
			return fail(400, { error: 'Invalid title' });
		}

		try {
			updateAlbum(
				albumId,
				title.trim(),
				slug,
				description.trim() || null,
				categoryId ? parseInt(categoryId) : null,
				isPublic,
				coverPhotoId ? parseInt(coverPhotoId) : null
			);
			return { success: true, message: 'Album updated' };
		} catch {
			return fail(500, { error: 'Failed to update album' });
		}
	},

	uploadPhotos: async ({ params, request }) => {
		const albumId = parseInt(params.id);
		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		const data = await request.formData();
		const files = data.getAll('photos') as File[];

		if (files.length === 0 || (files.length === 1 && files[0].size === 0)) {
			return fail(400, { error: 'No files selected' });
		}

		const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
		const maxSize = 50 * 1024 * 1024; // 50MB

		let uploaded = 0;
		let firstPhotoId: number | null = null;

		for (const file of files) {
			if (!validTypes.includes(file.type)) {
				continue;
			}
			if (file.size > maxSize) {
				continue;
			}

			try {
				const buffer = Buffer.from(await file.arrayBuffer());
				const processed = await processAndSaveImage(buffer, file.name);
				const photoId = createPhoto(
					albumId,
					processed.filename,
					file.name,
					processed.width,
					processed.height,
					processed.fileSize,
					processed.mimeType
				);

				if (!firstPhotoId) {
					firstPhotoId = photoId;
				}
				uploaded++;
			} catch (e) {
				console.error('Failed to process image:', e);
			}
		}

		// Set cover photo if album doesn't have one
		if (firstPhotoId) {
			const album = getAlbumById(albumId);
			if (album && !album.cover_photo_id) {
				setAlbumCover(albumId, firstPhotoId);
			}
		}

		return { success: true, message: `${uploaded} photo(s) uploaded` };
	},

	deletePhoto: async ({ request }) => {
		const data = await request.formData();
		const photoId = parseInt(data.get('photoId')?.toString() || '');

		if (isNaN(photoId)) {
			return fail(400, { error: 'Invalid photo ID' });
		}

		try {
			const photo = getPhotoById(photoId);

			if (photo) {
				await deleteImageFiles(photo.filename);
				deletePhoto(photoId);
			}

			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to delete photo' });
		}
	},

	setCover: async ({ params, request }) => {
		const albumId = parseInt(params.id);
		const data = await request.formData();
		const photoId = parseInt(data.get('photoId')?.toString() || '');

		if (isNaN(albumId) || isNaN(photoId)) {
			return fail(400, { error: 'Invalid IDs' });
		}

		try {
			setAlbumCover(albumId, photoId);
			return { success: true, message: 'Cover photo updated' };
		} catch {
			return fail(500, { error: 'Failed to set cover photo' });
		}
	},

	reorderPhotos: async ({ request }) => {
		const data = await request.formData();
		const orderJson = data.get('order')?.toString();

		if (!orderJson) {
			return fail(400, { error: 'Invalid order data' });
		}

		try {
			const order = JSON.parse(orderJson) as { id: number; sort_order: number }[];
			updatePhotoOrder(order);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to reorder photos' });
		}
	}
};
