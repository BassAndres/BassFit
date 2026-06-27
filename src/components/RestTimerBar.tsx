/**
 * Floating rest-timer pill shown while a rest countdown is running. Glassy,
 * with +15s / skip controls and a thin progress track.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { GlassCard } from './GlassCard';
import { usePalette, spacing, radius, typography } from '@/theme';
import { formatClock } from '@/utils/format';

interface RestTimerBarProps {
  remaining: number;
  total: number;
  onAdd: () => void;
  onSkip: () => void;
}

export function RestTimerBar({ remaining, total, onAdd, onSkip }: RestTimerBarProps) {
  const { colors } = usePalette();
  const pct = total > 0 ? remaining / total : 0;

  const trackStyle = useAnimatedStyle(() => ({
    width: withTiming(`${pct * 100}%`, { duration: 300 }),
  }));

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <GlassCard intensity={70} cornerRadius={radius.lg}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.secondaryLabel }]}>Descanso</Text>
          <Text style={[styles.clock, { color: colors.label }]}>{formatClock(remaining)}</Text>
          <Pressable onPress={onAdd} hitSlop={8} style={styles.btn}>
            <Text style={[styles.btnText, { color: colors.tint }]}>+15s</Text>
          </Pressable>
          <Pressable onPress={onSkip} hitSlop={8} style={styles.btn}>
            <Text style={[styles.btnText, { color: colors.danger }]}>Saltar</Text>
          </Pressable>
        </View>
        <View style={[styles.track, { backgroundColor: colors.separator }]}>
          <Animated.View style={[styles.fill, { backgroundColor: colors.tint }, trackStyle]} />
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  label: { ...typography.subhead },
  clock: { ...typography.title3, flex: 1 },
  btn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  btnText: { ...typography.callout, fontWeight: '600' },
  track: {
    height: 3,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: 'hidden',
  },
  fill: { height: 3 },
});
