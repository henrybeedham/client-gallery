import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import exifr from 'exifr';
import { env } from '$env/dynamic/private';

const UPLOAD_DIR = env.UPLOAD_DIR || './uploads';
const IMPORT_DIR = env.IMPORT_DIR || './import';
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
	cameraMake: string | null;
	cameraModel: string | null;
	lensModel: string | null;
	focalLength: number | null;
	aperture: number | null;
	shutterSpeed: string | null;
	iso: number | null;
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

export interface ExifMetadata {
	dateTaken: string | null;
	cameraMake: string | null;
	cameraModel: string | null;
	lensModel: string | null;
	focalLength: number | null;
	aperture: number | null;
	shutterSpeed: string | null;
	iso: number | null;
}

/**
 * Extract comprehensive EXIF metadata from an image buffer.
 * @param buffer - The image buffer to extract EXIF data from
 * @returns ExifMetadata object with all available EXIF data
 */
async function extractExifMetadata(buffer: Buffer): Promise<ExifMetadata> {
	try {
		// Parse comprehensive EXIF data from buffer
		const exif = await exifr.parse(buffer, {
			pick: [
				'DateTimeOriginal',
				'DateTimeDigitized',
				'DateTime',
				'Make',
				'Model',
				'LensModel',
				'FocalLength',
				'FNumber',
				'ExposureTime',
				'ISO'
			]
		});

		if (!exif) {
			return {
				dateTaken: null,
				cameraMake: null,
				cameraModel: null,
				lensModel: null,
				focalLength: null,
				aperture: null,
				shutterSpeed: null,
				iso: null
			};
		}

		// Extract date taken
		let dateTaken: string | null = null;
		const dateValue = exif.DateTimeOriginal || exif.DateTimeDigitized || exif.DateTime;
		if (dateValue) {
			if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
				const isoString = dateValue.toISOString();
				dateTaken = isoString.substring(0, 19); // Remove .xxxZ suffix
			} else if (typeof dateValue === 'string') {
				// EXIF format: "YYYY:MM:DD HH:MM:SS"
				const match = dateValue.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
				if (match) {
					const [, year, month, day, hour, minute, second] = match;
					const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
					const testDate = new Date(isoString);
					if (!isNaN(testDate.getTime())) {
						dateTaken = isoString;
					}
				}
			}
		}

		// Extract camera make/model
		const cameraMake = exif.Make ? String(exif.Make).trim() : null;
		const cameraModel = exif.Model ? String(exif.Model).trim() : null;

		// Extract lens model
		const lensModel = exif.LensModel ? String(exif.LensModel).trim() : null;

		// Extract focal length (convert to number)
		const focalLength =
			exif.FocalLength && !isNaN(Number(exif.FocalLength)) ? Number(exif.FocalLength) : null;

		// Extract aperture (FNumber, e.g., f/2.8 = 2.8)
		const aperture = exif.FNumber && !isNaN(Number(exif.FNumber)) ? Number(exif.FNumber) : null;

		// Extract shutter speed (ExposureTime, e.g., 1/125)
		let shutterSpeed: string | null = null;
		if (exif.ExposureTime) {
			const exposureTime = Number(exif.ExposureTime);
			if (!isNaN(exposureTime)) {
				if (exposureTime >= 1) {
					shutterSpeed = `${exposureTime}s`;
				} else if (exposureTime > 0) {
					const denominator = Math.round(1 / exposureTime);
					shutterSpeed = `1/${denominator}`;
				}
			}
		}

		// Extract ISO
		const iso = exif.ISO && !isNaN(Number(exif.ISO)) ? Number(exif.ISO) : null;

		return {
			dateTaken,
			cameraMake,
			cameraModel,
			lensModel,
			focalLength,
			aperture,
			shutterSpeed,
			iso
		};
	} catch (error) {
		console.error('Error extracting EXIF metadata:', error);
		return {
			dateTaken: null,
			cameraMake: null,
			cameraModel: null,
			lensModel: null,
			focalLength: null,
			aperture: null,
			shutterSpeed: null,
			iso: null
		};
	}
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

	// Extract comprehensive EXIF metadata from the original buffer
	const exifMetadata = await extractExifMetadata(buffer);

	// Save original
	const originalPath = path.join(UPLOAD_DIR, albumSlug, 'original', filename);
	await fs.writeFile(originalPath, buffer);

	// Generate medium size (for lightbox - preserve aspect ratio)
	const mediumPath = path.join(UPLOAD_DIR, albumSlug, 'medium', filename);
	await image
		.clone()
		.resize(MEDIUM_SIZE, MEDIUM_SIZE, { fit: 'inside', withoutEnlargement: true })
		.toFile(mediumPath);

	// Generate thumbnail (crop to cover the space for consistent grid layout)
	const thumbnailPath = path.join(UPLOAD_DIR, albumSlug, 'thumbnail', filename);
	await image
		.clone()
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', withoutEnlargement: true })
		.toFile(thumbnailPath);

	const stats = await fs.stat(originalPath);

	return {
		filename,
		width: metadata.width || 0,
		height: metadata.height || 0,
		fileSize: stats.size,
		mimeType: `image/${metadata.format || 'jpeg'}`,
		...exifMetadata
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
	cameraMake: string | null;
	cameraModel: string | null;
	lensModel: string | null;
	focalLength: number | null;
	aperture: number | null;
	shutterSpeed: string | null;
	iso: number | null;
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

	// Extract comprehensive EXIF metadata from buffer
	const exifMetadata = await extractExifMetadata(buffer);

	// Regenerate medium size (for lightbox - preserve aspect ratio)
	const mediumPath = path.join(UPLOAD_DIR, albumSlug, 'medium', filename);
	await image
		.clone()
		.resize(MEDIUM_SIZE, MEDIUM_SIZE, { fit: 'inside', withoutEnlargement: true })
		.toFile(mediumPath);

	// Regenerate thumbnail (crop to cover the space for consistent grid layout)
	const thumbnailPath = path.join(UPLOAD_DIR, albumSlug, 'thumbnail', filename);
	await image
		.clone()
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', withoutEnlargement: true })
		.toFile(thumbnailPath);

	const stats = await fs.stat(originalPath);

	return {
		width: metadata.width || 0,
		height: metadata.height || 0,
		fileSize: stats.size,
		mimeType: `image/${metadata.format || 'jpeg'}`,
		...exifMetadata
	};
}

export function getImportDir(): string {
	return IMPORT_DIR;
}

export interface ImportFolderFile {
	name: string;
	path: string;
	size: number;
	tag: string | null; // Subfolder name to be used as tag, null if in root
}

const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export async function getImportFolderFiles(): Promise<ImportFolderFile[]> {
	if (!existsSync(IMPORT_DIR)) {
		return [];
	}

	try {
		const entries = await fs.readdir(IMPORT_DIR, { withFileTypes: true });
		const files: ImportFolderFile[] = [];

		for (const entry of entries) {
			if (entry.isFile()) {
				// Files in the root import folder (no tag)
				const ext = path.extname(entry.name).toLowerCase();
				if (VALID_IMAGE_EXTENSIONS.includes(ext)) {
					const filePath = path.join(IMPORT_DIR, entry.name);
					try {
						const stats = await fs.stat(filePath);
						files.push({
							name: entry.name,
							path: filePath,
							size: stats.size,
							tag: null
						});
					} catch {
						// Skip files that can't be read
					}
				}
			} else if (entry.isDirectory()) {
				// Scan subfolders - subfolder name becomes the tag
				const subfolderName = entry.name;
				const subfolderPath = path.join(IMPORT_DIR, subfolderName);
				try {
					const subEntries = await fs.readdir(subfolderPath, { withFileTypes: true });
					for (const subEntry of subEntries) {
						if (subEntry.isFile()) {
							const ext = path.extname(subEntry.name).toLowerCase();
							if (VALID_IMAGE_EXTENSIONS.includes(ext)) {
								const filePath = path.join(subfolderPath, subEntry.name);
								try {
									const stats = await fs.stat(filePath);
									files.push({
										name: subEntry.name,
										path: filePath,
										size: stats.size,
										tag: subfolderName
									});
								} catch {
									// Skip files that can't be read
								}
							}
						}
					}
				} catch {
					// Skip subfolders that can't be read
				}
			}
		}

		return files.sort((a, b) => a.name.localeCompare(b.name));
	} catch {
		return [];
	}
}

export async function processImageFromImportFolder(
	filePath: string,
	albumSlug: string
): Promise<ProcessedImage> {
	// Validate that the file path is within the import directory (security check)
	const resolvedPath = path.resolve(filePath);
	const resolvedImportDir = path.resolve(IMPORT_DIR);
	if (!resolvedPath.startsWith(resolvedImportDir)) {
		throw new Error('Invalid file path: file must be within the import directory');
	}

	ensureAlbumDirs(albumSlug);

	const buffer = await fs.readFile(filePath);
	const originalFilename = path.basename(filePath);
	const ext = path.extname(originalFilename).toLowerCase();
	const filename = `${uuidv4()}${ext}`;

	const image = sharp(buffer);
	const metadata = await image.metadata();

	// Extract comprehensive EXIF metadata from buffer
	const exifMetadata = await extractExifMetadata(buffer);

	// Save original
	const originalPath = path.join(UPLOAD_DIR, albumSlug, 'original', filename);
	await fs.writeFile(originalPath, buffer);

	// Generate medium size (for lightbox - preserve aspect ratio)
	const mediumPath = path.join(UPLOAD_DIR, albumSlug, 'medium', filename);
	await image
		.clone()
		.resize(MEDIUM_SIZE, MEDIUM_SIZE, { fit: 'inside', withoutEnlargement: true })
		.toFile(mediumPath);

	// Generate thumbnail (crop to cover the space for consistent grid layout)
	const thumbnailPath = path.join(UPLOAD_DIR, albumSlug, 'thumbnail', filename);
	await image
		.clone()
		.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', withoutEnlargement: true })
		.toFile(thumbnailPath);

	const stats = await fs.stat(originalPath);

	return {
		filename,
		width: metadata.width || 0,
		height: metadata.height || 0,
		fileSize: stats.size,
		mimeType: `image/${metadata.format || 'jpeg'}`,
		...exifMetadata
	};
}

export async function deleteFileFromImportFolder(filePath: string): Promise<void> {
	try {
		// Ensure the file is within the import folder (security check)
		const resolvedPath = path.resolve(filePath);
		const resolvedImportDir = path.resolve(IMPORT_DIR);
		if (!resolvedPath.startsWith(resolvedImportDir)) {
			throw new Error('Invalid file path');
		}
		await fs.unlink(filePath);
	} catch {
		// File may not exist or can't be deleted
	}
}
