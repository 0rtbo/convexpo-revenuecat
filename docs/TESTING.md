# Testing RevenueCat Integration

Quick reference for testing your RevenueCat integration during development.

---

## Quick Test Checklist

Use this checklist to verify your integration is working:

- [ ] Backend webhook receives test event
- [ ] Sandbox purchase completes successfully
- [ ] Entitlement appears in Convex database
- [ ] Query returns `true` after purchase
- [ ] Restore purchases works on new device
- [ ] Sign out clears RevenueCat identity
- [ ] No entitlement leakage between users

---

## 1. Test Webhook Connection

### Send Test Event

1. Open [RevenueCat Dashboard](https://app.revenuecat.com)
2. Go to **Project Settings** → **Integrations** → **Webhooks**
3. Click your webhook
4. Click **Send Test Event**
5. Verify green checkmark

### Check Convex Logs

```bash
npx convex logs
```

Expected output:
```
[INFO] RevenueCat webhook received: TEST event
```

### Verify Database

1. Open [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to **Data** → `webhookEvents`
3. Should see a `TEST` event entry

---

## 2. Test Sandbox Purchases

### iOS Setup

#### Create Sandbox Tester

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **Users and Access** → **Sandbox Testers**
3. Click **+** to add tester
4. Fill in details (use unique email for each tester)

#### Make Test Purchase

1. **Sign out** of production Apple ID on device
   - Settings → iTunes & App Store → Sign Out
   
2. Run your app on device/simulator

3. Navigate to paywall screen

4. Tap purchase button

5. When prompted, sign in with sandbox tester account

6. Complete purchase (no actual charge)

#### Verify Purchase

Check Convex logs:
```bash
npx convex logs
```

Expected events:
```
[INFO] RevenueCat webhook received: INITIAL_PURCHASE event
[INFO] Subscription created for user: <user-id>
[INFO] Entitlement granted: pro
```

Check Convex Dashboard → **Data**:
- `customers` table → Should have user entry
- `subscriptions` table → Should have subscription
- `entitlements` table → Should show active entitlement

### Android Setup

#### Add License Testers

1. Go to [Google Play Console](https://play.google.com/console)
2. Navigate to **Setup** → **License testing**
3. Add test Gmail accounts
4. Set license response to `RESPOND_NORMALLY`

#### Publish to Internal Testing

1. Create internal testing track
2. Build and upload your app:
   ```bash
   cd apps/native
   eas build --platform android --profile preview
   ```
3. Add testers to internal testing track
4. Share opt-in link with testers

#### Make Test Purchase

1. Install app from internal testing link
2. Make purchase with test account
3. Verify in Convex Dashboard

---

## 3. Test Queries

### Basic Entitlement Check

Add to your app:

```typescript
import { useQuery } from 'convex/react';
import { api } from '@app/backend/convex/_generated/api';

function DebugPanel() {
  const currentUser = useQuery(api.auth.currentUser);
  const hasPremium = useQuery(
    api.subscriptions.hasPremium,
    currentUser?.id ? { userId: currentUser.id } : 'skip'
  );

  console.log('=== RevenueCat Debug ===');
  console.log('User ID:', currentUser?.id);
  console.log('Has Premium:', hasPremium);
  console.log('=======================');

  return (
    <View>
      <Text>User ID: {currentUser?.id}</Text>
      <Text>Has Premium: {String(hasPremium)}</Text>
    </View>
  );
}
```

### Expected Timeline

After purchase:
1. **T+0s**: Purchase completes in RevenueCat SDK
2. **T+1-5s**: Webhook arrives at Convex
3. **T+1-5s**: Query automatically updates to `true` (via reactivity)

**Note:** No manual refresh needed! Convex queries are reactive.

---

## 4. Test Restore Purchases

### iOS

1. Install app on new device (or uninstall/reinstall)
2. Sign in with your app account
3. Tap "Restore Purchases" button
4. Verify entitlement is restored

### Android

1. Install app on new device
2. Sign in with your app account
3. Entitlements should restore automatically
4. Can also tap "Restore Purchases" for manual restore

### Verify Restore

Check that:
- [ ] `hasPremium` query returns `true`
- [ ] Premium features are unlocked
- [ ] No new purchase required

---

## 5. Test Account Switching

This verifies no entitlement leakage between users.

### Test Steps

1. **User A with subscription:**
   - Sign in as User A
   - Purchase premium
   - Verify `hasPremium` is `true`
   
2. **Sign out User A:**
   - Tap sign out
   - Verify RevenueCat logout is called
   
3. **Sign in as User B (no subscription):**
   - Sign in with different account
   - Verify `hasPremium` is `false`
   - Verify premium features are locked
   
4. **Sign back in as User A:**
   - Sign in as User A again
   - Verify `hasPremium` is `true`
   - Verify premium features are unlocked

### Expected Behavior

✅ User B should **NOT** have User A's entitlement  
✅ User A should **keep** their entitlement after switching back

---

## 6. Test Cancellation Flow

### Cancel Subscription

**iOS:**
1. Settings → Apple ID → Subscriptions
2. Find your app's subscription
3. Tap "Cancel Subscription"

**Android:**
1. Play Store → Account → Payments & subscriptions
2. Find your app's subscription
3. Tap "Cancel subscription"

### Verify Behavior

After cancellation:

1. **Immediately after:** User still has access
   - `hasPremium` should be `true`
   - `willRenew` should be `false`
   
2. **Show messaging:** "Subscription ends on [date]"

3. **After expiration:** Access revoked
   - `hasPremium` becomes `false`
   - Premium features locked

Check webhook events:
- `CANCELLATION` - Marks cancelled, keeps access
- `EXPIRATION` - Revokes access

---

## 7. Test Grace Period

Grace period occurs when payment fails but user keeps access while store retries.

### Simulate Billing Issue

**iOS:**
1. Use "Declined - Billing Issue" sandbox tester
2. Or wait for natural billing retry

**Android:**
1. Test with expired payment method

### Verify Behavior

During grace period:
- [ ] `hasPremium` is still `true`
- [ ] `getSubscriptionsInGracePeriod()` returns subscription
- [ ] Show "Update payment method" banner

After grace period ends:
- [ ] `hasPremium` becomes `false`
- [ ] Access revoked

---

## 8. Common Test Scenarios

### Test: User ID Mismatch

**Purpose:** Verify user ID consistency

```typescript
// In your app
import Purchases from 'react-native-purchases';

const info = await Purchases.getCustomerInfo();
const rcUserId = info.originalAppUserId;
const queryUserId = currentUser.id;

console.log('RevenueCat user:', rcUserId);
console.log('Query user:', queryUserId);

if (rcUserId !== queryUserId) {
  console.error('USER ID MISMATCH!');
}
```

Expected: IDs should match exactly.

### Test: Webhook Delay

**Purpose:** Verify UI updates automatically

1. Make purchase
2. Immediately check `hasPremium` → Should be `false`
3. Wait 5-10 seconds
4. Check `hasPremium` again → Should be `true`

**Note:** No manual refresh needed due to Convex reactivity!

### Test: Offline Purchase

**Purpose:** Verify webhook sync

1. Enable airplane mode
2. Make purchase (stores queue it)
3. Disable airplane mode
4. Wait for webhook
5. Verify entitlement granted

---

## 9. Debug Tools

### Check RevenueCat User ID

```typescript
import Purchases from 'react-native-purchases';

async function debugRevenueCat() {
  const info = await Purchases.getCustomerInfo();
  
  console.log('App User ID:', info.originalAppUserId);
  console.log('Active Entitlements:', info.entitlements.active);
  console.log('Active Subscriptions:', info.activeSubscriptions);
}
```

### Check Convex Data

```typescript
const subscriptions = useQuery(api.subscriptions.getAllSubscriptions, {
  appUserId: currentUser?.id
});

console.log('Convex subscriptions:', subscriptions);
```

### Check Webhook Events

In Convex Dashboard:
1. Go to **Data** → `webhookEvents`
2. Filter by user: `appUserId` = `<user-id>`
3. Review event history

---

## 10. Production Testing

Before launch, test in production environment:

### Checklist

- [ ] Create real products (not sandbox)
- [ ] Configure production webhook URL
- [ ] Test real purchase on iOS
- [ ] Test real purchase on Android
- [ ] Test restore purchases
- [ ] Test cancellation flow
- [ ] Test account switching
- [ ] Monitor Convex logs for errors

### Test with TestFlight / Internal Testing

1. Upload production build to TestFlight (iOS) or internal testing (Android)
2. Make real purchases (you'll be charged!)
3. Verify everything works
4. Refund test purchases via store dashboard

---

## Troubleshooting Tests

### Purchase succeeds but `hasPremium` stays `false`

**Check:**
1. Wait 30 seconds (webhook delay)
2. Verify webhook arrived: `npx convex logs`
3. Check user ID match (see debug tools above)
4. Check entitlement ID spelling/casing

### Test event shows success but logs show nothing

**Check:**
1. Webhook URL is correct
2. Authorization token matches
3. Backend is running: `bun run dev:server`

### Restore doesn't work

**Check:**
1. Same Apple ID / Google account
2. Same RevenueCat user ID (same app account)
3. Check RevenueCat dashboard → Customer History

---

## Quick Reference Commands

```bash
# Start backend
bun run dev:server

# View Convex logs
npx convex logs

# View Convex logs (follow)
npx convex logs --tail

# Check environment variables
npx convex env list

# Send test webhook (via RevenueCat dashboard)
# Project Settings → Integrations → Webhooks → Send Test Event
```

---

## Additional Resources

- [RevenueCat Testing Guide](https://www.revenuecat.com/docs/test-and-launch/sandbox)
- [App Store Sandbox](https://developer.apple.com/apple-pay/sandbox-testing/)
- [Google Play Testing](https://developer.android.com/google/play/billing/test)
