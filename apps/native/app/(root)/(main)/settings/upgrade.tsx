import { useRouter } from "expo-router";
import { Button, Card, Skeleton } from "heroui-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { Icon } from "@/components/icon";
import { useRevenueCat } from "@/providers/RevenueCatProvider";

export default function UpgradeScreen() {
	const router = useRouter();

	const { purchasePackage, getPackages, restorePurchases } = useRevenueCat();

	const [packages, setPackages] = useState<PurchasesPackage[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isPurchasing, setIsPurchasing] = useState(false);
	const [isRestoring, setIsRestoring] = useState(false);

	useEffect(() => {
		loadPackages();
	}, []);
	// ============================================================================
	// load packages
	// ============================================================================
	const loadPackages = async () => {
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
	// ============================================================================
	// handle purchase
	// ============================================================================
	const handlePurchase = async (pkg: PurchasesPackage) => {
		setIsPurchasing(true);
		try {
			const success = await purchasePackage(pkg);
			if (success) {
				Alert.alert(
					"Purchase Successful!",
					"Your subscription is being activated. This may take a few seconds.",
				);
				router.back();
			}
		} catch (error) {
			console.error("Purchase failed:", error);
			Alert.alert("Purchase Failed", "Please try again.");
		} finally {
			setIsPurchasing(false);
		}
	};
	// ============================================================================
	// handle restore
	// ============================================================================
	const handleRestore = async () => {
		setIsRestoring(true);
		try {
			const restored = await restorePurchases();
			if (restored) {
				Alert.alert("Success", "Purchases restored successfully!");
				router.back();
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

	return (
		<View className="flex-1">
			<ScrollView
				contentInsetAdjustmentBehavior="always"
				contentContainerClassName="flex-grow px-4 py-2 gap-4"
			>
				{/* Loading State  */}
				{isLoading && <Card className="h-32 gap-2" />}

				{/* Available Packages */}
				{!isLoading &&
					packages.map((pkg) => (
						<Card key={pkg.identifier} variant="secondary" className="gap-2">
							<Card.Header>
								<Card.Title>
									{pkg.product.title || pkg.product.identifier}
								</Card.Title>
								<Card.Description>{pkg.product.priceString}</Card.Description>
							</Card.Header>
							<Card.Footer>
								<Button
									isDisabled={isPurchasing}
									onPress={() => handlePurchase(pkg)}
								>
									<Icon name="bonfire" size={18} className="text-background" />
									<Button.Label>{"Purchase"}</Button.Label>
								</Button>
							</Card.Footer>
						</Card>
					))}

				{/* No packages message */}
				{!isLoading && packages.length === 0 && (
					<Card variant="secondary" className="gap-2">
						<Card.Header>
							<Card.Title>No Options</Card.Title>
							<Card.Description>
								No subscription options available at this time.
							</Card.Description>
						</Card.Header>
					</Card>
				)}
			</ScrollView>
			{/* Restore Purchases Button */}
			<View className="px-8 pb-safe">
				{!isLoading && packages.length > 0 && (
					<Button
						variant="ghost"
						onPress={handleRestore}
						isDisabled={isRestoring}
					>
						<Button.Label>
							{isRestoring ? "Restoring..." : "Restore Purchases"}
						</Button.Label>
					</Button>
				)}
			</View>
		</View>
	);
}
