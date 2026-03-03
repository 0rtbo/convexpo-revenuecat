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
import { Card, Chip, Skeleton } from "heroui-native";
import { View } from "react-native";
import { Icon } from "@/components/icon";
import { useUser } from "@/contexts/user-context";

export function SubscriptionStatusCard() {
	// Query subscription status from Convex backend
	// This query is REACTIVE - it automatically updates when webhooks arrive!
	// SECURITY: No userId needed - automatically uses authenticated user
	const hasPremium = useQuery(api.subscriptions.hasPremium, {});

	// Get detailed subscription status with minimal data
	const subscriptionStatus = useQuery(
		api.subscriptions.getSubscriptionStatus,
		{},
	);

	// Loading state (undefined means query is still loading)
	if (hasPremium === undefined) {
		return (
			<Card variant="secondary">
				<Card.Header>
					<Card.Title>Subscription Status</Card.Title>
					<Card.Description>Loading subscription info...</Card.Description>
				</Card.Header>
				<Card.Body className="gap-2">
					<Skeleton className="h-6 w-full" />
					<Skeleton className="h-4 w-3/4" />
				</Card.Body>
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
					<View className="flex-row items-center justify-between">
						<Card.Title>Subscription Status</Card.Title>
						<View className="flex-row items-center gap-1 rounded-full bg-success/20 px-2 py-1">
							<Icon
								name="checkmark-circle"
								size={16}
								className="text-success"
							/>
							<Card.Description className="font-medium text-success text-xs">
								Active
							</Card.Description>
						</View>
					</View>
				</Card.Header>
				<Card.Body className="gap-3">
					{/* Subscription Details */}
					<View className="gap-2">
						<View className="flex-row items-center gap-2">
							<Icon name="trophy" size={18} className="text-warning" />
							<Card.Description>
								Premium Access • {subscription.store}
							</Card.Description>
						</View>

						{subscription.productId && (
							<View className="flex-row items-center gap-2">
								<Icon name="pricetag" size={18} className="text-default-500" />
								<Card.Description>{subscription.productId}</Card.Description>
							</View>
						)}

						{/* Renewal Status */}
						{willRenew ? (
							<View className="flex-row items-center gap-2">
								<Icon name="refresh" size={18} className="text-success" />
								<Card.Description>Renews on {expirationDate}</Card.Description>
							</View>
						) : (
							<View className="flex-row items-center gap-2">
								<Icon name="warning" size={18} className="text-warning" />
								<Card.Description>Ends on {expirationDate}</Card.Description>
							</View>
						)}

						{/* Grace Period Warning */}
						{isInGracePeriod && (
							<View className="mt-2 flex-row items-start gap-2 rounded-lg bg-warning/10 p-3">
								<Icon name="alert-circle" size={18} className="text-warning" />
								<View className="flex-1">
									<Card.Description className="font-medium text-warning">
										Payment Issue Detected
									</Card.Description>
									<Card.Description className="mt-1 text-warning text-xs">
										Please update your payment method to continue your
										subscription.
									</Card.Description>
								</View>
							</View>
						)}
					</View>
				</Card.Body>
			</Card>
		);
	}

	// No premium subscription
	return (
		<Card variant="secondary">
			<Card.Header>
				<View className="flex-row items-center justify-between">
					<Card.Title>Subscription Status</Card.Title>
					<View className="rounded-full bg-default-100 px-2 py-1">
						<Card.Description className="font-medium text-default-500 text-xs">
							Free
						</Card.Description>
					</View>
				</View>
			</Card.Header>
			<Card.Body className="gap-3">
				<View className="flex-row items-start gap-2">
					<Icon name="information-circle" size={18} className="text-primary" />
					<View className="flex-1">
						<Card.Description>
							You're currently using the free plan. Upgrade to Premium to unlock
							exclusive features!
						</Card.Description>
					</View>
				</View>

				{/* Example benefits you could add */}
				<View className="mt-2 gap-2">
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark" size={16} className="text-success" />
						<Card.Description className="text-xs">
							Unlimited access to all features
						</Card.Description>
					</View>
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark" size={16} className="text-success" />
						<Card.Description className="text-xs">
							Priority support
						</Card.Description>
					</View>
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark" size={16} className="text-success" />
						<Card.Description className="text-xs">
							Ad-free experience
						</Card.Description>
					</View>
				</View>
			</Card.Body>
		</Card>
	);
}
