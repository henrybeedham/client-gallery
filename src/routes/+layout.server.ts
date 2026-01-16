import type { LayoutServerLoad } from './$types';
import { getSettings } from '$lib/server/db';

export const load: LayoutServerLoad = async () => {
	const settings = getSettings();
	return { settings };
};
