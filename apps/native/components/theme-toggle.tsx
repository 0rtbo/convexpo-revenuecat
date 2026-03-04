import * as Haptics from "expo-haptics";
import { Platform, Pressable } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

import { Icon } from "@/components/icon";
import { useAppTheme } from "@/contexts/app-theme-context";

export function ThemeToggle() {
	const { toggleTheme, isLight } = useAppTheme();

	return (
		<Pressable
			className="p-1"
			onPress={() => {
				if (Platform.OS === "ios") {
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				}
				toggleTheme();
			}}
		>
			{isLight ? (
				<Animated.View key="moon" entering={ZoomIn} exiting={FadeOut}>
					<Icon name="moon" size={20} className="text-foreground" />
				</Animated.View>
			) : (
				<Animated.View key="sun" entering={ZoomIn} exiting={FadeOut}>
					<Icon name="sunny" size={20} className="text-foreground" />
				</Animated.View>
			)}
		</Pressable>
	);
}
