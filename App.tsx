/**
 * FASE 4 — App entry.
 *
 * Provider order matters:
 *  1. GestureHandlerRootView wraps everything for gesture-handler / bottom-sheet.
 *  2. SafeAreaProvider supplies insets.
 *  3. BottomSheetModalProvider enables `BottomSheetModal` anywhere below.
 *  4. NavigationContainer hosts the stack; theme follows OS appearance.
 *
 * Auth gating: while Firebase resolves the persisted session we show a splash;
 * then either the AuthScreen or the main app.
 */
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';

import { RootNavigator } from '@/navigation';
import { AuthScreen } from '@/screens/AuthScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCatalogStore } from '@/store/catalogStore';
import { palettes } from '@/theme';

export default function App() {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const themePref = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);
  const onboarded = useSettingsStore((s) => s.onboarded);
  const scheme = themePref === 'system' ? system : themePref;
  const colors = { ...palettes[scheme], tint: accent || palettes[scheme].tint };

  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);
  const init = useAuthStore((s) => s.init);
  const loadCatalog = useCatalogStore((s) => s.load);

  useEffect(() => init(), [init]);

  // Warm the exercise catalog (seed + custom) once the user is known.
  useEffect(() => {
    if (user?.uid) loadCatalog(user.uid);
  }, [user?.uid, loadCatalog]);

  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const themed = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.label,
      primary: colors.tint,
      border: colors.separator,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <NavigationContainer theme={themed}>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            {initializing ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator color={colors.tint} />
              </View>
            ) : !onboarded ? (
              <OnboardingScreen />
            ) : user ? (
              <RootNavigator />
            ) : (
              <AuthScreen />
            )}
          </NavigationContainer>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
