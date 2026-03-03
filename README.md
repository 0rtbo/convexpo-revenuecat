# Convexpo + RevenueCat

Convex + Better Auth + Expo (React Native) + HeroUI Native + RevenueCat.

This repo is a monetization-ready version of
[convexpo](https://github.com/0rtbo/convexpo) with RevenueCat **fully integrated** 
on both client and server:

## What You Get

### Client-Side (React Native)
- RevenueCat SDK installed in `apps/native`
- App-level RevenueCat provider for init, entitlement refresh, identity sync,
  and purchase helpers
- Environment-driven entitlement and offering selection
- Sign-out and account deletion flows that also clear RevenueCat identity

### Backend (Convex)
- **[convex-revenuecat](https://github.com/ramonclaudio/convex-revenuecat)** component integrated
- Webhook endpoint to receive RevenueCat events
- Real-time subscription state synced to Convex database
- 18+ query helpers for checking entitlements, subscriptions, invoices, etc.
- Automatic handling of all 18 RevenueCat webhook event types

## Quick Start

**👉 For backend setup, follow: [docs/DEV-TODO.md](./docs/DEV-TODO.md)** (10-15 minutes)

### 1. Install Dependencies

```bash
bun install
```

### 2. Complete Auth Setup

Follow the [convexpo auth setup](https://github.com/0rtbo/convexpo#authentication-providers) guide.

### 3. Configure Backend (Convex + RevenueCat Webhooks)

**📋 Follow the step-by-step checklist:** [docs/DEV-TODO.md](./docs/DEV-TODO.md)

Quick summary:

```bash
# Generate webhook token
openssl rand -base64 32

# Set in Convex
npx convex env set REVENUECAT_WEBHOOK_AUTH "your-token"

# Start backend
bun run dev:server
```

Then configure webhook in RevenueCat dashboard. **See [DEV-TODO.md](./docs/DEV-TODO.md) for detailed instructions.**

### 4. Configure RevenueCat Dashboard

1. Create your RevenueCat project (platform: `React Native`)
2. Create an entitlement (e.g., `pro`)
3. Add products and attach to an offering (e.g., `default`)
4. Navigate to **Project Settings** → **Integrations** → **Webhooks**
5. Add webhook:
   - **URL**: `https://your-deployment.convex.site/webhooks/revenuecat`
   - **Authorization header**: Your token from step 3
6. Click **Send Test Event** to verify

### 5. Configure Client Environment Variables

Copy `apps/native/.env.example` to `apps/native/.env` and set:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
```

### 6. Start Native App

```bash
bun dev:native
```

## RevenueCat Wizard Prompts (What You Initially See)

When creating a project in RevenueCat, the wizard asks for:

- project name
- category
- platform (`React Native`)
- entitlement details (name + subscription types)

Then you add products and attach them to an offering.

## Documentation

### 🚀 Start Here
- **[docs/DEV-TODO.md](./docs/DEV-TODO.md)** - Step-by-step backend setup checklist (10-15 min)
- **[QUICK-START-BACKEND.md](./QUICK-START-BACKEND.md)** - Quick reference (5 min)

### Client-Side (React Native)
- **[docs/revenuecat.md](./docs/revenuecat.md)** - RevenueCat SDK configuration, purchase flows, identity strategy

### Backend (Convex)
- **[docs/revenuecat-backend.md](./docs/revenuecat-backend.md)** - Complete backend guide, API reference, troubleshooting
- **[docs/TESTING.md](./docs/TESTING.md)** - Testing procedures and debug tools
- **[docs/SETUP.md](./docs/SETUP.md)** - Complete setup from scratch
- **[docs/INTEGRATION-SUMMARY.md](./docs/INTEGRATION-SUMMARY.md)** - What was implemented

## Architecture

```
┌─────────────────┐
│  React Native   │  User makes purchase
│      App        │  (RevenueCat SDK)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RevenueCat API  │  Processes purchase
└────────┬────────┘
         │
         │ Webhook
         ▼
┌─────────────────┐
│ Convex Backend  │  Stores entitlement
│ (This Repo)     │  in database
└────────┬────────┘
         │
         │ Real-time query
         ▼
┌─────────────────┐
│  React Native   │  UI updates automatically
│      App        │  (premium unlocked)
└─────────────────┘
```

## License

MIT
