import { Link, Stack } from "expo-router";
import { Pressable, Text } from "react-native";

import { Icon } from "@/components/icon";
import { useNavigationOptions } from "@/hooks/useNavigationOptions";

export default function EmailLayout() {
	const { modal } = useNavigationOptions();
	return (
		<Stack
			screenOptions={{
				...modal,
				gestureEnabled: false,
				headerTransparent: true,
			}}
		>
			<Stack.Screen
				name="signin"
				options={{
					headerLeft: () => <CloseButton />,
					headerRight: () => <SignUpButton />,
					title: "",
				}}
			/>
			<Stack.Screen
				name="signup"
				options={{
					title: "",
				}}
			/>
			<Stack.Screen
				name="(reset)/request-password-reset"
				options={{
					title: "",
				}}
			/>
			<Stack.Screen
				name="(reset)/reset-password"
				options={{
					title: "",
				}}
			/>
		</Stack>
	);
}
/* ------------------------------ close button ------------------------------ */
const CloseButton = () => {
	return (
		<Link href=".." asChild>
			<Pressable className="justify-center p-1" hitSlop={24}>
				<Icon name="close" size={24} className="text-foreground" />
			</Pressable>
		</Link>
	);
};

const SignUpButton = () => {
	return (
		<Link href="/(root)/(auth)/email/signup" asChild>
			<Pressable className="px-3 py-2" hitSlop={24}>
				<Text className="font-semibold text-foreground">Sign Up</Text>
			</Pressable>
		</Link>
	);
};
