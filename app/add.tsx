import { useAnimatedThemeColors, useTheme } from "@/theme/ThemeProvider";
import { layout, opacity, radii, spacing, typography } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  close: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function AddExpenseStub() {
  const { colors } = useTheme();
  const animatedColors = useAnimatedThemeColors();
  const router = useRouter();
  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: animatedColors.value.bg,
    opacity: opacity.modal,
  }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[styles.backdrop, backdropStyle]}
        pointerEvents="none"
      />
      <View style={[styles.content, styles.header]}>
        <Text style={[styles.title, { color: colors.text }]}>Add expense</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close add expense"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.close,
            {
              backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="close" size={spacing.xl} color={colors.text} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
