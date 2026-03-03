# RevenueCat Backend Integration (Convex)

This guide covers the **backend/server-side** RevenueCat integration using the [`convex-revenuecat`](https://github.com/ramonclaudio/convex-revenuecat) component.

For **client-side** setup (React Native), see [revenuecat.md](./revenuecat.md).

---

## 📚 Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Backend Setup](#backend-setup)
- [Querying Subscriptions](#querying-subscriptions)
- [Database Schema](#database-schema)
- [Important Concepts](#important-concepts)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

This integration uses the [`convex-revenuecat`](https://github.com/ramonclaudio/convex-revenuecat) component to:

✅ Sync subscription state from RevenueCat → Convex via webhooks  
✅ Provide real-time, reactive queries for checking entitlements  
✅ Handle all 18 RevenueCat webhook event types automatically  
✅ Store subscription history, invoices, and customer data  
✅ Support A/B experiments and virtual currency  

**What this does NOT do:**
❌ Handle purchases (use RevenueCat SDK in your client)  
❌ Initial sync of existing subscribers (webhook-driven only)  
❌ Poll RevenueCat API (webhook-driven architecture)  

---

## How It Works

```
┌─────────────────┐
│   React Native  │
│       App       │  1. User makes purchase via RevenueCat SDK
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RevenueCat Cloud│  2. RevenueCat processes purchase
└────────┬────────┘
         │
         │ 3. Webhook sent (INITIAL_PURCHASE event)
         ▼
┌─────────────────┐
│  Convex Backend │  4. Stores entitlement in database
│   (This Repo)   │     (packages/backend/convex/*)
└────────┬────────┘
         │
         │ 5. Real-time reactive query
         ▼
┌─────────────────┐
│   React Native  │  6. UI updates automatically
│       App       │     (premium feature unlocked)
└─────────────────┘
```

**Key Timing:** There's a 1-5 second delay between purchase and webhook. During this window, `hasEntitlement()` returns `false`. Use Convex's real-time reactivity to auto-update UI when webhook arrives.

---

## Backend Setup

### Step 1: Generate Webhook Token

Generate a secure random string for webhook authentication:

```bash
openssl rand -base64 32
```

Example output:
```
9K7xZm3pL8qR2nV6wA4yB1cD5eF0gH2iJ3kL4mN5oP6qR7sT8uV9w
```

### Step 2: Set Environment Variable

Add the token to your Convex deployment:

```bash
npx convex env set REVENUECAT_WEBHOOK_AUTH "your-generated-token-here"
```

For **local development**, add to `.env.local`:

```bash
# .env.local or packages/backend/.env.local
REVENUECAT_WEBHOOK_AUTH=your-generated-token-here
```

### Step 3: Deploy Backend

Deploy or restart your Convex backend:

```bash
bun run dev:server
# or for production:
npx convex deploy
```

This will generate the component types and start the webhook endpoint.

### Step 4: Configure RevenueCat Dashboard

1. Log into [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Navigate to **Project Settings** → **Integrations** → **Webhooks**
4. Click **+ New**
5. Configure:

   | Field | Value |
   |-------|-------|
   | **Name** | `Convex` |
   | **Webhook URL** | `https://your-deployment.convex.site/webhooks/revenuecat` |
   | **Authorization header** | Your token from Step 1 |

6. Click **Save**

**Finding your Convex URL:**
- Go to [Convex Dashboard](https://dashboard.convex.dev)
- Select your project → **Settings** → **URL & Deploy Key**
- Copy deployment URL (e.g., `https://happy-animal-123.convex.site`)

### Step 5: Test Webhook

1. In RevenueCat, return to your webhook configuration
2. Click **Send Test Event**
3. Verify success (green checkmark)
4. Check Convex logs:

```bash
npx convex logs
```

You should see:
```
[INFO] RevenueCat webhook received: TEST event
```

---

## Querying Subscriptions

All queries are available in `packages/backend/convex/subscriptions.ts`.

### Basic Usage (Client)

```typescript
import { useQuery } from 'convex/react';
import { api } from '@app/backend/convex/_generated/api';

function PremiumFeature() {
  const currentUser = useQuery(api.auth.currentUser);
  const hasPremium = useQuery(
    api.subscriptions.hasPremium,
    currentUser?.id ? { userId: currentUser.id } : 'skip'
  );

  if (hasPremium === undefined) {
    return <LoadingSpinner />; // Loading state
  }

  if (!hasPremium) {
    return <PaywallScreen />; // No access
  }

  return <PremiumContent />; // Has access
}
```

### Check Custom Entitlement

```typescript
const hasProAccess = useQuery(api.subscriptions.hasEntitlement, {
  appUserId: currentUser?.id,
  entitlementId: 'pro' // Must match RevenueCat dashboard
});
```

### Get Subscription Details

```typescript
const subscriptions = useQuery(api.subscriptions.getActiveSubscriptions, {
  appUserId: currentUser?.id
});

// Returns:
// [
//   {
//     productId: 'premium_monthly',
//     store: 'APP_STORE',
//     expirationAtMs: 1234567890000,
//     periodType: 'NORMAL',
//     willRenew: true,
//     // ... more fields
//   }
// ]
```

### Check Billing Grace Period

```typescript
const inGracePeriod = useQuery(
  api.subscriptions.getSubscriptionsInGracePeriod,
  { appUserId: currentUser?.id }
);

// Show warning if payment failed but they still have access
if (inGracePeriod.length > 0) {
  return <UpdatePaymentMethodBanner />;
}
```

### Get All Entitlements

```typescript
const entitlements = useQuery(api.subscriptions.getActiveEntitlements, {
  appUserId: currentUser?.id
});

// Returns:
// [
//   {
//     entitlementId: 'premium',
//     productId: 'premium_monthly',
//     isActive: true,
//     expirationAtMs: 1234567890000,
//     // ...
//   }
// ]
```

---

## Database Schema

The component creates these tables:

| Table | Purpose |
|-------|---------|
| `customers` | User identity, aliases, subscriber attributes |
| `subscriptions` | Purchase records with product details |
| `entitlements` | Access control state (active/inactive) |
| `experiments` | A/B test enrollments |
| `transfers` | Entitlement transfers between users |
| `invoices` | Web Billing invoice records |
| `virtualCurrencyBalances` | Virtual currency balances |
| `virtualCurrencyTransactions` | Currency adjustments |
| `webhookEvents` | Event log (30-day retention) |
| `rateLimits` | Webhook rate limiting (100 req/min) |

View data in [Convex Dashboard](https://dashboard.convex.dev) → **Data** → Tables.

---

## Important Concepts

### User ID Matching (CRITICAL!)

⚠️ **The `app_user_id` MUST match everywhere:**

1. **Client SDK configuration:**
   ```typescript
   // apps/native/lib/revenue-cat/index.ts
   await Purchases.configure({ 
     apiKey: 'your-key',
     appUserID: String(user._id) // Better Auth user ID
   });
   ```

2. **Backend queries:**
   ```typescript
   // packages/backend/convex/subscriptions.ts
   await revenuecat.hasEntitlement(ctx, {
     appUserId: user._id, // Same ID!
     entitlementId: 'premium',
   });
   ```

**This starter uses:** `String(user._id)` from Better Auth as the RevenueCat `app_user_id`.

### Webhook Timing

After a purchase completes:

1. ✅ RevenueCat SDK returns success
2. ⏱️ **Delay (1-5 seconds, sometimes longer)**
3. ✅ Webhook arrives at Convex
4. ✅ Database updates
5. ✅ UI reactively updates (no polling needed!)

**Don't check immediately after purchase!** Let Convex reactivity handle it.

### Cancellation Behavior

⚠️ **`CANCELLATION` does NOT immediately revoke access!**

When a user cancels:
1. `CANCELLATION` webhook arrives
2. Subscription marked as `willRenew: false`
3. **User keeps access until expiration date**
4. `EXPIRATION` webhook revokes access

Show "Subscription ends on [date]" messaging based on `willRenew` field.

### Grace Period

When payment fails:
1. `BILLING_ISSUE` webhook arrives
2. User **keeps access** during grace period
3. Store attempts to collect payment
4. Either `RENEWAL` (success) or `EXPIRATION` (failure)

Use `getSubscriptionsInGracePeriod()` to prompt payment method update.

### Entitlement IDs

⚠️ **Entitlement IDs are case-sensitive!**

**RevenueCat Dashboard:**
```
Entitlement ID: "premium"
```

**Your code:**
```typescript
// ✅ Correct
hasEntitlement(ctx, { appUserId, entitlementId: 'premium' })

// ❌ Wrong - won't match!
hasEntitlement(ctx, { appUserId, entitlementId: 'Premium' })
```

---

## Testing

### 1. Test Webhook

1. Go to RevenueCat → Webhooks → Your webhook
2. Click **Send Test Event**
3. Verify success checkmark
4. Check logs: `npx convex logs`

### 2. Test Sandbox Purchase

**iOS:**
1. Create sandbox tester in App Store Connect
2. Sign out of production Apple ID
3. Make test purchase in app
4. Sign in with sandbox account when prompted

**Android:**
1. Add test account in Google Play Console
2. Install from internal testing track
3. Make test purchase

### 3. Verify Data

After purchase, check [Convex Dashboard](https://dashboard.convex.dev):

1. **Data** → `customers` → Should have user record
2. **Data** → `subscriptions` → Should have subscription
3. **Data** → `entitlements` → Should show active entitlement
4. **Data** → `webhookEvents` → Should show `INITIAL_PURCHASE`

### 4. Test Queries

In your app:

```typescript
const hasPremium = useQuery(api.subscriptions.hasPremium, {
  userId: currentUser?.id
});

console.log('Has premium:', hasPremium); // Should be true
```

---

## Troubleshooting

### Webhook Returns 401 Unauthorized

**Problem:** Authorization mismatch.

**Fix:**
```bash
# Check environment variable
npx convex env get REVENUECAT_WEBHOOK_AUTH

# Ensure RevenueCat dashboard matches exactly
# Redeploy
npx convex deploy
```

### Webhook Returns 404 Not Found

**Problem:** Route not mounted or wrong URL.

**Fix:**
1. Verify `packages/backend/convex/http.ts` has route
2. Check URL: `https://your-deployment.convex.site/webhooks/revenuecat`
3. Test manually:
   ```bash
   curl -X POST https://your-deployment.convex.site/webhooks/revenuecat \
     -H "Authorization: your-token" \
     -d '{}'
   ```

### Purchase Succeeded but No Entitlement

**Causes:**

1. **Webhook delay** - Wait 10-30 seconds
2. **User ID mismatch:**
   ```typescript
   // Check RevenueCat user ID
   const info = await Purchases.getCustomerInfo();
   console.log('RC user:', info.originalAppUserId);
   
   // Check query user ID
   console.log('Query user:', currentUser.id);
   
   // Must match!
   ```
3. **Entitlement ID mismatch** - Check spelling/casing
4. **Webhook not configured** - Send test event to verify

### Query Returns `undefined`

**Normal!** Convex queries return `undefined` while loading.

```typescript
if (hasPremium === undefined) {
  return <LoadingSpinner />; // Still loading
}

if (hasPremium) {
  return <PremiumContent />; // Access granted
}

return <PaywallScreen />; // No access
```

### User Has Entitlement in RevenueCat but Not in Convex

**Problem:** Existing subscriber before webhook setup.

**Solution:** No historical sync. Options:
1. Wait for next renewal (automatic)
2. User cancels and re-subscribes
3. Manual migration via RevenueCat API

---

## Available Queries

All queries in `api.subscriptions.*`:

| Query | Returns |
|-------|---------|
| `hasEntitlement` | Boolean - has specific entitlement |
| `hasPremium` | Boolean - has "premium" entitlement |
| `getActiveEntitlements` | Array of active entitlements |
| `getAllEntitlements` | Array of all entitlements |
| `getActiveSubscriptions` | Array of active subscriptions |
| `getAllSubscriptions` | Array of all subscriptions |
| `getSubscriptionsInGracePeriod` | Array of subscriptions with billing issues |
| `isInGracePeriod` | Boolean - subscription in grace period |
| `getCustomer` | Customer record with attributes |
| `getExperiment` | A/B test enrollment for experiment |
| `getExperiments` | All A/B test enrollments |
| `getTransfer` | Transfer event by ID |
| `getTransfers` | Recent transfer events |
| `getInvoice` | Invoice by ID (Web Billing) |
| `getInvoices` | All invoices for user |
| `getVirtualCurrencyBalance` | Balance for currency |
| `getVirtualCurrencyBalances` | All currency balances |
| `getVirtualCurrencyTransactions` | Currency transaction history |

---

## Webhook Events

All 18 RevenueCat events are handled:

| Event | Behavior |
|-------|----------|
| `INITIAL_PURCHASE` | Creates subscription, grants entitlements |
| `RENEWAL` | Extends entitlement expiration |
| `CANCELLATION` | Marks cancelled, **keeps access until expiration** |
| `UNCANCELLATION` | Clears cancellation, resumes renewal |
| `EXPIRATION` | **Revokes entitlements** |
| `BILLING_ISSUE` | Keeps access during grace period |
| `SUBSCRIPTION_PAUSED` | Marks paused, **does not revoke** |
| `SUBSCRIPTION_EXTENDED` | Extends expiration (support action) |
| `PRODUCT_CHANGE` | Updates subscription product |
| `NON_RENEWING_PURCHASE` | Grants entitlement for one-time purchase |
| `TEMPORARY_ENTITLEMENT_GRANT` | Grants temp access during outage |
| `REFUND` | **Revokes entitlements immediately** |
| `REFUND_REVERSED` | Restores entitlements |
| `TRANSFER` | Moves entitlements between users |
| `INVOICE_ISSUANCE` | Creates invoice record |
| `VIRTUAL_CURRENCY_TRANSACTION` | Adjusts currency balance |
| `EXPERIMENT_ENROLLMENT` | Records A/B test enrollment |
| `TEST` | Dashboard test event (logged only) |

---

## Additional Resources

- [RevenueCat Webhooks](https://www.revenuecat.com/docs/webhooks)
- [convex-revenuecat GitHub](https://github.com/ramonclaudio/convex-revenuecat)
- [Convex Documentation](https://docs.convex.dev)
- [Client-Side Setup Guide](./revenuecat.md)

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/backend/convex/convex.config.ts` | Registers component |
| `packages/backend/convex/http.ts` | Mounts webhook endpoint |
| `packages/backend/convex/revenuecat.ts` | RevenueCat client instance |
| `packages/backend/convex/subscriptions.ts` | Query helpers |

---

Need help? Check [Troubleshooting](#troubleshooting) or review the webhook events in RevenueCat Dashboard → **Customer History**.
