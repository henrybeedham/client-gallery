import type { PageServerLoad, Actions } from './$types';
import {
	getAlbumById,
	getAlbumBySlug,
	getPhotosByAlbum,
	getTagsByAlbum,
	getPhotoTagRelationsByAlbum,
	updateAlbum,
	createPhoto,
	deletePhoto,
	setAlbumCover,
	setAlbumBackground,
	updatePhotoOrder,
	getPhotoById,
	createTag,
	deleteTag,
	addTagToPhoto,
	removeTagFromPhoto,
	getAlbumAnalytics,
	getPhotoDownloadCounts,
	updatePhotoMetadata,
	getOrCreateTag,
	deleteAlbumAnalytics
} from '$lib/server/db';
import {
	processAndSaveImage,
	deleteImageFiles,
	renameAlbumDirectory,
	regenerateImageFromOriginal,
	getImportFolderFiles,
	processImageFromImportFolder,
	deleteFileFromImportFolder
} from '$lib/server/storage';
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
	const tags = getTagsByAlbum(albumId);
	const photoTags = getPhotoTagRelationsByAlbum(albumId);
	const analytics = getAlbumAnalytics(albumId);
	const photoDownloads = getPhotoDownloadCounts(albumId);
	const importFiles = await getImportFolderFiles();

	return {
		album,
		photos,
		tags,
		photoTags,
		analytics,
		photoDownloads: Object.fromEntries(photoDownloads),
		importFiles
	};
};

export const actions: Actions = {
	updateAlbum: async ({ params, request }) => {
		const albumId = parseInt(params.id);
		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		const album = getAlbumById(albumId);
		if (!album) {
			return fail(404, { error: 'Album not found' });
		}

		const data = await request.formData();
		const title = data.get('title')?.toString() || '';
		const slugInput = data.get('slug')?.toString() || '';
		const description = data.get('description')?.toString() || '';
		const isPublic = data.get('isPublic') === 'on';
		const showOnHome = data.get('showOnHome') === 'on';
		const password = data.get('password')?.toString() || '';
		const sortOrder = (data.get('sortOrder')?.toString() || 'oldest') as
			| 'newest'
			| 'oldest'
			| 'random';
		const layoutStyleInput = data.get('layoutStyle')?.toString() || 'grid';
		const layoutStyle = (layoutStyleInput === 'masonry' ? 'masonry' : 'grid') as 'grid' | 'masonry';
		const albumDate = data.get('albumDate')?.toString() || null;
		const expiresAt = data.get('expiresAt')?.toString() || null;
		const primaryColor = data.get('primaryColor')?.toString() || '#3b82f6';
		const backgroundPhotoIdStr = data.get('backgroundPhotoId')?.toString();
		let backgroundPhotoId = backgroundPhotoIdStr ? parseInt(backgroundPhotoIdStr) : null;

		// Validate that backgroundPhotoId belongs to this album
		if (backgroundPhotoId !== null) {
			const photo = getPhotoById(backgroundPhotoId);
			if (!photo || photo.album_id !== albumId) {
				backgroundPhotoId = null; // Invalid photo, reset to null
			}
		}

		if (!title.trim()) {
			return fail(400, { error: 'Title is required' });
		}

		const newSlug = slugInput.trim() || slugify(title);
		if (!newSlug) {
			return fail(400, { error: 'Invalid title/slug' });
		}

		// Check if slug already exists for a different album
		if (newSlug !== album.slug) {
			const existing = getAlbumBySlug(newSlug);
			if (existing && existing.id !== albumId) {
				return fail(400, { error: 'An album with this slug already exists' });
			}
			// Rename the album directory if slug changed
			await renameAlbumDirectory(album.slug, newSlug);
		}

		try {
			updateAlbum(
				albumId,
				title.trim(),
				newSlug,
				description.trim() || null,
				isPublic,
				showOnHome,
				password || null,
				sortOrder,
				albumDate || null,
				expiresAt || null,
				primaryColor,
				backgroundPhotoId,
				layoutStyle
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

		const album = getAlbumById(albumId);
		if (!album) {
			return fail(404, { error: 'Album not found' });
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
				const processed = await processAndSaveImage(buffer, file.name, album.slug);
				const photoId = createPhoto(
					albumId,
					processed.filename,
					file.name,
					processed.width,
					processed.height,
					processed.fileSize,
					processed.mimeType,
					processed.dateTaken,
					processed.cameraMake,
					processed.cameraModel,
					processed.lensModel,
					processed.focalLength,
					processed.aperture,
					processed.shutterSpeed,
					processed.iso
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
			const updatedAlbum = getAlbumById(albumId);
			if (updatedAlbum && !updatedAlbum.cover_photo_id) {
				setAlbumCover(albumId, firstPhotoId);
			}
		}

		return { success: true, message: `${uploaded} photo(s) uploaded` };
	},

	deletePhoto: async ({ params, request }) => {
		const albumId = parseInt(params.id);
		const album = getAlbumById(albumId);
		if (!album) {
			return fail(404, { error: 'Album not found' });
		}

		const data = await request.formData();
		const photoId = parseInt(data.get('photoId')?.toString() || '');

		if (isNaN(photoId)) {
			return fail(400, { error: 'Invalid photo ID' });
		}

		try {
			const photo = getPhotoById(photoId);

			if (photo) {
				await deleteImageFiles(photo.filename, album.slug);
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

	setBackground: async ({ params, request }) => {
		const albumId = parseInt(params.id);
		const data = await request.formData();
		const photoId = parseInt(data.get('photoId')?.toString() || '');

		if (isNaN(albumId) || isNaN(photoId)) {
			return fail(400, { error: 'Invalid IDs' });
		}

		// Validate photo belongs to album
		const photo = getPhotoById(photoId);
		if (!photo || photo.album_id !== albumId) {
			return fail(400, { error: 'Photo not found in album' });
		}

		try {
			setAlbumBackground(albumId, photoId);
			return { success: true, message: 'Background photo updated' };
		} catch {
			return fail(500, { error: 'Failed to set background photo' });
		}
	},

	clearBackground: async ({ params }) => {
		const albumId = parseInt(params.id);

		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		try {
			setAlbumBackground(albumId, null);
			return { success: true, message: 'Background cleared' };
		} catch {
			return fail(500, { error: 'Failed to clear background' });
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
	},

	createTag: async ({ params, request }) => {
		const albumId = parseInt(params.id);
		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString() || '';

		if (!name.trim()) {
			return fail(400, { error: 'Tag name is required' });
		}

		try {
			const slug = slugify(name);
			createTag(albumId, name.trim(), slug);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to create tag. It may already exist.' });
		}
	},

	deleteTag: async ({ request }) => {
		const data = await request.formData();
		const tagId = parseInt(data.get('tagId')?.toString() || '');

		if (isNaN(tagId)) {
			return fail(400, { error: 'Invalid tag ID' });
		}

		try {
			deleteTag(tagId);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to delete tag' });
		}
	},

	addTagToPhoto: async ({ request }) => {
		const data = await request.formData();
		const photoId = parseInt(data.get('photoId')?.toString() || '');
		const tagId = parseInt(data.get('tagId')?.toString() || '');

		if (isNaN(photoId) || isNaN(tagId)) {
			return fail(400, { error: 'Invalid IDs' });
		}

		try {
			addTagToPhoto(photoId, tagId);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to add tag' });
		}
	},

	removeTagFromPhoto: async ({ request }) => {
		const data = await request.formData();
		const photoId = parseInt(data.get('photoId')?.toString() || '');
		const tagId = parseInt(data.get('tagId')?.toString() || '');

		if (isNaN(photoId) || isNaN(tagId)) {
			return fail(400, { error: 'Invalid IDs' });
		}

		try {
			removeTagFromPhoto(photoId, tagId);
			return { success: true };
		} catch {
			return fail(500, { error: 'Failed to remove tag' });
		}
	},

	regenerateImages: async ({ params }) => {
		const albumId = parseInt(params.id);
		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		const album = getAlbumById(albumId);
		if (!album) {
			return fail(404, { error: 'Album not found' });
		}

		const photos = getPhotosByAlbum(albumId);
		let regenerated = 0;
		let failed = 0;

		for (const photo of photos) {
			try {
				// Regenerate image files only (thumbnails and medium sizes)
				await regenerateImageFromOriginal(photo.filename, album.slug);
				regenerated++;
			} catch (e) {
				console.error(`Failed to regenerate image ${photo.filename}:`, e);
				failed++;
			}
		}

		if (failed > 0) {
			return {
				success: true,
				message: `Regenerated ${regenerated} thumbnail(s) and medium image(s), ${failed} failed`
			};
		}
		return { success: true, message: `Regenerated ${regenerated} thumbnail(s) and medium image(s)` };
	},

	regenerateData: async ({ params }) => {
		const albumId = parseInt(params.id);
		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		const album = getAlbumById(albumId);
		if (!album) {
			return fail(404, { error: 'Album not found' });
		}

		const photos = getPhotosByAlbum(albumId);
		let regenerated = 0;
		let failed = 0;

		for (const photo of photos) {
			try {
				// Re-extract metadata from original
				const result = await regenerateImageFromOriginal(photo.filename, album.slug);
				updatePhotoMetadata(
					photo.id,
					result.width,
					result.height,
					result.fileSize,
					result.mimeType,
					result.dateTaken,
					result.cameraMake,
					result.cameraModel,
					result.lensModel,
					result.focalLength,
					result.aperture,
					result.shutterSpeed,
					result.iso
				);
				regenerated++;
			} catch (e) {
				console.error(`Failed to regenerate metadata for ${photo.filename}:`, e);
				failed++;
			}
		}

		if (failed > 0) {
			return {
				success: true,
				message: `Regenerated metadata for ${regenerated} photo(s), ${failed} failed`
			};
		}
		return { success: true, message: `Regenerated metadata for ${regenerated} photo(s)` };
	},

	importFromFolder: async ({ params }) => {
		const albumId = parseInt(params.id);
		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		const album = getAlbumById(albumId);
		if (!album) {
			return fail(404, { error: 'Album not found' });
		}

		const importFiles = await getImportFolderFiles();
		if (importFiles.length === 0) {
			return fail(400, { error: 'No files found in import folder' });
		}

		let imported = 0;
		let failed = 0;
		let firstPhotoId: number | null = null;

		// Cache for tag IDs to avoid repeated lookups
		const tagCache = new Map<string, number>();

		for (const file of importFiles) {
			try {
				const processed = await processImageFromImportFolder(file.path, album.slug);
				const photoId = createPhoto(
					albumId,
					processed.filename,
					file.name,
					processed.width,
					processed.height,
					processed.fileSize,
					processed.mimeType,
					processed.dateTaken,
					processed.cameraMake,
					processed.cameraModel,
					processed.lensModel,
					processed.focalLength,
					processed.aperture,
					processed.shutterSpeed,
					processed.iso
				);

				// If the file was in a subfolder, create/get the tag and assign it to the photo
				if (file.tag) {
					let tagId = tagCache.get(file.tag);
					if (!tagId) {
						const tagSlug = slugify(file.tag);
						tagId = getOrCreateTag(albumId, file.tag, tagSlug);
						tagCache.set(file.tag, tagId);
					}
					addTagToPhoto(photoId, tagId);
				}

				if (!firstPhotoId) {
					firstPhotoId = photoId;
				}

				// Delete the file from import folder after successful import
				await deleteFileFromImportFolder(file.path);
				imported++;
			} catch (e) {
				console.error(`Failed to import image ${file.name}:`, e);
				failed++;
			}
		}

		// Set cover photo if album doesn't have one
		if (firstPhotoId) {
			const updatedAlbum = getAlbumById(albumId);
			if (updatedAlbum && !updatedAlbum.cover_photo_id) {
				setAlbumCover(albumId, firstPhotoId);
			}
		}

		if (failed > 0) {
			return { success: true, message: `Imported ${imported} photo(s), ${failed} failed` };
		}
		return { success: true, message: `Imported ${imported} photo(s) from import folder` };
	},

	clearAnalytics: async ({ params }) => {
		const albumId = parseInt(params.id);
		if (isNaN(albumId)) {
			return fail(400, { error: 'Invalid album ID' });
		}

		try {
			deleteAlbumAnalytics(albumId);
			return { success: true, message: 'Album analytics cleared' };
		} catch (e) {
			console.error(`Failed to clear analytics for album ${albumId}:`, e);
		}
	}
};
