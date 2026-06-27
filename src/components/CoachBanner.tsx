/**
 * "Coach Inteligente" banner.
 *
 * Renders the suggestion from `useProgressiveOverload` as a subtle, glassy
 * card that springs in from the top. Tone maps to a system color and an SF
 * Symbol-style emoji glyph. Tapping it (or the close button) dismisses it.
 */
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { usePalette, spacing, radius, typography } from '@/theme';
import type { OverloadSuggestion } from '@/hooks/useProgressiveOverload';

interface CoachBannerProps {
  suggestion: OverloadSuggestion | null;
  onDismiss: () => void;
}

const TONE_ICON: Record<OverloadSuggestion['tone'], keyof typeof Ionicons.glyphMap> = {
  success: 'trending-up',
  warning: 'arrow-forward',
  danger: 'trending-down',
  neutral: 'remove',
};

export function CoachBanner({ suggestion, onDismiss }: CoachBannerProps) {
  const { colors } = usePalette();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = suggestion
      ? withSpring(1, { damping: 18, stiffness: 180 })
      : withTiming(0, { duration: 160 });
  }, [suggestion, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * -16 },
      { scale: 0.96 + progress.value * 0.04 },
    ],
  }));

  if (!suggestion) return null;

  const toneColor =
    suggestion.tone === 'success'
      ? colors.success
      : suggestion.tone === 'danger'
      ? colors.danger
      : suggestion.tone === 'warning'
      ? colors.warning
      : colors.tint;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      <GlassCard intensity={60} cornerRadius={radius.lg}>
        <Pressable style={styles.row} onPress={onDismiss}>
          <View style={[styles.glyphBubble, { backgroundColor: toneColor }]}>
            <Ionicons name={TONE_ICON[suggestion.tone]} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.textCol}>
            <Text style={[styles.title, { color: colors.label }]}>
              {suggestion.title}
            </Text>
            <Text
              style={[styles.detail, { color: colors.secondaryLabel }]}
              numberOfLines={3}
            >
              {suggestion.detail}
            </Text>
          </View>
          <Ionicons name="close" size={18} color={colors.tertiaryLabel} />
        </Pressable>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  glyphBubble: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...typography.headline,
  },
  detail: {
    ...typography.footnote,
    marginTop: 2,
  },
  close: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: spacing.xs,
  },
});
