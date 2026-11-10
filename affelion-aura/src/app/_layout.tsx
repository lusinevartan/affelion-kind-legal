import * as React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { AppStoreProvider, useAppState } from '../features/store/AppStore';
import { colors } from '../ui/theme';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate({ children }: { children: React.ReactNode }) {
  const { ready } = useAppState();
  React.useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  React.useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.night).catch(() => {});
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.night }}>
      <SafeAreaProvider>
        <AppStoreProvider>
          <Gate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.night },
                animation: 'fade',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="home" />
              <Stack.Screen name="scan" options={{ gestureEnabled: false }} />
              <Stack.Screen name="portrait/[id]" />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
              <Stack.Screen name="report/[id]" />
              <Stack.Screen name="history" />
              <Stack.Screen name="guide/[id]" />
              <Stack.Screen name="settings" />
            </Stack>
          </Gate>
        </AppStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
