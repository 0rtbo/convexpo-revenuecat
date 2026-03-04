# 🚀 Quick Start: RevenueCat Backend

**5-minute setup guide** to get your RevenueCat webhook integration running.

---

## Prerequisites

- Convex account and project set up
- RevenueCat account with a project created

---

## Step 1: Generate Webhook Token (30 seconds)

```bash
openssl rand -base64 32
```

Copy the output (example: `9K7xZm3pL8qR2nV6wA4yB1cD5eF0gH2i...`)

---

## Step 2: Set Environment Variable (30 seconds)

```bash
cd packages/backend
npx convex env set REVENUECAT_WEBHOOK_AUTH "paste-your-token-here"
```

---

## Step 3: Deploy Backend (1 minute)

```bash
bun run dev:server
# or for production:
npx convex deploy
```

Copy your deployment URL from the output (e.g., `https://happy-animal-123.convex.site`)

---

## Step 4: Configure RevenueCat Webhook (2 minutes)

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Navigate to **Project Settings** → **Integrations** → **Webhooks**
3. Click **+ New**
4. Fill in:
   - **Name**: `Convex`
   - **Webhook URL**: `https://your-deployment.convex.site/webhooks/revenuecat`
   - **Authorization header**: Paste your token from Step 1
5. Click **Save**

---

## Step 5: Test It (1 minute)

1. In RevenueCat webhook settings, click **Send Test Event**
2. Verify green checkmark ✅
3. Check Convex logs:

```bash
npx convex logs
```

Expected output:
```
[INFO] RevenueCat webhook received: TEST event
```

---

## ✅ Done!

Your backend is now receiving RevenueCat webhooks!

---

## Next Steps

### Test with a Real Purchase

1. Make a sandbox purchase in your app
2. Wait 5-10 seconds for webhook
3. Check Convex Dashboard → Data → `entitlements` table
4. Query from your app:

```typescript
import { useQuery } from 'convex/react';
import { api } from '@app/backend/convex/_generated/api';

const hasPremium = useQuery(api.subscriptions.hasPremium, {
  userId: currentUser?.id
});
```

### Read Full Docs

- **[SETUP.md](./docs/SETUP.md)** - Complete setup guide
- **[revenuecat-backend.md](./docs/revenuecat-backend.md)** - Backend usage guide
- **[TESTING.md](./docs/TESTING.md)** - Testing procedures
- **[INTEGRATION-SUMMARY.md](./docs/INTEGRATION-SUMMARY.md)** - What was implemented

---

## Troubleshooting

### Webhook returns 401

Token mismatch. Verify:
```bash
npx convex env get REVENUECAT_WEBHOOK_AUTH
```
Must match RevenueCat exactly.

### Webhook returns 404

Wrong URL or backend not running. Check:
- URL format: `https://your-deployment.convex.site/webhooks/revenuecat`
- Backend is deployed: `npx convex deploy`

### Test event succeeds but no logs

Wait a moment, then check:
```bash
npx convex logs --tail
```

---

## Available Queries

All queries in `api.subscriptions.*` automatically use the authenticated user:

```typescript
// Check entitlement (uses authenticated user automatically!)
api.subscriptions.hasPremium({})
api.subscriptions.hasEntitlement({ entitlementId: "pro" })

// Get subscriptions
api.subscriptions.getActiveSubscriptions({})

// Get entitlements
api.subscriptions.getActiveEntitlements({})

// Check billing issues
api.subscriptions.getSubscriptionsInGracePeriod({})

// And more queries...
```

> 🔒 **Security:** No `userId` parameter needed - all queries use the authenticated user's ID automatically, preventing users from querying other users' subscription data.

See [revenuecat-backend.md](./docs/revenuecat-backend.md#available-queries) for full list.

---

**That's it!** Your backend is ready to sync RevenueCat subscriptions in real-time.
