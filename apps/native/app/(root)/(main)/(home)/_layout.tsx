import { Stack } from "expo-router";

import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export default function HomeLayout() {
	const { standard } = useNavigationOptions();

	return (
		<Stack screenOptions={standard}>
			<Stack.Screen
				name="index"
				options={{
					title: "Convexpo",
					headerLargeTitle: true,
				}}
			/>
		</Stack>
	);
}
