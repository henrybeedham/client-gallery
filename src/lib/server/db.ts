import Database from 'better-sqlite3';
import path from 'path';
import { env } from '$env/dynamic/private';

const dbPath = env.DATABASE_PATH || './data/gallery.db';
const db = new Database(path.resolve(dbPath));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_photo_id INTEGER,
    category_id INTEGER,
    is_public INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    file_size INTEGER,
    mime_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
  CREATE INDEX IF NOT EXISTS idx_albums_category_id ON albums(category_id);
  CREATE INDEX IF NOT EXISTS idx_albums_slug ON albums(slug);
`);

export interface Category {
	id: number;
	name: string;
	slug: string;
	created_at: string;
}

export interface Album {
	id: number;
	title: string;
	slug: string;
	description: string | null;
	cover_photo_id: number | null;
	category_id: number | null;
	is_public: number;
	created_at: string;
	updated_at: string;
	category_name?: string;
	photo_count?: number;
	cover_filename?: string;
}

export interface Photo {
	id: number;
	album_id: number;
	filename: string;
	original_filename: string;
	width: number | null;
	height: number | null;
	file_size: number | null;
	mime_type: string | null;
	created_at: string;
	sort_order: number;
}

// Category operations
export function getCategories(): Category[] {
	return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
}

export function getCategoryBySlug(slug: string): Category | undefined {
	return db.prepare('SELECT * FROM categories WHERE slug = ?').get(slug) as Category | undefined;
}

export function createCategory(name: string, slug: string): number {
	const result = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(name, slug);
	return result.lastInsertRowid as number;
}

export function updateCategory(id: number, name: string, slug: string): void {
	db.prepare('UPDATE categories SET name = ?, slug = ? WHERE id = ?').run(name, slug, id);
}

export function deleteCategory(id: number): void {
	db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}

// Album operations
export function getAlbums(categoryId?: number | null, publicOnly = true): Album[] {
	let query = `
    SELECT 
      a.*,
      c.name as category_name,
      (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count,
      (SELECT filename FROM photos WHERE id = a.cover_photo_id) as cover_filename
    FROM albums a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE 1=1
  `;
	const params: (number | string)[] = [];

	if (publicOnly) {
		query += ' AND a.is_public = 1';
	}

	if (categoryId !== undefined && categoryId !== null) {
		query += ' AND a.category_id = ?';
		params.push(categoryId);
	}

	query += ' ORDER BY a.created_at DESC';

	return db.prepare(query).all(...params) as Album[];
}

export function getAlbumBySlug(slug: string): Album | undefined {
	return db
		.prepare(
			`
    SELECT 
      a.*,
      c.name as category_name,
      (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count,
      (SELECT filename FROM photos WHERE id = a.cover_photo_id) as cover_filename
    FROM albums a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.slug = ?
  `
		)
		.get(slug) as Album | undefined;
}

export function getAlbumById(id: number): Album | undefined {
	return db
		.prepare(
			`
    SELECT 
      a.*,
      c.name as category_name,
      (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count,
      (SELECT filename FROM photos WHERE id = a.cover_photo_id) as cover_filename
    FROM albums a
    LEFT JOIN categories c ON a.category_id = c.id
    WHERE a.id = ?
  `
		)
		.get(id) as Album | undefined;
}

export function createAlbum(
	title: string,
	slug: string,
	description: string | null,
	categoryId: number | null,
	isPublic: boolean
): number {
	const result = db
		.prepare(
			'INSERT INTO albums (title, slug, description, category_id, is_public) VALUES (?, ?, ?, ?, ?)'
		)
		.run(title, slug, description, categoryId, isPublic ? 1 : 0);
	return result.lastInsertRowid as number;
}

export function updateAlbum(
	id: number,
	title: string,
	slug: string,
	description: string | null,
	categoryId: number | null,
	isPublic: boolean,
	coverPhotoId: number | null
): void {
	db.prepare(
		`UPDATE albums SET 
      title = ?, 
      slug = ?, 
      description = ?, 
      category_id = ?, 
      is_public = ?,
      cover_photo_id = ?,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`
	).run(title, slug, description, categoryId, isPublic ? 1 : 0, coverPhotoId, id);
}

export function deleteAlbum(id: number): void {
	db.prepare('DELETE FROM albums WHERE id = ?').run(id);
}

export function setAlbumCover(albumId: number, photoId: number | null): void {
	db.prepare('UPDATE albums SET cover_photo_id = ? WHERE id = ?').run(photoId, albumId);
}

// Photo operations
export function getPhotosByAlbum(albumId: number): Photo[] {
	return db
		.prepare('SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order, created_at')
		.all(albumId) as Photo[];
}

export function getPhotoById(id: number): Photo | undefined {
	return db.prepare('SELECT * FROM photos WHERE id = ?').get(id) as Photo | undefined;
}

export function getPhotosByIds(ids: number[]): Photo[] {
	if (ids.length === 0) return [];
	const placeholders = ids.map(() => '?').join(',');
	return db.prepare(`SELECT * FROM photos WHERE id IN (${placeholders})`).all(...ids) as Photo[];
}

export function createPhoto(
	albumId: number,
	filename: string,
	originalFilename: string,
	width: number | null,
	height: number | null,
	fileSize: number | null,
	mimeType: string | null
): number {
	const maxOrder = db
		.prepare('SELECT MAX(sort_order) as max_order FROM photos WHERE album_id = ?')
		.get(albumId) as { max_order: number | null };
	const sortOrder = (maxOrder?.max_order ?? -1) + 1;

	const result = db
		.prepare(
			`INSERT INTO photos 
      (album_id, filename, original_filename, width, height, file_size, mime_type, sort_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(albumId, filename, originalFilename, width, height, fileSize, mimeType, sortOrder);
	return result.lastInsertRowid as number;
}

export function deletePhoto(id: number): void {
	db.prepare('DELETE FROM photos WHERE id = ?').run(id);
}

export function updatePhotoOrder(photos: { id: number; sort_order: number }[]): void {
	const stmt = db.prepare('UPDATE photos SET sort_order = ? WHERE id = ?');
	const transaction = db.transaction(() => {
		for (const photo of photos) {
			stmt.run(photo.sort_order, photo.id);
		}
	});
	transaction();
}

export default db;
