import { Button, Card } from "heroui-native";
import { useState } from "react";
import { Alert, ScrollView } from "react-native";

import { Icon } from "@/components/icon";
import { SubscriptionStatusCard } from "@/components/subscription-status-card";
import { useUser } from "@/contexts/user-context";
import { authClient } from "@/lib/auth-client";
import { useRevenueCat } from "@/providers/RevenueCatProvider";

export default function SettingsRoute() {
	const { user } = useUser();
	const [isDeletingUser, setIsDeletingUser] = useState(false);
	const { logOutUser } = useRevenueCat();

	if (!user) return null;

	const handleDeleteUser = async () => {
		try {
			await logOutUser();
		} catch (error) {
			console.warn("[RevenueCat] Failed to log out before delete:", error);
		}

		await authClient.deleteUser(
			{},
			{
				onRequest: () => {
					setIsDeletingUser(true);
				},
				onSuccess: () => {
					setIsDeletingUser(false);
				},
				onError: (ctx) => {
					setIsDeletingUser(false);
					Alert.alert("Error", ctx.error.message || "Failed to delete user");
				},
			},
		);
	};

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="always"
			contentContainerClassName="flex-grow px-4 py-2 gap-4"
		>
			{/* User Info */}
			<Card variant="secondary">
				<Card.Body>
					<Card.Title>{user.name}</Card.Title>
					<Card.Description>{user.email}</Card.Description>
				</Card.Body>
			</Card>

			{/* Subscription Status - Real-time updates from Convex! */}
			<SubscriptionStatusCard />

			{/* Delete User */}
			<Button
				variant="tertiary"
				size="sm"
				className="self-center"
				isDisabled={isDeletingUser}
				onPress={() => {
					Alert.alert(
						"Delete User",
						"Are you sure you want to delete your account?",
						[
							{ text: "Cancel", style: "cancel" },
							{ text: "Delete", onPress: handleDeleteUser },
						],
					);
				}}
			>
				<Icon name="trash-bin" size={18} className="text-foreground" />
				<Button.Label>
					{isDeletingUser ? "Deleting..." : "Delete User"}
				</Button.Label>
			</Button>
		</ScrollView>
	);
}
