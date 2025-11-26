import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { env } from '$env/dynamic/private';

const UPLOAD_DIR = env.UPLOAD_DIR || './uploads';
const THUMBNAIL_SIZE = 600;
const MEDIUM_SIZE = 1600;

// Ensure base upload directory exists
if (!existsSync(UPLOAD_DIR)) {
	mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface ProcessedImage {
	filename: string;
	width: number;
	height: number;
	fileSize: number;
	mimeType: string;
	dateTaken: string | null;
}

function ensureAlbumDirs(albumSlug: string): void {
	const sizes = ['original', 'medium', 'thumbnail'];
	for (const size of sizes) {
		const dir = path.join(UPLOAD_DIR, albumSlug, size);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}
}

function extractExifDateTaken(exifBuffer: Buffer | undefined): string | null {
	if (!exifBuffer) return null;
	try {
		// EXIF dates are typically in offset 36 (DateTimeOriginal) or offset 132 (DateTime)
		// Sharp's metadata.exif is a Buffer - we need to look for date patterns
		const exifString = exifBuffer.toString('binary');
		// Look for date pattern: YYYY:MM:DD HH:MM:SS
		const dateMatch = exifString.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
		if (dateMatch) {
			const [, year, month, day, hour, minute, second] = dateMatch;
			return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
		}
	} catch {
		// Failed to parse EXIF, return null
	}
	return null;
}

export async function processAndSaveImage(
	buffer: Buffer,
	originalFilename: string,
	albumSlug: string
): Promise<ProcessedImage> {
	ensureAlbumDirs(albumSlug);

	const ext = path.extname(originalFilename).toLowerCase();
	const filename = `${uuidv4()}${ext}`;

	const image = sharp(buffer);
	const metadata = await image.metadata();

	// Extract EXIF date taken
	const dateTaken = extractExifDateTaken(metadata.exif);

	// Save original
	const originalPath = path.join(UPLOAD_DIR, albumSlug, 'original', filename);
	await fs.writeFile(originalPath, buffer);

	// Generate medium size (for lightbox - preserve aspect ratio)
	const mediumPath = path.join(UPLOAD_DIR, albumSlug, 'medium', filename);
	await image
		.clone()
		.resize(MEDIUM_SIZE, MEDIUM_SIZE, { fit: 'inside', withoutEnlargement: true })
		.toFile(mediumPath);

	// Generate thumbnail (preserve aspect ratio, don't crop)
	const thumbnailPath = path.join(UPLOAD_DIR, albumSlug, 'thumbnail', filename);
	await image
		.clone()
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'inside', withoutEnlargement: true })
		.toFile(thumbnailPath);

	const stats = await fs.stat(originalPath);

	return {
		filename,
		width: metadata.width || 0,
		height: metadata.height || 0,
		fileSize: stats.size,
		mimeType: `image/${metadata.format || 'jpeg'}`,
		dateTaken
	};
}

export async function deleteImageFiles(filename: string, albumSlug: string): Promise<void> {
	const sizes = ['original', 'medium', 'thumbnail'];

	for (const size of sizes) {
		const filePath = path.join(UPLOAD_DIR, albumSlug, size, filename);
		try {
			await fs.unlink(filePath);
		} catch {
			// File may not exist, ignore error
		}
	}
}

export async function deleteAlbumDirectory(albumSlug: string): Promise<void> {
	const albumDir = path.join(UPLOAD_DIR, albumSlug);
	try {
		await fs.rm(albumDir, { recursive: true, force: true });
	} catch {
		// Directory may not exist
	}
}

export async function renameAlbumDirectory(oldSlug: string, newSlug: string): Promise<void> {
	const oldDir = path.join(UPLOAD_DIR, oldSlug);
	const newDir = path.join(UPLOAD_DIR, newSlug);

	if (existsSync(oldDir) && oldSlug !== newSlug) {
		await fs.rename(oldDir, newDir);
	}
}

export function getImagePath(
	filename: string,
	size: 'original' | 'medium' | 'thumbnail',
	albumSlug: string
): string {
	return path.join(UPLOAD_DIR, albumSlug, size, filename);
}

export async function getImageBuffer(
	filename: string,
	size: 'original' | 'medium' | 'thumbnail',
	albumSlug: string
): Promise<Buffer> {
	const filePath = getImagePath(filename, size, albumSlug);
	return fs.readFile(filePath);
}

export function getUploadDir(): string {
	return UPLOAD_DIR;
}

export interface RegeneratedImageData {
	width: number;
	height: number;
	fileSize: number;
	mimeType: string;
	dateTaken: string | null;
}

export async function regenerateImageFromOriginal(
	filename: string,
	albumSlug: string
): Promise<RegeneratedImageData> {
	ensureAlbumDirs(albumSlug);

	const originalPath = path.join(UPLOAD_DIR, albumSlug, 'original', filename);
	const buffer = await fs.readFile(originalPath);

	const image = sharp(buffer);
	const metadata = await image.metadata();

	// Extract EXIF date taken using shared helper
	const dateTaken = extractExifDateTaken(metadata.exif);

	// Regenerate medium size (for lightbox - preserve aspect ratio)
	const mediumPath = path.join(UPLOAD_DIR, albumSlug, 'medium', filename);
	await image
		.clone()
		.resize(MEDIUM_SIZE, MEDIUM_SIZE, { fit: 'inside', withoutEnlargement: true })
		.toFile(mediumPath);

	// Regenerate thumbnail (preserve aspect ratio, don't crop)
	const thumbnailPath = path.join(UPLOAD_DIR, albumSlug, 'thumbnail', filename);
	await image
		.clone()
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'inside', withoutEnlargement: true })
		.toFile(thumbnailPath);

	const stats = await fs.stat(originalPath);

	return {
		width: metadata.width || 0,
		height: metadata.height || 0,
		fileSize: stats.size,
		mimeType: `image/${metadata.format || 'jpeg'}`,
		dateTaken
	};
}
