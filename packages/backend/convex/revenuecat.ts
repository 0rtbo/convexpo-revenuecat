/**
 * RevenueCat Integration Module
 *
 * Centralized access to RevenueCat subscription and entitlement data.
 * This module provides a configured instance of the RevenueCat client
 * that can be imported and used across your Convex backend.
 *
 * @see {@link https://github.com/ramonclaudio/convex-revenuecat|convex-revenuecat Documentation}
 */

import { RevenueCat } from "convex-revenuecat";
import { components } from "./_generated/api";

/**
 * Configured RevenueCat client instance.
 *
 * Import this in your queries and mutations to access subscription data:
 *
 * @example
 * ```typescript
 * import { revenuecat, ENTITLEMENT_ID } from "./revenuecat";
 *
 * export const checkPremium = query({
 *   handler: async (ctx) => {
 *     const user = await requireAuth(ctx);
 *     return await revenuecat.hasEntitlement(ctx, {
 *       appUserId: user._id,
 *       entitlementId: ENTITLEMENT_ID,
 *     });
 *   },
 * });
 * ```
 */
export const revenuecat = new RevenueCat(components.revenuecat, {
	REVENUECAT_WEBHOOK_AUTH: process.env.REVENUECAT_WEBHOOK_AUTH,
});

/**
 * The entitlement ID to check for premium access.
 *
 * This should match the entitlement ID configured in:
 * 1. RevenueCat dashboard
 * 2. Client app (EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID)
 *
 * Default: "pro"
 *
 * To change: Set REVENUECAT_ENTITLEMENT_ID environment variable
 */
export const ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID ?? "pro";
