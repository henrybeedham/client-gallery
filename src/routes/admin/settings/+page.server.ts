import type { PageServerLoad, Actions } from './$types';
import { getSettings, updateSettings } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const load: PageServerLoad = async () => {
	const settings = getSettings();
	return { settings };
};

export const actions: Actions = {
	updateSettings: async ({ request }) => {
		const data = await request.formData();
		const currentSettings = getSettings();

		// Get values from form data, falling back to current settings
		const defaultDescription = data.get('defaultDescription')?.toString() ?? currentSettings.defaultDescription;
		const defaultColor = data.get('defaultColor')?.toString() ?? currentSettings.defaultColor;
		const defaultLayoutStyle = (data.get('defaultLayoutStyle')?.toString() ?? currentSettings.defaultLayoutStyle) as 'grid' | 'masonry';
		const defaultSortOrder = (data.get('defaultSortOrder')?.toString() ?? currentSettings.defaultSortOrder) as 'newest' | 'oldest' | 'random';
		const defaultIsPublic = data.has('defaultIsPublic') ? data.get('defaultIsPublic') === 'on' : currentSettings.defaultIsPublic;
		const defaultShowOnHome = data.has('defaultShowOnHome') ? data.get('defaultShowOnHome') === 'on' : currentSettings.defaultShowOnHome;
		
		// Homepage content settings
		const siteTitle = data.get('siteTitle')?.toString() ?? currentSettings.siteTitle;
		const copyrightText = data.get('copyrightText')?.toString() ?? currentSettings.copyrightText;
		const heroTitle = data.get('heroTitle')?.toString() ?? currentSettings.heroTitle;
		const heroDescription = data.get('heroDescription')?.toString() ?? currentSettings.heroDescription;
		const aboutTitle = data.get('aboutTitle')?.toString() ?? currentSettings.aboutTitle;
		const aboutText = data.get('aboutText')?.toString() ?? currentSettings.aboutText;
		const contactEmail = data.get('contactEmail')?.toString() ?? currentSettings.contactEmail;
		const contactPhone = data.get('contactPhone')?.toString() ?? currentSettings.contactPhone;
		const discordWebhook = data.get('discordWebhook')?.toString() ?? currentSettings.discordWebhook;
		const showContactOnHome = data.has('showContactOnHome') ? data.get('showContactOnHome') === 'on' : currentSettings.showContactOnHome;
		const theme = (data.get('theme')?.toString() ?? currentSettings.theme) as 'light' | 'dark';

		try {
			updateSettings({
				defaultDescription,
				defaultColor,
				defaultLayoutStyle,
				defaultSortOrder,
				defaultIsPublic,
				defaultShowOnHome,
				siteTitle,
				copyrightText,
				heroTitle,
				heroDescription,
				aboutTitle,
				aboutText,
				contactEmail,
				contactPhone,
				discordWebhook,
				showContactOnHome,
				theme
			});
			return { success: true, message: 'Settings updated successfully' };
		} catch (e) {
			console.error('Failed to update settings:', e);
			return fail(500, { error: 'Failed to update settings' });
		}
	},

	uploadHeroImage: async ({ request }) => {
		const data = await request.formData();
		const file = data.get('heroImage') as File;

		if (!file || file.size === 0) {
			return fail(400, { error: 'No file uploaded' });
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			return fail(400, { error: 'File must be an image' });
		}

		try {
			// Get current hero image before updating
			const currentSettings = getSettings();
			const oldHeroImage = currentSettings.heroImage;
			
			// Create hero directory if it doesn't exist
			const heroDir = path.resolve('./uploads/hero');
			if (!fs.existsSync(heroDir)) {
				fs.mkdirSync(heroDir, { recursive: true });
			}

			// Generate filename
			const filename = `hero-${Date.now()}.jpg`;
			const filepath = path.join(heroDir, filename);

			// Process and save image
			const buffer = Buffer.from(await file.arrayBuffer());
			await sharp(buffer)
				.resize(2400, 1600, { fit: 'cover', position: 'center' })
				.jpeg({ quality: 85 })
				.toFile(filepath);

			// Update settings
			updateSettings({ heroImage: filename });
			
			// Delete old hero image if it exists
			if (oldHeroImage) {
				const oldFilepath = path.join(heroDir, oldHeroImage);
				if (fs.existsSync(oldFilepath)) {
					try {
						fs.unlinkSync(oldFilepath);
					} catch (e) {
						console.error('Failed to delete old hero image at', oldFilepath, ':', e);
					}
				}
			}

			return { success: true, message: 'Hero image uploaded successfully' };
		} catch (e) {
			console.error('Failed to upload hero image:', e);
			return fail(500, { error: 'Failed to upload hero image' });
		}
	}
};
