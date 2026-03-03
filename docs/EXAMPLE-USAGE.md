# Example Usage: Subscription Components

This document shows how to use the subscription status and paywall components in your app.

---

## 📋 Components Created

### 1. **SubscriptionStatusCard** 
**Location:** `apps/native/components/subscription-status-card.tsx`

A card component that displays the user's current subscription status with real-time updates from the Convex backend.

**Features:**
- ✅ Shows loading state while fetching data
- ✅ Displays "Active" badge when user has premium
- ✅ Shows subscription details (product ID, expiration date, renewal status)
- ✅ Warns about billing issues (grace period)
- ✅ Shows upgrade prompt for free users
- ✅ **Automatically updates when webhooks arrive** (reactive!)

**Already integrated:** Settings screen (`apps/native/app/(root)/(main)/settings/index.tsx`)

### 2. **PaywallExample**
**Location:** `apps/native/components/paywall-example.tsx`

A complete paywall implementation showing how to check subscription status, load packages, and handle purchases.

**Features:**
- ✅ Checks subscription status from Convex
- ✅ Loads available packages from RevenueCat
- ✅ Handles purchases with loading states
- ✅ Restore purchases functionality
- ✅ Shows premium benefits
- ✅ Automatically updates UI after purchase

---

## 🚀 How to Use

### Using SubscriptionStatusCard

The component is already integrated into your settings screen. Just import and use it:

```tsx
import { SubscriptionStatusCard } from "@/components/subscription-status-card";

export default function MyScreen() {
  return (
    <ScrollView>
      <SubscriptionStatusCard />
    </ScrollView>
  );
}
```

**What it does:**
1. Queries `api.subscriptions.hasPremium` with current user ID
2. Shows loading skeleton while fetching
3. Displays subscription status when loaded
4. **Automatically re-renders when subscription changes!**

**No manual refresh needed** - Convex queries are reactive!

---

### Using PaywallExample

Add to any screen where you want to show subscription options:

```tsx
import { PaywallExample } from "@/components/paywall-example";

export default function PremiumScreen() {
  return (
    <ScrollView>
      <PaywallExample />
    </ScrollView>
  );
}
```

**What it does:**
1. Checks if user already has premium
2. If yes → shows "You're premium!" message
3. If no → shows subscription packages
4. Handles purchase flow
5. Updates automatically when webhook arrives

---

## 🎯 Real-Time Updates in Action

### The Magic of Reactive Queries

Both components use Convex queries that **automatically update** when data changes:

```tsx
// This query is REACTIVE!
const hasPremium = useQuery(
  api.subscriptions.hasPremium,
  user?._id ? { userId: user._id } : "skip"
);
```

**Timeline after purchase:**

```
T+0s    User taps "Subscribe"
        ↓
T+1s    Purchase completes in RevenueCat SDK
        ↓
T+2-5s  Webhook arrives at Convex backend
        ↓
T+2-5s  Convex database updates
        ↓
T+2-5s  Your query AUTOMATICALLY re-runs
        ↓
T+2-5s  Component re-renders with new data
        ↓
        ✨ UI updates - premium features unlock!
```

**You don't need to:**
- ❌ Manually refresh
- ❌ Poll for updates
- ❌ Call `refetch()`
- ❌ Wait for page reload

**Convex handles it automatically!** 🎉

---

## 💡 How to Check Subscription in Your Components

### Method 1: Use Convex Query (Recommended)

**Best for:** Showing/hiding features based on subscription

```tsx
import { useQuery } from "convex/react";
import { api } from "@app/backend/convex/_generated/api";
import { useUser } from "@/contexts/user-context";

function PremiumFeature() {
  const { user } = useUser();
  const hasPremium = useQuery(
    api.subscriptions.hasPremium,
    user?._id ? { userId: user._id } : "skip"
  );

  // Loading state
  if (hasPremium === undefined) {
    return <LoadingSpinner />;
  }

  // No premium - show paywall
  if (!hasPremium) {
    return <PaywallScreen />;
  }

  // Has premium - show feature
  return <PremiumContent />;
}
```

**Why this is better:**
- ✅ Source of truth is backend (webhook-synced)
- ✅ Works across devices automatically
- ✅ Can't be faked by user
- ✅ Reactive updates

### Method 2: Use RevenueCat Provider (Client-side only)

**Best for:** Quick checks in UI, not for access control

```tsx
import { useIsPro } from "@/providers/RevenueCatProvider";

function QuickCheck() {
  const isPro = useIsPro();

  if (isPro) {
    return <Badge>Premium</Badge>;
  }

  return <Badge>Free</Badge>;
}
```

**Limitations:**
- ⚠️ Client-side only (can be manipulated)
- ⚠️ Doesn't update from webhooks
- ⚠️ Only reflects SDK state, not backend truth

**Use Method 1 for anything important!**

---

## 📊 Example: Premium-Only Screen

Here's a complete example showing how to gate content:

```tsx
import { useQuery } from "convex/react";
import { api } from "@app/backend/convex/_generated/api";
import { useUser } from "@/contexts/user-context";
import { PaywallExample } from "@/components/paywall-example";
import { View, ScrollView } from "react-native";
import { Card } from "heroui-native";

export default function PremiumOnlyScreen() {
  const { user } = useUser();
  
  // Check subscription status from backend
  const hasPremium = useQuery(
    api.subscriptions.hasPremium,
    user?._id ? { userId: user._id } : "skip"
  );

  // Loading state
  if (hasPremium === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <Card.Description>Loading...</Card.Description>
      </View>
    );
  }

  // Show paywall if not premium
  if (!hasPremium) {
    return (
      <ScrollView className="flex-1 px-4 py-6">
        <PaywallExample />
      </ScrollView>
    );
  }

  // Show premium content
  return (
    <ScrollView className="flex-1 px-4 py-6">
      <Card variant="secondary">
        <Card.Header>
          <Card.Title>Premium Content</Card.Title>
          <Card.Description>
            This content is only visible to premium users!
          </Card.Description>
        </Card.Header>
        <Card.Body>
          {/* Your premium features here */}
        </Card.Body>
      </Card>
    </ScrollView>
  );
}
```

---

## 🧪 Testing the Components

### 1. Test Subscription Status Card

1. Navigate to Settings screen
2. You should see "Subscription Status" card
3. Status shows "Free" by default
4. Make a sandbox purchase
5. Wait 5-10 seconds
6. **Card automatically updates to "Active"!** ✨

### 2. Test Paywall Component

1. Add `PaywallExample` to a screen
2. Load the screen - shows upgrade prompt
3. Tap "View Subscription Options"
4. Shows available packages
5. Tap "Subscribe Now"
6. Complete sandbox purchase
7. Wait 5-10 seconds
8. **UI automatically updates to show "You're premium!"** ✨

### 3. Test Cross-Device Sync

1. Device A: Sign in, purchase premium
2. Device B: Sign in with same account
3. Navigate to Settings
4. **Subscription status shows "Active" automatically!** ✨

---

## 🎨 Customization

### Changing Entitlement ID

If your entitlement ID isn't "premium", update the query:

```tsx
// Change "premium" to your entitlement ID
const hasAccess = useQuery(
  api.subscriptions.hasEntitlement,
  user?._id ? {
    appUserId: user._id,
    entitlementId: "pro" // Your entitlement ID
  } : "skip"
);
```

Or update the default in:
```typescript
// packages/backend/convex/subscriptions.ts
export const hasPremium = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await revenuecat.hasEntitlement(ctx, {
      appUserId: args.userId,
      entitlementId: "pro", // Change this
    });
  },
});
```

### Styling the Components

Both components use HeroUI Native and Tailwind classes. Customize as needed:

```tsx
// Example: Change colors
<View className="bg-success/20"> {/* Change to bg-primary/20 */}
<Card.Description className="text-success"> {/* Change to text-primary */}
```

---

## 📖 Related Documentation

- [Backend Integration](./revenuecat-backend.md) - Complete backend guide
- [User Linking](./USER-LINKING.md) - How users link to subscriptions
- [Testing Guide](./TESTING.md) - How to test subscriptions
- [Setup Guide](./SETUP.md) - Complete setup from scratch

---

## 🎯 Key Takeaways

1. **Components are ready to use** - Already created and documented
2. **SubscriptionStatusCard** - Shows status in Settings (already integrated!)
3. **PaywallExample** - Full paywall implementation (ready to use)
4. **Reactive queries** - UI updates automatically when webhooks arrive
5. **No manual refresh needed** - Convex handles real-time sync
6. **Backend is source of truth** - Use Convex queries for access control

---

## 🚀 Next Steps

1. **Test the Settings screen** - See SubscriptionStatusCard in action
2. **Add PaywallExample** - Put it in a premium screen or modal
3. **Make sandbox purchase** - See real-time updates
4. **Customize styling** - Match your app's design
5. **Add more features** - Use queries to gate content

The components are production-ready. Just follow [DEV-TODO.md](./DEV-TODO.md) to set up webhooks and start testing! 🎉
