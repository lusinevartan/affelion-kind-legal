import * as React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform } from "react-native";
import {
  SafeAreaInsetsContext,
  SafeAreaProvider,
  type EdgeInsets,
} from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { AppStoreProvider, useAppState } from "../features/store/AppStore";
import { colors } from "../ui/theme";
import { useBrandFonts } from "../ui/fonts";

void SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate({
  children,
  fontsReady,
}: {
  children: React.ReactNode;
  fontsReady: boolean;
}) {
  const { ready } = useAppState();
  const show = ready && fontsReady;
  React.useEffect(() => {
    if (show) void SplashScreen.hideAsync().catch(() => {});
  }, [show]);
  if (!show) return null;
  return <>{children}</>;
}

/**
 * Review build only (web): screen captures pass a phone's safe-area insets through
 * localStorage `aura.insets`, so the layout is drawn around a notch, a status bar and a home
 * indicator the way it is on the device. Phones ignore this; they report their own insets.
 */
function ReviewInsets({ children }: { children: React.ReactNode }) {
  const insets = React.useMemo<EdgeInsets | null>(() => {
    if (Platform.OS !== "web") return null;
    try {
      const raw = globalThis.localStorage?.getItem("aura.insets");
      return raw ? (JSON.parse(raw) as EdgeInsets) : null;
    } catch {
      return null;
    }
  }, []);
  if (!insets) return <>{children}</>;
  return (
    <SafeAreaInsetsContext.Provider value={insets}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

export default function RootLayout() {
  const fontsReady = useBrandFonts();
  React.useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.ground).catch(() => {});
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ground }}>
      <SafeAreaProvider>
        <ReviewInsets>
          <AppStoreProvider>
            <Gate fontsReady={fontsReady}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.ground },
                  animation: "fade",
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="home" />
                <Stack.Screen name="scan" options={{ gestureEnabled: false }} />
                <Stack.Screen
                  name="practice"
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="portrait/[id]" />
                <Stack.Screen
                  name="paywall"
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen name="report/[id]" />
                <Stack.Screen name="history" />
                <Stack.Screen name="guide/[id]" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="how" />
              </Stack>
            </Gate>
          </AppStoreProvider>
        </ReviewInsets>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
