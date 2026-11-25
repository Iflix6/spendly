import { AnimatedSplash } from "@/components/AnimatedSplash";
import { SheetOpenProgressProvider } from "@/components/SheetOpenProgressProvider";
import { SnackbarProvider } from "@/components/SnackbarProvider";
import { useExpenseStore } from "@/store/useExpenseStore";
import { splash } from "@/theme/motion";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { isRunningInExpoGo } from "expo";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  root: { flex: 1 },
});

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
if (!isRunningInExpoGo()) {
  SplashScreen.setOptions({
    fade: true,
    duration: splash.nativeFadeDurationMs,
  });
}

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
  const [rootLayoutReady, setRootLayoutReady] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);
  const fontsReady = fontsLoaded || Boolean(fontError);

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

  const handleRootLayout = useCallback(() => {
    setRootLayoutReady(true);
  }, []);

  const handleSplashFirstFrame = useCallback(() => {
    if (fontsReady && storeReady) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsReady, storeReady]);

  const handleSplashFinish = useCallback(() => {
    setSplashFinished(true);
  }, []);

  if (!fontsReady || !storeReady) {
    return <StatusBar style="light" />;
  }

  const isAppReady = fontsReady && storeReady && rootLayoutReady;

  return (
    <GestureHandlerRootView onLayout={handleRootLayout} style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <SheetOpenProgressProvider>
            <SnackbarProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: "transparent" },
                }}
              >
                <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
                <Stack.Screen
                  name="add"
                  options={{
                    presentation: "transparentModal",
                    animation: "none",
                  }}
                />
                <Stack.Screen
                  name="expense/[id]"
                  options={{ presentation: "card" }}
                />
              </Stack>
              {!splashFinished && (
                <AnimatedSplash
                  isAppReady={isAppReady}
                  onFirstFrame={handleSplashFirstFrame}
                  onFinish={handleSplashFinish}
                />
              )}
            </SnackbarProvider>
          </SheetOpenProgressProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
