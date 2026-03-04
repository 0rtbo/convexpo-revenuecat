# Developer TODO: RevenueCat Backend Integration

This checklist tells you exactly what to do to get RevenueCat webhooks working with your Convex backend.

---

## ✅ Pre-Flight Check

Before you start, make sure you have:

- [ ] Convex project deployed and running

**Time estimate:** 15-20 minutes

---

## 🧙 Step 0: RevenueCat Project Setup (If Not Done)

If you haven't created a RevenueCat project yet, here's what the wizard asks:

### 0.1 Create Project

1. Go to [https://app.revenuecat.com](https://app.revenuecat.com)
2. Click **Create New Project**

### 0.2 Wizard Prompts

The wizard will ask:

| Prompt | What to Enter |
|--------|---------------|
| **Project name** | Your app name (e.g., `My App`) |
| **Category** | Select your app category |
| **Platform** | Select `React Native` |

### 0.3 Create Entitlement

After project creation:

1. Go to **Entitlements** in sidebar
2. Click **+ New**
3. Enter an identifier (e.g., `pro` or `premium`)
   - ⚠️ This is case-sensitive! Remember exactly what you type.

### 0.4 Add Products (Optional for Testing)

For sandbox testing, you can skip this. For real purchases:

1. **iOS:** Create products in App Store Connect → Subscriptions
2. **Android:** Create products in Google Play Console → Monetization
3. In RevenueCat: Go to **Products** → Add your store products
4. Go to **Offerings** → Create offering → Attach products

### 0.5 Get API Keys

1. Go to **API Keys** in sidebar
2. Copy your keys:
   - **iOS:** `appl_...` (or `test_...` for sandbox)
   - **Android:** `goog_...` (or `test_...` for sandbox)

**✏️ ACTION:** Note your entitlement ID and API keys - you'll need them later.

---

## 🔧 Step 1: Generate Webhook Secret

Open your terminal and run:

```bash
openssl rand -base64 32
```

**You'll get output like:**
```
9K7xZm3pL8qR2nV6wA4yB1cD5eF0gH2iJ3kL4mN5oP6qR7sT8uV9w
```

**✏️ ACTION:** Copy this entire string somewhere safe (you'll need it in the next steps).

---

## 🔧 Step 2: Set Convex Environment Variable

In your terminal, navigate to the backend:

```bash
cd packages/backend
```

Set the environment variable (replace with YOUR token from Step 1):

```bash
npx convex env set REVENUECAT_WEBHOOK_AUTH <token goes here>
```

**Expected output:**
```
Set REVENUECAT_WEBHOOK_AUTH for this project
```

**✏️ ACTION:** Confirm you see the success message.

---

## 🔧 Step 3: Start Backend Server

Still in `packages/backend`, start the dev server:

```bash
bun run dev:server
```

**OR** from the project root:

```bash
bun run dev:server
```

**Expected output:**
```
✔ Convex functions ready!
https://your-deployment-123.convex.site
```

**✏️ ACTION:** Copy your deployment URL (the `https://...` line). You'll need this for RevenueCat.

**Keep this terminal running!** Open a new terminal tab for the next steps.

---

## 🔧 Step 4: Configure RevenueCat Webhook

### 4.1 Open RevenueCat Dashboard

1. Go to [https://app.revenuecat.com](https://app.revenuecat.com)
2. Select your project
3. Click **Project Settings** (bottom left sidebar)

### 4.2 Navigate to Webhooks

1. In Project Settings, click **Integrations** tab
2. Find **Webhooks** section
3. Click **Webhooks (Add new configuration)** button

### 4.3 Fill in Webhook Details

You'll see a form with these fields:

| Field | What to Enter |
|-------|---------------|
| **Name** | `Convex` (or any name you want) |
| **Webhook URL** | Your deployment URL from Step 3 + `/webhooks/revenuecat`<br>Example: `https://your-deployment-123.convex.site/webhooks/revenuecat` |
| **Authorization header** | Paste your token from Step 1 |

**Example:**
- Name: `Convex`
- URL: `https://happy-animal-123.convex.site/webhooks/revenuecat`
- Auth: `9K7xZm3pL8qR2nV6wA4yB1cD5eF0gH2iJ3kL4mN5oP6qR7sT8uV9w`

### 4.4 Save the Webhook

Click **Save** or **Add** button at the bottom of the form.

**✏️ ACTION:** Confirm the webhook appears in your list.

---

## 🔧 Step 5: Test the Webhook

### 5.1 Send Test Event

In RevenueCat webhook settings:

1. Find your newly created webhook in the list
2. Click on it to expand details
3. Look for **Send Test Event** button
4. Click it

**✏️ ACTION:** You should see a green checkmark ✅ indicating success.

### 5.2 Verify in Convex Logs

In a new terminal (keep backend server running), run:

```bash
npx convex logs
```

**Expected output:**
```
[INFO] RevenueCat webhook received: TEST event
[INFO] Event processed successfully
```

**✏️ ACTION:** Confirm you see the TEST event logged.

### 5.3 Verify in Convex Dashboard

1. Go to [https://dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your project
3. Click **Data** in left sidebar
4. Click **app** dropdown and select **revenuecat**
5. Click **webhookEvents** table
6. You should see one row with `eventType: "TEST"`

**✏️ ACTION:** Confirm the test event appears in the table.

---

## 🔧 Step 6: Configure Client Environment

### 6.1 Copy Environment File

```bash
cp apps/native/.env.example apps/native/.env.development
```

### 6.2 Set Variables

Edit `apps/native/.env.development`:

```bash
# Copy from CONVEX_URL in packages/backend/.env.local
EXPO_PUBLIC_CONVEX_URL=https://xxxx-xxx-xxx.convex.cloud

# Same as above but with .site instead of .cloud
EXPO_PUBLIC_CONVEX_SITE_URL=https://xxxx-xxx-xxx.convex.site

# RevenueCat API Keys (from Step 0.5)
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_... # or test_... for sandbox
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_... # or test_... for sandbox

# Must match your RevenueCat entitlement EXACTLY (case-sensitive!)
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro

# Optional - defaults to "default"
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
```

### 6.3 Set Backend Entitlement ID

Make sure backend matches client:

```bash
cd packages/backend
npx convex env set REVENUECAT_ENTITLEMENT_ID "pro"
```

**✏️ ACTION:** Verify both client and backend use the same entitlement ID.

---

## 🎉 Success Checklist

If all these are true, you're done with backend setup:

- [ ] ✅ Webhook secret generated and set in Convex
- [ ] ✅ Backend server is running
- [ ] ✅ Webhook configured in RevenueCat dashboard
- [ ] ✅ Test event shows green checkmark in RevenueCat
- [ ] ✅ Test event appears in `npx convex logs`
- [ ] ✅ Test event appears in Convex Dashboard → webhookEvents table

**Backend integration is complete!** 🎊

---

## 🧪 Next: Test with Real Purchase

Now that webhooks are working, test with an actual purchase:

### 1. Make Sandbox Purchase

In your React Native app:
1. Navigate to paywall/subscription screen
2. Make a test purchase (sandbox mode)
3. Complete the purchase flow

### 2. Wait for Webhook

**Don't refresh!** Just wait 5-10 seconds. Convex queries will update automatically.

### 3. Verify in Logs

```bash
npx convex logs --tail
```

**Expected output:**
```
[INFO] RevenueCat webhook received: INITIAL_PURCHASE event
[INFO] Created subscription for user: <user-id>
[INFO] Granted entitlement: premium (or your entitlement ID)
```

### 4. Verify in Database

In Convex Dashboard → Data, check these tables:

- [ ] **customers** - Should have user record
- [ ] **subscriptions** - Should have subscription record
- [ ] **entitlements** - Should have active entitlement

### 5. Verify in App

In your React Native app, check the query:

```typescript
// No userId needed - uses authenticated user automatically!
const hasPremium = useQuery(api.subscriptions.hasPremium, {});

console.log('Has Premium:', hasPremium); // Should be true
```

**✏️ ACTION:** Confirm `hasPremium` returns `true` after the webhook arrives.

---

## 🐛 Troubleshooting

### Problem: Test Event Returns 401 Unauthorized

**Cause:** Authorization token mismatch.

**Fix:**
1. Check environment variable:
   ```bash
   npx convex env get REVENUECAT_WEBHOOK_AUTH
   ```
2. Compare with what's in RevenueCat dashboard
3. They must match EXACTLY (no extra spaces)
4. If different, update one to match the other
5. Restart backend: Stop (`Ctrl+C`) and run `bun run dev:server` again

### Problem: Test Event Returns 404 Not Found

**Cause:** Wrong URL or backend not running.

**Fix:**
1. Check backend is running (`bun run dev:server`)
2. Verify URL ends with `/webhooks/revenuecat` (note the plural "webhooks")
3. Check for typos in URL
4. Get correct URL from Convex deployment logs

### Problem: Test Event Succeeds but No Logs

**Cause:** Logs not showing or event processing silently failed.

**Fix:**
1. Wait 10 seconds and check logs again:
   ```bash
   npx convex logs --tail
   ```
2. Check Convex Dashboard → Data → webhookEvents table directly
3. Restart backend and try test event again

### Problem: Purchase Succeeded but No Entitlement

**Possible causes:**

1. **Webhook delay** - Wait 10-30 seconds (normal)
2. **User ID mismatch** - Most common issue!

**Debug user ID mismatch:**

In your app, add this debug code:

```typescript
import Purchases from 'react-native-purchases';

// Check RevenueCat user ID
const info = await Purchases.getCustomerInfo();
console.log('RevenueCat user ID:', info.originalAppUserId);

// Check your app user ID
console.log('App user ID:', currentUser?.id);

// These MUST match!
```

If they don't match, check:
- `apps/native/lib/revenue-cat/index.ts` - Should use `String(user._id)`
- Your query - Should use same ID

3. **Entitlement ID mismatch** - Check spelling/casing

In RevenueCat dashboard:
- Go to **Entitlements**
- Note the exact ID (e.g., `pro`, `premium`)

In your environment:
```bash
# Must match EXACTLY (case-sensitive, spaces matter!)
npx convex env set REVENUECAT_ENTITLEMENT_ID "pro"
```

And in client `.env`:
```bash
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID=pro
```

### Problem: Types Not Found After Installation

**Cause:** Convex hasn't regenerated types yet.

**Fix:**
1. Stop backend server (`Ctrl+C`)
2. Restart: `bun run dev:server`
3. Wait for "Convex functions ready!" message
4. Check `packages/backend/convex/_generated/api.d.ts` exists

---

## 📋 Environment Variable Reference

### For Local Development

Create `packages/backend/.env.local`:

```bash
REVENUECAT_WEBHOOK_AUTH=your-generated-token-here
```

### For Production

Set via Convex CLI:

```bash
npx convex env set REVENUECAT_WEBHOOK_AUTH <your-token> --prod
```

**Note:** Production webhook URL will be different from dev URL.

---

## 🔗 Webhook URL Format

Your webhook URL should look like this:

```
https://[deployment-name].convex.site/webhooks/revenuecat
       ^^^^^^^^^^^^^^^^                ^^^^^^^^^^^^^^^^^^
       Your Convex deployment          Component webhook path
```

**Examples of correct URLs:**
- `https://happy-animal-123.convex.site/webhooks/revenuecat`
- `https://my-app-prod.convex.site/webhooks/revenuecat`

**Examples of WRONG URLs:**
- ❌ `https://happy-animal-123.convex.site/webhook/revenuecat` (missing 's')
- ❌ `https://happy-animal-123.convex.site/revenuecat` (missing `/webhooks/`)
- ❌ `https://happy-animal-123.convex.site/webhooks/revenue-cat` (hyphen)

---

## 📚 Documentation Reference

After setup, refer to these docs:

| When You Need... | Read This |
|-----------------|-----------|
| How to use queries in app | [revenuecat-backend.md](./revenuecat-backend.md#querying-subscriptions) |
| Testing procedures | [TESTING.md](./TESTING.md) |
| Understanding architecture | [revenuecat-backend.md](./revenuecat-backend.md#how-it-works) |
| Troubleshooting issues | [revenuecat-backend.md](./revenuecat-backend.md#troubleshooting) |
| How user IDs link | [USER-LINKING.md](./USER-LINKING.md) |

---

## 🎯 What Happens After Setup

Once setup is complete:

1. **Every time a user makes a purchase:**
   - RevenueCat sends webhook to Convex
   - Convex stores subscription data
   - Your queries automatically update (reactive!)
   - UI updates without refresh

2. **Every time a subscription renews:**
   - Webhook updates expiration date
   - User keeps access seamlessly

3. **Every time a user cancels:**
   - Webhook marks as cancelled
   - User keeps access until expiration
   - Then access is revoked automatically

4. **Every time there's a billing issue:**
   - Webhook tracks grace period
   - You can show "Update payment" prompt
   - User keeps access during grace period

**You don't need to do anything - it's all automatic!** 🎉

---

## ✅ Completion Checklist

Before moving on, ensure:

- [ ] Backend server is running without errors
- [ ] Environment variable is set (check with `npx convex env list`)
- [ ] Webhook is configured in RevenueCat dashboard
- [ ] Test event succeeds (green checkmark)
- [ ] Test event appears in logs
- [ ] Test event appears in Convex Dashboard
- [ ] You understand how to query subscriptions (see docs above)

**If all checked, you're done!** The backend integration is complete and ready for production.

---

## 🆘 Still Stuck?

1. **Check logs carefully:**
   ```bash
   npx convex logs --tail
   ```

2. **Verify webhook in RevenueCat:**
   - Should show "Last Response: 200 OK"
   - Click "View Recent Attempts" to see request/response

3. **Check Convex Dashboard:**
   - Data → webhookEvents should have entries
   - If empty, webhook isn't reaching Convex

4. **Read detailed troubleshooting:**
   - [revenuecat-backend.md#troubleshooting](./revenuecat-backend.md#troubleshooting)
   - [TESTING.md](./TESTING.md)

5. **Compare your setup to example:**
   - Check [convex-revenuecat examples](https://github.com/ramonclaudio/convex-revenuecat/tree/main/example)

---

**Good luck!** 🚀 Once this is working, you have real-time subscription syncing with zero polling!
