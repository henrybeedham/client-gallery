import type { LayoutServerLoad } from './$types';
import { validateSession } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const isAuthenticated = validateSession(cookies);
	const isLoginPage = url.pathname === '/admin/login';

	if (!isAuthenticated && !isLoginPage) {
		throw redirect(303, '/admin/login');
	}

	if (isAuthenticated && isLoginPage) {
		throw redirect(303, '/admin');
	}

	return {
		isAuthenticated
	};
};
