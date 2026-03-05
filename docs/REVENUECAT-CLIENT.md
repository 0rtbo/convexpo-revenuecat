# RevenueCat Client Integration

How the RevenueCat SDK is wired up in the React Native app.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Components                     │
│              (paywall, settings, gates)                  │
├─────────────────────────────────────────────────────────┤
│                  useRevenueCat() hook                    │
├─────────────────────────────────────────────────────────┤
│                 RevenueCatProvider.tsx                   │
│          (state, auth sync, lifecycle)                   │
├─────────────────────────────────────────────────────────┤
│              lib/revenue-cat/index.ts                    │
│            (pure SDK wrappers)                           │
├─────────────────────────────────────────────────────────┤
│               react-native-purchases                     │
└─────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/revenue-cat/index.ts` | SDK utility functions (no React) |
| `providers/RevenueCatProvider.tsx` | React context, state, auth sync |
| `app/_layout.tsx` | Provider placement |
| `settings/_layout.tsx` | Sign-out flow |

---

## Using the Hook

```tsx
import { useRevenueCat } from "@/providers/RevenueCatProvider";

function Paywall() {
  const { isPro, getPackages, purchasePackage, restorePurchases } = useRevenueCat();

  // isPro - current entitlement status
  // getPackages() - get available products
  // purchasePackage(pkg) - make purchase
  // restorePurchases() - restore from store
}
```

### Quick Check

```tsx
import { useIsPro } from "@/providers/RevenueCatProvider";

function FeatureGate() {
  const isPro = useIsPro();
  return isPro ? <ProFeature /> : <UpgradePrompt />;
}
```

---

## How Auth Sync Works

The provider automatically syncs identity when users sign in/out:

1. **User signs in** -> `Purchases.logIn(user._id)` links purchases to account
2. **User signs out** -> `Purchases.logOut()` resets to anonymous
3. **App launches** -> Re-syncs if session exists

This happens in `RevenueCatProvider.tsx` via a `useEffect` watching `user._id`.

---

## Sign-Out Order

RevenueCat logout must happen **before** auth signout:

```tsx
const handleSignOut = async () => {
  await logOutUser();        // 1. RevenueCat first
  await authClient.signOut(); // 2. Then auth
};
```

This prevents stale RevenueCat identity carrying over to the next user.

---

## Backend Integration

The client uses `useIsPro()` for immediate UI feedback.

For source of truth, components query the Convex backend:

```tsx
const hasPremium = useQuery(api.subscriptions.hasPremium);
```

This updates reactively when RevenueCat webhooks arrive.
