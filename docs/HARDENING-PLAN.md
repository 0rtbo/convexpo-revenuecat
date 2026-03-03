# Security Hardening Plan

This document outlines the security improvements needed to make the RevenueCat integration production-ready.

---

## 🔴 Critical Security Issues

### Issue 1: No Authentication Guards on Subscription Queries

**Current State:**
```typescript
// packages/backend/convex/subscriptions.ts:43
export const hasPremium = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // ❌ NO AUTH CHECK - anyone can query anyone's subscription!
    return await revenuecat.hasEntitlement(ctx, {
      appUserId: args.userId,
      entitlementId: "premium",
    });
  },
});
```

**Problem:**
- Any client can call `api.subscriptions.hasPremium({ userId: "any-user-id" })`
- Users can check other users' subscription status
- No verification that the caller owns the data they're requesting

**Fix Required:**
1. Add authentication check using Better Auth
2. Verify caller is requesting their own data
3. Only allow admins to query other users' data

**Implementation:**
```typescript
export const hasPremium = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // 1. Get authenticated user
    const user = await getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    
    // 2. Verify caller is requesting their own data
    if (user._id !== args.userId) {
      throw new Error("Cannot query other users' subscriptions");
    }
    
    // 3. Check entitlement
    return await revenuecat.hasEntitlement(ctx, {
      appUserId: args.userId,
      entitlementId: "pro",
    });
  },
});
```

**Alternative: Remove userId Parameter**
```typescript
export const hasPremium = query({
  args: {}, // No args - always check current user
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return false;
    
    return await revenuecat.hasEntitlement(ctx, {
      appUserId: user._id,
      entitlementId: "pro",
    });
  },
});
```

---

### Issue 2: Public Billing Data Exposure

**Current State:**
```typescript
// packages/backend/convex/subscriptions.ts:276
export const getVirtualCurrencyTransactions = query({
  args: {
    appUserId: v.string(),
    currencyCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ❌ Returns all transaction data without auth check!
    return await revenuecat.getVirtualCurrencyTransactions(ctx, args);
  },
});
```

**Problem:**
- Exposes sensitive billing information
- No authentication required
- Returns full subscription objects with all fields
- Includes payment details, product IDs, pricing data

**Fix Required:**
1. Add auth guards to all data-fetching queries
2. Return minimal data needed for UI
3. Create separate admin-only queries for detailed data

**Implementation:**
```typescript
// Public query - minimal data
export const getSubscriptionStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return null;
    
    const subscriptions = await revenuecat.getActiveSubscriptions(ctx, {
      appUserId: user._id,
    });
    
    // Return only what UI needs
    return subscriptions.map(sub => ({
      isActive: true,
      expiresAt: sub.expirationAtMs,
      productId: sub.productId,
      willRenew: sub.willRenew ?? true,
    }));
  },
});

// Admin-only query - full data
export const getFullSubscriptionData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user || !isAdmin(user)) {
      throw new Error("Admin access required");
    }
    
    return await revenuecat.getAllSubscriptions(ctx, {
      appUserId: args.userId,
    });
  },
});
```

---

## 🟡 Consistency Issues

### Issue 3: Entitlement ID Mismatch

**Current State:**

Client (apps/native/lib/revenue-cat/index.ts:33):
```typescript
const proEntitlementId = normalizeEnvValue(
  process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID
) ?? "pro"; // ✅ Defaults to "pro"
```

Backend (packages/backend/convex/subscriptions.ts:72):
```typescript
return await revenuecat.hasEntitlement(ctx, {
  appUserId: args.userId,
  entitlementId: "premium", // ❌ Hardcoded to "premium"
});
```

**Problem:**
- Client checks for "pro" entitlement
- Backend checks for "premium" entitlement
- They will never match!
- Confusing for developers

**Fix Required:**
1. Use consistent entitlement ID everywhere
2. Make it configurable via environment variable
3. Add validation to ensure consistency

**Implementation:**
```typescript
// packages/backend/convex/revenuecat.ts
const ENTITLEMENT_ID = process.env.REVENUECAT_ENTITLEMENT_ID ?? "pro";

export { ENTITLEMENT_ID };
```

```typescript
// packages/backend/convex/subscriptions.ts
import { ENTITLEMENT_ID } from "./revenuecat";

export const hasPremium = query({
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return false;
    
    return await revenuecat.hasEntitlement(ctx, {
      appUserId: user._id,
      entitlementId: ENTITLEMENT_ID, // ✅ Consistent!
    });
  },
});
```

---

### Issue 4: Type Safety in Subscription Checks

**Current State:**
```typescript
// apps/native/components/subscription-status-card.tsx:63
const willRenew = "willRenew" in subscription
  ? (subscription.willRenew as boolean | null) ?? true
  : true;

// apps/native/components/subscription-status-card.tsx:64
const isInGracePeriod = subscription.billingIssueDetectedAt !== null;
```

**Problems:**
1. `willRenew` type assertion without proper type guard
2. `!== null` doesn't handle `undefined` correctly
3. Grace period check can fail if field is undefined

**Fix Required:**
```typescript
// Proper type-safe checks
const willRenew = subscription.willRenew === false ? false : true;

const isInGracePeriod = 
  subscription.billingIssueDetectedAt !== null && 
  subscription.billingIssueDetectedAt !== undefined;
```

**Better: Create type guard**
```typescript
function hasGracePeriod(
  subscription: Subscription
): subscription is Subscription & { billingIssueDetectedAt: number } {
  return (
    typeof subscription.billingIssueDetectedAt === "number" &&
    subscription.billingIssueDetectedAt > 0
  );
}

// Usage
const isInGracePeriod = hasGracePeriod(subscription);
```

---

## 🟠 Edge Cases

### Issue 5: Retry Logic Bug

**Current State:**
```typescript
// apps/native/providers/RevenueCatProvider.tsx:283-290
const revenueCatUserId = String(user._id);

if (lastSyncedUserIdRef.current === revenueCatUserId) return;
lastSyncedUserIdRef.current = revenueCatUserId; // ❌ Set BEFORE success!

identifyUser(revenueCatUserId).catch((error) => {
  console.warn("[RevenueCat] Auth sync identify failed:", error);
});
```

**Problem:**
- `lastSyncedUserIdRef` is set before `identifyUser` completes
- If `identifyUser` fails, the ref still shows "synced"
- Future attempts skip retry because ref says it's already synced
- User never gets properly identified in RevenueCat

**Fix Required:**
```typescript
const revenueCatUserId = String(user._id);

if (lastSyncedUserIdRef.current === revenueCatUserId) return;

// ✅ Set ref AFTER success
identifyUser(revenueCatUserId)
  .then(() => {
    lastSyncedUserIdRef.current = revenueCatUserId;
  })
  .catch((error) => {
    console.warn("[RevenueCat] Auth sync identify failed:", error);
    // Don't set ref on failure - allow retry next time
  });
```

---

## 📋 Implementation Checklist

### Phase 1: Critical Security (Must Have)

- [ ] Add authentication helper (`getAuthUser`)
- [ ] Add auth guards to all subscription queries
- [ ] Remove `userId` parameter from queries (use authenticated user)
- [ ] Create minimal data DTOs for subscription status
- [ ] Move sensitive queries to admin-only

### Phase 2: Consistency (Should Have)

- [ ] Fix entitlement ID to use "pro" everywhere
- [ ] Add `REVENUECAT_ENTITLEMENT_ID` environment variable
- [ ] Update backend queries to use consistent entitlement ID
- [ ] Update documentation with correct entitlement ID

### Phase 3: Type Safety (Should Have)

- [ ] Fix `willRenew` check in SubscriptionStatusCard
- [ ] Fix `isInGracePeriod` check to handle undefined
- [ ] Create type guards for subscription fields
- [ ] Add proper null/undefined handling

### Phase 4: Edge Cases (Nice to Have)

- [ ] Fix `lastSyncedUserIdRef` timing issue
- [ ] Add retry mechanism for failed identify calls
- [ ] Add error tracking for failed syncs

---

## 🎯 Recommended Implementation Order

### Step 1: Authentication Helper (Foundation)
```typescript
// packages/backend/convex/auth.ts (or similar)
import { QueryCtx } from "./_generated/server";

export async function getAuthUser(ctx: QueryCtx) {
  const user = await authComponent.currentUser(ctx);
  return user;
}

export function requireAuth(ctx: QueryCtx) {
  const user = await getAuthUser(ctx);
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
```

### Step 2: Secure Subscription Queries
```typescript
// packages/backend/convex/subscriptions.ts
import { requireAuth } from "./auth";
import { ENTITLEMENT_ID } from "./revenuecat";

export const hasPremium = query({
  args: {}, // No userId - always current user
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    
    return await revenuecat.hasEntitlement(ctx, {
      appUserId: user._id,
      entitlementId: ENTITLEMENT_ID,
    });
  },
});
```

### Step 3: Fix Client Components
```typescript
// apps/native/components/subscription-status-card.tsx
const hasPremium = useQuery(
  api.subscriptions.hasPremium,
  {} // No userId needed!
);
```

### Step 4: Fix Type Safety
```typescript
// Proper type-safe checks throughout components
const willRenew = subscription.willRenew === false ? false : true;
const isInGracePeriod = Boolean(subscription.billingIssueDetectedAt);
```

### Step 5: Fix Edge Cases
```typescript
// RevenueCatProvider.tsx - Set ref after success
identifyUser(revenueCatUserId)
  .then(() => {
    lastSyncedUserIdRef.current = revenueCatUserId;
  })
  .catch(error => {
    console.warn("Failed to identify user:", error);
  });
```

---

## 🔒 Security Best Practices

### 1. Authentication

**✅ DO:**
- Always verify authenticated user in queries
- Use `requireAuth()` helper for consistency
- Only allow users to access their own data
- Create separate admin queries for cross-user access

**❌ DON'T:**
- Accept `userId` from client without verification
- Trust client-provided IDs
- Return data without auth check
- Expose other users' subscription data

### 2. Data Minimization

**✅ DO:**
- Return only data needed for UI
- Create minimal DTOs for responses
- Separate public and admin queries
- Document what each query returns

**❌ DON'T:**
- Return full database objects
- Expose payment details unnecessarily
- Return all subscription history by default
- Include internal IDs in public responses

### 3. Error Handling

**✅ DO:**
- Return safe error messages
- Log errors for debugging
- Return `null` or `false` for unauthenticated requests
- Handle missing data gracefully

**❌ DON'T:**
- Expose database structure in errors
- Return sensitive info in error messages
- Throw errors with internal details
- Let unauthenticated queries fail noisily

---

## 📊 Before vs After

### Before (Insecure)
```typescript
// ❌ Anyone can query anyone's subscription
const hasPremium = useQuery(api.subscriptions.hasPremium, {
  userId: "any-user-id" // Can query other users!
});
```

### After (Secure)
```typescript
// ✅ Only checks current authenticated user
const hasPremium = useQuery(api.subscriptions.hasPremium, {});
// Automatically uses authenticated user's ID
```

---

## 🧪 Testing Hardened Security

### Test 1: Unauthenticated Access
```typescript
// Should fail or return null
const result = await convex.query(api.subscriptions.hasPremium, {});
expect(result).toBe(null); // or throws Error
```

### Test 2: Cross-User Access
```typescript
// Sign in as User A
const userA = await signIn("userA");

// Try to query User B's subscription
const result = await convex.query(api.subscriptions.hasPremium, {
  userId: "userB-id"
});
// Should fail - can't query other users
```

### Test 3: Authenticated Access
```typescript
// Sign in as User A
const userA = await signIn("userA");

// Query own subscription
const result = await convex.query(api.subscriptions.hasPremium, {});
expect(typeof result).toBe("boolean"); // Success!
```

---

## 📚 Additional Documentation Needed

After hardening, update these docs:

1. **EXAMPLE-USAGE.md** - Update query examples (no userId param)
2. **SECURITY.md** - Create new doc explaining security model
3. **DEV-TODO.md** - Add entitlement ID configuration step
4. **README.md** - Add security section

---

## ⚠️ Breaking Changes

These fixes introduce breaking changes:

1. **Subscription queries no longer accept `userId` parameter**
   - Before: `api.subscriptions.hasPremium({ userId: user._id })`
   - After: `api.subscriptions.hasPremium({})`

2. **Unauthenticated queries now fail/return null**
   - Before: Queries work without auth
   - After: Queries require authentication

3. **Entitlement ID changes from "premium" to "pro"**
   - Before: Backend checked "premium"
   - After: Backend checks "pro" (matching client)

**Migration Guide:**
- Update all query calls to remove `userId` parameter
- Ensure users are authenticated before querying
- Update RevenueCat dashboard if using "premium" entitlement

---

## 🎯 Expected Outcome

After implementing all fixes:

✅ **Security:**
- Only authenticated users can query subscriptions
- Users can only access their own data
- Sensitive billing data is protected
- Admin queries are properly gated

✅ **Consistency:**
- Entitlement ID is "pro" everywhere
- Client and backend use same configuration
- Environment variables control behavior

✅ **Type Safety:**
- No more `as any` or unsafe type assertions
- Proper null/undefined handling
- Type guards for complex checks

✅ **Reliability:**
- Retry logic works correctly
- Failed syncs don't block future attempts
- Error handling is robust

---

## 🚀 Next Steps

1. Review this plan
2. Approve implementation approach
3. Implement fixes in order (Phase 1 → Phase 4)
4. Test each phase thoroughly
5. Update documentation
6. Create migration guide for existing users

Ready to implement! 🔒
