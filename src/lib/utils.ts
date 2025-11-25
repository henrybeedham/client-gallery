import { marked } from 'marked';

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function renderMarkdown(text: string | null): string {
	if (!text) return '';
	return marked(text, { breaks: true, gfm: true }) as string;
}

export function formatTimeRemaining(milliseconds: number): string {
	if (milliseconds <= 0) return 'expired';

	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		return days === 1 ? '1 day' : `${days} days`;
	}
	if (hours > 0) {
		return hours === 1 ? '1 hour' : `${hours} hours`;
	}
	if (minutes > 0) {
		return minutes === 1 ? '1 minute' : `${minutes} minutes`;
	}
	return 'less than a minute';
}
