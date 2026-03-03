# RevenueCat Integration Guide

This guide explains how RevenueCat is configured in this starter, how to set it
up from scratch, and how to verify it is working.

## 1. Dashboard Setup (RevenueCat)

### 1.1 Create Project

In RevenueCat dashboard:

1. Create project
2. Choose category
3. Choose platform: `React Native`

### 1.2 Create Entitlement

Create an entitlement ID that your app will check for access.

- Recommended: `pro`
- Alternatives: `premium`, `unlimited`, etc.

### 1.3 Add Products and Offering

1. Add App Store / Play Store products in RevenueCat
2. Attach those products to an offering
3. Recommended offering ID: `default`

### 1.4 Copy API Keys

From RevenueCat project settings:

- iOS public SDK key (`appl_...`)
- Android public SDK key (`goog_...`)

## 2. Environment Variables

Create `apps/native/.env` from `apps/native/.env.example` and set:

```dotenv
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
```

Notes:

- `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID` defaults to `pro` if missing.
- `EXPO_PUBLIC_REVENUECAT_OFFERING_ID` is optional. If set, the app will try
  that offering first.

## 3. Where RevenueCat Is Wired

### Core SDK wrappers

- `apps/native/lib/revenue-cat/index.ts`

Contains:

- SDK configure
- entitlement checks
- package lookup
- purchase / restore / sync helpers
- user identify / logout / attribute helpers

### App provider

- `apps/native/providers/RevenueCatProvider.tsx`

Handles:

- one-time SDK init
- entitlement state (`isPro`)
- foreground refresh
- customer info listener
- auth-to-RevenueCat identity sync

### Root mount

- `apps/native/app/_layout.tsx`

`RevenueCatProvider` is mounted at app root, so hooks work everywhere under it.

### Sign-out + account deletion behavior

- `apps/native/app/(root)/(main)/settings/_layout.tsx`
- `apps/native/app/(root)/(main)/settings/index.tsx`

Both flows call RevenueCat logout before auth logout/delete to prevent stale
RevenueCat identity carry-over between users.

## 4. Identity Strategy in This Starter

RevenueCat user identity uses:

- `String(user._id)` from Convex auth user record

This gives a stable user key per account and keeps purchase state attached to
the authenticated user across sessions/devices.

## 5. Using RevenueCat in Screens

Import hooks from:

- `@/providers/RevenueCatProvider`

Example:

```tsx
import { useRevenueCat } from "@/providers/RevenueCatProvider";

export function ExamplePaywallAction() {
	const { isPro, getPackages, purchasePackage, restorePurchases } = useRevenueCat();

	// isPro -> current entitlement status
	// getPackages() -> offering packages
	// purchasePackage(pkg) -> purchase selected package
	// restorePurchases() -> restore previous purchases
}
```

## 6. Verification Checklist

1. App starts without RevenueCat init warning
2. `getPackages()` returns at least one package
3. Test purchase succeeds in sandbox
4. After purchase, `isPro` becomes `true`
5. On reinstall / new device with same account, restore works
6. On sign out + new sign in, entitlement does not leak between users

## 7. Troubleshooting

### "Initialization skipped: missing EXPO_PUBLIC_REVENUECAT_* key"

- Ensure `apps/native/.env` exists
- Ensure both iOS and Android keys are set
- Restart Expo after env changes

### No packages returned

- Confirm products are attached to offering in RevenueCat
- Confirm `EXPO_PUBLIC_REVENUECAT_OFFERING_ID` matches dashboard offering ID
- If unsure, remove offering env var to let app fall back to current offering

### Purchase succeeds in store but app not unlocked

- Confirm entitlement ID in dashboard matches
  `EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID`
- Confirm purchased product is attached to that entitlement

### Wrong user gets entitlement after account switch

- Ensure sign-out flow calls RevenueCat logout before auth logout
- This starter already does this in settings layout and delete-user flow

## 8. Production Launch Checklist

1. Replace sandbox/test products with production store products
2. Validate entitlement and offering IDs in production env
3. Test iOS and Android purchases on real devices
4. Test restore purchases on both platforms
5. Test sign out / sign in with two different accounts
6. Verify App Store and Play billing configurations are complete
