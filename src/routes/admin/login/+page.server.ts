import type { Actions } from './$types';
import { validateCredentials, createSession } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString() || '';
		const password = data.get('password')?.toString() || '';

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required' });
		}

		if (!validateCredentials(username, password)) {
			return fail(401, { error: 'Invalid credentials' });
		}

		createSession(cookies);
		throw redirect(303, '/admin');
	}
};
