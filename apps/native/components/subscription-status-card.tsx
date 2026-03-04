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
import { Button, Card, Skeleton } from "heroui-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { Icon } from "@/components/icon";
import { useRevenueCat } from "@/providers/RevenueCatProvider";

export function SubscriptionStatusCard() {
	const { purchasePackage, getPackages, restorePurchases } = useRevenueCat();
	const [packages, setPackages] = useState<PurchasesPackage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);

	// Query subscription status from Convex backend
	// This query is REACTIVE - it automatically updates when webhooks arrive!
	// SECURITY: No userId needed - automatically uses authenticated user
	const hasPremium = useQuery(api.subscriptions.hasPremium, {});

	// Get detailed subscription status with minimal data
	const subscriptionStatus = useQuery(
		api.subscriptions.getSubscriptionStatus,
		{},
	);

	// Load available packages from RevenueCat
	const handleLoadPackages = async () => {
		setIsLoading(true);
		try {
			const availablePackages = await getPackages();
			setPackages(availablePackages);
			if (availablePackages.length === 0) {
				Alert.alert(
					"No Products Available",
					"No subscription products are configured yet. Please set up products in RevenueCat and App Store Connect / Google Play Console.",
				);
			}
		} catch (error) {
			console.error("Failed to load packages:", error);
			Alert.alert(
				"Error",
				"Failed to load subscription options. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	// Handle purchase
	const handlePurchase = async (pkg: PurchasesPackage) => {
		setIsPurchasing(true);
		try {
			const success = await purchasePackage(pkg);
			if (success) {
				Alert.alert(
					"Purchase Successful!",
					"Your subscription is being activated. This may take a few seconds.",
				);
				setPackages([]); // Hide packages after successful purchase
			}
		} catch (error) {
			console.error("Purchase failed:", error);
			Alert.alert("Purchase Failed", "Please try again.");
		} finally {
			setIsPurchasing(false);
		}
	};

	// Handle restore purchases
	const handleRestore = async () => {
		setIsRestoring(true);
		try {
			const restored = await restorePurchases();
			if (restored) {
				Alert.alert("Success", "Purchases restored successfully!");
				setPackages([]);
			} else {
				Alert.alert(
					"No Purchases Found",
					"No previous purchases found to restore.",
				);
			}
		} catch (error) {
			console.error("Restore failed:", error);
			Alert.alert(
				"Restore Failed",
				"Unable to restore purchases. Please try again.",
			);
		} finally {
			setIsRestoring(false);
		}
	};

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
		<View className="gap-4">
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
						<Icon
							name="information-circle"
							size={18}
							className="text-primary"
						/>
						<View className="flex-1">
							<Card.Description>
								You're currently using the free plan. Upgrade to Premium to
								unlock exclusive features!
							</Card.Description>
						</View>
					</View>

					{/* Benefits */}
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

					{/* Upgrade Button - Shows when no packages loaded yet */}
					{packages.length === 0 && (
						<Button
							onPress={handleLoadPackages}
							isDisabled={isLoading}
							className="mt-2"
						>
							<Icon name="trophy" size={18} />
							<Button.Label>
								{isLoading ? "Loading..." : "Upgrade to Premium"}
							</Button.Label>
						</Button>
					)}
				</Card.Body>
			</Card>

			{/* Available Packages - Shows after clicking Upgrade */}
			{packages.map((pkg) => (
				<Card key={pkg.identifier} variant="secondary">
					<Card.Body className="gap-3">
						<View className="flex-row items-center justify-between">
							<View className="flex-1">
								<Card.Title>
									{pkg.product.title || pkg.product.identifier}
								</Card.Title>
								<Card.Description>
									{pkg.product.description || "Premium subscription"}
								</Card.Description>
							</View>
							<Card.Title className="text-primary">
								{pkg.product.priceString}
							</Card.Title>
						</View>

						<Button
							onPress={() => handlePurchase(pkg)}
							isDisabled={isPurchasing}
						>
							<Icon name="card" size={18} />
							<Button.Label>
								{isPurchasing ? "Processing..." : "Subscribe Now"}
							</Button.Label>
						</Button>
					</Card.Body>
				</Card>
			))}

			{/* Restore Purchases - Shows when packages are visible */}
			{packages.length > 0 && (
				<Button
					variant="secondary"
					onPress={handleRestore}
					isDisabled={isRestoring}
				>
					<Icon name="refresh" size={18} />
					<Button.Label>
						{isRestoring ? "Restoring..." : "Restore Purchases"}
					</Button.Label>
				</Button>
			)}
		</View>
	);
}
