import { useTheme } from "@/theme/ThemeProvider";
import { layout, radii, spacing, typography } from "@/theme/tokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  back: {
    width: layout.minTouchTarget,
    height: layout.minTouchTarget,
    borderRadius: radii.input,
    borderWidth: layout.borderWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function ExpenseDetailStub() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to expenses"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.back,
              {
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={spacing.xl} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>
            Expense details
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
