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
import { useAuthStore } from '@/store/authStore';
import { palettes } from '@/theme';

export default function App() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palettes[scheme];

  const user = useAuthStore((s) => s.user);
  const initializing = useAuthStore((s) => s.initializing);
  const init = useAuthStore((s) => s.init);

  useEffect(() => init(), [init]);

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
