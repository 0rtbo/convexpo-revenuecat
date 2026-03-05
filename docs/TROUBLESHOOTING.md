# Troubleshooting

Quick fixes for common RevenueCat + Convex issues.

---

## 401 Unauthorized

**Cause:** Token mismatch between Convex and RevenueCat.

**Fix:**
1. Check your Convex token:
   ```bash
   npx convex env get REVENUECAT_WEBHOOK_AUTH
   ```
2. Compare with the Authorization header in RevenueCat dashboard
3. They must match exactly (no extra spaces)

---

## 404 Not Found

**Cause:** Wrong webhook URL.

**Fix:**
1. Verify URL ends with `/webhooks/revenuecat` (plural "webhooks")
2. Check for typos
3. Confirm the URL uses `.site` not `.cloud`

**Correct format:**
```
https://your-deployment.convex.site/webhooks/revenuecat
```

---

## Purchase Succeeded but No Entitlement

**Cause:** Usually entitlement ID mismatch.

**Fix:**
1. Check your entitlement name in RevenueCat dashboard (e.g., `"MyApp Pro"`)
2. Verify it matches **exactly** in both places:

   **Client** (`apps/native/.env.development`):
   ```bash
   EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID="MyApp Pro"
   ```

   **Backend**:
   ```bash
   npx convex env get REVENUECAT_ENTITLEMENT_ID
   ```

3. Remember: case-sensitive, spaces and hyphens matter!

---

## Types Not Found

**Cause:** Convex hasn't regenerated types.

**Fix:**
1. Restart the backend: `bun run dev:server`
2. Wait for "Convex functions ready!"
3. Check `packages/backend/convex/_generated/api.d.ts` exists
