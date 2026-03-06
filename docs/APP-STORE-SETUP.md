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

Then submit to TestFlight:

```bash
eas submit -p ios
```

> **Note:** This creates your app in App Store Connect automatically. We need the app to exist there before we can connect it to RevenueCat.

---

## Step 2: Connect App Store to RevenueCat

Connect your app and add the required credentials.

### 2.1 Create App in RevenueCat

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project → **Apps & Providers**
3. Click **+ New App Configuration** → **App Store**
4. Fill in:
   | Field | Value | Example |
   |-------|-------|---------|
   | **App name** | Your app name | `My Awesome App` |
   | **Bundle ID** | From `apps/native/app.json` → `expo.ios.bundleIdentifier` | `com.mycompany.myapp` |

### 2.2 Add In-App Purchase Key (Required)

This key validates transactions.

> **Note:** This key is account-level, not app-specific. If you already have one from another app, you can reuse the same `.p8` file, Key ID, and Issuer ID.

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **In-App Purchase**
2. The **Issuer ID** is displayed right above the **+** button
3. Click **+** to generate a new key (or reuse an existing one)
4. Download the `.p8` file and note the **Key ID**
5. In RevenueCat, open **In-app purchase key configuration**
6. Upload `.p8`, enter **Key ID** and **Issuer ID**

**What these look like:**
| Field | Example |
|-------|---------|
| Key ID | `ABC123DEFG` |
| Issuer ID | `12345678-1234-1234-1234-123456789012` |
| .p8 file | `AuthKey_ABC123DEFG.p8` |

Docs: https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration

### 2.3 Add App Store Connect API Key (Recommended)

This key auto-imports products and prices — saves you from manually entering each product.

> **Note:** This key is also account-level and can be reused across apps.

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API**
2. The **Issuer ID** is displayed right above the **+** button
3. Click **+** to generate a key with **App Manager** access (or reuse an existing one)
4. Download the `.p8` file and note the **Key ID**
5. Get your **Vendor Number**: Go to **Payments and Financial Reports** — it's visible in the top-left corner
6. In RevenueCat, open **App Store Connect API**
7. Upload `.p8`, enter **Key ID**, **Issuer ID**, and **Vendor Number**
8. Click **Save Changes**

**What these look like:**
| Field | Example |
|-------|---------|
| Key ID | `XYZ789HIJK` |
| Issuer ID | `12345678-1234-1234-1234-123456789012` (same as 2.2) |
| Vendor Number | `87654321` |

Docs: https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration

> **Note:** Shared Secret is legacy (StoreKit 1). Modern apps use the In-App Purchase Key (StoreKit 2) instead.

### 2.4 Enable Apple Server Notifications (Recommended)

This ensures RevenueCat receives real-time updates for renewals, cancellations, and refunds — even when the app isn't open.

1. You should still be in RevenueCat from 2.3 — if not, go to **Apps & Providers** → select your app (App Store)
2. Scroll down to **Apple Server Notification URL** and copy it
3. Go to [App Store Connect](https://appstoreconnect.apple.com) → Your App → **App Information**
4. Scroll to **App Store Server Notifications**
5. Paste the URL in **Production Server URL**
6. Set version to **Version 2**
7. Back in RevenueCat, enable **Track new purchases from server-to-server notifications**

**Example URL:**
```
https://api.revenuecat.com/v1/incoming-webhooks/apple/abcd1234-5678-90ab-cdef-1234567890ab
```

Docs: https://www.revenuecat.com/docs/service-credentials/apple-app-store#apple-server-notifications

---

## Step 3: Create Subscription in App Store Connect

Follow along: https://www.revenuecat.com/docs/getting-started/entitlements/ios-products

### 3.1 Create Subscription Group

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → **Subscriptions** in sidebar
3. Click **+** to create a subscription group
4. Enter a **Reference Name** (internal only, not shown to users)
5. Click **Create**

> **Examples:** `Premium Subscriptions`, `Pro Access`, `MyApp Plus`

### 3.2 Add Subscription Product

1. Inside the group, click **+** to add a subscription
2. Enter:
   | Field | Description |
   |-------|-------------|
   | **Reference Name** | Internal name (e.g., `Monthly Premium`) |
   | **Product ID** | Unique ID - can't be reused, even if deleted |

3. Click **Create**

> **Product ID Format:** Use a consistent naming scheme. Once used, a Product ID can never be reused — even if deleted!
>
> Recommended format: `<app>_<price>_<duration>_<intro>`
>
> | Product | Product ID | Explanation |
> |---------|------------|-------------|
> | $4.99/month | `myapp_499_1m` | 499 cents, 1 month |
> | $9.99/month | `myapp_999_1m` | 999 cents, 1 month |
> | $49.99/year | `myapp_4999_1y` | 4999 cents, 1 year |
> | $39.99/year + 1 week free | `myapp_3999_1y_1w0` | 1 week trial, $0 |
> | $79.99 lifetime | `myapp_7999_lt` | lifetime purchase |

### 3.3 Configure Duration, Price & Localization

1. Select your subscription product
2. Set **Subscription Duration** (e.g., 1 Month)
3. Under **Subscription Prices**, click **+** to add a price tier
4. Under **App Store Localization**, click **+** and add:
   - **Display Name:** What users see (e.g., `Pro Monthly`)
   - **Description:** Brief benefit (e.g., `Unlock all premium features`)
5. Click **Save**

Repeat 3.2-3.3 for yearly, lifetime, etc.

> **Localization Examples:**
>
> | Product | Display Name | Description |
> |---------|--------------|-------------|
> | Monthly | `Pro Monthly` | `Full access to all premium features, billed monthly` |
> | Yearly | `Pro Yearly` | `Full access to all premium features, save 40%` |
> | Lifetime | `Pro Lifetime` | `Unlock all features forever with a one-time purchase` |
>
> **Tip:** Use the same Display Name across all durations (e.g., just `Pro`) for a cleaner App Store listing.

### 3.4 Add Review Information

Apple requires review information before approving subscriptions.

1. In your subscription product, scroll to **Review Information**
2. Add a **Screenshot** of your paywall:
   - Size: **640 x 920 px** (required)
   - While testing, you can upload a placeholder image
3. Add **Review Notes** (optional) — explain anything the reviewer needs to know

> **App Store Listing Screenshots** (for the App Store page, not IAP review) have different size requirements:
>
> | Device | Size (portrait) |
> |--------|-----------------|
> | 6.7" (iPhone 15 Pro Max) | 1290 x 2796 px |
> | 6.5" (iPhone 14 Plus) | 1284 x 2778 px |
> | 5.5" (iPhone 8 Plus) | 1242 x 2208 px |
> | iPad Pro 12.9" | 2048 x 2732 px |

---

## Step 4: Import Products to RevenueCat

If you added the App Store Connect API Key in Step 2.3, products will auto-import. Otherwise, add them manually:

1. In RevenueCat, go to **Product Catalog** → **Products** in the sidebar
2. Click **+ New**
3. Select **App Store**
4. Enter your Product ID exactly as created in App Store Connect
5. Click **Save**

Repeat for each subscription product.

### 4.1 Attach Products to Entitlement

This links your products to the entitlement you created during initial setup — so purchases unlock access.

1. Still in **Product Catalog** → **Products**
2. On the products you just added
3. Click **Attach** and select your entitlement (e.g., `MyApp Pro`)

Repeat for each product that should unlock this entitlement.

> **Example:** If you have `myapp_999_1m` (monthly) and `myapp_4999_1y` (yearly), attach BOTH to the same entitlement like `MyApp Pro`. Either purchase will unlock pro access.

---

## Step 5: Add Products to Offerings

Connect your products to the Offering you created during initial setup:

1. In RevenueCat, go to **Product Catalog** in the sidebar
2. In the top bar, select **Offerings**
3. Click into your existing offering (e.g., `default`)
4. Click **Edit** 
5. Choose a package identifier and attach the matching product
6. Click **Save**

**Package Identifier Reference:**

| Package ID | Use For | Example Product ID |
|------------|---------|-------------------|
| `$rc_monthly` | Monthly subscription | `myapp_999_1m` |
| `$rc_annual` | Yearly subscription | `myapp_4999_1y` |
| `$rc_lifetime` | One-time lifetime purchase | `myapp_7999_lt` |
| `$rc_weekly` | Weekly subscription | `myapp_199_1w` |

> **Note:** Packages are cross-platform containers. When you add Android later, you'll attach Google Play products to the same packages — this is how RevenueCat handles cross-platform subscriptions.

---

## Step 6: Test with Sandbox

Before going live, test purchases using Apple's sandbox environment:

### 6.1 Create Sandbox Tester

Docs: https://www.revenuecat.com/docs/test-and-launch/sandbox/apple-app-store

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → **Users and Access** → **Sandbox** → **Testers**
2. Click **+** to add a new tester
3. Fill in the form (email doesn't need to be real):

**Example tester:**
| Field | Example |
|-------|---------|
| First Name | `Test` |
| Last Name | `User` |
| Email | `testuser+sandbox1@gmail.com` |
| Password | `Test1234!` |
| Country | United States |

> **Tip:** Use Gmail's `+` trick (`you+sandbox1@gmail.com`) to create multiple testers with your real email, or just use fake emails like `sandbox1@test.com`.

### 6.2 Configure Device for Sandbox

1. On your **physical iOS device**, go to **Settings** → **App Store**
2. Scroll to bottom → **Sandbox Account**
3. Sign in with your sandbox tester credentials

> **Note:** Do NOT sign out of your real Apple ID. Sandbox account is separate.

### 6.3 Get Your iOS API Key

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Select your project
3. Click **API Keys** in the left sidebar
4. Find **Your App Name (App Store)** under "Public API Keys"
5. Click **Show Key** to reveal it — starts with `appl_`
6. Copy it

**Example:**
```
appl_AbCdEfGhIjKlMnOpQrStUvWxYz
```

### 6.4 Configure Environment Variable

Add the key to your native app environment:

**File:** `apps/native/.env.development` (create if it doesn't exist)

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_your_key_here
```

> **Note:** If you were using a `test_` key before, replace it with the `appl_` key. The `test_` keys only work in simulator and can't make real purchases.

> **Important for EAS Builds:** When deploying with `eas build`, make sure to also set this in your production environment:
> - **Option 1:** Add to `apps/native/.env.production`
> - **Option 2:** Set in EAS Secrets: `eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_your_key_here`
> 
> See [EAS Environment Variables](https://docs.expo.dev/build-reference/variables/) for more details.

### 6.5 Make Test Purchase

1. Build and run your app on the device:
   ```bash
   cd apps/native
   npx expo run:ios --device
   ```
2. Trigger a purchase from your paywall
3. The sandbox account will be used automatically
4. Confirm the purchase completes
5. Verify in RevenueCat Dashboard → **Customers** that the subscription appears

---

## Done!

Your iOS app is connected to real App Store subscriptions through RevenueCat.

**Next steps:**
- Submit your app for review (products are reviewed with the app)
- Set up [Android/Google Play](https://www.revenuecat.com/docs/getting-started/entitlements/android-products) when ready

---

## Troubleshooting

**Products not showing in app?**
- Verify Bundle ID matches exactly in RevenueCat app config
- Check products are added to Packages within an Offering
- Ensure the Offering is set as "Current" (default)
- Verify In-App Purchase Key credentials are correct

**Purchase fails in sandbox?**
- Make sure Sandbox Account is configured in device Settings
- Check product has pricing and localization in App Store Connect
- Verify product status shows "Ready to Submit"

**RevenueCat not receiving webhooks?**
- Confirm Apple Server Notification URL is set in App Store Connect
- Check version is set to "Version 2"
