/**
 * FASE 4 — App entry.
 *
 * Order matters here:
 *  1. GestureHandlerRootView must wrap the whole tree for @gorhom/bottom-sheet
 *     and react-native-gesture-handler to receive touches.
 *  2. SafeAreaProvider supplies insets used by the screens and the sheet.
 *  3. BottomSheetModalProvider enables `BottomSheetModal` anywhere below it.
 *  4. NavigationContainer hosts the stack; theme follows the OS appearance.
 */
import 'react-native-gesture-handler';
import React from 'react';
import { useColorScheme } from 'react-native';
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
import { palettes } from '@/theme';

export default function App() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = palettes[scheme];

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
            <RootNavigator />
          </NavigationContainer>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
