# Convexpo + RevenueCat

A monetization-ready app starter built on [Convexpo](https://github.com/0rtbo/convexpo).

**Stack:** Convex + Better Auth + Expo (React Native) + HeroUI Native + RevenueCat

---

## What You Get

### Client (React Native)

- RevenueCat SDK with provider for purchases, entitlements, and identity sync
- Subscription status card with real-time updates
- Purchase flow with loading states and error handling
- Sign-out and account deletion that clears RevenueCat identity

### Backend (Convex)

- [convex-revenuecat](https://github.com/ramonclaudio/convex-revenuecat) component
- Webhook endpoint receiving all 18 RevenueCat event types
- Secure subscription queries (auth-guarded, no user ID spoofing)
- Real-time sync - UI updates automatically when webhooks arrive

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- RevenueCat account with project created
- Convex account

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd convexpo-revenuecat
bun install

# 2. Follow the setup guide
```

**Follow the complete setup guide:** [docs/DEV-TODO.md](./docs/DEV-TODO.md)

The guide covers:

- Convex backend configuration
- RevenueCat webhook setup
- Environment variables
- Testing your integration

---

## Architecture

```
┌─────────────────┐
│  React Native   │  User makes purchase
│      App        │  (RevenueCat SDK)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RevenueCat API  │  Processes purchase
└────────┬────────┘
         │ Webhook
         ▼
┌─────────────────┐
│ Convex Backend  │  Stores subscription
└────────┬────────┘
         │ Reactive query
         ▼
┌─────────────────┐
│  React Native   │  UI auto-updates
│      App        │  (no refresh needed)
└─────────────────┘
```

---

## Documentation


| Doc                                                   | Description                        |
| ----------------------------------------------------- | ---------------------------------- |
| [DEV-TODO.md](./docs/DEV-TODO.md)                     | Setup checklist (start here)       |
| [revenuecat.md](./docs/revenuecat.md)                 | Client-side SDK guide              |
| [revenuecat-backend.md](./docs/revenuecat-backend.md) | Backend API reference              |
| [TESTING.md](./docs/TESTING.md)                       | Testing procedures                 |
| [USER-LINKING.md](./docs/USER-LINKING.md)             | How user IDs link to subscriptions |


---

## License

MIT