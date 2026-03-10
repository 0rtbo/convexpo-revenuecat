import { Link } from "expo-router";
import { Button } from "heroui-native";
import { Text, View } from "react-native";

import { Icon } from "@/components/icon";
import { useAppleAuth } from "@/lib/oauth/useAppleAuth";
import { useGoogleAuth } from "@/lib/oauth/useGoogleAuth";

export default function Landing() {
	const oAuthGoogle = useGoogleAuth();
	const oAuthApple = useAppleAuth();

	return (
		<View className="flex-1 gap-4 px-8 pt-safe pb-safe">
			<View className="flex-1 justify-end">
				<Text className="font-extrabold text-6xl text-foreground">
					Convexpo
				</Text>
				<Text className="line-clamp-4 text-muted/50 text-xl leading-relaxed">
					Convex + Expo + Better Auth + Hero UI + RevenueCat = 🚀
				</Text>
			</View>
			{/* OAuth buttons */}
			<View className="w-full flex-row gap-4">
				<Button
					className="flex-1"
					size="lg"
					variant="tertiary"
					isDisabled={oAuthGoogle.isLoading}
					onPress={oAuthGoogle.signIn}
				>
					<Icon name="logo-google" size={20} className="text-foreground" />
					<Button.Label>Google</Button.Label>
				</Button>
				<Button
					className="flex-1"
					size="lg"
					variant="tertiary"
					isDisabled={oAuthApple.isLoading}
					onPress={oAuthApple.signIn}
				>
					<Icon name="logo-apple" size={20} className="text-foreground" />
					<Button.Label>Apple</Button.Label>
				</Button>
			</View>
			<Link href="/(root)/(auth)/email/signin" asChild>
				<Button className="w-full" size="lg">
					<Button.Label>Email</Button.Label>
				</Button>
			</Link>
		</View>
	);
}
