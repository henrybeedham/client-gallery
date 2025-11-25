import type { Actions } from './$types';
import { destroySession } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ cookies }) => {
		destroySession(cookies);
		throw redirect(303, '/admin/login');
	}
};
