# Quick Setup Checklist

Speed-run checklist for setting up Convexpo + RevenueCat from scratch.

---

## 1. Clone & Install

```bash
git clone <repo>
cd convexpo-revenuecat
pnpm install
```

---

## 2. Convex Backend

```bash
cd packages/backend
pnpm dlx convex dev
```

- [ ] Create new Convex project (or link existing)
- [ ] Copy deployment URL

---

## 3. RevenueCat Project

Go to [RevenueCat Dashboard](https://app.revenuecat.com)

- [ ] Create new project
- [ ] Run through wizard:
  - [ ] Create entitlement (e.g., `MyApp Pro`) — **remember this exactly!**
  - [ ] Create offering (e.g., `default`)
  - [ ] Skip products for now
- [ ] Get API key: **API Keys** → Apple App Store → **Show Key** → copy `appl_...`

---

## 4. RevenueCat Webhook → Convex

In RevenueCat: **Integrations** → **Webhooks**

- [ ] Click **+ New**
- [ ] Webhook URL: `https://<your-convex-url>/webhooks/revenuecat`
- [ ] Copy the **Authorization Header** value
- [ ] Save

In Convex Dashboard: **Settings** → **Environment Variables**

- [ ] Add `REVENUECAT_WEBHOOK_SECRET` = (the auth header value)

---

## 5. Configure Client

**File:** `apps/native/.env.development`

```bash
EXPO_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=MyApp Pro
```

---

## 6. Configure Backend

**File:** `packages/backend/.env.local`

```bash
NATIVE_APP_URL=myapp://
```

Also set in Convex Dashboard → Environment Variables:
- [ ] `NATIVE_APP_URL` = `myapp://`

---

## 7. Run the App

Terminal 1 - Backend:
```bash
cd packages/backend
pnpm dlx convex dev
```

Terminal 2 - App:
```bash
cd apps/native
pnpm start
```

- [ ] Press `i` for iOS simulator
- [ ] App should launch and show auth screen

---

## 8. Test Auth Flow

- [ ] Sign up / Sign in
- [ ] Should redirect to home screen
- [ ] Check Convex dashboard → **Data** → `users` table has your user

---

## 9. Test Paywall (Simulator)

- [ ] Navigate to paywall/subscription screen
- [ ] Products might show "unavailable" in simulator (that's OK)
- [ ] For real purchase testing, need physical device + sandbox tester

---

## Going to Production?

See [APP-STORE-SETUP.md](./APP-STORE-SETUP.md) for:

- [ ] EAS build & submit to TestFlight
- [ ] Connect App Store to RevenueCat (In-App Purchase Key)
- [ ] Create subscriptions in App Store Connect
- [ ] Import products to RevenueCat
- [ ] Attach products to entitlement
- [ ] Add products to offerings
- [ ] Create sandbox tester
- [ ] Test real purchase on device

---

## Quick Troubleshooting

**Offerings empty?**
```bash
rm -rf ios
npx expo prebuild --clean
npx expo run:ios --device
```

**Subscription not detected?**
- Check entitlement ID matches exactly (case-sensitive, spaces matter!)
- Check webhook is set up and `REVENUECAT_WEBHOOK_SECRET` is correct

**Auth redirect not working?**
- Check `NATIVE_APP_URL` is set in both `.env.local` AND Convex dashboard
