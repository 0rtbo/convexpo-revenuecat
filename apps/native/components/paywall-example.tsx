/**
 * Paywall Example Component
 *
 * This is a simple example showing how to:
 * 1. Check subscription status from Convex backend
 * 2. Show content based on subscription status
 * 3. Handle purchases with RevenueCat SDK
 * 4. See real-time updates after purchase (via webhook)
 *
 * Use this as a reference for building your own paywalls!
 */

import { api } from "@app/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Button, Card } from "heroui-native";
import { useState } from "react";
import { Alert, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { Icon } from "@/components/icon";
import { useRevenueCat } from "@/providers/RevenueCatProvider";

export function PaywallExample() {
	const { purchasePackage, getPackages, restorePurchases } = useRevenueCat();
	const [availablePackages, setAvailablePackages] = useState<
		PurchasesPackage[]
	>([]);
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);

	// Query subscription status from Convex backend
	// This will automatically update when the webhook arrives!
	// SECURITY: Automatically uses authenticated user - no userId needed
	const hasPremium = useQuery(api.subscriptions.hasPremium, {});

	// Load available packages when component mounts
	const loadPackages = async () => {
		try {
			const packages = await getPackages();
			setAvailablePackages(packages);
		} catch (error) {
			console.error("Failed to load packages:", error);
		}
	};

	// Handle purchase
	const handlePurchase = async (pkg: PurchasesPackage) => {
		setIsPurchasing(true);
		try {
			await purchasePackage(pkg);

			// Note: hasPremium will automatically update to true when webhook arrives
			// This usually takes 1-5 seconds after purchase completes
			Alert.alert(
				"Purchase Successful!",
				"Your subscription is being activated. This may take a few seconds.",
			);
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
			await restorePurchases();
			Alert.alert("Success", "Purchases restored successfully!");
		} catch (error) {
			console.error("Restore failed:", error);
			Alert.alert("Restore Failed", "No purchases found to restore.");
		} finally {
			setIsRestoring(false);
		}
	};

	// Loading state
	if (hasPremium === undefined) {
		return (
			<Card variant="secondary">
				<Card.Body className="items-center py-8">
					<Card.Description>Checking subscription status...</Card.Description>
				</Card.Body>
			</Card>
		);
	}

	// User already has premium
	if (hasPremium) {
		return (
			<Card variant="secondary">
				<Card.Header>
					<View className="items-center gap-2">
						<View className="h-16 w-16 items-center justify-center rounded-full bg-success/20">
							<Icon
								name="checkmark-circle"
								size={32}
								className="text-success"
							/>
						</View>
						<Card.Title className="text-center">
							You're a Premium Member!
						</Card.Title>
						<Card.Description className="text-center">
							Thank you for your support. Enjoy all premium features!
						</Card.Description>
					</View>
				</Card.Header>
				<Card.Body className="gap-2">
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark" size={16} className="text-success" />
						<Card.Description>
							Unlimited access to all features
						</Card.Description>
					</View>
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark" size={16} className="text-success" />
						<Card.Description>Priority support</Card.Description>
					</View>
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark" size={16} className="text-success" />
						<Card.Description>Ad-free experience</Card.Description>
					</View>
				</Card.Body>
			</Card>
		);
	}

	// Show paywall
	return (
		<View className="gap-4">
			{/* Premium Benefits */}
			<Card variant="secondary">
				<Card.Header>
					<View className="items-center gap-2">
						<View className="h-16 w-16 items-center justify-center rounded-full bg-primary/20">
							<Icon name="trophy" size={32} className="text-primary" />
						</View>
						<Card.Title className="text-center">Upgrade to Premium</Card.Title>
						<Card.Description className="text-center">
							Unlock all features and support development
						</Card.Description>
					</View>
				</Card.Header>
				<Card.Body className="gap-3">
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark-circle" size={20} className="text-success" />
						<Card.Description>
							Unlimited access to all features
						</Card.Description>
					</View>
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark-circle" size={20} className="text-success" />
						<Card.Description>Priority support</Card.Description>
					</View>
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark-circle" size={20} className="text-success" />
						<Card.Description>Ad-free experience</Card.Description>
					</View>
					<View className="flex-row items-center gap-2">
						<Icon name="checkmark-circle" size={20} className="text-success" />
						<Card.Description>New features first</Card.Description>
					</View>
				</Card.Body>
			</Card>

			{/* Load Packages Button */}
			{availablePackages.length === 0 && (
				<Button onPress={loadPackages}>
					<Icon name="pricetag" size={20} />
					<Button.Label>View Subscription Options</Button.Label>
				</Button>
			)}

			{/* Available Packages */}
			{availablePackages.map((pkg) => (
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
							<Icon name="card" size={20} />
							<Button.Label>
								{isPurchasing ? "Processing..." : "Subscribe Now"}
							</Button.Label>
						</Button>
					</Card.Body>
				</Card>
			))}

			{/* Restore Purchases */}
			{availablePackages.length > 0 && (
				<Button
					variant="secondary"
					onPress={handleRestore}
					isDisabled={isRestoring}
				>
					<Icon name="refresh" size={20} />
					<Button.Label>
						{isRestoring ? "Restoring..." : "Restore Purchases"}
					</Button.Label>
				</Button>
			)}

			{/* Info Card */}
			<Card variant="tertiary">
				<Card.Body>
					<View className="flex-row items-start gap-2">
						<Icon
							name="information-circle"
							size={18}
							className="text-default-500"
						/>
						<Card.Description className="flex-1 text-xs">
							After purchase, your subscription status will update automatically
							(usually within 5-10 seconds). No need to refresh!
						</Card.Description>
					</View>
				</Card.Body>
			</Card>
		</View>
	);
}
