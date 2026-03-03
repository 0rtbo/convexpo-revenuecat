# Complete Setup Guide

This guide walks you through setting up the entire stack from scratch.

## Prerequisites

- [Bun](https://bun.sh) installed
- [RevenueCat account](https://app.revenuecat.com)
- [Convex account](https://www.convex.dev)
- iOS/Android development environment for mobile app

---

## Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd convexpo-revenuecat
bun install
```

---

## Step 2: Convex Backend Setup

### 2.1 Initialize Convex

```bash
cd packages/backend
npx convex dev --configure
```

This will:
- Create a new Convex project
- Generate `convex/_generated` files
- Start the development server

### 2.2 Configure Environment Variables

Generate a webhook authorization token:

```bash
openssl rand -base64 32
```

Set it in Convex:

```bash
npx convex env set REVENUECAT_WEBHOOK_AUTH "your-generated-token"
```

For local development, create `.env.local`:

```bash
cp .env.example .env.local
# Edit .env.local and add your token
```

### 2.3 Deploy Backend

```bash
npx convex deploy
```

Note your deployment URL from the output (e.g., `https://happy-animal-123.convex.site`)

---

## Step 3: RevenueCat Setup

### 3.1 Create Project

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Click **Create New Project**
3. Choose **React Native** as platform
4. Complete the setup wizard

### 3.2 Create Entitlement

1. In your project, go to **Entitlements**
2. Click **+ New Entitlement**
3. Enter ID: `pro` (or `premium`)
4. Save

### 3.3 Add Products

#### iOS (App Store)

1. Create products in [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to your app → **Monetization** → **Subscriptions**
   - Create subscription group and products
   - Note the product IDs (e.g., `premium_monthly`, `premium_annual`)

2. Add products in RevenueCat:
   - Go to **Products**
   - Click **+ New**
   - Select **App Store**
   - Enter product ID
   - Attach to your entitlement

#### Android (Google Play)

1. Create products in [Google Play Console](https://play.google.com/console)
   - Navigate to your app → **Monetize** → **Subscriptions**
   - Create products
   - Note the product IDs

2. Add products in RevenueCat:
   - Go to **Products**
   - Click **+ New**
   - Select **Google Play**
   - Enter product ID
   - Attach to your entitlement

### 3.4 Create Offering

1. Go to **Offerings**
2. Click **+ New Offering**
3. Set identifier: `default`
4. Add your products to packages
5. Make it the current offering

### 3.5 Get API Keys

1. Go to **Project Settings** → **API Keys**
2. Copy:
   - iOS public SDK key (starts with `appl_`)
   - Android public SDK key (starts with `goog_`)

### 3.6 Configure Webhook

1. Go to **Project Settings** → **Integrations** → **Webhooks**
2. Click **+ New**
3. Configure:
   - **Name**: `Convex`
   - **Webhook URL**: `https://your-deployment.convex.site/webhooks/revenuecat`
   - **Authorization header**: Your token from Step 2.2
4. Click **Save**
5. Click **Send Test Event** to verify

Check Convex logs to verify:
```bash
npx convex logs
```

You should see:
```
[INFO] RevenueCat webhook received: TEST event
```

---

## Step 4: React Native App Setup

### 4.1 Configure Environment Variables

```bash
cd apps/native
cp .env.example .env
```

Edit `apps/native/.env`:

```bash
# RevenueCat API Keys (from Step 3.5)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_your_ios_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_your_android_key_here

# Entitlement and Offering (from Step 3.2 and 3.4)
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default

# Convex URL (from Step 2.3)
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.site
```

### 4.2 Install Dependencies

```bash
cd apps/native
bun install
```

### 4.3 iOS Setup

```bash
cd ios
pod install
cd ..
```

Configure signing in Xcode:
1. Open `ios/YourApp.xcworkspace`
2. Select your target
3. Go to **Signing & Capabilities**
4. Select your team
5. Configure **In-App Purchase** capability

### 4.4 Android Setup

No additional setup required for RevenueCat on Android.

---

## Step 5: Test the Integration

### 5.1 Start Development Servers

Terminal 1 - Backend:
```bash
bun run dev:server
```

Terminal 2 - Native App:
```bash
bun run dev:native
```

### 5.2 Test Webhook Connection

1. In RevenueCat dashboard, go to your webhook
2. Click **Send Test Event**
3. Verify success (green checkmark)
4. Check Convex logs for the event

### 5.3 Test Sandbox Purchase

#### iOS

1. Create a sandbox tester account in [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to **Users and Access** → **Sandbox Testers**
   - Click **+** to add a new tester
   
2. On your iOS device/simulator:
   - Sign out of your production Apple ID
   - Run your app
   - Navigate to paywall
   - Make a test purchase
   - Sign in with sandbox account when prompted

3. Verify in Convex Dashboard:
   - Go to [Convex Dashboard](https://dashboard.convex.dev)
   - Navigate to **Data** → `entitlements` table
   - You should see an active entitlement

#### Android

1. Add a test account in [Google Play Console](https://play.google.com/console)
   - Navigate to **Setup** → **License testing**
   - Add test email addresses
   
2. Publish to internal testing:
   - Create internal testing track
   - Upload your app
   - Add test users
   
3. Install and test:
   - Install from Play Store (internal testing)
   - Make test purchase
   - Verify in Convex Dashboard

### 5.4 Verify Queries Work

Add debug logging to your app:

```typescript
import { useQuery } from 'convex/react';
import { api } from '@app/backend/convex/_generated/api';

function DebugSubscription() {
  const currentUser = useQuery(api.auth.currentUser);
  const hasPremium = useQuery(
    api.subscriptions.hasPremium,
    currentUser?.id ? { userId: currentUser.id } : 'skip'
  );

  console.log('Current user:', currentUser?.id);
  console.log('Has premium:', hasPremium);

  return null;
}
```

After purchase, `hasPremium` should be `true` (may take 5-10 seconds for webhook to arrive).

---

## Step 6: Production Checklist

Before launching:

### Backend
- [ ] Deploy to production: `npx convex deploy --prod`
- [ ] Set production webhook auth: `npx convex env set REVENUECAT_WEBHOOK_AUTH "token" --prod`
- [ ] Update webhook URL in RevenueCat to production URL
- [ ] Test webhook with production URL

### RevenueCat
- [ ] Replace sandbox products with production products
- [ ] Verify entitlements are correctly configured
- [ ] Test on both iOS and Android
- [ ] Set up App Store and Play Store billing

### Mobile App
- [ ] Update environment variables to production
- [ ] Test restore purchases flow
- [ ] Test account switching (no entitlement leakage)
- [ ] Submit to App Store / Play Store

---

## Troubleshooting

### "Convex deployment URL not found"

**Solution:** Make sure you've deployed your backend:
```bash
cd packages/backend
npx convex deploy
```

### "Webhook 401 Unauthorized"

**Solution:** Token mismatch. Verify:
```bash
npx convex env get REVENUECAT_WEBHOOK_AUTH
```
Ensure this matches exactly what's in RevenueCat dashboard.

### "No packages available"

**Solution:**
1. Verify products are attached to offering in RevenueCat
2. Verify `EXPO_PUBLIC_REVENUECAT_OFFERING_ID` matches
3. Check RevenueCat logs for errors

### "Purchase succeeded but no entitlement"

**Causes:**
1. **Webhook delay** - Wait 10-30 seconds
2. **User ID mismatch** - Check that RevenueCat `app_user_id` matches query `userId`
3. **Entitlement ID mismatch** - Check spelling/casing
4. **Webhook not reaching server** - Check Convex logs

**Debug:**
```typescript
// Check RevenueCat user ID
const info = await Purchases.getCustomerInfo();
console.log('RevenueCat user:', info.originalAppUserId);

// Check what you're querying
console.log('Querying for:', currentUser.id);

// These must match!
```

### "Types not found after adding component"

**Solution:** Restart your dev server:
```bash
# Stop the server (Ctrl+C)
bun run dev:server
```

---

## Next Steps

- Read [revenuecat.md](./revenuecat.md) for client-side details
- Read [revenuecat-backend.md](./revenuecat-backend.md) for backend details
- Implement your paywall UI
- Add subscription management screens
- Set up analytics and tracking

---

## Support

- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [Convex Documentation](https://docs.convex.dev)
- [convex-revenuecat GitHub](https://github.com/ramonclaudio/convex-revenuecat)
