import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import crypto from 'crypto';

const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getAdminCredentials(): { username: string; password: string } {
	return {
		username: env.ADMIN_USERNAME || 'admin',
		password: env.ADMIN_PASSWORD || 'changeme'
	};
}

function generateSessionToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

// In-memory session store (simple for single-user admin)
const sessions = new Map<string, { expires: number }>();

export function validateCredentials(username: string, password: string): boolean {
	const creds = getAdminCredentials();
	return username === creds.username && password === creds.password;
}

export function createSession(cookies: Cookies): void {
	const token = generateSessionToken();
	const expires = Date.now() + SESSION_MAX_AGE * 1000;

	sessions.set(token, { expires });

	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		maxAge: SESSION_MAX_AGE,
		secure: process.env.NODE_ENV === 'production'
	});
}

export function validateSession(cookies: Cookies): boolean {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return false;

	const session = sessions.get(token);
	if (!session) return false;

	if (session.expires < Date.now()) {
		sessions.delete(token);
		return false;
	}

	return true;
}

export function destroySession(cookies: Cookies): void {
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		sessions.delete(token);
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
