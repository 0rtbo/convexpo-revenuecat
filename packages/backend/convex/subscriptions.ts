/**
 * Subscription & Entitlement Queries
 *
 * This module provides SECURE queries to check user subscription status and entitlements.
 * All queries are reactive and will automatically update when RevenueCat webhooks arrive.
 *
 * SECURITY: All queries require authentication and only return data for the authenticated user.
 *
 * @example Client Usage
 * ```typescript
 * import { useQuery } from "convex/react";
 * import { api } from "@app/backend/convex/_generated/api";
 *
 * function MyComponent() {
 *   // No userId needed - automatically uses authenticated user
 *   const hasPremium = useQuery(api.subscriptions.hasPremium, {});
 *
 *   if (hasPremium) {
 *     return <PremiumFeature />;
 *   }
 *   return <PaywallScreen />;
 * }
 * ```
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUser } from "./auth";
// import { requireAuth } from "./auth"; // Uncomment when implementing admin queries
import { ENTITLEMENT_ID, revenuecat } from "./revenuecat";

/**
 * Check if the authenticated user has premium access.
 *
 * SECURITY: Only checks current authenticated user. Returns false if not authenticated.
 *
 * Returns `false` if:
 * - User is not authenticated
 * - User has never made a purchase
 * - Subscription expired or was cancelled
 * - Webhook hasn't arrived yet (right after purchase)
 *
 * @returns `true` if user has premium access, `false` otherwise
 */
export const hasPremium = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return false;

		return await revenuecat.hasEntitlement(ctx, {
			appUserId: user._id,
			entitlementId: ENTITLEMENT_ID,
		});
	},
});

/**
 * Check if the authenticated user has a specific entitlement.
 *
 * SECURITY: Only checks current authenticated user. Returns false if not authenticated.
 *
 * @param entitlementId - The entitlement identifier from RevenueCat dashboard
 * @returns `true` if user has active entitlement, `false` otherwise
 */
export const hasEntitlement = query({
	args: {
		entitlementId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthUser(ctx);
		if (!user) return false;

		return await revenuecat.hasEntitlement(ctx, {
			appUserId: user._id,
			entitlementId: args.entitlementId,
		});
	},
});

/**
 * BRIAN NOTE what ist he acutla differnce between had entitlemnt and the get acgive subsctiption and c
 * can it be the same one query instead of two?
 */
/**
 * Get subscription status for the authenticated user.
 *
 * SECURITY: Only returns minimal data for current authenticated user.
 * Returns null if not authenticated.
 *
 * @returns Subscription status or null
 */
export const getSubscriptionStatus = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return null;

		const subscriptions = await revenuecat.getActiveSubscriptions(ctx, {
			appUserId: user._id,
		});

		// Return minimal data needed for UI
		return subscriptions.map((sub) => ({
			isActive: true,
			expiresAt: sub.expirationAtMs,
			productId: sub.productId,
			store: sub.store,
			// willRenew defaults to true if not present (lifetime purchases, etc.)
			willRenew:
				"willRenew" in sub && typeof sub.willRenew === "boolean"
					? sub.willRenew
					: true,
			// billingIssueDetectedAt is a timestamp when present, null/undefined when not
			isInGracePeriod: Boolean(
				"billingIssueDetectedAt" in sub && sub.billingIssueDetectedAt,
			),
		}));
	},
});

/**
 * Get all active entitlements for the authenticated user.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @returns Array of active entitlements
 */
export const getActiveEntitlements = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getActiveEntitlements(ctx, {
			appUserId: user._id,
		});
	},
});

/**
 * Get all entitlements for the authenticated user (active and inactive).
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @returns Array of all entitlements
 */
export const getAllEntitlements = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getAllEntitlements(ctx, {
			appUserId: user._id,
		});
	},
});

/**
 * Get all active subscriptions for the authenticated user.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @returns Array of active subscription objects
 */
export const getActiveSubscriptions = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getActiveSubscriptions(ctx, {
			appUserId: user._id,
		});
	},
});

/**
 * Get all subscriptions for the authenticated user (active and inactive).
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @returns Array of all subscriptions
 */
export const getAllSubscriptions = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getAllSubscriptions(ctx, {
			appUserId: user._id,
		});
	},
});

/**
 * Get subscriptions currently in billing grace period for the authenticated user.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @returns Array of subscriptions in grace period
 */
export const getSubscriptionsInGracePeriod = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getSubscriptionsInGracePeriod(ctx, {
			appUserId: user._id,
		});
	},
});

/**
 * Check if any of the authenticated user's subscriptions are in grace period.
 *
 * SECURITY: Only checks subscriptions owned by authenticated user.
 * Use this instead of checking by transaction ID to ensure ownership.
 *
 * @returns `true` if any subscription is in grace period, `false` otherwise
 */
export const hasSubscriptionInGracePeriod = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return false;

		const gracePeriodSubs = await revenuecat.getSubscriptionsInGracePeriod(
			ctx,
			{
				appUserId: user._id,
			},
		);

		return gracePeriodSubs.length > 0;
	},
});

/**
 * Get customer record for the authenticated user.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns null if not authenticated.
 *
 * @returns Customer object or null
 */
export const getCustomer = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return null;

		return await revenuecat.getCustomer(ctx, {
			appUserId: user._id,
		});
	},
});

/**
 * Get the authenticated user's enrollment in a specific A/B test experiment.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns null if not authenticated.
 *
 * @param experimentId - The experiment ID from RevenueCat
 * @returns Experiment enrollment data or null
 */
export const getExperiment = query({
	args: {
		experimentId: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthUser(ctx);
		if (!user) return null;

		return await revenuecat.getExperiment(ctx, {
			appUserId: user._id,
			experimentId: args.experimentId,
		});
	},
});

/**
 * Get all experiments the authenticated user is enrolled in.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @returns Array of experiment enrollments
 */
export const getExperiments = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getExperiments(ctx, {
			appUserId: user._id,
		});
	},
});

// ============================================================================
// ADMIN QUERIES - Commented out until role-based access is implemented
// These queries expose data across all users and should only be accessible
// to administrators. Uncomment and add proper admin checking when ready.
// ============================================================================

// /**
//  * Get a transfer event by ID.
//  *
//  * SECURITY: Should be admin-only in production.
//  *
//  * @param eventId - The transfer event ID
//  * @returns Transfer event data or null
//  */
// export const getTransfer = query({
// 	args: {
// 		eventId: v.string(),
// 	},
// 	handler: async (ctx, args) => {
// 		const user = await requireAuth(ctx);
// 		// TODO: Add admin check
// 		// if (!isAdmin(user)) throw new Error("Admin access required");
//
// 		return await revenuecat.getTransfer(ctx, {
// 			eventId: args.eventId,
// 		});
// 	},
// });

// /**
//  * Get recent transfer events.
//  *
//  * SECURITY: Should be admin-only in production.
//  *
//  * @param limit - Maximum number of transfers to return (default: 100)
//  * @returns Array of transfer events
//  */
// export const getTransfers = query({
// 	args: {
// 		limit: v.optional(v.number()),
// 	},
// 	handler: async (ctx, args) => {
// 		const user = await requireAuth(ctx);
// 		// TODO: Add admin check
// 		// if (!isAdmin(user)) throw new Error("Admin access required");
//
// 		return await revenuecat.getTransfers(ctx, {
// 			limit: args.limit,
// 		});
// 	},
// });

/**
 * Get all invoices for the authenticated user.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @returns Array of invoices
 */
export const getInvoices = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getInvoices(ctx, {
			appUserId: user._id,
		});
	},
});

// /**
//  * Get an invoice by ID.
//  *
//  * SECURITY: Should verify invoice ownership before returning.
//  * Commented out until ownership verification is implemented.
//  *
//  * @param invoiceId - The invoice ID
//  * @returns Invoice data or null
//  */
// export const getInvoice = query({
// 	args: {
// 		invoiceId: v.string(),
// 	},
// 	handler: async (ctx, args) => {
// 		const user = await requireAuth(ctx);
// 		const invoice = await revenuecat.getInvoice(ctx, {
// 			invoiceId: args.invoiceId,
// 		});
// 		// TODO: Verify invoice belongs to authenticated user
// 		// if (invoice && invoice.appUserId !== user._id) {
// 		//   return null; // Don't expose other users' invoices
// 		// }
// 		return invoice;
// 	},
// });

/**
 * Get virtual currency balance for a specific currency for the authenticated user.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns null if not authenticated.
 *
 * @param currencyCode - The currency code (e.g., "gems", "coins")
 * @returns Balance amount or null
 */
export const getVirtualCurrencyBalance = query({
	args: {
		currencyCode: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await getAuthUser(ctx);
		if (!user) return null;

		return await revenuecat.getVirtualCurrencyBalance(ctx, {
			appUserId: user._id,
			currencyCode: args.currencyCode,
		});
	},
});

/**
 * Get all virtual currency balances for the authenticated user.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @returns Array of currency balances
 */
export const getVirtualCurrencyBalances = query({
	args: {},
	handler: async (ctx) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getVirtualCurrencyBalances(ctx, {
			appUserId: user._id,
		});
	},
});

/**
 * Get virtual currency transaction history for the authenticated user.
 *
 * SECURITY: Only returns data for current authenticated user.
 * Returns empty array if not authenticated.
 *
 * @param currencyCode - Optional: filter by specific currency
 * @returns Array of transactions
 */
export const getVirtualCurrencyTransactions = query({
	args: {
		currencyCode: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await getAuthUser(ctx);
		if (!user) return [];

		return await revenuecat.getVirtualCurrencyTransactions(ctx, {
			appUserId: user._id,
			currencyCode: args.currencyCode,
		});
	},
});
