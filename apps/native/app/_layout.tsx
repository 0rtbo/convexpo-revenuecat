import "@/global.css";
import { env } from "@app/env/native";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { Slot } from "expo-router";
import { HeroUINativeProvider } from "heroui-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { AppThemeProvider } from "@/contexts/app-theme-context";
import { UserProvider } from "@/contexts/user-context";
import { authClient } from "@/lib/auth-client";
import { RevenueCatProvider } from "@/providers/RevenueCatProvider";
import SplashScreenProvider from "@/providers/SplashScreenProvider";

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
	unsavedChangesWarning: false,
});

/* ------------------------------- root layout ------------------------------ */
export default function Layout() {
	return (
		<GestureHandlerRootView className="flex-1">
			<KeyboardProvider>
				<AppThemeProvider>
					<HeroUINativeProvider>
						<ConvexBetterAuthProvider client={convex} authClient={authClient}>
							<UserProvider>
								<RevenueCatProvider>
									<SplashScreenProvider>
										<Slot />
									</SplashScreenProvider>
								</RevenueCatProvider>
							</UserProvider>
						</ConvexBetterAuthProvider>
					</HeroUINativeProvider>
				</AppThemeProvider>
			</KeyboardProvider>
		</GestureHandlerRootView>
	);
}
