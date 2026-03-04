# User Linking Strategy

How users are linked to their subscriptions in this app starter.

---

## 🔑 TL;DR

**Your users are already properly linked!** The starter uses `String(user._id)` as the RevenueCat `app_user_id`, which links subscriptions between:
- Client SDK (React Native)
- Backend queries (Convex)

**You don't need to do anything** - it's already wired up correctly.

---

## 📋 How It Works

### The User ID

**Source:** Better Auth user ID (`user._id`)  
**Format:** String representation of the Convex document ID  
**Example:** `"kg2h8fu7c9vj8w9j8w9j8w9j8w"`

### Three Points of Synchronization

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│   1. CLIENT SDK                                              │
│   RevenueCatProvider identifies user on auth                │
│   → Purchases.logIn(String(user._id))                       │
│                                                               │
│   2. REVENUECAT CLOUD                                        │
│   Stores subscriptions under app_user_id                    │
│   → app_user_id: "kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w"          │
│                                                               │
│   3. BACKEND QUERIES                                         │
│   Secured - uses authenticated user automatically           │
│   → api.subscriptions.hasPremium({}) // No userId needed    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Already Implemented

### 1. Client-Side User Identification

**Location:** `apps/native/providers/RevenueCatProvider.tsx` (lines 266-307)

```typescript
useEffect(() => {
  if (!isConfigured || isLoadingUser) return;
  
  if (!user?._id) {
    // User logged out - clear RevenueCat identity
    logOutRevenueCatUser();
    return;
  }

  // Identify user in RevenueCat
  const revenueCatUserId = String(user._id);
  
  identifyUser(revenueCatUserId).catch((error) => {
    console.warn("[RevenueCat] Auth sync identify failed:", error);
  });

  // Set user attributes
  setUserAttributes({
    email: user.email ?? undefined,
    displayName: user.name ?? undefined,
    userId: revenueCatUserId,
  });
}, [isConfigured, isLoadingUser, user?._id, user?.email, user?.name]);
```

**What it does:**
- Watches for user authentication state
- Calls `Purchases.logIn(userId)` when user signs in
- Calls `Purchases.logOut()` when user signs out
- Sets user attributes for RevenueCat dashboard

### 2. SDK Configuration

**Location:** `apps/native/lib/revenue-cat/index.ts` (line 169-172)

```typescript
export async function identifyUser(userId: string): Promise<boolean> {
  const { customerInfo } = await Purchases.logIn(userId);
  return hasProEntitlement(customerInfo);
}
```

**What it does:**
- Links purchases to the authenticated user
- Ensures subscriptions follow user across devices
- Returns current entitlement status

### 3. Backend Queries (Secured)

**Location:** `packages/backend/convex/subscriptions.ts`

```typescript
export const hasPremium = query({
  args: {}, // No userId needed - uses authenticated user
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return false;
    
    return await revenuecat.hasEntitlement(ctx, {
      appUserId: user._id, // Uses authenticated user's ID
      entitlementId: ENTITLEMENT_ID,
    });
  },
});
```

**What it does:**
- Automatically uses authenticated user's ID (no client-supplied ID)
- Returns subscription status for the current user only
- Reactive updates when webhooks arrive
- Returns `false` if not authenticated

---

## 🔄 User Lifecycle

### Sign Up (New User)

1. User creates account in your app
2. Better Auth creates user with `_id`
3. `RevenueCatProvider` detects new user
4. Calls `Purchases.logIn(String(user._id))`
5. RevenueCat links anonymous ID → authenticated user ID
6. User makes purchase → linked to authenticated ID
7. Webhook arrives with `app_user_id: user._id`
8. Backend stores subscription for that user
9. Queries return subscription status

### Sign In (Returning User)

1. User signs in with existing account
2. Better Auth loads user with same `_id`
3. `RevenueCatProvider` identifies user
4. Calls `Purchases.logIn(String(user._id))`
5. RevenueCat restores previous purchases
6. Provider updates `isPro` state
7. UI shows premium features

### Sign Out

1. User taps sign out
2. App calls `RevenueCat.logOutUser()` **first**
3. Then calls `auth.signOut()`
4. RevenueCat resets to anonymous ID
5. Provider clears `isPro` state
6. UI shows paywall

### Account Deletion

1. User deletes account
2. App calls `RevenueCat.logOutUser()` **first**
3. Then deletes user from Better Auth
4. RevenueCat identity cleared
5. Next user won't inherit previous subscriptions

---

## 🧪 How to Verify User Linking

### Check Client-Side

```typescript
import Purchases from 'react-native-purchases';
import { useUser } from '@/contexts/user-context';

async function debugUserLinking() {
  const { user } = useUser();
  const info = await Purchases.getCustomerInfo();
  
  console.log('App user ID:', user?._id);
  console.log('RevenueCat app_user_id:', info.originalAppUserId);
  console.log('Match:', String(user?._id) === info.originalAppUserId);
  
  // These MUST match!
}
```

**Expected output:**
```
App user ID: kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w
RevenueCat app_user_id: kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w
Match: true
```

### Check Backend

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to **Data** → `customers` table
3. Find your user by `appUserId`
4. Verify it matches your Better Auth `user._id`

### Check RevenueCat Dashboard

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Navigate to **Customer History**
3. Search for your user ID (the `user._id` string)
4. View purchases and entitlements

---

## 📊 Data Flow

### Purchase Flow

```
1. User taps "Subscribe" button
   ↓
2. RevenueCat SDK processes purchase
   app_user_id: "kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w"
   ↓
3. Purchase succeeds
   ↓
4. RevenueCat sends webhook (1-5 seconds later)
   {
     "app_user_id": "kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w",
     "event_type": "INITIAL_PURCHASE",
     "entitlements": { "premium": { ... } }
   }
   ↓
5. Webhook arrives at Convex backend
   /webhooks/revenuecat
   ↓
6. Backend stores in database
   customers table: appUserId = "kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w"
   entitlements table: appUserId = "kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w"
   ↓
7. Query reactively updates
   api.subscriptions.hasPremium({})  // Uses authenticated user automatically
   Returns: true
   ↓
8. UI updates automatically
   Premium features unlock
```

### Cross-Device Sync

```
Device A:
  User signs in → Purchases.logIn(user._id) → Makes purchase

Device B:
  Same user signs in → Purchases.logIn(user._id)
  → RevenueCat restores purchases automatically
  → Webhook syncs to backend (if not already synced)
  → Query returns true
  → Premium features unlock
```

---

## 🔍 Troubleshooting User Linking

### Problem: Purchase succeeded but no entitlement

**Most common cause:** User ID mismatch

**Debug steps:**

1. **Check client-side ID:**
   ```typescript
   const info = await Purchases.getCustomerInfo();
   console.log('RevenueCat user:', info.originalAppUserId);
   ```

2. **Check backend query ID:**
   ```typescript
   const userId = currentUser?.id;
   console.log('Query user:', userId);
   ```

3. **Check webhook payload:**
   - Convex Dashboard → Data → webhookEvents
   - Find latest event
   - Check `app_user_id` field

4. **Verify they all match:**
   ```
   RevenueCat user:  kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w
   Query user:       kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w
   Webhook user:     kg2h8fu7c9vj8w9j8w9j8w9j8w9j8w
   
   ✅ All match - linking is correct!
   ```

### Problem: Subscription leaks between users

**Symptoms:** User B has User A's subscription after switching accounts

**Cause:** RevenueCat not logged out before auth sign-out

**Fix:** Already implemented in this starter!

**Verify logout order:**
1. Check `apps/native/app/(root)/(main)/settings/_layout.tsx`
2. Should call `RevenueCat.logOutUser()` **before** `auth.signOut()`

**Example (already in your code):**
```typescript
const handleSignOut = async () => {
  // 1. FIRST: Clear RevenueCat identity
  await RevenueCat.logOutUser();
  
  // 2. THEN: Sign out from auth
  await auth.signOut();
};
```

### Problem: Anonymous purchases not linking to new user

**Scenario:** User makes purchase before creating account

**What happens:**
1. Anonymous user makes purchase (app_user_id: `$RCAnonymousID:abc123`)
2. User creates account (app_user_id: `kg2h8fu7...`)
3. RevenueCat SDK automatically transfers purchase to new ID
4. Webhook arrives with new `app_user_id`
5. Backend stores under authenticated user
6. ✅ Purchase successfully linked!

**No manual action needed** - RevenueCat handles this automatically.

---

## 🎯 Best Practices

### ✅ DO

- **Use stable user ID** - `user._id` from Better Auth (already implemented)
- **Call `logIn()` on every app launch** - Provider already does this
- **Log out RevenueCat before auth** - Already implemented in sign-out flows
- **Use same ID everywhere** - Client SDK, backend queries, webhooks

### ❌ DON'T

- **Don't use email as user ID** - Email can change
- **Don't use device ID** - Breaks cross-device sync
- **Don't forget to log out** - Causes subscription leakage
- **Don't log in on every render** - Provider handles this efficiently

---

## 📝 Summary

### User Linking in This Starter

| Component | Implementation | Status |
|-----------|----------------|--------|
| **User ID Source** | Better Auth `user._id` | ✅ Implemented |
| **Client SDK Login** | `RevenueCatProvider` auto-identifies | ✅ Implemented |
| **Backend Queries** | Use same `user._id` | ✅ Implemented |
| **Logout Handling** | RevenueCat first, then auth | ✅ Implemented |
| **Cross-Device Sync** | RevenueCat SDK automatic | ✅ Works |
| **Account Switching** | No leakage between users | ✅ Protected |

### Key Takeaways

1. **Already Working** - User linking is fully implemented
2. **User ID** - `String(user._id)` is used consistently
3. **Automatic Sync** - Provider handles identification on auth changes
4. **Safe Logout** - RevenueCat cleared before auth sign-out
5. **No Action Needed** - You can start testing immediately

---

## 🧪 Test User Linking

### Test 1: Purchase Links to User

1. Sign in as User A
2. Make sandbox purchase
3. Check Convex Dashboard → customers table
4. Verify `appUserId` matches User A's `_id`

### Test 2: Cross-Device Sync

1. Device 1: Sign in as User A, make purchase
2. Device 2: Sign in as same User A
3. Check that `hasPremium` returns true
4. Verify premium features unlock

### Test 3: No Leakage Between Users

1. Sign in as User A (has subscription)
2. Verify `hasPremium` is true
3. Sign out
4. Sign in as User B (no subscription)
5. Verify `hasPremium` is false
6. Premium features should be locked

### Test 4: Anonymous to Authenticated

1. Start app without signing in
2. Make sandbox purchase (anonymous)
3. Create account and sign in
4. Check that purchase transferred to new user
5. Verify `hasPremium` is true

---

## 🔗 Related Documentation

- [Backend Integration](./revenuecat-backend.md)
- [Testing Guide](./TESTING.md#5-test-account-switching)
- [Setup Guide](./SETUP.md)
- [RevenueCat Identity Docs](https://www.revenuecat.com/docs/user-ids)

---

**Your users are properly linked!** The starter handles all the complexity for you. Just follow [DEV-TODO.md](./DEV-TODO.md) to set up webhooks and start testing.
