import { expo } from "@better-auth/expo";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL || "http://localhost:8081";
const nativeAppUrl = process.env.NATIVE_APP_URL || "myrevapp://";
// const appleBundleId = process.env.APPLE_APP_BUNDLE_IDENTIFIER || "";
// const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
// const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

export const authComponent = createClient<DataModel>(components.betterAuth);

function createAuth(ctx: GenericCtx<DataModel>) {
	return betterAuth({
		trustedOrigins: [
			siteUrl,
			nativeAppUrl,
			...(process.env.NODE_ENV === "development"
				? ["exp://", "exp://**", "exp://192.168.*.*:*/**"]
				: []),
		],
		user: {
			deleteUser: {
				enabled: true,
			},
		},
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			// sendResetPassword: async ({ user, url }) => {
			// 	await sendResetPassword(requireActionCtx(ctx), {
			// 		to: user.email,
			// 		url,
			// 	});
			// },
		},
		socialProviders: {
			// TODO: if only doing native auth do the appbundleID only!!!
			// apple: {
			// 	clientId: "", // keep empty for mobile-only setup
			// 	clientSecret: "", // keep empty for mobile-only setup
			// 	appBundleIdentifier: appleBundleId,
			// },
			// google: {
			// 	clientId: googleClientId,
			// 	clientSecret: googleClientSecret,
			// },
		},
		plugins: [
			expo(),
			crossDomain({ siteUrl }),
			convex({
				authConfig,
				jwksRotateOnTokenGenerationError: true,
			}),
		],
	});
}

export { createAuth };

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return await authComponent.safeGetAuthUser(ctx);
	},
});

/**
 * Get the authenticated user or return null if not authenticated.
 * Use this for queries that should work for both authenticated and guest users.
 */
export async function getAuthUser(ctx: GenericCtx<DataModel>) {
	return await authComponent.safeGetAuthUser(ctx);
}

/**
 * Get the authenticated user or throw an error if not authenticated.
 * Use this for queries/mutations that require authentication.
 */
export async function requireAuth(ctx: GenericCtx<DataModel>) {
	const user = await authComponent.safeGetAuthUser(ctx);
	if (!user) {
		throw new Error("Authentication required");
	}
	return user;
}
