/**
 * Subscription Status Card
 *
 * Displays the user's current subscription status with real-time updates.
 * This component demonstrates:
 * - Querying Convex backend for subscription state
 * - Reactive updates when webhooks arrive
 * - Handling loading states
 * - Displaying subscription details
 *
 * The subscription status automatically updates when:
 * - User makes a purchase (webhook arrives)
 * - Subscription renews
 * - Subscription expires or is cancelled
 */

import { api } from "@app/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Button, Card, Skeleton } from "heroui-native";
import { View } from "react-native";
import { Icon } from "@/components/icon";
// TODO WHY TWO QUERIES WHEN YOU CAN COMBINE THEM INTO TWO?
export function SubscriptionStatusCard() {
	const router = useRouter();

	// Query subscription status from Convex backend
	// This query is REACTIVE - it automatically updates when webhooks arrive!
	// SECURITY: No userId needed - automatically uses authenticated user
	const hasPremium = useQuery(api.subscriptions.hasPremium);

	// Get detailed subscription status with minimal data
	const subscriptionStatus = useQuery(
		api.subscriptions.getSubscriptionStatus,
		{},
	);

	// Loading state (undefined means query is still loading)
	if (hasPremium === undefined) {
		return (
			<Card variant="secondary" className="shadow-none">
				<Card.Header className="gap-2">
					<Skeleton className="h-4 w-1/2 rounded-full" />
					<Skeleton className="h-4 w-full rounded-full" />
					<Skeleton className="h-4 w-3/4 rounded-full" />
				</Card.Header>
			</Card>
		);
	}

	// Premium subscription active
	if (hasPremium && subscriptionStatus && subscriptionStatus.length > 0) {
		const subscription = subscriptionStatus[0];
		const expirationDate = subscription.expiresAt
			? new Date(subscription.expiresAt).toLocaleDateString()
			: "Never";

		const willRenew = subscription.willRenew;
		const isInGracePeriod = subscription.isInGracePeriod;

		return (
			<Card variant="secondary">
				<Card.Header>
					<Card.Title>Subscription Status</Card.Title>
				</Card.Header>
				<Card.Body>
					{/* Subscription Details */}
					<Card.Description>
						Premium Access • {subscription.store}
					</Card.Description>
					<Card.Description>Status • Active</Card.Description>
					{subscription.productId ? (
						<Card.Description>
							Product Id • {subscription.productId.toLocaleUpperCase()}
						</Card.Description>
					) : null}

					{/* Renewal Status */}
					{willRenew ? (
						<Card.Description>Renews • {expirationDate}</Card.Description>
					) : (
						<Card.Description>Ends • {expirationDate}</Card.Description>
					)}

					{/* Grace Period Warning */}
					{isInGracePeriod && (
						<View className="mt-4 flex items-start rounded-3xl bg-warning/10 px-4 py-4">
							<Card.Description className="font-medium text-warning">
								Payment Issue Detected
							</Card.Description>
							<Card.Description className="s text-warning text-xs">
								Please update your payment method to continue your subscription.
							</Card.Description>
						</View>
					)}
				</Card.Body>
			</Card>
		);
	}

	// No premium subscription
	return (
		<Card variant="secondary" className="gap-2">
			<Card.Header>
				<Card.Title>Subscription Status</Card.Title>
				<Card.Description>
					You're currently using the free plan. Upgrade to Premium to unlock
					exclusive features!
				</Card.Description>
			</Card.Header>
			<Card.Footer>
				<Button onPress={() => router.push("/settings/upgrade")}>
					<Icon name="lock-open" size={18} className="text-background" />
					<Button.Label>Upgrade to Premium</Button.Label>
				</Button>
			</Card.Footer>
		</Card>
	);
}
