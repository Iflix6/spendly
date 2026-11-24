import { useTabBlurTarget } from "@/components/TabBlurTargetContext";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing, typography } from "@/theme/tokens";
import { BlurTargetView } from "expo-blur";
import { useIsFocused } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TabScreenProps {
  title: string;
}

const styles = StyleSheet.create({
  target: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  title: typography.title,
});

export function TabScreen({ title }: TabScreenProps) {
  const { colors } = useTheme();
  const bottomPadding = useTabBarHeight();
  const blurTarget = useTabBlurTarget();
  const isFocused = useIsFocused();

  return (
    <BlurTargetView
      ref={isFocused ? blurTarget : undefined}
      style={styles.target}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={[styles.content, { paddingBottom: bottomPadding }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
      </SafeAreaView>
    </BlurTargetView>
  );
}
