/**
 * Standard screen container: themed background + safe-area padding + an
 * optional large iOS-style title header.
 */
import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette, spacing, typography } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  title?: string;
  /** Render to the right of the large title (e.g. an action button). */
  headerRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Apply top safe-area inset (default true). */
  edgeTop?: boolean;
}

export function Screen({ children, title, headerRight, style, edgeTop = true }: ScreenProps) {
  const { colors } = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop: edgeTop ? insets.top : 0 },
        style,
      ]}
    >
      {title !== undefined && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.label }]}>{title}</Text>
          {headerRight}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.largeTitle },
});
