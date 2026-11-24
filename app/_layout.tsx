import { useExpenseStore } from "@/store/useExpenseStore";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  root: { flex: 1 },
});

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [storeReady, setStoreReady] = useState(() =>
    useExpenseStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useExpenseStore.persist.hasHydrated()) {
      setStoreReady(true);
      return;
    }
    const unsubscribe = useExpenseStore.persist.onFinishHydration(() => {
      setStoreReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && storeReady) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontError, fontsLoaded, storeReady]);

  if (!(fontsLoaded || fontError) || !storeReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "transparent" },
            }}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
