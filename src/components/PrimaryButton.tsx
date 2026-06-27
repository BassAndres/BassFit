/** iOS-style filled, full-width button with a pressed-state dim. */
import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import { usePalette, spacing, radius, typography } from '@/theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  /** Override background; defaults to the system tint. */
  color?: string;
  variant?: 'filled' | 'tinted' | 'destructive';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  color,
  variant = 'filled',
  disabled,
  style,
}: PrimaryButtonProps) {
  const { colors } = usePalette();
  const base = color ?? (variant === 'destructive' ? colors.danger : colors.tint);

  const isTinted = variant === 'tinted';
  const bg = isTinted ? base + '1F' : base;
  const textColor = isTinted ? base : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { ...typography.headline },
});
