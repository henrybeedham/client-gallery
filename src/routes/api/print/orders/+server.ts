import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { getProdigiClient } from '$lib/server/prodigi';
import {
	getAllPrintOrders,
	getPrintOrderById,
	updatePrintOrderStatus,
	updatePrintOrderData
} from '$lib/server/db';

// GET /api/print/orders - List all orders
export const GET: RequestHandler = async ({ url }) => {
	const orderId = url.searchParams.get('id');

	if (orderId) {
		// Get single order
		const order = getPrintOrderById(parseInt(orderId, 10));
		if (!order) {
			throw error(404, 'Order not found');
		}

		// If order has a Prodigi ID, fetch latest status
		if (order.prodigi_order_id) {
			const prodigi = getProdigiClient();
			if (prodigi.isConfigured()) {
				try {
					const prodigiOrder = await prodigi.getOrder(order.prodigi_order_id);

					// Update local order with latest status
					const status = prodigiOrder.status?.stage?.toLowerCase() || order.status;
					const totalCost = prodigiOrder.charges?.[0]?.totalCost;

					if (totalCost) {
						updatePrintOrderStatus(order.id, status, totalCost.amount, totalCost.currency);
					} else {
						updatePrintOrderStatus(order.id, status);
					}

					// Store full order data
					updatePrintOrderData(order.id, JSON.stringify(prodigiOrder));

					return json({
						order: {
							...order,
							status,
							total_cost: totalCost?.amount || order.total_cost,
							currency: totalCost?.currency || order.currency,
							prodigiOrder
						}
					});
				} catch (err) {
					console.error('Failed to fetch Prodigi order status:', err);
					// Return local order data if Prodigi fetch fails
				}
			}
		}

		// Parse stored order data if available
		let prodigiOrder = null;
		if (order.order_data) {
			try {
				prodigiOrder = JSON.parse(order.order_data);
			} catch {
				// Ignore parse errors
			}
		}

		return json({
			order: {
				...order,
				prodigiOrder
			}
		});
	}

	// List all orders
	const orders = getAllPrintOrders();
	return json({ orders });
};
