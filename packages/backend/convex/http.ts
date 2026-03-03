import { httpRouter } from "convex/server";

import { authComponent, createAuth } from "./auth";
import { revenuecat } from "./revenuecat";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth, { cors: true });

/**
 * RevenueCat Webhook Endpoint
 *
 * This endpoint receives webhook events from RevenueCat when subscription
 * states change (purchases, renewals, cancellations, etc.)
 *
 * @see {@link https://www.revenuecat.com/docs/webhooks|RevenueCat Webhooks Documentation}
 */
http.route({
	path: "/webhooks/revenuecat",
	method: "POST",
	handler: revenuecat.httpHandler(),
});

export default http;
