import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { env } from '$env/dynamic/private';

const UPLOAD_DIR = env.UPLOAD_DIR || './uploads';
const THUMBNAIL_SIZE = 400;
const MEDIUM_SIZE = 1200;

// Ensure upload directories exist
const dirs = ['original', 'medium', 'thumbnail'].map((d) => path.join(UPLOAD_DIR, d));
for (const dir of dirs) {
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
}

export interface ProcessedImage {
	filename: string;
	width: number;
	height: number;
	fileSize: number;
	mimeType: string;
}

export async function processAndSaveImage(
	buffer: Buffer,
	originalFilename: string
): Promise<ProcessedImage> {
	const ext = path.extname(originalFilename).toLowerCase();
	const filename = `${uuidv4()}${ext}`;

	const image = sharp(buffer);
	const metadata = await image.metadata();

	// Save original
	const originalPath = path.join(UPLOAD_DIR, 'original', filename);
	await fs.writeFile(originalPath, buffer);

	// Generate medium size
	const mediumPath = path.join(UPLOAD_DIR, 'medium', filename);
	await image
		.resize(MEDIUM_SIZE, MEDIUM_SIZE, { fit: 'inside', withoutEnlargement: true })
		.toFile(mediumPath);

	// Generate thumbnail
	const thumbnailPath = path.join(UPLOAD_DIR, 'thumbnail', filename);
	await sharp(buffer)
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover' })
		.toFile(thumbnailPath);

	const stats = await fs.stat(originalPath);

	return {
		filename,
		width: metadata.width || 0,
		height: metadata.height || 0,
		fileSize: stats.size,
		mimeType: `image/${metadata.format || 'jpeg'}`
	};
}

export async function deleteImageFiles(filename: string): Promise<void> {
	const sizes = ['original', 'medium', 'thumbnail'];

	for (const size of sizes) {
		const filePath = path.join(UPLOAD_DIR, size, filename);
		try {
			await fs.unlink(filePath);
		} catch {
			// File may not exist, ignore error
		}
	}
}

export function getImagePath(filename: string, size: 'original' | 'medium' | 'thumbnail'): string {
	return path.join(UPLOAD_DIR, size, filename);
}

export async function getImageBuffer(
	filename: string,
	size: 'original' | 'medium' | 'thumbnail'
): Promise<Buffer> {
	const filePath = getImagePath(filename, size);
	return fs.readFile(filePath);
}

export function getUploadDir(): string {
	return UPLOAD_DIR;
}
