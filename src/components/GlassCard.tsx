/**
 * Glassmorphism surface: a BlurView with a translucent fill and an iOS-style
 * corner radius and hairline border. Adapts to light/dark automatically.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { usePalette, radius } from '@/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  cornerRadius?: number;
}

export function GlassCard({
  children,
  style,
  intensity = 40,
  cornerRadius = radius.lg,
}: GlassCardProps) {
  const { colors } = usePalette();
  return (
    <View
      style={[
        styles.wrapper,
        { borderRadius: cornerRadius, borderColor: colors.separator },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={colors.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.fill, { backgroundColor: colors.glassFill }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'relative',
  },
});
