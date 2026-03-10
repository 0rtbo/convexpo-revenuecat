import { api } from "@app/backend";
import { useQuery } from "convex/react";
import { Card } from "heroui-native";
import { ScrollView } from "react-native";

function getStatusConfig(isLoading: boolean, isConnected: boolean) {
	if (isLoading) {
		return {
			label: "Checking...",
		};
	}

	if (isConnected) {
		return {
			label: "Connected to Convex",
		};
	}

	return {
		label: "Disconnected",
	};
}

export default function HomeRoute() {
	const healthCheck = useQuery(api.healthCheck.get);

	const isConnected = healthCheck === "OK";

	const isLoading = healthCheck === undefined;

	const status = getStatusConfig(isLoading, isConnected);

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="always"
			contentContainerClassName="flex-grow px-4 py-2 gap-4"
		>
			{/* API Status */}
			<Card variant="secondary">
				<Card.Body>
					<Card.Title>API Status</Card.Title>
					<Card.Description>{status.label}</Card.Description>
				</Card.Body>
			</Card>
		</ScrollView>
	);
}
