import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text } from "react-native";

import { ThemeToggle } from "@/components/theme-toggle";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";
import { authClient } from "@/lib/auth-client";
import { useRevenueCat } from "@/providers/RevenueCatProvider";

export default function SettingsLayout() {
	const { standard } = useNavigationOptions();

	return (
		<Stack screenOptions={standard}>
			<Stack.Screen
				name="index"
				options={{
					title: "Settings",
					headerLargeTitle: true,
					headerLeft: () => <ThemeToggle />,
					headerRight: () => <SignOutButton />,
				}}
			/>
		</Stack>
	);
}

const SignOutButton = () => {
	const [isSigningOut, setIsSigningOut] = useState(false);
	const { logOutUser } = useRevenueCat();

	const handleSignOut = async () => {
		try {
			await logOutUser();
		} catch (error) {
			console.warn("[RevenueCat] Failed to log out before sign out:", error);
		}

		await authClient.signOut(
			{},
			{
				onRequest: () => {
					setIsSigningOut(true);
				},
				onSuccess: () => {
					setIsSigningOut(false);
				},
				onError: (ctx) => {
					Alert.alert("Error", ctx.error.message || "Failed to sign out");
					setIsSigningOut(false);
				},
			},
		);
	};

	return (
		<Pressable
			className="justify-center px-3"
			disabled={isSigningOut}
			onPress={() => {
				Alert.alert("Sign Out", "Are you sure you want to sign out?", [
					{ text: "Cancel", style: "cancel" },
					{ text: "Sign Out", onPress: handleSignOut },
				]);
			}}
		>
			<Text className="text-foreground">Sign Out</Text>
		</Pressable>
	);
};
