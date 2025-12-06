import type { PageServerLoad, Actions } from './$types';
import { getSettings, updateSettings } from '$lib/server/db';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const settings = getSettings();
	return { settings };
};

export const actions: Actions = {
	updateSettings: async ({ request }) => {
		const data = await request.formData();

		const defaultDescription = data.get('defaultDescription')?.toString() || '';
		const defaultColor = data.get('defaultColor')?.toString() || '#3b82f6';
		const defaultLayoutStyle = (data.get('defaultLayoutStyle')?.toString() || 'grid') as
			| 'grid'
			| 'masonry';
		const defaultSortOrder = (data.get('defaultSortOrder')?.toString() || 'oldest') as
			| 'newest'
			| 'oldest'
			| 'random';
		const defaultIsPublic = data.get('defaultIsPublic') === 'on';
		const defaultShowOnHome = data.get('defaultShowOnHome') === 'on';

		try {
			updateSettings({
				defaultDescription,
				defaultColor,
				defaultLayoutStyle,
				defaultSortOrder,
				defaultIsPublic,
				defaultShowOnHome
			});
			return { success: true, message: 'Settings updated successfully' };
		} catch (e) {
			console.error('Failed to update settings:', e);
			return fail(500, { error: 'Failed to update settings' });
		}
	}
};
