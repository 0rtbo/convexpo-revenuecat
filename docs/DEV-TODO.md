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

### 0.2 Wizard Screen 1: Project Info

| Field | What to Enter |
|-------|---------------|
| **Project name** | Your app name (e.g., `My App`) |
| **Category** | Select your app category |
| **Platform** | Select `React Native` |

### 0.3 Wizard Screen 2: Entitlement & Offering

This screen sets up your monetization structure.

| Field | What to Enter |
|-------|---------------|
| **Entitlement name** | Defaults to `[App] Pro`. Edit if you prefer another name (e.g., `Premium`, `Unlimited`). |
| **Default offering** | Configure your pricing tiers. You can add/remove options (monthly, yearly, lifetime). |

> ⚠️ **Important:** Remember your entitlement name exactly! It's case-sensitive, and spaces/hyphens matter. For example: `"MyApp Pro"`, `"my-app Pro"`, etc.

### 0.4 Wizard Screen 3: API Key

Copy your API key immediately! It looks like:
```
test_btlVgXwsaXNWLyaCclgyNjLgPMO
```

> 💡 **Tip:** Test keys start with `test_`. Production keys will start with `appl_` (iOS) or `goog_` (Android) once you connect your app stores.

**✏️ ACTION:** Save both your **entitlement name** and **API key** somewhere safe - you'll need them in Step 6.

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

## 🔧 Step 3: Find Your Convex Site URL

### If you completed auth setup (Convexpo)

Your URL is already in `apps/native/.env.development`:

```bash
EXPO_PUBLIC_CONVEX_SITE_URL=https://your-deployment-123.convex.site
```

**✏️ ACTION:** Copy this URL - you'll use it in Step 4.

### If starting fresh

From the project root, start the backend:

```bash
bun run dev:server
```

Copy the `.site` URL from the output:
```
✔ Convex functions ready!
https://your-deployment-123.convex.site
```

---

## 🔧 Step 4: Configure RevenueCat Webhook

### 4.1 Navigate to Webhooks

1. Go to [https://app.revenuecat.com](https://app.revenuecat.com)
2. Select your project
3. Click the **Integrations** tab
4. Find **Webhooks** section and click **+ New**

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

### 5.2 Verify in Convex Dashboard

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

# Must match your RevenueCat entitlement EXACTLY (case-sensitive, spaces and hyphens matter!)
EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID="MyApp Pro"

# Optional - defaults to "default"
EXPO_PUBLIC_REVENUECAT_OFFERING_ID=default
```

### 6.3 Set Backend Entitlement ID

Make sure backend matches client (use the exact same entitlement name):

```bash
npx convex env set REVENUECAT_ENTITLEMENT_ID "MyApp Pro"
```

**✏️ ACTION:** Verify both client and backend use the same entitlement ID.

---

## 🎉 Success!

If you see the test event in your Convex Dashboard → webhookEvents table, **you're done!**

RevenueCat is now connected to your Convex backend. 🎊

---

## 🧪 Next: Test in sandbox

Now that webhooks are working, test with an actual purchase:

### 1. Make Sandbox Purchase

In your React Native app:
1. Navigate to paywall/subscription screen
2. Make a test purchase (sandbox mode)
3. Complete the purchase flow

### 2. Wait for Webhook

**Don't refresh!** Just wait 5-10 seconds. Convex queries will update automatically.

### 3. Verify in Database

In Convex Dashboard → Data, check these tables:

- **customers** - Should have user record
- **subscriptions** - Should have subscription record
- **entitlements** - Should have active entitlement

### 4. Verify in App

Go to **Settings** in your app - the `SubscriptionStatusCard` should show your active subscription!

**✏️ ACTION:** Confirm the subscription status updates automatically.

---

## 🐛 Troubleshooting

Something not working? See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common fixes.

---

## 🚀 What's Next?

You've got RevenueCat working with test keys! To accept real payments:

1. **[Set up App Store Connect](./APP-STORE-SETUP.md)** (iOS) - Create products, subscriptions, and connect to RevenueCat
2. **Set up Google Play Console** (Android) - 🚧 Under construction, coming in next release
