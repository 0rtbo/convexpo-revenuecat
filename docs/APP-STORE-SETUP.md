# App Store Connect Setup

Connect your iOS app to RevenueCat for real purchases.

**Prerequisites:**
- Apple Developer account ($99/year)
- RevenueCat project set up (completed [DEV-TODO.md](./DEV-TODO.md))

**Time estimate:** 30-45 minutes

---

## Step 1: Configure EAS & Create Production Build

First, make sure you're logged into EAS with the correct account:

```bash
eas login
eas whoami  # Verify you're logged into the right account/org
```

Then navigate to the native app and build for the App Store:

```bash
cd apps/native
eas build -p ios --profile production
```

EAS will automatically:
- Create your EAS project (if it doesn't exist)
- Link it to your Expo account/organization
- Set up Apple credentials (Distribution Certificate, Provisioning Profile)
- Initialize build numbers

Just follow the prompts and provide your Apple Developer account credentials when asked.

Then submit to :
// left off here
```bash
eas submit -p ios
```

This will upload your build to App Store Connect.

---

## Step 2: Create Subscription in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Click **Subscriptions** in the sidebar
4. Click **+** to create a new subscription group
5. Name your group (e.g., `Premium`)

### Add a Subscription Product

1. Inside your subscription group, click **+** to add a subscription
2. Fill in:
   | Field | Example |
   |-------|---------|
   | **Reference Name** | Monthly Premium |
   | **Product ID** | `com.yourapp.premium.monthly` |
   | **Duration** | 1 Month |
   | **Price** | Select your price tier |

3. Add localized display name and description
4. Click **Save**

Repeat for yearly, lifetime, etc.

---

## Step 3: Get Your Shared Secret

1. In App Store Connect, go to your app
2. Click **App Information** in the sidebar
3. Scroll to **App-Specific Shared Secret**
4. Click **Manage** → **Generate**
5. Copy the shared secret

---

## Step 4: Connect RevenueCat to App Store

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Click **Apps** in the sidebar
4. Click **+ New App** → Select **App Store**
5. Fill in:
   | Field | Value |
   |-------|-------|
   | **App name** | Your app name |
   | **Bundle ID** | Your iOS bundle ID (e.g., `com.yourapp`) |
   | **Shared Secret** | Paste from Step 3 |

6. Click **Save**

---

## Step 5: Import Products to RevenueCat

1. In RevenueCat, go to **Products** in the sidebar
2. Click **+ New**
3. Select **App Store**
4. Enter your Product ID (e.g., `com.yourapp.premium.monthly`)
5. Click **Save**

Repeat for each subscription product.

---

## Step 6: Set Up Offerings

1. Go to **Offerings** in the sidebar
2. Edit your existing offering (or create new)
3. Add your products to packages:
   - Monthly → your monthly product
   - Annual → your yearly product
4. Click **Save**

---

## Step 7: Get Production API Key

1. Go to **API Keys** in the sidebar
2. Find your iOS key that starts with `appl_` (not `test_`)
3. Copy it

---

## Step 8: Update Environment Variables

Replace your test key with the production key:

**Client** (`apps/native/.env.development`):
```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxx
```

---

## Step 9: Test Real Purchase

1. Create a Sandbox Tester in App Store Connect
   - Go to **Users and Access** → **Sandbox Testers**
   - Add a new tester with a unique email
2. On your device, sign out of your Apple ID
3. Run your app and make a purchase
4. Sign in with the sandbox tester when prompted

---

## 🎉 Done!

Your iOS app is now connected to real App Store subscriptions through RevenueCat.

---

## Troubleshooting

**Products not showing in app?**
- Verify Bundle ID matches exactly
- Check products are added to an Offering in RevenueCat
- Make sure Shared Secret is correct

**Purchase fails?**
- Confirm you're signed in with Sandbox Tester account
- Check product status is "Ready to Submit" in App Store Connect
