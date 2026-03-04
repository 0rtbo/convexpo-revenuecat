import { Platform } from "react-native";
import Purchases, {
	type CustomerInfo,
	LOG_LEVEL,
	type PurchasesOffering,
	type PurchasesPackage,
} from "react-native-purchases";

// =============================================================================
// RevenueCat SDK Utility Layer
//
// Thin wrappers around `react-native-purchases`. These are pure functions with
// no React state — they talk directly to the SDK.
//
// ## Who should call these?
//
// - `RevenueCatProvider`  — owns lifecycle (configure, listener, foreground refresh)
// - `create-profile.ts`  — fire-and-forget identity sync on sign-in
// - Provider consumers    — via the context methods, NOT by importing these directly
//
// If you are in a React component or hook, prefer `useRevenueCat()` or
// `useIsPro()` instead of importing from this file.
// =============================================================================

const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

function normalizeEnvValue(value: string | undefined): string | undefined {
	const normalized = value?.trim();
	return normalized ? normalized : undefined;
}

const proEntitlementId =
	normalizeEnvValue(process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID) ?? "pro";
const preferredOfferingId = normalizeEnvValue(
	process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID,
);

export const PRO_ENTITLEMENT_IDS: readonly string[] = [proEntitlementId];

let hasConfiguredRevenueCat = false;

export type RevenueCatInitFailureReason =
	| "unsupported_platform"
	| "missing_api_key";

export type RevenueCatInitResult =
	| { configured: true }
	| {
			configured: false;
			reason: RevenueCatInitFailureReason;
	  };

type RevenueCatPurchaseError = {
	userCancelled?: boolean;
};

type CustomerInfoListener = (customerInfo: CustomerInfo) => void;

type PurchasesWithRemoveListener = typeof Purchases & {
	removeCustomerInfoUpdateListener?: (listener: CustomerInfoListener) => void;
};

/**
 * Check whether a CustomerInfo object contains an active pro entitlement.
 *
 * **When to use:** Inside the provider or any callback that already has a
 * `CustomerInfo` instance (e.g. `onCustomerInfoUpdated` listener).
 * In components, use `useIsPro()` instead.
 */
export function hasProEntitlement(customerInfo: CustomerInfo | null): boolean {
	if (!customerInfo) return false;

	return PRO_ENTITLEMENT_IDS.some(
		(id) => customerInfo.entitlements.active[id] !== undefined,
	);
}

function hasPackages(
	offering: PurchasesOffering | null | undefined,
): offering is PurchasesOffering {
	return !!offering && offering.availablePackages.length > 0;
}

function pickFirstOfferingWithPackages(
	offeringsById: Record<string, PurchasesOffering>,
): PurchasesOffering | null {
	for (const offering of Object.values(offeringsById)) {
		if (hasPackages(offering)) {
			return offering;
		}
	}
	return null;
}

/**
 * One-time SDK initialization. Safe to call multiple times (no-ops after first).
 *
 * **When to use:** Only in `RevenueCatProvider` on mount. Never call from
 * screens or hooks — the provider owns the SDK lifecycle.
 */
export async function configureRevenueCat(): Promise<RevenueCatInitResult> {
	if (Platform.OS !== "ios" && Platform.OS !== "android") {
		return { configured: false, reason: "unsupported_platform" };
	}

	if (hasConfiguredRevenueCat) {
		return { configured: true };
	}

	const apiKey = Platform.OS === "ios" ? iosApiKey : androidApiKey;

	if (!apiKey) {
		return { configured: false, reason: "missing_api_key" };
	}

	// Only show RevenueCat SDK logs in dev, and keep them minimal
	Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);

	Purchases.configure({ apiKey });

	hasConfiguredRevenueCat = true;

	return { configured: true };
}

/**
 * Subscribe to real-time entitlement changes from the SDK.
 * Returns an unsubscribe function for effect cleanup.
 *
 * **When to use:** Only in `RevenueCatProvider` init effect. The provider
 * pipes updates into `isPro` state so screens never need this directly.
 */
export function onCustomerInfoUpdated(
	listener: CustomerInfoListener,
): () => void {
	Purchases.addCustomerInfoUpdateListener(listener);

	return () => {
		(
			Purchases as PurchasesWithRemoveListener
		).removeCustomerInfoUpdateListener?.(listener);
	};
}

/**
 * Fetch latest CustomerInfo and return current pro status.
 *
 * **When to use:** Provider init, foreground refresh, and post-cancellation
 * recovery. Screens should call `refreshEntitlement()` from `useRevenueCat()`
 * if they need an on-demand check (rare — the provider handles most cases).
 */
export async function refreshProEntitlement(): Promise<boolean> {
	const customerInfo = await Purchases.getCustomerInfo();
	return hasProEntitlement(customerInfo);
}

/**
 * Identify the user in RevenueCat via `Purchases.logIn`.
 * Links purchases to the account so entitlements follow across devices.
 * Returns the pro entitlement status after login.
 *
 * **When to use:**
 * - `create-profile.ts` — fire-and-forget on sign-in (new + returning users)
 * - `RevenueCatProvider` — backstop sync for already-authenticated app launches
 *
 * Always pass the stable auth user ID (for this starter: `String(user._id)`).
 */
export async function identifyUser(userId: string): Promise<boolean> {
	const { customerInfo } = await Purchases.logIn(userId);
	return hasProEntitlement(customerInfo);
}

/**
 * Log out the current user from RevenueCat (resets to anonymous ID).
 *
 * **When to use:** Sign-out and account deletion flows only.
 * Must be called **before** `db.auth.signOut()` to avoid carrying a stale
 * RevenueCat identity into the next session.
 */
export async function logOutUser(): Promise<void> {
	await Purchases.logOut();
}

/**
 * Set user attributes for tracking in the RevenueCat dashboard.
 *
 * **When to use:**
 * - `create-profile.ts` — fire-and-forget after `identifyUser` on sign-in
 * - `RevenueCatProvider` — backstop sync on already-authenticated launches
 *
 * Only call when attribute data actually changes (auth/profile updates),
 * not on every render or effect cycle.
 */
export async function setUserAttributes(attributes: {
	email?: string;
	displayName?: string;
}): Promise<void> {
	if (attributes.email) {
		await Purchases.setEmail(attributes.email);
	}
	if (attributes.displayName) {
		await Purchases.setDisplayName(attributes.displayName);
	}
}

async function getOffering(): Promise<PurchasesOffering | null> {
	const offerings = await Purchases.getOfferings();

	// If configured, prefer a specific offering ID for deterministic starter behavior
	if (preferredOfferingId) {
		const preferredOffering = offerings.all[preferredOfferingId];
		if (hasPackages(preferredOffering)) {
			return preferredOffering;
		}

		if (__DEV__) {
			console.warn(
				`[RevenueCat] Offering '${preferredOfferingId}' was configured but has no available packages; falling back to current offering.`,
			);
		}
	}

	// Try current offering first (if it has packages)
	if (hasPackages(offerings.current)) {
		return offerings.current;
	}

	// Fallback: find any offering with packages
	const fallbackOffering = pickFirstOfferingWithPackages(offerings.all);
	if (fallbackOffering) {
		return fallbackOffering;
	}

	// Last resort: return current (even if empty)
	return offerings.current ?? null;
}

/**
 * Get available subscription packages from the resolved offering.
 *
 * **When to use:** Paywall / subscription picker screens that need to
 * display package options with prices. Call via `useRevenueCat().getPackages()`
 * in components — don't import this directly.
 *
 * Offering selection: if `EXPO_PUBLIC_REVENUECAT_OFFERING_ID` is set and has
 * packages, that offering is used. Otherwise: `offerings.current`, then the
 * first offering with packages, then `current` even if empty.
 */
export async function getPackages(): Promise<PurchasesPackage[]> {
	const offering = await getOffering();
	return offering?.availablePackages ?? [];
}

/**
 * Attempt a package purchase and return the resulting pro status.
 *
 * **When to use:** Only from `RevenueCatProvider.purchasePackage()` which
 * handles cancellation recovery and state updates. Never call directly
 * from screens — use `useRevenueCat().purchasePackage(pack)`.
 *
 * Throws on cancellation — the provider catches via `isPurchaseCancelledError`.
 */
export async function purchaseAndCheckPro(
	pack: PurchasesPackage,
): Promise<boolean> {
	const { customerInfo } = await Purchases.purchasePackage(pack);
	return hasProEntitlement(customerInfo);
}

/**
 * Restore purchases from the App Store / Play Store.
 *
 * **When to use:** "Restore Purchases" button in paywall or settings.
 * Call via `useRevenueCat().restorePurchases()` — not directly.
 */
export async function restoreAndCheckPro(): Promise<boolean> {
	const customerInfo = await Purchases.restorePurchases();
	return hasProEntitlement(customerInfo);
}

/**
 * Force-sync local store state with RevenueCat servers.
 *
 * **When to use:** Debug / recovery tool only. The normal purchase and
 * restore flows already sync. Call via `useRevenueCat().syncPurchases()`.
 */
export async function syncAndCheckPro(): Promise<boolean> {
	const { customerInfo } = await Purchases.syncPurchasesForResult();
	return hasProEntitlement(customerInfo);
}

/**
 * Check if an error thrown by `purchaseAndCheckPro` is a user cancellation.
 *
 * **When to use:** Only in the provider's `purchasePackage` catch block.
 * Cancellation is not a real error — the provider recovers by refreshing
 * entitlement and returning the current `isPro` value.
 */
export function isPurchaseCancelledError(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;

	return (error as RevenueCatPurchaseError).userCancelled === true;
}
