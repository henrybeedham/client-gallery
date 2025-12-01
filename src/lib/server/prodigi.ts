import { env } from '$env/dynamic/private';

// Prodigi API Types
export interface ProdigiAddress {
	line1: string;
	line2?: string;
	postalOrZipCode: string;
	countryCode: string;
	townOrCity: string;
	stateOrCounty?: string;
}

export interface ProdigiRecipient {
	name: string;
	email?: string;
	phoneNumber?: string;
	address: ProdigiAddress;
}

export interface ProdigiAsset {
	printArea: string;
	url: string;
}

export interface ProdigiItem {
	merchantReference?: string;
	sku: string;
	copies: number;
	sizing?: 'fillPrintArea' | 'fitPrintArea' | 'stretchToPrintArea';
	assets: ProdigiAsset[];
}

export interface ProdigiOrderRequest {
	merchantReference?: string;
	shippingMethod: 'Budget' | 'Standard' | 'Express' | 'Overnight';
	recipient: ProdigiRecipient;
	items: ProdigiItem[];
	idempotencyKey?: string;
}

export interface ProdigiCost {
	amount: string;
	currency: string;
}

export interface ProdigiCharge {
	id: string;
	prodigiInvoiceNumber?: string;
	totalCost: ProdigiCost;
	items: Array<{
		id: string;
		description: string;
		itemCost: ProdigiCost;
	}>;
}

export interface ProdigiShipment {
	id: string;
	carrier: {
		name: string;
		service: string;
	};
	tracking: {
		number?: string;
		url?: string;
	};
	dispatchDate: string;
	items: Array<{ itemId: string }>;
	fulfillmentLocation: {
		countryCode: string;
		labCode: string;
	};
}

export interface ProdigiOrderStatus {
	stage:
		| 'InProgress'
		| 'Complete'
		| 'Cancelled'
		| 'AwaitingPayment'
		| 'Draft'
		| 'OnHold'
		| 'Unknown';
	issues?: Array<{
		objectId: string;
		errorCode: string;
		description: string;
		authorisationDetails?: {
			authorisationUrl: string;
		};
	}>;
	details?: {
		downloadAssets: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
		printReadyAssetsPrepared: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
		allocateProductionLocation: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
		inProduction: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
		shipping: 'NotStarted' | 'InProgress' | 'Complete' | 'Error';
	};
}

export interface ProdigiOrder {
	id: string;
	created: string;
	lastUpdated: string;
	callbackUrl?: string;
	merchantReference?: string;
	shippingMethod: string;
	idempotencyKey?: string;
	status: ProdigiOrderStatus;
	charges: ProdigiCharge[];
	shipments: ProdigiShipment[];
	recipient: ProdigiRecipient;
	items: Array<{
		id: string;
		status: string;
		merchantReference?: string;
		sku: string;
		copies: number;
		sizing: string;
		recipientCost?: ProdigiCost;
		assets: ProdigiAsset[];
	}>;
}

export interface ProdigiProduct {
	sku: string;
	description: string;
	productDimensions?: {
		width: number;
		height: number;
		unit: string;
	};
	attributes: Record<string, string>;
	printAreas: Array<{
		name: string;
		required: boolean;
	}>;
}

export interface ProdigiQuoteRequest {
	shippingMethod: 'Budget' | 'Standard' | 'Express' | 'Overnight';
	destinationCountryCode: string;
	currencyCode: string;
	items: Array<{
		sku: string;
		copies: number;
		assets: ProdigiAsset[];
	}>;
}

export interface ProdigiQuote {
	shipmentMethod: string;
	costSummary: {
		items: ProdigiCost;
		shipping: ProdigiCost;
		totalCost: ProdigiCost;
	};
	quotes: Array<{
		sku: string;
		copies: number;
		unitCost: ProdigiCost;
		totalCost: ProdigiCost;
	}>;
}

export class ProdigiClient {
	private apiKey: string;
	private baseUrl: string;

	constructor() {
		this.apiKey = env.PRODIGI_API_KEY || '';
		const apiEnv = env.PRODIGI_API_ENV || 'sandbox';
		this.baseUrl =
			apiEnv === 'production'
				? 'https://api.prodigi.com/v4.0'
				: 'https://api.sandbox.prodigi.com/v4.0';
	}

	private async request<T>(
		method: string,
		endpoint: string,
		body?: Record<string, unknown>
	): Promise<T> {
		if (!this.apiKey) {
			throw new Error('Prodigi API key is not configured');
		}

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method,
			headers: {
				'X-API-Key': this.apiKey,
				'Content-Type': 'application/json'
			},
			body: body ? JSON.stringify(body) : undefined
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.traceParent || data.message || `Prodigi API error: ${response.status}`);
		}

		return data;
	}

	/**
	 * Check if Prodigi is configured and available
	 */
	isConfigured(): boolean {
		return !!this.apiKey;
	}

	/**
	 * Create a new print order
	 */
	async createOrder(orderData: ProdigiOrderRequest): Promise<ProdigiOrder> {
		const response = await this.request<{ order: ProdigiOrder }>('POST', '/Orders', orderData);
		return response.order;
	}

	/**
	 * Get an order by ID
	 */
	async getOrder(orderId: string): Promise<ProdigiOrder> {
		const response = await this.request<{ order: ProdigiOrder }>('GET', `/Orders/${orderId}`);
		return response.order;
	}

	/**
	 * Get available actions for an order
	 */
	async getOrderActions(orderId: string): Promise<{ availableActions: string[] }> {
		return this.request<{ availableActions: string[] }>('GET', `/Orders/${orderId}/actions`);
	}

	/**
	 * Cancel an order
	 */
	async cancelOrder(orderId: string): Promise<ProdigiOrder> {
		const response = await this.request<{ order: ProdigiOrder }>(
			'POST',
			`/Orders/${orderId}/actions/cancel`
		);
		return response.order;
	}

	/**
	 * Get a quote for an order
	 */
	async getQuote(quoteRequest: ProdigiQuoteRequest): Promise<ProdigiQuote> {
		const response = await this.request<{ quotes: ProdigiQuote[] }>(
			'POST',
			'/Quotes',
			quoteRequest
		);
		// Return the first quote (for the requested shipping method)
		if (response.quotes && response.quotes.length > 0) {
			return response.quotes[0];
		}
		throw new Error('No quote available');
	}

	/**
	 * Get product information by SKU
	 */
	async getProduct(sku: string): Promise<ProdigiProduct> {
		const response = await this.request<{ product: ProdigiProduct }>('GET', `/Products/${sku}`);
		return response.product;
	}

	/**
	 * Search products
	 */
	async searchProducts(params: {
		top?: number;
		skip?: number;
		skuPrefix?: string;
	}): Promise<{ products: ProdigiProduct[]; count: number }> {
		const searchParams = new URLSearchParams();
		if (params.top) searchParams.set('$top', params.top.toString());
		if (params.skip) searchParams.set('$skip', params.skip.toString());
		if (params.skuPrefix) searchParams.set('sku', params.skuPrefix);

		const endpoint = `/Products${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
		return this.request<{ products: ProdigiProduct[]; count: number }>('GET', endpoint);
	}
}

// Singleton instance
let prodigiClient: ProdigiClient | null = null;

export function getProdigiClient(): ProdigiClient {
	if (!prodigiClient) {
		prodigiClient = new ProdigiClient();
	}
	return prodigiClient;
}

// Common print product SKUs for photos
export const PHOTO_PRINT_SKUS = {
	// Standard photo prints (various sizes)
	'4x6': 'GLOBAL-PHO-4x6',
	'5x7': 'GLOBAL-PHO-5x7',
	'8x10': 'GLOBAL-PHO-8x10',
	'8x12': 'GLOBAL-PHO-8x12',
	'10x12': 'GLOBAL-PHO-10x12',
	'12x12': 'GLOBAL-PHO-12x12',
	'11x14': 'GLOBAL-PHO-11x14',
	'12x16': 'GLOBAL-PHO-12x16',
	'12x18': 'GLOBAL-PHO-12x18',
	'16x20': 'GLOBAL-PHO-16x20',
	'16x24': 'GLOBAL-PHO-16x24',
	'20x24': 'GLOBAL-PHO-20x24',
	'20x30': 'GLOBAL-PHO-20x30'
} as const;

export type PhotoPrintSize = keyof typeof PHOTO_PRINT_SKUS;

/**
 * Extract order status and cost from Prodigi order response
 * This utility function helps maintain consistency across order creation and status checking
 */
export function extractOrderStatusAndCost(
	prodigiOrder: ProdigiOrder,
	fallbackStatus = 'pending'
): {
	status: string;
	totalCost: ProdigiCost | undefined;
} {
	const status = prodigiOrder.status?.stage?.toLowerCase() || fallbackStatus;
	const totalCost = prodigiOrder.charges?.[0]?.totalCost;
	return { status, totalCost };
}
