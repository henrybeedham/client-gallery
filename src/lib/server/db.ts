import Database from 'better-sqlite3';
import path from 'path';
import { env } from '$env/dynamic/private';

const dbPath = env.DATABASE_PATH || './data/gallery.db';
const db = new Database(path.resolve(dbPath));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    cover_photo_id INTEGER,
    background_photo_id INTEGER,
    is_public INTEGER DEFAULT 1,
    show_on_home INTEGER DEFAULT 1,
    password TEXT,
    sort_order TEXT DEFAULT 'newest',
    album_date TEXT,
    expires_at TEXT,
    primary_color TEXT DEFAULT '#3b82f6',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    date_taken DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS photo_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(album_id, slug),
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS photo_tag_relations (
    photo_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (photo_id, tag_id),
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES photo_tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    photo_id INTEGER,
    event_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
  CREATE INDEX IF NOT EXISTS idx_albums_slug ON albums(slug);
  CREATE INDEX IF NOT EXISTS idx_photo_tags_album_id ON photo_tags(album_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_album_id ON analytics(album_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
`);

// Migration: Add new columns if they don't exist
try {
	db.exec(`ALTER TABLE albums ADD COLUMN show_on_home INTEGER DEFAULT 1`);
} catch {
	/* Column may already exist */
}
try {
	db.exec(`ALTER TABLE albums ADD COLUMN password TEXT`);
} catch {
	/* Column may already exist */
}
try {
	db.exec(`ALTER TABLE albums ADD COLUMN layout TEXT DEFAULT 'grid'`);
} catch {
	/* Column may already exist */
}

// New column migrations for album date, expiration, contact info, and styling
try {
	db.exec(`ALTER TABLE albums ADD COLUMN album_date TEXT`);
} catch {
	/* Column may already exist */
}
try {
	db.exec(`ALTER TABLE albums ADD COLUMN expires_at TEXT`);
} catch {
	/* Column may already exist */
}
try {
	db.exec(`ALTER TABLE albums ADD COLUMN primary_color TEXT DEFAULT '#3b82f6'`);
} catch {
	/* Column may already exist */
}
try {
	db.exec(`ALTER TABLE albums ADD COLUMN background_photo_id INTEGER`);
} catch {
	/* Column may already exist */
}
try {
	db.exec(`ALTER TABLE albums ADD COLUMN sort_order TEXT DEFAULT 'newest'`);
} catch {
	/* Column may already exist */
}

// Migration: Update existing albums with 'manual' sort_order to 'newest'
try {
	db.exec(`UPDATE albums SET sort_order = 'newest' WHERE sort_order = 'manual'`);
} catch {
	/* Table may not exist yet */
}

// Migration: Add date_taken column to photos for EXIF data
try {
	db.exec(`ALTER TABLE photos ADD COLUMN date_taken DATETIME`);
} catch {
	/* Column may already exist */
}

// Create analytics table if not exists (for migrations)
try {
	db.exec(`
		CREATE TABLE IF NOT EXISTS analytics (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			album_id INTEGER NOT NULL,
			photo_id INTEGER,
			event_type TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
			FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS idx_analytics_album_id ON analytics(album_id);
		CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
	`);
} catch {
	/* Table may already exist */
}

// Drop old categories table if exists (migration)
try {
	db.exec(`DROP TABLE IF EXISTS categories`);
} catch {
	/* Table may not exist */
}

export interface Album {
	id: number;
	title: string;
	slug: string;
	description: string | null;
	cover_photo_id: number | null;
	background_photo_id: number | null;
	is_public: number;
	show_on_home: number;
	password: string | null;
	sort_order: 'newest' | 'oldest' | 'random';
	album_date: string | null;
	expires_at: string | null;
	primary_color: string;
	created_at: string;
	updated_at: string;
	photo_count?: number;
	cover_filename?: string;
	background_filename?: string;
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
	date_taken: string | null;
	created_at: string;
	sort_order: number;
	tags?: PhotoTag[];
}

export interface PhotoTag {
	id: number;
	album_id: number;
	name: string;
	slug: string;
	created_at: string;
}

// Album operations
export function getAlbums(showOnHomeOnly = false, publicOnly = true): Album[] {
	let query = `
    SELECT 
      a.*,
      (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count,
      (SELECT filename FROM photos WHERE id = a.cover_photo_id) as cover_filename
    FROM albums a
    WHERE 1=1
  `;

	if (publicOnly) {
		query += ' AND a.is_public = 1';
	}

	if (showOnHomeOnly) {
		query += ' AND a.show_on_home = 1';
	}

	query += ' ORDER BY a.created_at DESC';

	return db.prepare(query).all() as Album[];
}

export function getAlbumBySlug(slug: string): Album | undefined {
	return db
		.prepare(
			`
    SELECT 
      a.*,
      (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count,
      (SELECT filename FROM photos WHERE id = a.cover_photo_id) as cover_filename,
      (SELECT filename FROM photos WHERE id = a.background_photo_id) as background_filename
    FROM albums a
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
      (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count,
      (SELECT filename FROM photos WHERE id = a.cover_photo_id) as cover_filename,
      (SELECT filename FROM photos WHERE id = a.background_photo_id) as background_filename
    FROM albums a
    WHERE a.id = ?
  `
		)
		.get(id) as Album | undefined;
}

export function createAlbum(
	title: string,
	slug: string,
	description: string | null,
	isPublic: boolean,
	showOnHome: boolean,
	password: string | null,
	sortOrder: 'newest' | 'oldest' | 'random' = 'newest',
	albumDate: string | null = null,
	expiresAt: string | null = null,
	primaryColor: string = '#3b82f6'
): number {
	const result = db
		.prepare(
			'INSERT INTO albums (title, slug, description, is_public, show_on_home, password, sort_order, album_date, expires_at, primary_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.run(
			title,
			slug,
			description,
			isPublic ? 1 : 0,
			showOnHome ? 1 : 0,
			password || null,
			sortOrder,
			albumDate || null,
			expiresAt || null,
			primaryColor
		);
	return result.lastInsertRowid as number;
}

export function updateAlbum(
	id: number,
	title: string,
	slug: string,
	description: string | null,
	isPublic: boolean,
	showOnHome: boolean,
	password: string | null,
	sortOrder: 'newest' | 'oldest' | 'random' = 'newest',
	albumDate: string | null = null,
	expiresAt: string | null = null,
	primaryColor: string = '#3b82f6',
	backgroundPhotoId: number | null = null
): void {
	db.prepare(
		`UPDATE albums SET 
      title = ?, 
      slug = ?, 
      description = ?, 
      is_public = ?,
      show_on_home = ?,
      password = ?,
      sort_order = ?,
      album_date = ?,
      expires_at = ?,
      primary_color = ?,
      background_photo_id = ?,
      updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`
	).run(
		title,
		slug,
		description,
		isPublic ? 1 : 0,
		showOnHome ? 1 : 0,
		password || null,
		sortOrder,
		albumDate || null,
		expiresAt || null,
		primaryColor,
		backgroundPhotoId,
		id
	);
}

export function deleteAlbum(id: number): void {
	db.prepare('DELETE FROM albums WHERE id = ?').run(id);
}

export function setAlbumCover(albumId: number, photoId: number | null): void {
	db.prepare('UPDATE albums SET cover_photo_id = ? WHERE id = ?').run(photoId, albumId);
}

export function setAlbumBackground(albumId: number, photoId: number | null): void {
	db.prepare('UPDATE albums SET background_photo_id = ? WHERE id = ?').run(photoId, albumId);
}

export function checkAlbumPassword(albumId: number, password: string): boolean {
	const album = getAlbumById(albumId);
	if (!album || !album.password) return true;
	return album.password === password;
}

// Photo operations
// For deterministic random order, we use a hash of album_id + photo_id
// This ensures the same "random" order every time for a given album
const HASH_MULTIPLIER_1 = 31;  // Prime multiplier for first hash step
const HASH_MULTIPLIER_2 = 17;  // Prime multiplier for second hash step
const HASH_MODULUS = 1000000;  // Modulus to keep hash values bounded

function getSeededRandomOrder(photos: Photo[], albumId: number): Photo[] {
	// Simple deterministic shuffle using album_id as seed
	const shuffled = [...photos];
	shuffled.sort((a, b) => {
		const hashA = ((albumId * HASH_MULTIPLIER_1 + a.id) * HASH_MULTIPLIER_2) % HASH_MODULUS;
		const hashB = ((albumId * HASH_MULTIPLIER_1 + b.id) * HASH_MULTIPLIER_2) % HASH_MODULUS;
		return hashA - hashB;
	});
	return shuffled;
}

// Allowlist of valid order by clauses for getPhotosByAlbum
const VALID_ORDER_BY_WITH_ALIAS = {
	'newest': 'COALESCE(p.date_taken, p.created_at) DESC',
	'oldest': 'COALESCE(p.date_taken, p.created_at) ASC',
	'random': 'p.id' // We'll shuffle in JS for deterministic random
} as const;

const VALID_ORDER_BY_NO_ALIAS = {
	'newest': 'COALESCE(date_taken, created_at) DESC',
	'oldest': 'COALESCE(date_taken, created_at) ASC',
	'random': 'id' // We'll shuffle in JS for deterministic random
} as const;

export function getPhotosByAlbum(albumId: number, tagSlug?: string, sortOrder: 'newest' | 'oldest' | 'random' = 'newest'): Photo[] {
	let photos: Photo[];
	
	if (tagSlug) {
		// Use allowlist to prevent SQL injection (with alias)
		const orderBy = VALID_ORDER_BY_WITH_ALIAS[sortOrder] || VALID_ORDER_BY_WITH_ALIAS['newest'];
		photos = db
			.prepare(
				`
        SELECT p.* FROM photos p
        INNER JOIN photo_tag_relations ptr ON p.id = ptr.photo_id
        INNER JOIN photo_tags pt ON ptr.tag_id = pt.id
        WHERE p.album_id = ? AND pt.slug = ?
        ORDER BY ${orderBy}
      `
			)
			.all(albumId, tagSlug) as Photo[];
	} else {
		// Use allowlist to prevent SQL injection (without alias)
		const orderBy = VALID_ORDER_BY_NO_ALIAS[sortOrder] || VALID_ORDER_BY_NO_ALIAS['newest'];
		photos = db
			.prepare(`SELECT * FROM photos WHERE album_id = ? ORDER BY ${orderBy}`)
			.all(albumId) as Photo[];
	}
	
	// Apply deterministic random shuffle if needed
	if (sortOrder === 'random') {
		return getSeededRandomOrder(photos, albumId);
	}
	
	return photos;
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
	mimeType: string | null,
	dateTaken: string | null = null
): number {
	const maxOrder = db
		.prepare('SELECT MAX(sort_order) as max_order FROM photos WHERE album_id = ?')
		.get(albumId) as { max_order: number | null };
	const sortOrder = (maxOrder?.max_order ?? -1) + 1;

	const result = db
		.prepare(
			`INSERT INTO photos 
      (album_id, filename, original_filename, width, height, file_size, mime_type, date_taken, sort_order) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(albumId, filename, originalFilename, width, height, fileSize, mimeType, dateTaken, sortOrder);
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

// Photo Tag operations
export function getTagsByAlbum(albumId: number): PhotoTag[] {
	return db
		.prepare('SELECT * FROM photo_tags WHERE album_id = ? ORDER BY name')
		.all(albumId) as PhotoTag[];
}

export function createTag(albumId: number, name: string, slug: string): number {
	const result = db
		.prepare('INSERT INTO photo_tags (album_id, name, slug) VALUES (?, ?, ?)')
		.run(albumId, name, slug);
	return result.lastInsertRowid as number;
}

export function deleteTag(id: number): void {
	db.prepare('DELETE FROM photo_tags WHERE id = ?').run(id);
}

export function addTagToPhoto(photoId: number, tagId: number): void {
	db.prepare('INSERT OR IGNORE INTO photo_tag_relations (photo_id, tag_id) VALUES (?, ?)').run(
		photoId,
		tagId
	);
}

export function removeTagFromPhoto(photoId: number, tagId: number): void {
	db.prepare('DELETE FROM photo_tag_relations WHERE photo_id = ? AND tag_id = ?').run(
		photoId,
		tagId
	);
}

export function getPhotoTags(photoId: number): PhotoTag[] {
	return db
		.prepare(
			`
      SELECT pt.* FROM photo_tags pt
      INNER JOIN photo_tag_relations ptr ON pt.id = ptr.tag_id
      WHERE ptr.photo_id = ?
    `
		)
		.all(photoId) as PhotoTag[];
}

export function getPhotoTagRelationsByAlbum(
	albumId: number
): { photo_id: number; tag_id: number }[] {
	return db
		.prepare(
			`
      SELECT ptr.photo_id, ptr.tag_id 
      FROM photo_tag_relations ptr
      INNER JOIN photos p ON ptr.photo_id = p.id
      WHERE p.album_id = ?
    `
		)
		.all(albumId) as { photo_id: number; tag_id: number }[];
}

export function getStats(): { albums: number; photos: number; tags: number } {
	const albums = (db.prepare('SELECT COUNT(*) as count FROM albums').get() as { count: number })
		.count;
	const photos = (db.prepare('SELECT COUNT(*) as count FROM photos').get() as { count: number })
		.count;
	const tags = (db.prepare('SELECT COUNT(*) as count FROM photo_tags').get() as { count: number })
		.count;
	return { albums, photos, tags };
}

// Analytics operations
export type AnalyticsEventType = 'page_view' | 'download' | 'album_download';

export interface AnalyticsEvent {
	id: number;
	album_id: number;
	photo_id: number | null;
	event_type: AnalyticsEventType;
	created_at: string;
}

export function recordAnalyticsEvent(
	albumId: number,
	eventType: AnalyticsEventType,
	photoId: number | null = null
): void {
	try {
		db.prepare('INSERT INTO analytics (album_id, photo_id, event_type) VALUES (?, ?, ?)').run(
			albumId,
			photoId,
			eventType
		);
	} catch (e) {
		console.warn('Failed to record analytics event:', e);
	}
}

export function getAlbumAnalytics(
	albumId: number
): { page_views: number; downloads: number; album_downloads: number } {
	const pageViews = (
		db
			.prepare(
				"SELECT COUNT(*) as count FROM analytics WHERE album_id = ? AND event_type = 'page_view'"
			)
			.get(albumId) as { count: number }
	).count;
	const downloads = (
		db
			.prepare(
				"SELECT COUNT(*) as count FROM analytics WHERE album_id = ? AND event_type = 'download'"
			)
			.get(albumId) as { count: number }
	).count;
	const albumDownloads = (
		db
			.prepare(
				"SELECT COUNT(*) as count FROM analytics WHERE album_id = ? AND event_type = 'album_download'"
			)
			.get(albumId) as { count: number }
	).count;
	return { page_views: pageViews, downloads, album_downloads: albumDownloads };
}

export function getPhotoDownloadCounts(albumId: number): Map<number, number> {
	const results = db
		.prepare(
			`SELECT photo_id, COUNT(*) as count 
			 FROM analytics 
			 WHERE album_id = ? AND event_type = 'download' AND photo_id IS NOT NULL
			 GROUP BY photo_id`
		)
		.all(albumId) as { photo_id: number; count: number }[];
	
	const map = new Map<number, number>();
	for (const row of results) {
		map.set(row.photo_id, row.count);
	}
	return map;
}

export function getAllAnalytics(): {
	album_id: number;
	title: string;
	page_views: number;
	downloads: number;
	album_downloads: number;
}[] {
	return db
		.prepare(
			`
			SELECT 
				a.id as album_id,
				a.title,
				COALESCE(SUM(CASE WHEN an.event_type = 'page_view' THEN 1 ELSE 0 END), 0) as page_views,
				COALESCE(SUM(CASE WHEN an.event_type = 'download' THEN 1 ELSE 0 END), 0) as downloads,
				COALESCE(SUM(CASE WHEN an.event_type = 'album_download' THEN 1 ELSE 0 END), 0) as album_downloads
			FROM albums a
			LEFT JOIN analytics an ON a.id = an.album_id
			GROUP BY a.id, a.title
			ORDER BY page_views DESC
		`
		)
		.all() as {
		album_id: number;
		title: string;
		page_views: number;
		downloads: number;
		album_downloads: number;
	}[];
}

export default db;
